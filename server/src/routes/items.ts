import { Hono } from 'hono'
import { desc, eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { items } from '../db/schema.js'

const itemsRoute = new Hono()

itemsRoute.get('/', async (c) => {
  const all = await db.select().from(items).orderBy(desc(items.createdAt))
  return c.json(all)
})

itemsRoute.post('/', async (c) => {
  const body = await c.req.json<{ name?: unknown }>()

  if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
    return c.json({ error: 'Name is required' }, 400)
  }

  const now = new Date().toISOString()
  const [created] = await db
    .insert(items)
    .values({ name: body.name.trim(), createdAt: now })
    .returning()

  return c.json(created, 201)
})

export default itemsRoute

itemsRoute.get('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id) || id < 1) return c.json({ error: 'Invalid id' }, 400)

  const [item] = await db.select().from(items).where(eq(items.id, id))
  if (!item) return c.json({ error: 'Not found' }, 404)

  return c.json(item)
})

itemsRoute.put('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id) || id < 1) return c.json({ error: 'Invalid id' }, 400)

  const body = await c.req.json<{ name?: unknown }>()
  if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
    return c.json({ error: 'Name is required' }, 400)
  }

  const [updated] = await db
    .update(items)
    .set({ name: body.name.trim() })
    .where(eq(items.id, id))
    .returning()

  if (!updated) return c.json({ error: 'Not found' }, 404)

  return c.json(updated)
})
