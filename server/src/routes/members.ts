import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { log } from '../logger.js'
import { members } from '../db/schema.js'

const membersRoute = new Hono()

// GET /api/members — list all household members ordered by display name
membersRoute.get('/', async (c) => {
  const all = await db.select().from(members).orderBy(members.displayName)
  return c.json(all)
})

// PATCH /api/members/:id — rename a member's display name
membersRoute.patch('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id) || id < 1) return c.json({ error: 'Invalid id' }, 400)

  const body = await c.req.json<{ displayName?: unknown }>()
  if (typeof body.displayName !== 'string' || !body.displayName.trim()) {
    return c.json({ error: 'displayName is required' }, 400)
  }

  const [updated] = await db
    .update(members)
    .set({ displayName: body.displayName.trim() })
    .where(eq(members.id, id))
    .returning()

  if (!updated) return c.json({ error: 'Not found' }, 404)

  log.info({ memberId: id, displayName: updated.displayName }, 'Member renamed')
  return c.json(updated)
})

export default membersRoute
