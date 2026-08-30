import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { log } from '../logger.js'
import { userPlants, plants, wateringEvents, tasks, taskLogs, members } from '../db/schema.js'

interface DiscordInteraction {
  type: number
  data?: {
    custom_id: string
    component_type: number
  }
  member?: { user: { username: string } }
  user?: { username: string }
}

interface InteractionResponse {
  type: number
  data?: {
    content?: string
    components?: unknown[]
    flags?: number
  }
}

type ButtonHandler = (id: string, username: string | null) => Promise<InteractionResponse>

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

// Registry: keyed by "action:domain"
const handlers = new Map<string, ButtonHandler>()

export function registerButtonHandler(action: string, domain: string, handler: ButtonHandler): void {
  handlers.set(`${action}:${domain}`, handler)
}

function parseCustomId(customId: string): { action: string; domain: string; id: string } | null {
  const parts = customId.split(':')

  // New format: action:domain:id (e.g. "water:plant:42")
  if (parts.length === 3) {
    return { action: parts[0], domain: parts[1], id: parts[2] }
  }

  // Legacy format: water_plant:42, snooze_plant:42
  if (parts.length === 2) {
    if (customId.startsWith('water_plant:')) return { action: 'water', domain: 'plant', id: parts[1] }
    if (customId.startsWith('snooze_plant:')) return { action: 'snooze', domain: 'plant', id: parts[1] }
  }

  return null
}

// Plant: water
registerButtonHandler('water', 'plant', async (id, username) => {
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
registerButtonHandler('snooze', 'plant', async (id, _username) => {
  const plantId = parseInt(id, 10)
  if (isNaN(plantId)) {
    log.warn({ id }, 'Discord button: invalid plant ID for snooze')
    return { type: CHANNEL_MESSAGE, data: { content: '❌ Invalid plant ID.', flags: EPHEMERAL } }
  }

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const snoozedUntil = tomorrow.toISOString()

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
  log.info({ userPlantId: plantId, name, snoozedUntil }, 'Plant snoozed via Discord')

  return {
    type: UPDATE_MESSAGE,
    data: { content: `😴 **${name}** snoozed for 1 day.`, components: [] },
  }
})

// Task: complete
registerButtonHandler('complete', 'task', async (id, username) => {
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

  // Look up or create member from username
  let member: { id: number; displayName: string } | null = null
  if (username) {
    const existing = await db.select().from(members).where(eq(members.discordName, username))
    if (existing.length > 0) {
      member = existing[0]
    } else {
      const [created] = await db
        .insert(members)
        .values({ discordId: username, discordName: username, displayName: username, createdAt: new Date().toISOString() })
        .returning()
      member = created
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
registerButtonHandler('snooze', 'task', async (id, _username) => {
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

  const [updated] = await db
    .update(tasks)
    .set({ snoozedUntil })
    .where(eq(tasks.id, taskId))
    .returning()

  if (!updated) {
    log.warn({ taskId }, 'Discord button: task not found for snooze')
    return { type: CHANNEL_MESSAGE, data: { content: '❌ Task not found.', flags: EPHEMERAL } }
  }

  log.info({ taskId, name: updated.name, snoozedUntil }, 'Task snoozed via Discord button')

  return {
    type: UPDATE_MESSAGE,
    data: { content: `😴 **${updated.name}** snoozed for 1 day.`, components: [] },
  }
})

export async function handleInteraction(body: DiscordInteraction): Promise<InteractionResponse> {
  if (body.type === PING) {
    return { type: PONG }
  }

  if (body.type === MESSAGE_COMPONENT && body.data?.component_type === BUTTON) {
    const customId = body.data.custom_id
    const username = body.member?.user.username ?? body.user?.username ?? null
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

    return handler(parsed.id, username)
  }

  return { type: PONG }
}
