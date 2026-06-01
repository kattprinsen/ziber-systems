import { getCookie } from 'hono/cookie'
import type { MiddlewareHandler } from 'hono'

// Paths that must be accessible without a session cookie
const EXEMPT = ['/api/auth/', '/api/discord/interactions']

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const path = new URL(c.req.url).pathname
  if (EXEMPT.some((prefix) => path.startsWith(prefix))) {
    return next()
  }

  const session = getCookie(c, 'session')
  if (!session || session !== process.env.AUTH_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  return next()
}
