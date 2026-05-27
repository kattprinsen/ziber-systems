DATE      : 2026-05-27
TIME      : (local)
PROMPTS   : 2
SESSION   : 006

LOG
---
User spotted Discord API 429 rate limit error in pm2 logs
Fixed: discordFetch in api.ts now handles 429 — reads retry_after, waits, retries once
Fixed: reminders.ts sends now wrapped in try/catch so one failure doesn't abort the batch
Fixed: added 500ms delay between per-plant message sends to proactively avoid rate limits
triage passed — 0 errors
Updated copilot-instructions.md with Discord rate limit handling pattern
/pr executed
