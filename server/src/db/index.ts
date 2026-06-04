import { mkdirSync } from 'node:fs'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { log } from '../logger.js'
import * as schema from './schema.js'

mkdirSync('data', { recursive: true })
const sqlite = new Database('data/data.db')

// Create tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS health_checks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    checked_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );
  CREATE TABLE IF NOT EXISTS plants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    common_name TEXT NOT NULL,
    latin_name TEXT NOT NULL,
    watering_interval_days INTEGER NOT NULL,
    light TEXT NOT NULL,
    description TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS user_plants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plant_id INTEGER NOT NULL REFERENCES plants(id),
    nickname TEXT,
    added_at TEXT NOT NULL,
    last_watered_at TEXT
  );
`)

// Safe migrations: ALTER TABLE has no IF NOT EXISTS in SQLite, so we check PRAGMA table_info first.
const userPlantsColumns = sqlite
  .prepare('PRAGMA table_info(user_plants)')
  .all() as { name: string }[]

if (!userPlantsColumns.some((col) => col.name === 'room_id')) {
  sqlite.exec('ALTER TABLE user_plants ADD COLUMN room_id INTEGER REFERENCES rooms(id)')
  log.info('DB migration: added room_id column to user_plants')
}

if (!userPlantsColumns.some((col) => col.name === 'snoozed_until')) {
  sqlite.exec('ALTER TABLE user_plants ADD COLUMN snoozed_until TEXT')
  log.info('DB migration: added snoozed_until column to user_plants')
}

log.info('DB ready')

export const db = drizzle(sqlite, { schema })
