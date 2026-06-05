import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { log } from '../logger.js'
import * as schema from './schema.js'

mkdirSync('data', { recursive: true })
const sqlite = new Database('data/data.db')

export const db = drizzle(sqlite, { schema })

// Resolve server/drizzle/ relative to this file — works for both:
//   dev:  src/db/index.ts  → up 3 levels → server/drizzle/
//   prod: dist/db/index.js → up 3 levels → server/drizzle/
const migrationsFolder = join(fileURLToPath(import.meta.url), '../../..', 'drizzle')

migrate(db, { migrationsFolder })
log.info('DB ready')
