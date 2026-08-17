import { Hono } from 'hono'
import { eq, isNull } from 'drizzle-orm'
import { db } from '../db/index.js'
import { log } from '../logger.js'
import { userPlants, plants, rooms, wateringEvents } from '../db/schema.js'
import type { MyPlant, WateringEvent } from '../types.js'

const myPlantsRoute = new Hono()

// GET /api/my-plants — list all user plants joined with plant data
myPlantsRoute.get('/', async (c) => {
  const rows: MyPlant[] = await db
    .select({
      id: userPlants.id,
      plantId: userPlants.plantId,
      roomId: userPlants.roomId,
      nickname: userPlants.nickname,
      addedAt: userPlants.addedAt,
      lastWateredAt: userPlants.lastWateredAt,
      snoozedUntil: userPlants.snoozedUntil,
      archivedAt: userPlants.archivedAt,
      commonName: plants.commonName,
      latinName: plants.latinName,
      wateringIntervalDays: plants.wateringIntervalDays,
      light: plants.light,
      description: plants.description,
    })
    .from(userPlants)
    .innerJoin(plants, eq(userPlants.plantId, plants.id))
    .where(isNull(userPlants.archivedAt))
    .orderBy(userPlants.addedAt)

  return c.json(rows)
})

// POST /api/my-plants — add a plant to the collection
myPlantsRoute.post('/', async (c) => {
  const body = await c.req.json<{ plantId?: unknown; roomId?: unknown; nickname?: unknown }>()

  const plantId = Number(body.plantId)
  if (!Number.isInteger(plantId) || plantId < 1) {
    return c.json({ error: 'plantId is required and must be a positive integer' }, 400)
  }

  const roomId = Number(body.roomId)
  if (!Number.isInteger(roomId) || roomId < 1) {
    return c.json({ error: 'roomId is required and must be a positive integer' }, 400)
  }

  const [plant] = await db.select().from(plants).where(eq(plants.id, plantId))
  if (!plant) return c.json({ error: 'Plant not found' }, 404)

  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId))
  if (!room) return c.json({ error: 'Room not found' }, 404)

  const nickname =
    typeof body.nickname === 'string' && body.nickname.trim()
      ? body.nickname.trim()
      : null

  const now = new Date().toISOString()
  const [created] = await db
    .insert(userPlants)
    .values({ plantId, roomId, nickname, addedAt: now, lastWateredAt: null })
    .returning()

  log.info({ userPlantId: created.id, plantId, roomId, nickname }, 'Plant added to collection')
  return c.json({ ...created, ...plant }, 201)
})

// PATCH /api/my-plants/:id/water — mark as watered now (also clears any active snooze)
myPlantsRoute.patch('/:id/water', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id) || id < 1) return c.json({ error: 'Invalid id' }, 400)

  const now = new Date().toISOString()
  const [updated] = await db
    .update(userPlants)
    .set({ lastWateredAt: now, snoozedUntil: null })
    .where(eq(userPlants.id, id))
    .returning()

  if (!updated) return c.json({ error: 'Not found' }, 404)

  await db.insert(wateringEvents).values({ userPlantId: id, wateredAt: now, source: 'manual', wateredBy: null })

  log.info({ userPlantId: id, lastWateredAt: now }, 'Plant watered')
  return c.json(updated)
})

// GET /api/my-plants/:id/history — watering history for a plant (newest first)
myPlantsRoute.get('/:id/history', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id) || id < 1) return c.json({ error: 'Invalid id' }, 400)

  const events: WateringEvent[] = await db
    .select()
    .from(wateringEvents)
    .where(eq(wateringEvents.userPlantId, id))
    .orderBy(wateringEvents.wateredAt)

  return c.json(events.reverse())
})

// PATCH /api/my-plants/:id/snooze — push the next watering reminder by 1 day
myPlantsRoute.patch('/:id/snooze', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id) || id < 1) return c.json({ error: 'Invalid id' }, 400)

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const snoozedUntil = tomorrow.toISOString()

  const [updated] = await db
    .update(userPlants)
    .set({ snoozedUntil })
    .where(eq(userPlants.id, id))
    .returning()

  if (!updated) return c.json({ error: 'Not found' }, 404)

  log.info({ userPlantId: id, snoozedUntil }, 'Plant snoozed')
  return c.json(updated)
})

// PATCH /api/my-plants/:id — update nickname and/or roomId
myPlantsRoute.patch('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id) || id < 1) return c.json({ error: 'Invalid id' }, 400)

  const body = await c.req.json<{ nickname?: unknown; roomId?: unknown }>()
  const updates: { nickname?: string | null; roomId?: number | null } = {}

  if ('nickname' in body) {
    updates.nickname =
      typeof body.nickname === 'string' && body.nickname.trim()
        ? body.nickname.trim()
        : null
  }

  if ('roomId' in body) {
    if (body.roomId === null) {
      updates.roomId = null
    } else {
      const roomId = Number(body.roomId)
      if (!Number.isInteger(roomId) || roomId < 1) {
        return c.json({ error: 'roomId must be a positive integer or null' }, 400)
      }
      const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId))
      if (!room) return c.json({ error: 'Room not found' }, 404)
      updates.roomId = roomId
    }
  }

  if (Object.keys(updates).length === 0) {
    return c.json({ error: 'No valid fields to update' }, 400)
  }

  const [updated] = await db
    .update(userPlants)
    .set(updates)
    .where(eq(userPlants.id, id))
    .returning()

  if (!updated) return c.json({ error: 'Not found' }, 404)
  log.info({ userPlantId: id, updates }, 'Plant updated')
  return c.json(updated)
})

// DELETE /api/my-plants/:id — archive (soft-delete) a plant
myPlantsRoute.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id) || id < 1) return c.json({ error: 'Invalid id' }, 400)

  const [archived] = await db
    .update(userPlants)
    .set({ archivedAt: new Date().toISOString() })
    .where(eq(userPlants.id, id))
    .returning()

  if (!archived) return c.json({ error: 'Not found' }, 404)

  log.info({ userPlantId: id }, 'Plant archived')
  return c.json({ success: true })
})

// PATCH /api/my-plants/:id/restore — unarchive a plant
myPlantsRoute.patch('/:id/restore', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id) || id < 1) return c.json({ error: 'Invalid id' }, 400)

  const [restored] = await db
    .update(userPlants)
    .set({ archivedAt: null })
    .where(eq(userPlants.id, id))
    .returning()

  if (!restored) return c.json({ error: 'Not found' }, 404)

  log.info({ userPlantId: id }, 'Plant restored from archive')
  return c.json(restored)
})

export default myPlantsRoute
