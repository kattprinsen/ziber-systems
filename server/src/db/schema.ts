import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'

export const healthChecks = sqliteTable('health_checks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  checkedAt: text('checked_at').notNull(),
})
