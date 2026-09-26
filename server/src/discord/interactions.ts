import { eq } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { db } from '../db/index.js'
import { log } from '../logger.js'
import { userPlants, plants, wateringEvents, tasks, taskLogs, members } from '../db/schema.js'

interface DiscordInteraction {
  type: number
  data?: {
    custom_id: string
    component_type: number
  }
  member?: { user: { id: string; username: string } }
  user?: { id: string; username: string }
}

interface InteractionResponse {
  type: number
  data?: {
    content?: string
    components?: unknown[]
    flags?: number
  }
}

type ButtonHandler = (id: string, username: string | null, discordUserId: string | null, token?: string) => Promise<InteractionResponse>

// Interaction types
const PING = 1
const MESSAGE_COMPONENT = 3

// Component types
const BUTTON = 2

// Response types
const PONG = 1
const UPDATE_MESSAGE = 7
const CHANNEL_MESSAGE = 4

// Message flags
const EPHEMERAL = 64
const UNDO_WINDOW_MS = 5 * 60 * 1000

interface SnoozeUndo {
  domain: 'plant' | 'task'
  id: number
  previousSnoozedUntil: string | null
  snoozedUntil: string
  expiresAt: number
}

const snoozeUndos = new Map<string, SnoozeUndo>()

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

function parseUndoCustomId(customId: string): ParsedCustomId | null {
  const parts = customId.split(':')
  if (parts.length === 4 && parts[0] === 'undo') {
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
  return parseCurrentCustomId(customId) ?? parseUndoCustomId(customId) ?? parseLegacyCustomId(customId)
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
registerButtonHandler('complete', 'task', async (id, username, discordUserId) => {
  const taskId = parseInt(id, 10)
  if (isNaN(taskId)) {
    log.warn({ id }, 'Discord button: invalid task ID')
    return { type: CHANNEL_MESSAGE, data: { content: '❌ Invalid task ID.', flags: EPHEMERAL } }
  }

  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId))
  if (!task) {
    log.warn({ taskId }, 'Discord button: task not found')
    return { type: UPDATE_MESSAGE, data: { content: '🗑️ This task has been removed.', components: [] } }
  }

  // Look up or create member by Discord user ID — consistent with the !command handler
  let member: { id: number; displayName: string } | null = null
  if (discordUserId) {
    const existing = await db.select().from(members).where(eq(members.discordId, discordUserId))
    if (existing.length > 0) {
      member = existing[0]
    } else {
      const displayName = username ?? discordUserId
      const [created] = await db
        .insert(members)
        .values({ discordId: discordUserId, discordName: username ?? discordUserId, displayName, createdAt: new Date().toISOString() })
        .returning()
      member = created
      log.info({ discordId: discordUserId, displayName }, 'New member auto-created from Discord button')
    }
  }

  if (!member) {
    return { type: CHANNEL_MESSAGE, data: { content: '❌ Could not identify user.', flags: EPHEMERAL } }
  }

  await db.insert(taskLogs).values({
    taskId,
    memberId: member.id,
    completedAt: new Date().toISOString(),
    source: 'discord',
  })

  // Clear snooze on completion
  if (task.snoozedUntil) {
    await db.update(tasks).set({ snoozedUntil: null }).where(eq(tasks.id, taskId))
  }

  log.info({ taskId, name: task.name, username }, 'Task completed via Discord button')

  return {
    type: UPDATE_MESSAGE,
    data: { content: `✅ **${task.name}** marked as done by ${member.displayName}!`, components: [] },
  }
})

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
  if (!undo || undo.domain !== domain || undo.id !== entityId || undo.expiresAt <= Date.now()) {
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

  if (body.type === MESSAGE_COMPONENT && body.data?.component_type === BUTTON) {
    const customId = body.data.custom_id
    const username = body.member?.user.username ?? body.user?.username ?? null
    const discordUserId = body.member?.user.id ?? body.user?.id ?? null
    const parsed = parseCustomId(customId)

    if (!parsed) {
      log.warn({ customId }, 'Discord button: unrecognised custom_id format')
      return { type: PONG }
    }

    const key = `${parsed.action}:${parsed.domain}`
    const handler = handlers.get(key)

    if (!handler) {
      log.warn({ key, customId }, 'Discord button: no handler registered')
      return { type: PONG }
    }

    return handler(parsed.id, username, discordUserId, parsed.token)
  }

  return { type: PONG }
}
