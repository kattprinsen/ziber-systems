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
