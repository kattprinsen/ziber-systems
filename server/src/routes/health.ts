import { Hono } from 'hono'
import { count } from 'drizzle-orm'
import { db } from '../db/index.js'
import { healthChecks } from '../db/schema.js'

const health = new Hono()

health.get('/', async (c) => {
  const now = new Date().toISOString()

  await db.insert(healthChecks).values({ checkedAt: now })

  const [result] = await db.select({ total: count() }).from(healthChecks)

  return c.json({
    status: 'ok',
    db: 'connected',
    timestamp: now,
    totalChecks: result?.total ?? 0,
  })
})

export default health
