import { eq, desc } from 'drizzle-orm'
import { db } from '../db/index.js'
import { log } from '../logger.js'
import { userPlants, plants, tasks, taskLogs } from '../db/schema.js'
import { discordConfig } from './config.js'
import { sendMessage } from './api.js'

const DAY_MS = 24 * 60 * 60 * 1000

export async function sendPlantReminders(forceAll = false): Promise<void> {
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

  const endOfToday = new Date()
  endOfToday.setHours(23, 59, 59, 999)

  const due = forceAll ? rows : rows.filter((r) => {
    const base = r.lastWateredAt ?? r.addedAt
    const dueMs = new Date(base).getTime() + r.wateringIntervalDays * DAY_MS
    return dueMs <= endOfToday.getTime()
  })

  if (due.length === 0) {
    log.info('No plants due today — no plant reminder sent')
    return
  }

  log.info({ count: due.length }, 'Sending plant watering reminders')

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
      log.info({ userPlantId: plant.id, name, statusText }, 'Plant reminder sent')
    } catch (err) {
      log.error({ err, userPlantId: plant.id, name }, 'Failed to send plant reminder')
    }

    await new Promise((resolve) => setTimeout(resolve, 500))
  }
}

export async function sendTaskReminders(forceAll = false): Promise<void> {
  if (!discordConfig.botToken || !discordConfig.taskChannelId) {
    log.warn('Missing DISCORD_BOT_TOKEN or DISCORD_TASK_CHANNEL_ID — task reminders skipped')
    return
  }

  const scheduledTasks = await db.select().from(tasks)

  const endOfToday = new Date()
  endOfToday.setHours(23, 59, 59, 999)

  const due = []
  const todayDow = new Date().getDay() // 0=Sun … 6=Sat

  for (const task of scheduledTasks) {
    const isIntervalBased = task.intervalDays !== null
    const isDayOfWeekBased = task.dayOfWeek !== null

    if (!isIntervalBased && !isDayOfWeekBased) continue // on-demand — no reminder

    // Respect snooze
    if (!forceAll && task.snoozedUntil && new Date(task.snoozedUntil) > new Date()) continue

    if (isDayOfWeekBased) {
      // Also fire if the task was snoozed and the snooze just expired (today != matching weekday)
      const snoozedAndExpired = !forceAll && task.snoozedUntil !== null && new Date(task.snoozedUntil) <= new Date()
      if (forceAll || task.dayOfWeek === todayDow || snoozedAndExpired) {
        due.push({ task, dueMs: Date.now() })
      }
      continue
    }

    // Interval-based task
    const [lastLog] = await db
      .select({ completedAt: taskLogs.completedAt })
      .from(taskLogs)
      .where(eq(taskLogs.taskId, task.id))
      .orderBy(desc(taskLogs.completedAt))
      .limit(1)

    const base = lastLog?.completedAt ?? task.createdAt
    const dueMs = new Date(base).getTime() + task.intervalDays! * DAY_MS

    if (forceAll || dueMs <= endOfToday.getTime()) {
      due.push({ task, dueMs })
    }
  }

  if (due.length === 0) {
    log.info('No tasks due today — no task reminder sent')
    return
  }

  log.info({ count: due.length }, 'Sending task reminders')

  for (const { task, dueMs } of due) {
    const overdueDays = Math.ceil((Date.now() - dueMs) / DAY_MS)
    let statusText: string
    if (task.dayOfWeek !== null) {
      statusText = 'scheduled for today'
    } else if (overdueDays <= 0) {
      statusText = 'due today'
    } else {
      statusText = `overdue by ${overdueDays} day${overdueDays === 1 ? '' : 's'}`
    }

    try {
      await sendMessage(discordConfig.taskChannelId, {
        content: `🏠 **${task.name}** needs to be done!\n${task.description ? `*${task.description}* · ` : ''}${statusText}`,
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 1,
                label: '✅ Mark as done',
                custom_id: `complete:task:${task.id}`,
              },
              {
                type: 2,
                style: 2,
                label: '😴 Snooze 1 day',
                custom_id: `snooze:task:${task.id}`,
              },
            ],
          },
        ],
      })
      log.info({ taskId: task.id, name: task.name, statusText }, 'Task reminder sent')
    } catch (err) {
      log.error({ err, taskId: task.id, name: task.name }, 'Failed to send task reminder')
    }

    await new Promise((resolve) => setTimeout(resolve, 500))
  }
}
