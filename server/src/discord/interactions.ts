import { eq } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { db } from '../db/index.js'
import { log } from '../logger.js'
import { userPlants, plants, wateringEvents, tasks } from '../db/schema.js'
import { recordTaskCompletion, type TaskParticipantInput } from './task-completions.js'

interface DiscordUser {
  id: string
  username: string
  global_name?: string | null
}

interface DiscordInteraction {
  type: number
  message?: { id: string }
  data?: {
    custom_id?: string
    component_type: number
    values?: string[]
    resolved?: {
      users?: Record<string, DiscordUser>
      members?: Record<string, { nick?: string | null }>
    }
  }
  member?: { user: DiscordUser }
  user?: DiscordUser
}

interface InteractionResponse {
  type: number
  data?: {
    content?: string
    components?: unknown[]
    flags?: number
  }
}

type ButtonHandler = (id: string, username: string | null, discordUserId: string | null, token?: string, actor?: DiscordUser | null, messageId?: string) => Promise<InteractionResponse>

// Interaction types
const PING = 1
const MESSAGE_COMPONENT = 3

// Component types
const BUTTON = 2
const USER_SELECT = 5

// Response types
const PONG = 1
const UPDATE_MESSAGE = 7
const CHANNEL_MESSAGE = 4

// Message flags
const EPHEMERAL = 64
const UNDO_WINDOW_MS = 5 * 60 * 1000
const COMPLETION_SELECTION_WINDOW_MS = 10 * 60 * 1000

interface SnoozeUndo {
  domain: 'plant' | 'task'
  id: number
  previousSnoozedUntil: string | null
  snoozedUntil: string
  expiresAt: number
}

const snoozeUndos = new Map<string, SnoozeUndo>()

interface PendingTaskCompletion {
  taskId: number
  taskName: string
  discordMessageId: string | undefined
  requester: DiscordUser
  participants: { user: DiscordUser; displayName: string }[]
  expiresAt: number
  processing: boolean
}

const pendingTaskCompletions = new Map<string, PendingTaskCompletion>()

function rememberSnoozeUndo(undo: Omit<SnoozeUndo, 'expiresAt'>): string {
  const now = Date.now()
  for (const [token, entry] of snoozeUndos) {
    if (entry.expiresAt <= now) snoozeUndos.delete(token)
  }

  const token = randomUUID()
  snoozeUndos.set(token, { ...undo, expiresAt: now + UNDO_WINDOW_MS })
  return token
}

// Registry: keyed by "action:domain"
const handlers = new Map<string, ButtonHandler>()

export function registerButtonHandler(action: string, domain: string, handler: ButtonHandler): void {
  handlers.set(`${action}:${domain}`, handler)
}

interface ParsedCustomId {
  action: string
  domain: string
  id: string
  token?: string
}

function parseCurrentCustomId(customId: string): ParsedCustomId | null {
  const parts = customId.split(':')
  if (parts.length === 3) {
    return { action: parts[0], domain: parts[1], id: parts[2] }
  }
  return null
}

function parseTokenCustomId(customId: string): ParsedCustomId | null {
  const parts = customId.split(':')
  if (parts.length === 4 && ['undo', 'participants', 'confirm', 'cancel'].includes(parts[0])) {
    return { action: parts[0], domain: parts[1], id: parts[2], token: parts[3] }
  }
  return null
}

function parseLegacyCustomId(customId: string): ParsedCustomId | null {
  const legacyFormats: Record<string, Omit<ParsedCustomId, 'id'>> = {
    water_plant: { action: 'water', domain: 'plant' },
    snooze_plant: { action: 'snooze', domain: 'plant' },
  }
  const separatorIndex = customId.indexOf(':')
  if (separatorIndex === -1) return null

  const format = customId.slice(0, separatorIndex)
  const parsedFormat = legacyFormats[format]
  if (!parsedFormat) return null

  return { ...parsedFormat, id: customId.slice(separatorIndex + 1) }
}

function parseCustomId(customId: string): ParsedCustomId | null {
  return parseCurrentCustomId(customId) ?? parseTokenCustomId(customId) ?? parseLegacyCustomId(customId)
}

// Plant: water
registerButtonHandler('water', 'plant', async (id, username, _discordUserId) => {
  const plantId = parseInt(id, 10)
  if (isNaN(plantId)) {
    log.warn({ id }, 'Discord button: invalid plant ID')
    return { type: CHANNEL_MESSAGE, data: { content: '❌ Invalid plant ID.', flags: EPHEMERAL } }
  }

  const now = new Date().toISOString()
  const updated = await db
    .update(userPlants)
    .set({ lastWateredAt: now, snoozedUntil: null })
    .where(eq(userPlants.id, plantId))
    .returning()

  if (updated.length === 0) {
    log.warn({ userPlantId: plantId }, 'Discord button: plant not found')
    return { type: UPDATE_MESSAGE, data: { content: '🗑️ This plant has been removed.', components: [] } }
  }

  await db.insert(wateringEvents).values({
    userPlantId: plantId,
    wateredAt: now,
    source: 'discord',
    wateredBy: username,
  })

  const [plantRow] = await db
    .select({ commonName: plants.commonName })
    .from(plants)
    .where(eq(plants.id, updated[0].plantId))

  const name = updated[0].nickname ?? plantRow?.commonName ?? 'Plant'
  log.info({ userPlantId: plantId, name, username }, 'Plant watered via Discord')

  return {
    type: UPDATE_MESSAGE,
    data: { content: `✅ **${name}** marked as watered!`, components: [] },
  }
})

// Plant: snooze
registerButtonHandler('snooze', 'plant', async (id, _username, _discordUserId) => {
  const plantId = parseInt(id, 10)
  if (isNaN(plantId)) {
    log.warn({ id }, 'Discord button: invalid plant ID for snooze')
    return { type: CHANNEL_MESSAGE, data: { content: '❌ Invalid plant ID.', flags: EPHEMERAL } }
  }

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const snoozedUntil = tomorrow.toISOString()
  const [before] = await db
    .select({ snoozedUntil: userPlants.snoozedUntil })
    .from(userPlants)
    .where(eq(userPlants.id, plantId))

  const updated = await db
    .update(userPlants)
    .set({ snoozedUntil })
    .where(eq(userPlants.id, plantId))
    .returning()

  if (updated.length === 0) {
    log.warn({ userPlantId: plantId }, 'Discord button: plant not found for snooze')
    return { type: UPDATE_MESSAGE, data: { content: '🗑️ This plant has been removed.', components: [] } }
  }

  const [plantRow] = await db
    .select({ commonName: plants.commonName })
    .from(plants)
    .where(eq(plants.id, updated[0].plantId))

  const name = updated[0].nickname ?? plantRow?.commonName ?? 'Plant'
  const undoToken = rememberSnoozeUndo({
    domain: 'plant',
    id: plantId,
    previousSnoozedUntil: before?.snoozedUntil ?? null,
    snoozedUntil,
  })
  log.info({ userPlantId: plantId, name, snoozedUntil }, 'Plant snoozed via Discord')

  return {
    type: UPDATE_MESSAGE,
    data: {
      content: `😴 **${name}** snoozed for 1 day.`,
      components: [{ type: 1, components: [{ type: 2, style: 2, label: 'Undo snooze', custom_id: `undo:plant:${plantId}:${undoToken}` }] }],
    },
  }
})

// Task: complete
registerButtonHandler('complete', 'task', async (id, _username, discordUserId, _token, actor, messageId) => {
  const taskId = parseInt(id, 10)
  if (isNaN(taskId)) {
    log.warn({ id }, 'Discord button: invalid task ID')
    return { type: CHANNEL_MESSAGE, data: { content: '❌ Invalid task ID.', flags: EPHEMERAL } }
  }

  if (!discordUserId || !actor) {
    return { type: CHANNEL_MESSAGE, data: { content: '❌ Could not identify user.', flags: EPHEMERAL } }
  }

  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId))
  if (!task) {
    log.warn({ taskId }, 'Discord button: task not found')
    return { type: UPDATE_MESSAGE, data: { content: '🗑️ This task has been removed.', components: [] } }
  }

  const now = Date.now()
  for (const [token, pending] of pendingTaskCompletions) {
    if (pending.expiresAt <= now) pendingTaskCompletions.delete(token)
  }
  const token = randomUUID()
  pendingTaskCompletions.set(token, {
    taskId,
    taskName: task.name,
    discordMessageId: messageId,
    requester: actor,
    participants: [],
    expiresAt: now + COMPLETION_SELECTION_WINDOW_MS,
    processing: false,
  })

  return {
    type: CHANNEL_MESSAGE,
    data: {
      content: `Choose everyone who took part in **${task.name}**, then confirm. Leave the selection empty to credit yourself.`,
      flags: EPHEMERAL,
      components: completionComponents(taskId, token),
    },
  }
})

registerButtonHandler('confirm', 'task', async (id, _username, discordUserId, token) =>
  confirmTaskCompletion(id, token, discordUserId))
registerButtonHandler('cancel', 'task', async (id, _username, discordUserId, token) =>
  cancelTaskCompletion(id, token, discordUserId))

function completionComponents(taskId: number, token: string): unknown[] {
  return [
    {
      type: 1,
      components: [{
        type: USER_SELECT,
        custom_id: `participants:task:${taskId}:${token}`,
        placeholder: 'Select participants (optional)',
        min_values: 0,
        max_values: 25,
      }],
    },
    {
      type: 1,
      components: [
        { type: BUTTON, style: 1, label: 'Confirm completion', custom_id: `confirm:task:${taskId}:${token}` },
        { type: BUTTON, style: 2, label: 'Cancel', custom_id: `cancel:task:${taskId}:${token}` },
      ],
    },
  ]
}

function getPendingCompletion(id: string, token: string | undefined, discordUserId: string | null): PendingTaskCompletion | null {
  const taskId = Number.parseInt(id, 10)
  const pending = token ? pendingTaskCompletions.get(token) : undefined
  if (!pending || pending.taskId !== taskId) return null
  if (pending.expiresAt <= Date.now()) {
    pendingTaskCompletions.delete(token!)
    return null
  }
  if (pending.requester.id !== discordUserId) return null
  return pending
}

function updateParticipantSelection(body: DiscordInteraction, parsed: ParsedCustomId): InteractionResponse {
  const pending = getPendingCompletion(parsed.id, parsed.token, body.member?.user.id ?? body.user?.id ?? null)
  if (!pending || pending.processing) {
    return { type: UPDATE_MESSAGE, data: { content: 'This participant selection has expired or is no longer available.', components: [] } }
  }

  const ids = [...new Set(body.data?.values ?? [])]
  if (ids.length > 25) {
    return { type: UPDATE_MESSAGE, data: { content: 'Select no more than 25 participants.', components: completionComponents(pending.taskId, parsed.token!) } }
  }

  const users = body.data?.resolved?.users ?? {}
  const resolvedMembers = body.data?.resolved?.members ?? {}
  const participants = []
  for (const id of ids) {
    const user = users[id]
    if (!user) {
      return { type: UPDATE_MESSAGE, data: { content: 'Discord could not resolve one of the selected users. Please select them again.', components: completionComponents(pending.taskId, parsed.token!) } }
    }
    const displayName = resolvedMembers[id]?.nick ?? user.global_name ?? user.username
    participants.push({ user, displayName })
  }
  pending.participants = participants

  const summary = participants.length > 0
    ? `Selected: ${participants.map((participant) => participant.displayName).join(', ')}`
    : 'No participants selected; confirming will credit you.'
  return { type: UPDATE_MESSAGE, data: { content: `${summary}\nConfirm to record **${pending.taskName}**.`, components: completionComponents(pending.taskId, parsed.token!) } }
}

async function confirmTaskCompletion(id: string, token: string | undefined, discordUserId: string | null): Promise<InteractionResponse> {
  const pending = getPendingCompletion(id, token, discordUserId)
  if (!pending || pending.processing || !token) {
    return { type: UPDATE_MESSAGE, data: { content: 'This completion has expired or was already submitted.', components: [] } }
  }
  pending.processing = true

  try {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, pending.taskId))
    if (!task) {
      pendingTaskCompletions.delete(token)
      return { type: UPDATE_MESSAGE, data: { content: 'This task was removed; no completion was recorded.', components: [] } }
    }

    const participants = pending.participants.length > 0
      ? pending.participants
      : [{ user: pending.requester, displayName: pending.requester.global_name ?? pending.requester.username }]
    const inputs: TaskParticipantInput[] = participants.map(({ user, displayName }) => ({
      discordId: user.id,
      discordName: user.username,
      displayName,
    }))
    const recorded = recordTaskCompletion(pending.taskId, 'discord', inputs, pending.discordMessageId)
    if (recorded.duplicate) {
      pendingTaskCompletions.delete(token)
      return { type: UPDATE_MESSAGE, data: { content: `✅ **${task.name}** was already completed from this reminder.`, components: [] } }
    }
    if (task.snoozedUntil) await db.update(tasks).set({ snoozedUntil: null }).where(eq(tasks.id, task.id))
    pendingTaskCompletions.delete(token)
    log.info({ taskId: task.id, participants: recorded.participants }, 'Task completed via Discord button')

    const names = recorded.participants.join(', ')
    return { type: UPDATE_MESSAGE, data: { content: `✅ **${task.name}** marked as done by ${names}!`, components: [] } }
  } catch (error) {
    pending.processing = false
    throw error
  }
}

function cancelTaskCompletion(id: string, token: string | undefined, discordUserId: string | null): InteractionResponse {
  const pending = getPendingCompletion(id, token, discordUserId)
  if (pending && token) pendingTaskCompletions.delete(token)
  return { type: UPDATE_MESSAGE, data: { content: pending ? 'Completion cancelled.' : 'This completion has expired.', components: [] } }
}

// Task: snooze
registerButtonHandler('snooze', 'task', async (id, _username, _discordUserId) => {
  const taskId = parseInt(id, 10)
  if (isNaN(taskId)) {
    log.warn({ id }, 'Discord button: invalid task ID for snooze')
    return { type: CHANNEL_MESSAGE, data: { content: '❌ Invalid task ID.', flags: EPHEMERAL } }
  }

  // Set to midnight of next day so the 08:00 reminder sees the snooze as expired
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  const snoozedUntil = tomorrow.toISOString()
  const [before] = await db
    .select({ snoozedUntil: tasks.snoozedUntil })
    .from(tasks)
    .where(eq(tasks.id, taskId))

  const [updated] = await db
    .update(tasks)
    .set({ snoozedUntil })
    .where(eq(tasks.id, taskId))
    .returning()

  if (!updated) {
    log.warn({ taskId }, 'Discord button: task not found for snooze')
    return { type: CHANNEL_MESSAGE, data: { content: '❌ Task not found.', flags: EPHEMERAL } }
  }

  const undoToken = rememberSnoozeUndo({
    domain: 'task',
    id: taskId,
    previousSnoozedUntil: before?.snoozedUntil ?? null,
    snoozedUntil,
  })
  log.info({ taskId, name: updated.name, snoozedUntil }, 'Task snoozed via Discord button')

  return {
    type: UPDATE_MESSAGE,
    data: {
      content: `😴 **${updated.name}** snoozed for 1 day.`,
      components: [{ type: 1, components: [{ type: 2, style: 2, label: 'Undo snooze', custom_id: `undo:task:${taskId}:${undoToken}` }] }],
    },
  }
})

registerButtonHandler('undo', 'plant', async (id, _username, _discordUserId, token) => undoSnooze('plant', id, token))
registerButtonHandler('undo', 'task', async (id, _username, _discordUserId, token) => undoSnooze('task', id, token))

async function undoSnooze(domain: 'plant' | 'task', id: string, token?: string): Promise<InteractionResponse> {
  const undo = token ? snoozeUndos.get(token) : undefined
  const entityId = parseInt(id, 10)
  if (!token || !undo || undo.domain !== domain || undo.id !== entityId || undo.expiresAt <= Date.now()) {
    if (token) snoozeUndos.delete(token)
    return { type: UPDATE_MESSAGE, data: { content: '↩️ This undo action has expired.', components: [] } }
  }

  if (domain === 'plant') {
    const [current] = await db
      .select({ snoozedUntil: userPlants.snoozedUntil })
      .from(userPlants)
      .where(eq(userPlants.id, entityId))
    if (!current || current.snoozedUntil !== undo.snoozedUntil) {
      snoozeUndos.delete(token)
      return { type: UPDATE_MESSAGE, data: { content: '↩️ This snooze can no longer be undone.', components: [] } }
    }
    await db.update(userPlants).set({ snoozedUntil: undo.previousSnoozedUntil }).where(eq(userPlants.id, entityId))
  } else {
    const [current] = await db
      .select({ snoozedUntil: tasks.snoozedUntil })
      .from(tasks)
      .where(eq(tasks.id, entityId))
    if (!current || current.snoozedUntil !== undo.snoozedUntil) {
      snoozeUndos.delete(token)
      return { type: UPDATE_MESSAGE, data: { content: '↩️ This snooze can no longer be undone.', components: [] } }
    }
    await db.update(tasks).set({ snoozedUntil: undo.previousSnoozedUntil }).where(eq(tasks.id, entityId))
  }

  snoozeUndos.delete(token)
  log.info({ domain, id: entityId }, 'Discord snooze undone')
  return { type: UPDATE_MESSAGE, data: { content: '↩️ Snooze undone.', components: [] } }
}

export async function handleInteraction(body: DiscordInteraction): Promise<InteractionResponse> {
  if (body.type === PING) {
    return { type: PONG }
  }

  if (body.type === MESSAGE_COMPONENT && body.data?.custom_id) {
    const customId = body.data.custom_id
    const parsed = parseCustomId(customId)

    if (!parsed) {
      log.warn({ customId }, 'Discord button: unrecognised custom_id format')
      return { type: PONG }
    }

    if (body.data.component_type === USER_SELECT && parsed.action === 'participants' && parsed.domain === 'task') {
      return updateParticipantSelection(body, parsed)
    }

    if (body.data.component_type !== BUTTON) return { type: PONG }

    const key = `${parsed.action}:${parsed.domain}`
    const handler = handlers.get(key)

    if (!handler) {
      log.warn({ key, customId }, 'Discord button: no handler registered')
      return { type: PONG }
    }

    const actor = body.member?.user ?? body.user ?? null
    return handler(parsed.id, actor?.username ?? null, actor?.id ?? null, parsed.token, actor, body.message?.id)
  }

  return { type: PONG }
}
