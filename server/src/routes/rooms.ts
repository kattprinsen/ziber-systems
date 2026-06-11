import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { log } from '../logger.js'
import { rooms, userPlants } from '../db/schema.js'

const roomsRoute = new Hono()

// GET /api/rooms — list all rooms ordered by name
roomsRoute.get('/', async (c) => {
  const all = await db.select().from(rooms).orderBy(rooms.name)
  return c.json(all)
})

// POST /api/rooms — create a room { name: string }
roomsRoute.post('/', async (c) => {
  const body = await c.req.json<{ name?: unknown }>()
  if (typeof body.name !== 'string' || !body.name.trim()) {
    return c.json({ error: 'name is required' }, 400)
  }

  const [created] = await db
    .insert(rooms)
    .values({ name: body.name.trim() })
    .returning()

  log.info({ roomId: created.id, name: created.name }, 'Room created')
  return c.json(created, 201)
})

// PATCH /api/rooms/:id — rename a room { name: string }
roomsRoute.patch('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id) || id < 1) return c.json({ error: 'Invalid id' }, 400)

  const body = await c.req.json<{ name?: unknown }>()
  if (typeof body.name !== 'string' || !body.name.trim()) {
    return c.json({ error: 'name is required' }, 400)
  }

  const [updated] = await db
    .update(rooms)
    .set({ name: body.name.trim() })
    .where(eq(rooms.id, id))
    .returning()

  if (!updated) return c.json({ error: 'Not found' }, 404)

  log.info({ roomId: id, name: updated.name }, 'Room renamed')
  return c.json(updated)
})

// DELETE /api/rooms/:id — delete a room; unassigns any plants in it first
roomsRoute.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id) || id < 1) return c.json({ error: 'Invalid id' }, 400)

  await db
    .update(userPlants)
    .set({ roomId: null })
    .where(eq(userPlants.roomId, id))

  const [deleted] = await db
    .delete(rooms)
    .where(eq(rooms.id, id))
    .returning()

  if (!deleted) return c.json({ error: 'Not found' }, 404)

  log.info({ roomId: id, name: deleted.name }, 'Room deleted')
  return c.json({ success: true })
})

export default roomsRoute
