import { Hono } from 'hono'
import { eq, desc } from 'drizzle-orm'
import { db } from '../db/index.js'
import { tasks, taskLogs, members, userPlants, plants, wateringEvents } from '../db/schema.js'

const activityRoute = new Hono()

// GET /api/activity — unified feed of task completions + plant waterings, newest first
activityRoute.get('/', async (c) => {
  const [taskRows, waterRows] = await Promise.all([
    db
      .select({
        id: taskLogs.id,
        completedAt: taskLogs.completedAt,
        source: taskLogs.source,
        taskName: tasks.name,
        displayName: members.displayName,
      })
      .from(taskLogs)
      .innerJoin(tasks, eq(taskLogs.taskId, tasks.id))
      .innerJoin(members, eq(taskLogs.memberId, members.id))
      .orderBy(desc(taskLogs.completedAt))
      .limit(200),

    db
      .select({
        id: wateringEvents.id,
        wateredAt: wateringEvents.wateredAt,
        source: wateringEvents.source,
        wateredBy: wateringEvents.wateredBy,
        nickname: userPlants.nickname,
        commonName: plants.commonName,
      })
      .from(wateringEvents)
      .innerJoin(userPlants, eq(wateringEvents.userPlantId, userPlants.id))
      .innerJoin(plants, eq(userPlants.plantId, plants.id))
      .orderBy(desc(wateringEvents.wateredAt))
      .limit(200),
  ])

  const taskEntries = taskRows.map((r) => ({
    id: `task-${r.id}`,
    type: 'task' as const,
    name: r.taskName,
    who: r.displayName,
    source: r.source,
    timestamp: r.completedAt,
  }))

  const waterEntries = waterRows.map((r) => ({
    id: `plant-${r.id}`,
    type: 'plant' as const,
    name: r.nickname ?? r.commonName,
    who: r.wateredBy ?? null,
    source: r.source,
    timestamp: r.wateredAt,
  }))

  const feed = [...taskEntries, ...waterEntries]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 100)

  return c.json(feed)
})

export default activityRoute
