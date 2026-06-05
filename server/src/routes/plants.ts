import { Hono } from 'hono'
import { eq, like, or } from 'drizzle-orm'
import { db } from '../db/index.js'
import { plants } from '../db/schema.js'
import type { InsertPlant, LightLevel } from '../types.js'

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
  const validLight: LightLevel[] = ['low', 'indirect', 'bright']
  const light: LightLevel = validLight.includes(body.light as LightLevel)
    ? (body.light as LightLevel)
    : 'indirect'
  const description = typeof body.description === 'string' ? body.description.trim() : ''

  const [created] = await db
    .insert(plants)
    .values({ commonName, latinName, wateringIntervalDays, light, description })
    .returning()

  return c.json(created, 201)
})

plantsRoute.patch('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id) || id < 1) return c.json({ error: 'Invalid id' }, 400)

  const body = await c.req.json<Record<string, unknown>>()

  const updates: Partial<InsertPlant> = {}

  if (typeof body.commonName === 'string' && body.commonName.trim())
    updates.commonName = body.commonName.trim()
  if (typeof body.latinName === 'string')
    updates.latinName = body.latinName.trim()
  const days = Number(body.wateringIntervalDays)
  if (Number.isInteger(days) && days >= 1)
    updates.wateringIntervalDays = days
  const validLight: LightLevel[] = ['low', 'indirect', 'bright']
  if (validLight.includes(body.light as LightLevel))
    updates.light = body.light as LightLevel
  if (typeof body.description === 'string')
    updates.description = body.description.trim()

  if (Object.keys(updates).length === 0)
    return c.json({ error: 'No valid fields to update' }, 400)

  const [updated] = await db
    .update(plants)
    .set(updates)
    .where(eq(plants.id, id))
    .returning()

  if (!updated) return c.json({ error: 'Not found' }, 404)
  return c.json(updated)
})

export default plantsRoute
