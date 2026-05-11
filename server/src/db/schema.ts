import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'

export const healthChecks = sqliteTable('health_checks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  checkedAt: text('checked_at').notNull(),
})

export const items = sqliteTable('items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdAt: text('created_at').notNull(),
})

export const plants = sqliteTable('plants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  commonName: text('common_name').notNull(),
  latinName: text('latin_name').notNull(),
  wateringIntervalDays: integer('watering_interval_days').notNull(),
  light: text('light', { enum: ['low', 'indirect', 'bright'] }).notNull(),
  description: text('description').notNull(),
})
