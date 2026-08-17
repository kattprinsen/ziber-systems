import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'
import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core'

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
  snoozedUntil: text('snoozed_until'),
  archivedAt: text('archived_at'),
})

export const wateringEvents = sqliteTable('watering_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userPlantId: integer('user_plant_id').notNull().references((): AnySQLiteColumn => userPlants.id),
  wateredAt: text('watered_at').notNull(),
  source: text('source', { enum: ['manual', 'discord'] }).notNull(),
  wateredBy: text('watered_by'),
})

export const members = sqliteTable('members', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  discordId: text('discord_id').notNull().unique(),
  discordName: text('discord_name').notNull(),
  displayName: text('display_name').notNull(),
  createdAt: text('created_at').notNull(),
})

export const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  command: text('command').notNull().unique(), // the !command word, e.g. "dishes"
  description: text('description'),
  intervalDays: integer('interval_days'), // null = on-demand or day-of-week; mutually exclusive with dayOfWeek
  dayOfWeek: integer('day_of_week'), // 0=Sun … 6=Sat; null = interval-based or on-demand
  snoozedUntil: text('snoozed_until'),
  createdAt: text('created_at').notNull(),
})

export const taskLogs = sqliteTable('task_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  taskId: integer('task_id').notNull().references((): AnySQLiteColumn => tasks.id),
  memberId: integer('member_id').notNull().references((): AnySQLiteColumn => members.id),
  completedAt: text('completed_at').notNull(),
  source: text('source', { enum: ['discord', 'web'] }).notNull(),
})
