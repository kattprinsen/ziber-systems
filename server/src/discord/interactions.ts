import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { log } from '../logger.js'
import { userPlants, plants, wateringEvents } from '../db/schema.js'

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

export async function handleInteraction(body: DiscordInteraction): Promise<InteractionResponse> {
  if (body.type === PING) {
    return { type: PONG }
  }

  if (body.type === MESSAGE_COMPONENT && body.data?.component_type === BUTTON) {
    const customId = body.data.custom_id
    const discordUsername = body.member?.user.username ?? body.user?.username ?? null

    if (customId.startsWith('water_plant:')) {
      const plantId = parseInt(customId.split(':')[1], 10)
      if (isNaN(plantId)) {
        log.warn({ customId }, 'Discord button: invalid plant ID')
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
        return { type: CHANNEL_MESSAGE, data: { content: '❌ Plant not found.', flags: EPHEMERAL } }
      }

      await db.insert(wateringEvents).values({
        userPlantId: plantId,
        wateredAt: now,
        source: 'discord',
        wateredBy: discordUsername,
      })

      const [plantRow] = await db
        .select({ commonName: plants.commonName })
        .from(plants)
        .where(eq(plants.id, updated[0].plantId))

      const name = updated[0].nickname ?? plantRow?.commonName ?? 'Plant'

      log.info({ userPlantId: plantId, name, discordUsername }, 'Plant watered via Discord')
      return {
        type: UPDATE_MESSAGE,
        data: {
          content: `✅ **${name}** marked as watered!`,
          components: [],
        },
      }
    }

    if (customId.startsWith('snooze_plant:')) {
      const plantId = parseInt(customId.split(':')[1], 10)
      if (isNaN(plantId)) {
        log.warn({ customId }, 'Discord button: invalid plant ID for snooze')
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
        return { type: CHANNEL_MESSAGE, data: { content: '❌ Plant not found.', flags: EPHEMERAL } }
      }

      const [plantRow] = await db
        .select({ commonName: plants.commonName })
        .from(plants)
        .where(eq(plants.id, updated[0].plantId))

      const name = updated[0].nickname ?? plantRow?.commonName ?? 'Plant'

      log.info({ userPlantId: plantId, name, snoozedUntil }, 'Plant snoozed via Discord')
      return {
        type: UPDATE_MESSAGE,
        data: {
          content: `😴 **${name}** snoozed for 1 day.`,
          components: [],
        },
      }
    }
  }

  return { type: PONG }
}
