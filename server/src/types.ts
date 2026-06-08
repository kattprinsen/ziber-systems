/**
 * Canonical API types derived directly from the Drizzle schema.
 * These are the authoritative definitions — update schema.ts, not this file.
 *
 * Client-side mirrors live in client/src/api/ and must be kept in sync manually
 * until a shared workspace is introduced.
 */
import type { plants, rooms, userPlants, wateringEvents } from './db/schema.js'

export type Plant = typeof plants.$inferSelect
export type InsertPlant = typeof plants.$inferInsert

export type Room = typeof rooms.$inferSelect

export type UserPlant = typeof userPlants.$inferSelect

export type LightLevel = Plant['light']

/** Shape returned by GET /api/my-plants — a userPlant row joined with its plant catalogue entry */
export interface MyPlant extends UserPlant {
  commonName: Plant['commonName']
  latinName: Plant['latinName']
  wateringIntervalDays: Plant['wateringIntervalDays']
  light: Plant['light']
  description: Plant['description']
}

export type WateringEvent = typeof wateringEvents.$inferSelect
