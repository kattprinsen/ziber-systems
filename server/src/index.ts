import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import health from './routes/health.js'
import itemsRoute from './routes/items.js'
import plantsRoute from './routes/plants.js'

const app = new Hono()

app.use('*', cors())
app.route('/api/health', health)
app.route('/api/items', itemsRoute)
app.route('/api/plants', plantsRoute)

serve({ fetch: app.fetch, port: 3000 }, () => {
  console.log('Server running on http://localhost:3000')
})
