import type { MiddlewareHandler } from 'hono'

/** Protects /api/export/* with a static API key supplied via X-Api-Key header. */
export const apiKeyMiddleware: MiddlewareHandler = async (c, next) => {
  const key = process.env.EXPORT_API_KEY
  if (!key) {
    return c.json({ error: 'Export API is disabled (EXPORT_API_KEY not set)' }, 503)
  }

  if (c.req.header('X-Api-Key') !== key) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  return next()
}
