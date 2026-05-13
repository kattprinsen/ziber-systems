import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { userPlants, plants } from '../db/schema.js'

interface DiscordInteraction {
  type: number
  data?: {
    custom_id: string
    component_type: number
  }
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

    if (customId.startsWith('water_plant:')) {
      const plantId = parseInt(customId.split(':')[1], 10)
      if (isNaN(plantId)) {
        return { type: CHANNEL_MESSAGE, data: { content: '❌ Invalid plant ID.', flags: EPHEMERAL } }
      }

      const updated = await db
        .update(userPlants)
        .set({ lastWateredAt: new Date().toISOString() })
        .where(eq(userPlants.id, plantId))
        .returning()

      if (updated.length === 0) {
        return { type: CHANNEL_MESSAGE, data: { content: '❌ Plant not found.', flags: EPHEMERAL } }
      }

      const [plantRow] = await db
        .select({ commonName: plants.commonName })
        .from(plants)
        .where(eq(plants.id, updated[0].plantId))

      const name = updated[0].nickname ?? plantRow?.commonName ?? 'Plant'

      return {
        type: UPDATE_MESSAGE,
        data: {
          content: `✅ **${name}** marked as watered!`,
          components: [],
        },
      }
    }
  }

  return { type: PONG }
}
