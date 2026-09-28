import { Hono } from 'hono'
import { count, eq, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import { tasks, taskLogs, taskLogMembers, members, userPlants, plants, wateringEvents } from '../db/schema.js'

const activityRoute = new Hono()
const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 100

// GET /api/activity — paginated unified feed of task completions + plant waterings, newest first
activityRoute.get('/', async (c) => {
  const page = Math.max(1, Number.parseInt(c.req.query('page') ?? '1', 10) || 1)
  const requestedPageSize = Number.parseInt(c.req.query('pageSize') ?? `${DEFAULT_PAGE_SIZE}`, 10)
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, requestedPageSize || DEFAULT_PAGE_SIZE))
  const type = c.req.query('type')

  if (type !== undefined && type !== 'task' && type !== 'plant') {
    return c.json({ error: 'type must be task or plant' }, 400)
  }

  const [taskCount, plantCount, entries] = await Promise.all([
    type === 'plant'
      ? Promise.resolve([{ total: 0 }])
      : db.select({ total: count() }).from(taskLogs).innerJoin(tasks, eq(taskLogs.taskId, tasks.id)),
    type === 'task'
      ? Promise.resolve([{ total: 0 }])
      : db.select({ total: count() }).from(wateringEvents).innerJoin(userPlants, eq(wateringEvents.userPlantId, userPlants.id)).innerJoin(plants, eq(userPlants.plantId, plants.id)),
    db.all<{ id: string; type: 'task' | 'plant'; name: string; who: string | null; source: string; timestamp: string }>(sql`
      SELECT 'task-' || ${taskLogs.id} AS id, 'task' AS type, ${tasks.name} AS name,
        (SELECT group_concat(${members.displayName}, ', ')
          FROM ${taskLogMembers}
          INNER JOIN ${members} ON ${taskLogMembers.memberId} = ${members.id}
          WHERE ${taskLogMembers.taskLogId} = ${taskLogs.id}) AS who,
        ${taskLogs.source} AS source, ${taskLogs.completedAt} AS timestamp
      FROM ${taskLogs}
      INNER JOIN ${tasks} ON ${taskLogs.taskId} = ${tasks.id}
      WHERE ${type === 'plant' ? 0 : 1}
      UNION ALL
      SELECT 'plant-' || ${wateringEvents.id} AS id, 'plant' AS type,
        coalesce(${userPlants.nickname}, ${plants.commonName}) AS name, ${wateringEvents.wateredBy} AS who,
        ${wateringEvents.source} AS source, ${wateringEvents.wateredAt} AS timestamp
      FROM ${wateringEvents}
      INNER JOIN ${userPlants} ON ${wateringEvents.userPlantId} = ${userPlants.id}
      INNER JOIN ${plants} ON ${userPlants.plantId} = ${plants.id}
      WHERE ${type === 'task' ? 0 : 1}
      ORDER BY timestamp DESC
      LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
    `),
  ])

  const total = taskCount[0].total + plantCount[0].total
  return c.json({ entries, total, page, pageSize })
})

export default activityRoute
