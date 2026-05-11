import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { eq } from 'drizzle-orm'
import { createRequire } from 'module'
import { plants } from '../db/schema.js'
import * as schema from '../db/schema.js'

const require = createRequire(import.meta.url)
const seedData = require('./seeds/plants.json') as {
  commonName: string
  latinName: string
  wateringIntervalDays: number
  light: 'low' | 'indirect' | 'bright'
  description: string
}[]

const sqlite = new Database('data.db')

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS plants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    common_name TEXT NOT NULL,
    latin_name TEXT NOT NULL,
    watering_interval_days INTEGER NOT NULL,
    light TEXT NOT NULL,
    description TEXT NOT NULL
  )
`)

const db = drizzle(sqlite, { schema })

let inserted = 0
let skipped = 0

for (const plant of seedData) {
  const existing = db
    .select()
    .from(plants)
    .where(eq(plants.latinName, plant.latinName))
    .all()

  if (existing.length > 0) {
    skipped++
    continue
  }

  db.insert(plants).values(plant).run()
  inserted++
}

console.log(`Seed complete — inserted: ${inserted}, skipped (already exist): ${skipped}`)
sqlite.close()
