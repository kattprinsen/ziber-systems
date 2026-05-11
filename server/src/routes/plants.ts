import { Hono } from 'hono'
import { eq, like, or } from 'drizzle-orm'
import { db } from '../db/index.js'
import { plants } from '../db/schema.js'

const plantsRoute = new Hono()

plantsRoute.get('/', async (c) => {
  const q = c.req.query('q')?.trim()

  if (q) {
    const pattern = `%${q}%`
    const results = await db
      .select()
      .from(plants)
      .where(or(like(plants.commonName, pattern), like(plants.latinName, pattern)))
      .limit(20)
    return c.json(results)
  }

  const all = await db.select().from(plants)
  return c.json(all)
})

plantsRoute.get('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id) || id < 1) return c.json({ error: 'Invalid id' }, 400)

  const [plant] = await db.select().from(plants).where(eq(plants.id, id))
  if (!plant) return c.json({ error: 'Not found' }, 404)

  return c.json(plant)
})

export default plantsRoute
