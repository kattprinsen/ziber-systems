import { Hono } from 'hono'
import { eq, desc, count, max, gte } from 'drizzle-orm'
import { db } from '../db/index.js'
import { plants, userPlants, rooms, wateringEvents, tasks, taskLogs, members } from '../db/schema.js'
import { apiKeyMiddleware } from '../middleware/apiKey.js'

const exportRoute = new Hono()

exportRoute.use('/*', apiKeyMiddleware)

// ---------------------------------------------------------------------------
// GET /api/export/plants
// Full plant collection — user plants joined with catalogue and room name.
// ---------------------------------------------------------------------------
exportRoute.get('/plants', async (c) => {
  const rows = await db
    .select({
      id: userPlants.id,
      plantId: userPlants.plantId,
      nickname: userPlants.nickname,
      addedAt: userPlants.addedAt,
      lastWateredAt: userPlants.lastWateredAt,
      snoozedUntil: userPlants.snoozedUntil,
      commonName: plants.commonName,
      latinName: plants.latinName,
      wateringIntervalDays: plants.wateringIntervalDays,
      light: plants.light,
      description: plants.description,
      roomId: userPlants.roomId,
      roomName: rooms.name,
    })
    .from(userPlants)
    .innerJoin(plants, eq(userPlants.plantId, plants.id))
    .leftJoin(rooms, eq(userPlants.roomId, rooms.id))
    .orderBy(plants.commonName)

  return c.json(rows)
})

// ---------------------------------------------------------------------------
// GET /api/export/watering-events
// All watering history with plant info and room.
// ---------------------------------------------------------------------------
exportRoute.get('/watering-events', async (c) => {
  const rows = await db
    .select({
      id: wateringEvents.id,
      wateredAt: wateringEvents.wateredAt,
      source: wateringEvents.source,
      wateredBy: wateringEvents.wateredBy,
      userPlantId: wateringEvents.userPlantId,
      nickname: userPlants.nickname,
      commonName: plants.commonName,
      latinName: plants.latinName,
      roomName: rooms.name,
    })
    .from(wateringEvents)
    .innerJoin(userPlants, eq(wateringEvents.userPlantId, userPlants.id))
    .innerJoin(plants, eq(userPlants.plantId, plants.id))
    .leftJoin(rooms, eq(userPlants.roomId, rooms.id))
    .orderBy(desc(wateringEvents.wateredAt))

  return c.json(rows)
})

// ---------------------------------------------------------------------------
// GET /api/export/tasks
// All task definitions with aggregate stats (completion count + last completed).
// ---------------------------------------------------------------------------
exportRoute.get('/tasks', async (c) => {
  const all = await db.select().from(tasks).orderBy(tasks.name)

  const stats = await db
    .select({
      taskId: taskLogs.taskId,
      completionCount: count(taskLogs.id),
      lastCompletedAt: max(taskLogs.completedAt),
    })
    .from(taskLogs)
    .groupBy(taskLogs.taskId)

  const statsMap = new Map(stats.map((s) => [s.taskId, s]))

  const result = all.map((t) => {
    const s = statsMap.get(t.id)
    return {
      ...t,
      completionCount: s?.completionCount ?? 0,
      lastCompletedAt: s?.lastCompletedAt ?? null,
    }
  })

  return c.json(result)
})

// ---------------------------------------------------------------------------
// GET /api/export/task-logs
// Raw task completion history with task name and member display name.
// ---------------------------------------------------------------------------
exportRoute.get('/task-logs', async (c) => {
  const rows = await db
    .select({
      id: taskLogs.id,
      completedAt: taskLogs.completedAt,
      source: taskLogs.source,
      taskId: taskLogs.taskId,
      taskName: tasks.name,
      memberId: taskLogs.memberId,
      displayName: members.displayName,
      discordName: members.discordName,
    })
    .from(taskLogs)
    .innerJoin(tasks, eq(taskLogs.taskId, tasks.id))
    .innerJoin(members, eq(taskLogs.memberId, members.id))
    .orderBy(desc(taskLogs.completedAt))

  return c.json(rows)
})

// ---------------------------------------------------------------------------
// GET /api/export/members
// All members with activity stats (task count + last active).
// ---------------------------------------------------------------------------
exportRoute.get('/members', async (c) => {
  const all = await db.select().from(members).orderBy(members.displayName)

  const stats = await db
    .select({
      memberId: taskLogs.memberId,
      taskCount: count(taskLogs.id),
      lastActiveAt: max(taskLogs.completedAt),
    })
    .from(taskLogs)
    .groupBy(taskLogs.memberId)

  const statsMap = new Map(stats.map((s) => [s.memberId, s]))

  const result = all.map((m) => {
    const s = statsMap.get(m.id)
    return {
      id: m.id,
      displayName: m.displayName,
      discordName: m.discordName,
      createdAt: m.createdAt,
      taskCount: s?.taskCount ?? 0,
      lastActiveAt: s?.lastActiveAt ?? null,
    }
  })

  return c.json(result)
})

// ---------------------------------------------------------------------------
// GET /api/export/summary
// High-level stats snapshot useful for dashboards and reports.
// ---------------------------------------------------------------------------
exportRoute.get('/summary', async (c) => {
  const now = new Date()
  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoIso = weekAgo.toISOString()

  const [
    [{ totalPlants }],
    allUserPlants,
    [{ tasksThisWeek }],
    [{ totalTasks }],
    [{ totalMembers }],
    topMemberRows,
  ] = await Promise.all([
    db.select({ totalPlants: count(userPlants.id) }).from(userPlants),
    db
      .select({
        lastWateredAt: userPlants.lastWateredAt,
        wateringIntervalDays: plants.wateringIntervalDays,
        snoozedUntil: userPlants.snoozedUntil,
      })
      .from(userPlants)
      .innerJoin(plants, eq(userPlants.plantId, plants.id)),
    db
      .select({ tasksThisWeek: count(taskLogs.id) })
      .from(taskLogs)
      .where(gte(taskLogs.completedAt, weekAgoIso)),
    db.select({ totalTasks: count(tasks.id) }).from(tasks),
    db.select({ totalMembers: count(members.id) }).from(members),
    db
      .select({ memberId: taskLogs.memberId, taskCount: count(taskLogs.id), displayName: members.displayName })
      .from(taskLogs)
      .innerJoin(members, eq(taskLogs.memberId, members.id))
      .where(gte(taskLogs.completedAt, weekAgoIso))
      .groupBy(taskLogs.memberId)
      .orderBy(desc(count(taskLogs.id)))
      .limit(1),
  ])

  const nowIso = now.toISOString()
  let overdueCount = 0
  let wateredTodayCount = 0
  const todayPrefix = nowIso.slice(0, 10)

  for (const p of allUserPlants) {
    const snoozed = p.snoozedUntil && p.snoozedUntil > nowIso
    if (!snoozed) {
      if (!p.lastWateredAt) {
        overdueCount++
      } else {
        const dueDate = new Date(p.lastWateredAt)
        dueDate.setDate(dueDate.getDate() + p.wateringIntervalDays)
        if (dueDate < now) overdueCount++
      }
    }
    if (p.lastWateredAt?.startsWith(todayPrefix)) wateredTodayCount++
  }

  return c.json({
    generatedAt: nowIso,
    plants: {
      total: totalPlants,
      overdueForWatering: overdueCount,
      wateredToday: wateredTodayCount,
    },
    tasks: {
      total: totalTasks,
      completedThisWeek: tasksThisWeek,
    },
    members: {
      total: totalMembers,
      mostActiveThisWeek: topMemberRows[0]?.displayName ?? null,
    },
  })
})

export default exportRoute
