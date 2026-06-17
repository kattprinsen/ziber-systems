import { Hono } from 'hono'
import { webcrypto } from 'crypto'
import { discordConfig } from '../discord/config.js'
import { handleInteraction } from '../discord/interactions.js'

const discordRoute = new Hono()

async function verifySignature(rawBody: string, signature: string, timestamp: string): Promise<boolean> {
  if (!discordConfig.publicKey) return false
  try {
    const key = await webcrypto.subtle.importKey(
      'raw',
      Buffer.from(discordConfig.publicKey, 'hex'),
      { name: 'Ed25519' },
      false,
      ['verify'],
    )
    return webcrypto.subtle.verify(
      'Ed25519',
      key,
      Buffer.from(signature, 'hex'),
      Buffer.from(timestamp + rawBody),
    )
  } catch (e) {
    console.error('[Discord] Verify error:', e)
    return false
  }
}

import { sendPlantReminders, sendTaskReminders } from '../discord/reminders.js'

discordRoute.post('/reminders/trigger', async (c) => {
  const force = c.req.query('force') === 'true'
  await sendPlantReminders(force)
  await sendTaskReminders(force)
  return c.json({ ok: true })
})

discordRoute.post('/interactions', async (c) => {
  const rawBody = await c.req.text()
  const signature = c.req.header('x-signature-ed25519') ?? ''
  const timestamp = c.req.header('x-signature-timestamp') ?? ''

  if (!await verifySignature(rawBody, signature, timestamp)) {
    return c.text('Invalid request signature', 401)
  }

  const body = JSON.parse(rawBody)
  const response = await handleInteraction(body)
  return c.json(response)
})

export default discordRoute
