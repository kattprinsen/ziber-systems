import 'dotenv/config'
import { spawn } from 'child_process'

const domain = process.env.NGROK_DOMAIN

if (!domain) {
  console.error('[ngrok] NGROK_DOMAIN is not set in server/.env')
  process.exit(1)
}

console.log(`[ngrok] Starting tunnel → https://${domain}`)
console.log(`[ngrok] Interactions endpoint: https://${domain}/api/discord/interactions`)

const proc = spawn('ngrok', ['http', `--url=${domain}`, '3000'], {
  stdio: 'inherit',
  shell: true,
})

proc.on('exit', (code) => process.exit(code ?? 0))
