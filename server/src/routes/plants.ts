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

plantsRoute.post('/', async (c) => {
  const body = await c.req.json<Record<string, unknown>>()

  const commonName = typeof body.commonName === 'string' ? body.commonName.trim() : ''
  if (!commonName) return c.json({ error: 'commonName is required' }, 400)

  const wateringIntervalDays = Number(body.wateringIntervalDays)
  if (!Number.isInteger(wateringIntervalDays) || wateringIntervalDays < 1) {
    return c.json({ error: 'wateringIntervalDays must be a positive integer' }, 400)
  }

  const latinName = typeof body.latinName === 'string' ? body.latinName.trim() : ''
  const validLight = ['low', 'indirect', 'bright'] as const
  const light = validLight.includes(body.light as typeof validLight[number])
    ? (body.light as typeof validLight[number])
    : 'indirect'
  const description = typeof body.description === 'string' ? body.description.trim() : ''

  const [created] = await db
    .insert(plants)
    .values({ commonName, latinName, wateringIntervalDays, light, description })
    .returning()

  return c.json(created, 201)
})

export default plantsRoute
