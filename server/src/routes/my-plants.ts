import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { userPlants, plants } from '../db/schema.js'

const myPlantsRoute = new Hono()

// GET /api/my-plants — list all user plants joined with plant data
myPlantsRoute.get('/', async (c) => {
  const rows = await db
    .select({
      id: userPlants.id,
      plantId: userPlants.plantId,
      nickname: userPlants.nickname,
      addedAt: userPlants.addedAt,
      lastWateredAt: userPlants.lastWateredAt,
      commonName: plants.commonName,
      latinName: plants.latinName,
      wateringIntervalDays: plants.wateringIntervalDays,
      light: plants.light,
      description: plants.description,
    })
    .from(userPlants)
    .innerJoin(plants, eq(userPlants.plantId, plants.id))
    .orderBy(userPlants.addedAt)

  return c.json(rows)
})

// POST /api/my-plants — add a plant to the collection
myPlantsRoute.post('/', async (c) => {
  const body = await c.req.json<{ plantId?: unknown; nickname?: unknown }>()

  const plantId = Number(body.plantId)
  if (!Number.isInteger(plantId) || plantId < 1) {
    return c.json({ error: 'plantId is required and must be a positive integer' }, 400)
  }

  const [plant] = await db.select().from(plants).where(eq(plants.id, plantId))
  if (!plant) return c.json({ error: 'Plant not found' }, 404)

  const nickname =
    typeof body.nickname === 'string' && body.nickname.trim()
      ? body.nickname.trim()
      : null

  const now = new Date().toISOString()
  const [created] = await db
    .insert(userPlants)
    .values({ plantId, nickname, addedAt: now, lastWateredAt: null })
    .returning()

  return c.json({ ...created, ...plant }, 201)
})

// PATCH /api/my-plants/:id/water — mark as watered now
myPlantsRoute.patch('/:id/water', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id) || id < 1) return c.json({ error: 'Invalid id' }, 400)

  const now = new Date().toISOString()
  const [updated] = await db
    .update(userPlants)
    .set({ lastWateredAt: now })
    .where(eq(userPlants.id, id))
    .returning()

  if (!updated) return c.json({ error: 'Not found' }, 404)

  return c.json(updated)
})

// DELETE /api/my-plants/:id — remove from collection
myPlantsRoute.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id) || id < 1) return c.json({ error: 'Invalid id' }, 400)

  const [deleted] = await db
    .delete(userPlants)
    .where(eq(userPlants.id, id))
    .returning()

  if (!deleted) return c.json({ error: 'Not found' }, 404)

  return c.json({ success: true })
})

export default myPlantsRoute
