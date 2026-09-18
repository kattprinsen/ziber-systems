import 'dotenv/config'
import { spawn } from 'child_process'
import { log } from './logger.js'

const domain = process.env.NGROK_DOMAIN

if (!domain) {
  log.error('[ngrok] NGROK_DOMAIN is not set in server/.env')
  process.exit(1)
}

log.info(`[ngrok] Starting tunnel → https://${domain}`)
log.info(`[ngrok] Interactions endpoint: https://${domain}/api/discord/interactions`)

const proc = spawn('ngrok', ['http', `--url=${domain}`, '3000'], {
  stdio: 'inherit',
  shell: true,
})

proc.on('exit', (code) => process.exit(code ?? 0))
