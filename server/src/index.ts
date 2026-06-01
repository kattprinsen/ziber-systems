import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') })
dotenv.config() // fallback: also load .env from cwd (e.g. dev or root-level .env)
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger as honoLogger } from 'hono/logger'
import cron from 'node-cron'
import { log } from './logger.js'
import { authMiddleware } from './middleware/auth.js'
import authRoute from './routes/auth.js'
import health from './routes/health.js'
import plantsRoute from './routes/plants.js'
import myPlantsRoute from './routes/my-plants.js'
import discordRoute from './routes/discord.js'
import roomsRoute from './routes/rooms.js'
import { sendReminders } from './discord/reminders.js'

const app = new Hono()

app.use('*', cors())
app.use('*', honoLogger())

// Auth route must be mounted before the auth middleware so /api/auth/login is reachable
app.route('/api/auth', authRoute)
app.use('/api/*', authMiddleware)

app.route('/api/health', health)
app.route('/api/plants', plantsRoute)
app.route('/api/my-plants', myPlantsRoute)
app.route('/api/rooms', roomsRoute)
app.route('/api/discord', discordRoute)

// In production, serve the built React client and fall back to index.html
// so React Router handles client-side navigation.
// Run from the project root: NODE_ENV=production node server/dist/index.js
if (process.env.NODE_ENV === 'production') {
  app.use('/*', serveStatic({ root: './client/dist' }))
  app.get('*', serveStatic({ root: './client/dist', rewriteRequestPath: () => '/index.html' }))
}

// Send watering reminders every day at 8:00am (server local time)
cron.schedule('0 8 * * *', () => {
  sendReminders().catch((err: unknown) => log.error({ err }, '[Discord] Reminder cron error'))
})

serve({ fetch: app.fetch, port: 3000 }, () => {
  log.info('Server running on http://localhost:3000')
})
