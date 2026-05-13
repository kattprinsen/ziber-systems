import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import cron from 'node-cron'
import health from './routes/health.js'
import plantsRoute from './routes/plants.js'
import myPlantsRoute from './routes/my-plants.js'
import discordRoute from './routes/discord.js'
import { sendReminders } from './discord/reminders.js'

const app = new Hono()

app.use('*', cors())
app.route('/api/health', health)
app.route('/api/plants', plantsRoute)
app.route('/api/my-plants', myPlantsRoute)
app.route('/api/discord', discordRoute)

// Send watering reminders every day at 8:00am (server local time)
cron.schedule('0 8 * * *', () => {
  sendReminders().catch((err: unknown) => console.error('[Discord] Reminder error:', err))
})

serve({ fetch: app.fetch, port: 3000 }, () => {
  console.log('Server running on http://localhost:3000')
})
