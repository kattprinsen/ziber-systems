import { Hono } from 'hono'
import { setCookie, deleteCookie, getCookie } from 'hono/cookie'
import { log } from '../logger.js'

const auth = new Hono()

auth.post('/login', async (c) => {
  const body = await c.req.json<{ password?: string }>()

  if (!body.password || body.password !== process.env.AUTH_PASSWORD) {
    log.warn('Failed login attempt')
    return c.json({ error: 'Invalid password' }, 401)
  }

  setCookie(c, 'session', process.env.AUTH_SECRET ?? '', {
    httpOnly: true,
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    // 30-day session
    maxAge: 60 * 60 * 24 * 30,
  })

  log.info('Login successful')
  return c.json({ ok: true })
})

auth.post('/logout', (c) => {
  deleteCookie(c, 'session', { path: '/' })
  return c.json({ ok: true })
})

auth.get('/me', (c) => {
  // /api/auth/* is exempt from the auth middleware, so validate the cookie manually here.
  const session = getCookie(c, 'session')
  if (!session || session !== process.env.AUTH_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  return c.json({ ok: true })
})

export default auth
