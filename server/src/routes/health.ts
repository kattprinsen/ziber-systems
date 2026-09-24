import { Hono } from 'hono'
import { count, lt } from 'drizzle-orm'
import { db } from '../db/index.js'
import { healthChecks } from '../db/schema.js'
import { log } from '../logger.js'

const health = new Hono()
const HEALTH_CHECK_RETENTION_DAYS = 30

health.get('/', async (c) => {
  const now = new Date().toISOString()
  const retentionCutoff = new Date(Date.now() - HEALTH_CHECK_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString()

  await db.insert(healthChecks).values({ checkedAt: now })
  await db.delete(healthChecks).where(lt(healthChecks.checkedAt, retentionCutoff))

  const [result] = await db.select({ total: count() }).from(healthChecks)
  log.info('Healthcheck PING!')
  return c.json({
    status: 'ok',
    db: 'connected',
    timestamp: now,
    totalChecks: result?.total ?? 0,
  })
})

export default health
