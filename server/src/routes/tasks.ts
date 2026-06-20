import { Hono } from 'hono'
import { eq, desc } from 'drizzle-orm'
import { db } from '../db/index.js'
import { log } from '../logger.js'
import { tasks, taskLogs, members } from '../db/schema.js'

const tasksRoute = new Hono()

// GET /api/tasks — list all tasks ordered by name
tasksRoute.get('/', async (c) => {
  const all = await db.select().from(tasks).orderBy(tasks.name)
  return c.json(all)
})

// GET /api/tasks/:id/history — task completion log with member display names
tasksRoute.get('/:id/history', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id) || id < 1) return c.json({ error: 'Invalid id' }, 400)

  const history = await db
    .select({
      id: taskLogs.id,
      completedAt: taskLogs.completedAt,
      source: taskLogs.source,
      displayName: members.displayName,
    })
    .from(taskLogs)
    .innerJoin(members, eq(taskLogs.memberId, members.id))
    .where(eq(taskLogs.taskId, id))
    .orderBy(desc(taskLogs.completedAt))

  return c.json(history)
})

function parseSchedule(
  intervalDays: unknown,
  dayOfWeek: unknown,
): { intervalDays: number | null; dayOfWeek: number | null } | { error: string } {
  const hasDayOfWeek = dayOfWeek !== null && dayOfWeek !== undefined
  const hasInterval = intervalDays !== null && intervalDays !== undefined

  if (hasDayOfWeek && hasInterval) {
    return { error: 'intervalDays and dayOfWeek are mutually exclusive' }
  }

  if (hasDayOfWeek) {
    const dow = Number(dayOfWeek)
    if (!Number.isInteger(dow) || dow < 0 || dow > 6) {
      return { error: 'dayOfWeek must be an integer 0–6 (0=Sun, 6=Sat)' }
    }
    return { intervalDays: null, dayOfWeek: dow }
  }

  if (hasInterval) {
    const iv = Number(intervalDays)
    if (!Number.isInteger(iv) || iv < 1) {
      return { error: 'intervalDays must be a positive integer or null' }
    }
    return { intervalDays: iv, dayOfWeek: null }
  }

  return { intervalDays: null, dayOfWeek: null }
}

// POST /api/tasks — create a task { name, command, description?, intervalDays?, dayOfWeek? }
tasksRoute.post('/', async (c) => {
  const body = await c.req.json<{ name?: unknown; command?: unknown; description?: unknown; intervalDays?: unknown; dayOfWeek?: unknown }>()

  if (typeof body.name !== 'string' || !body.name.trim()) {
    return c.json({ error: 'name is required' }, 400)
  }
  if (typeof body.command !== 'string' || !body.command.trim()) {
    return c.json({ error: 'command is required' }, 400)
  }

  const schedule = parseSchedule(body.intervalDays, body.dayOfWeek)
  if ('error' in schedule) return c.json({ error: schedule.error }, 400)

  const [created] = await db
    .insert(tasks)
    .values({
      name: body.name.trim(),
      command: body.command.trim().toLowerCase().replace(/^!+/, ''),
      description: typeof body.description === 'string' ? body.description.trim() || null : null,
      intervalDays: schedule.intervalDays,
      dayOfWeek: schedule.dayOfWeek,
      createdAt: new Date().toISOString(),
    })
    .returning()

  log.info({ taskId: created.id, command: created.command }, 'Task created')
  return c.json(created, 201)
})

// PATCH /api/tasks/:id — update task fields
tasksRoute.patch('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id) || id < 1) return c.json({ error: 'Invalid id' }, 400)

  const body = await c.req.json<{ name?: unknown; command?: unknown; description?: unknown; intervalDays?: unknown; dayOfWeek?: unknown }>()
  const update: Partial<{ name: string; command: string; description: string | null; intervalDays: number | null; dayOfWeek: number | null }> = {}

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) return c.json({ error: 'name must be a non-empty string' }, 400)
    update.name = body.name.trim()
  }
  if (body.command !== undefined) {
    if (typeof body.command !== 'string' || !body.command.trim()) return c.json({ error: 'command must be a non-empty string' }, 400)
    update.command = body.command.trim().toLowerCase()
  }
  if (body.description !== undefined) {
    update.description = typeof body.description === 'string' ? body.description.trim() || null : null
  }

  const scheduleChanged = body.intervalDays !== undefined || body.dayOfWeek !== undefined
  if (scheduleChanged) {
    const schedule = parseSchedule(body.intervalDays, body.dayOfWeek)
    if ('error' in schedule) return c.json({ error: schedule.error }, 400)
    update.intervalDays = schedule.intervalDays
    update.dayOfWeek = schedule.dayOfWeek
  }

  if (Object.keys(update).length === 0) return c.json({ error: 'No fields to update' }, 400)

  const [updated] = await db.update(tasks).set(update).where(eq(tasks.id, id)).returning()
  if (!updated) return c.json({ error: 'Not found' }, 404)

  log.info({ taskId: id }, 'Task updated')
  return c.json(updated)
})

// DELETE /api/tasks/:id — delete task and its logs
tasksRoute.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id) || id < 1) return c.json({ error: 'Invalid id' }, 400)

  await db.delete(taskLogs).where(eq(taskLogs.taskId, id))
  const [deleted] = await db.delete(tasks).where(eq(tasks.id, id)).returning()
  if (!deleted) return c.json({ error: 'Not found' }, 404)

  log.info({ taskId: id, name: deleted.name }, 'Task deleted')
  return c.json({ success: true })
})

export default tasksRoute
