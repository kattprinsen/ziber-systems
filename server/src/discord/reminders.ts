import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { log } from '../logger.js'
import { userPlants, plants } from '../db/schema.js'
import { discordConfig } from './config.js'
import { sendMessage } from './api.js'

const DAY_MS = 24 * 60 * 60 * 1000

export async function sendReminders(forceAll = false): Promise<void> {
  if (!discordConfig.botToken || !discordConfig.plantChannelId) {
    log.warn('Missing DISCORD_BOT_TOKEN or DISCORD_PLANT_CHANNEL_ID — plant reminders skipped')
    return
  }

  const rows = await db
    .select({
      id: userPlants.id,
      nickname: userPlants.nickname,
      addedAt: userPlants.addedAt,
      lastWateredAt: userPlants.lastWateredAt,
      commonName: plants.commonName,
      latinName: plants.latinName,
      wateringIntervalDays: plants.wateringIntervalDays,
    })
    .from(userPlants)
    .innerJoin(plants, eq(userPlants.plantId, plants.id))

  // Include overdue + due today (by end of day)
  const endOfToday = new Date()
  endOfToday.setHours(23, 59, 59, 999)

  const due = forceAll ? rows : rows.filter((r) => {
    const base = r.lastWateredAt ?? r.addedAt
    const dueMs = new Date(base).getTime() + r.wateringIntervalDays * DAY_MS
    return dueMs <= endOfToday.getTime()
  })

  if (due.length === 0) {
    log.info('No plants due today — no reminder sent')
    return
  }

  log.info({ count: due.length }, 'Sending watering reminders')

  for (const plant of due) {
    const name = plant.nickname ?? plant.commonName
    const base = plant.lastWateredAt ?? plant.addedAt
    const dueMs = new Date(base).getTime() + plant.wateringIntervalDays * DAY_MS
    const overdueDays = Math.ceil((Date.now() - dueMs) / DAY_MS)
    const statusText = overdueDays <= 0
      ? 'due today'
      : `overdue by ${overdueDays} day${overdueDays === 1 ? '' : 's'}`

    try {
      await sendMessage(discordConfig.plantChannelId, {
        content: `🌿 **${name}** needs watering!\n*${plant.latinName}* · ${statusText}`,
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 1,
                label: '💧 Mark as watered',
                custom_id: `water:plant:${plant.id}`,
              },
              {
                type: 2,
                style: 2,
                label: '😴 Snooze 1 day',
                custom_id: `snooze:plant:${plant.id}`,
              },
            ],
          },
        ],
      })
      log.info({ userPlantId: plant.id, name, statusText }, 'Reminder sent')
    } catch (err) {
      log.error({ err, userPlantId: plant.id, name }, 'Failed to send reminder')
    }

    // Small delay between messages to stay within Discord rate limits
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
}
