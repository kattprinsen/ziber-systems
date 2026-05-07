import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema.js'

const sqlite = new Database('data.db')

// Create tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS health_checks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    checked_at TEXT NOT NULL
  )
`)

export const db = drizzle(sqlite, { schema })
