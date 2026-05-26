import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'

export const healthChecks = sqliteTable('health_checks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  checkedAt: text('checked_at').notNull(),
})

export const rooms = sqliteTable('rooms', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
})

export const plants = sqliteTable('plants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  commonName: text('common_name').notNull(),
  latinName: text('latin_name').notNull(),
  wateringIntervalDays: integer('watering_interval_days').notNull(),
  light: text('light', { enum: ['low', 'indirect', 'bright'] }).notNull(),
  description: text('description').notNull(),
})

export const userPlants = sqliteTable('user_plants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  plantId: integer('plant_id').notNull().references(() => plants.id),
  roomId: integer('room_id').references(() => rooms.id),
  nickname: text('nickname'),
  addedAt: text('added_at').notNull(),
  lastWateredAt: text('last_watered_at'),
})
