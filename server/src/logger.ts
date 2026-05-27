import pino from 'pino'

// In dev: pretty-print with colours. In prod: raw JSON (captured by pm2).
export const log = pino({
  level: 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
})
