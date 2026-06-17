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
import tasksRoute from './routes/tasks.js'
import membersRoute from './routes/members.js'
import { sendPlantReminders, sendTaskReminders } from './discord/reminders.js'
import { startGateway } from './discord/gateway.js'
import { handleCommand } from './discord/commands.js'
import { discordConfig } from './discord/config.js'
import { sendMessage } from './discord/api.js'

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
app.route('/api/tasks', tasksRoute)
app.route('/api/members', membersRoute)

// In production, serve the built React client and fall back to index.html
// so React Router handles client-side navigation.
// Run from the project root: NODE_ENV=production node server/dist/index.js
if (process.env.NODE_ENV === 'production') {
  app.use('/*', serveStatic({ root: './client/dist' }))
  app.get('*', serveStatic({ root: './client/dist', rewriteRequestPath: () => '/index.html' }))
}

// Send reminders every day at 8:00am (server local time)
cron.schedule('0 8 * * *', () => {
  sendPlantReminders().catch((err: unknown) => log.error({ err }, '[Discord] Plant reminder cron error'))
  sendTaskReminders().catch((err: unknown) => log.error({ err }, '[Discord] Task reminder cron error'))
})

// Start Discord gateway to handle !prefix commands
startGateway(async (msg) => {
  const reply = await handleCommand(discordConfig.commandPrefix, msg)
  if (reply) {
    await sendMessage(msg.channel_id, { content: reply })
  }
})

serve({ fetch: app.fetch, port: 3000 }, () => {
  log.info('Server running on http://localhost:3000')
})
