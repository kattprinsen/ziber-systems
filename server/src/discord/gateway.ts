import WebSocket from 'ws'
import { discordConfig } from './config.js'
import { log } from '../logger.js'
import type { GatewayMessage } from './commands.js'

// Intents: GUILDS(1) | GUILD_MESSAGES(512) | MESSAGE_CONTENT(32768)
const INTENTS = 1 | 512 | 32768

const GATEWAY_URL = 'wss://gateway.discord.gg/?v=10&encoding=json'

// Op codes
const OP_DISPATCH = 0
const OP_HEARTBEAT = 1
const OP_IDENTIFY = 2
const OP_RECONNECT = 7
const OP_INVALID_SESSION = 9
const OP_HELLO = 10
const OP_HEARTBEAT_ACK = 11

type MessageHandler = (message: GatewayMessage) => Promise<void>

export function startGateway(onMessage: MessageHandler): void {
  if (!discordConfig.botToken) {
    log.warn('Missing DISCORD_BOT_TOKEN — Discord gateway not started')
    return
  }
  connect(onMessage)
}

function connect(onMessage: MessageHandler): void {
  let heartbeatTimer: NodeJS.Timeout | null = null
  let sequence: number | null = null

  const ws = new WebSocket(GATEWAY_URL)

  ws.on('message', (data) => {
    let payload: { op: number; d: unknown; s: number | null; t: string | null }
    try {
      payload = JSON.parse(data.toString())
    } catch {
      return
    }

    const { op, d, s, t } = payload
    if (s !== null) sequence = s

    if (op === OP_HELLO) {
      const interval = (d as { heartbeat_interval: number }).heartbeat_interval

      heartbeatTimer = setInterval(() => {
        ws.send(JSON.stringify({ op: OP_HEARTBEAT, d: sequence }))
      }, interval)

      ws.send(JSON.stringify({
        op: OP_IDENTIFY,
        d: {
          token: discordConfig.botToken,
          intents: INTENTS,
          properties: { os: 'linux', browser: 'ziber', device: 'ziber' },
        },
      }))
    }

    if (op === OP_DISPATCH && t === 'READY') {
      log.info('Discord gateway connected and ready')
    }

    if (op === OP_DISPATCH && t === 'MESSAGE_CREATE') {
      const msg = d as GatewayMessage & { author: { bot?: boolean } }
      if (msg.author?.bot) return
      onMessage(msg).catch((err: unknown) =>
        log.error({ err }, 'Discord gateway: error in message handler')
      )
    }

    if (op === OP_RECONNECT) {
      log.info('Discord gateway: reconnect requested')
      ws.close()
    }

    if (op === OP_INVALID_SESSION) {
      log.warn('Discord gateway: invalid session, reconnecting in 5s')
      ws.close()
    }

    if (op === OP_HEARTBEAT_ACK) {
      // heartbeat acknowledged — connection healthy
    }
  })

  ws.on('close', (code) => {
    if (heartbeatTimer) clearInterval(heartbeatTimer)
    // 4004 = authentication failed — don't retry, it won't help
    if (code === 4004) {
      log.error('Discord gateway: authentication failed — check DISCORD_BOT_TOKEN')
      return
    }
    log.warn({ code }, 'Discord gateway disconnected, reconnecting in 5s')
    setTimeout(() => connect(onMessage), 5000)
  })

  ws.on('error', (err) => {
    log.error({ err }, 'Discord gateway error')
  })
}
