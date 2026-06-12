# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Run from the **repo root** unless noted otherwise.

```bash
# Development
npm run dev            # start client (Vite) + server (tsx --watch) concurrently
npm run dev:discord    # same + Cloudflare Tunnel (for Discord interactions)

# Build & production
npm run build          # build client then server
npm start              # run production build (NODE_ENV=production node server/dist/index.js)

# Type-check & lint
npm run triage         # typecheck client + server + lint in parallel (runs all three, kills on first failure)
npm run lint           # ESLint only
npm run typecheck -w client
npm run typecheck -w server

# Tests
npm test               # run all tests (client + server)
npm test -w server     # server tests only
npm test -w client     # client tests only
npx vitest run server/src/discord/api.test.ts   # single test file

# DB seed
npm run seed -w server

# DB migrations (drizzle-kit)
npm run db:generate -w server   # generate a new migration after changing schema.ts
npm run db:studio -w server     # open Drizzle Studio to browse the DB
```

## Architecture

This is an npm workspaces monorepo with two packages: `client/` (React SPA) and `server/` (Hono API).

### Server (`server/src/`)

- **Framework**: [Hono](https://hono.dev/) on Node.js via `@hono/node-server`
- **Database**: SQLite via `better-sqlite3` + Drizzle ORM. The DB file lives at `data/data.db` (created at startup). Schema is in `db/schema.ts`; migrations are applied inline in `db/index.ts` using raw `PRAGMA table_info` checks (no migration runner).
- **Auth**: Cookie-based shared-password auth. Login posts to `/api/auth/login`, which sets a `session` cookie. `middleware/auth.ts` compares it against `AUTH_SECRET` env var. `/api/auth/*` and `/api/discord/interactions` are exempt.
- **Discord integration**: A Discord bot sends daily reminders at 08:00 (cron) for both plant watering and scheduled household tasks. `discord/reminders.ts` is parameterised by domain. `discord/interactions.ts` dispatches button clicks via a registry keyed on `custom_id` prefix. `discord/commands.ts` handles `!prefix` commands (e.g. `!dishes`). `discord/api.ts` wraps the Discord REST API.
- **Cloudflare Tunnel**: `tunnel.ts` exposes the local server publicly so Discord can reach `/api/discord/interactions` during development (`npm run dev:discord`).
- **Logging**: `pino` via `logger.ts`, exported as `log`.

### Client (`client/src/`)

- **Stack**: React 19 + React Router v7 + Sass (CSS Modules)
- **API layer**: `api/` contains thin fetch wrappers for each resource (`plants`, `my-plants`, `rooms`, `auth`). Hooks in `hooks/` (`usePlants`, `useMyPlants`, `useRooms`) wrap those with state/loading/error management.
- **Routes**: `/` (home/collection view), `/add-plant` (search + add), `/plants/:id` (edit plant). All routes are auth-gated in `App.tsx`; unauthenticated users redirect to `/login`.
- **Watering logic**: `utils/plants.ts` contains `getDaysUntilWater` and `getWaterStatus` — the core scheduling calculations used by both the list and the detail panel.

### Data model

```
plants          — reference catalogue (common name, latin name, watering interval, light, description)
userPlants      — the user's personal collection (FK → plants, FK → rooms, nickname, lastWateredAt, snoozedUntil)
rooms           — named locations (e.g. "Kitchen") for grouping userPlants
wateringEvents  — plant watering history (FK → userPlants, wateredBy, source, wateredAt)

tasks           — household task definitions (name, command, intervalDays nullable, description, snoozedUntil nullable)
                  snoozedUntil lives here directly (tasks are shared, not per-user like plants)
taskLogs        — completion history (FK → tasks, FK → members, completedAt, source: 'discord'|'web')
members         — household members (discordId, discordName, displayName — auto-created on first interaction)
```

### Environment variables

Server reads from `server/.env` (then falls back to root `.env`):

```
AUTH_PASSWORD           # the password users type on the login screen
AUTH_SECRET             # the session cookie value (internal, never typed — make it a long random string)
DISCORD_BOT_TOKEN       # optional — Discord bot token for reminders and commands
DISCORD_CHANNEL_ID      # optional — channel to post reminders to
DISCORD_PUBLIC_KEY      # optional — for verifying interaction signatures
DISCORD_COMMAND_PREFIX  # optional — prefix for text commands, defaults to "!"
```

**Note**: `!prefix` commands require the bot to have the **Message Content** privileged intent enabled in the Discord developer portal, and the bot must be invited with the `bot` scope (not just `applications.commands`).

In production, the server serves the built React client as static files from `client/dist/` with a catch-all fallback to `index.html` for client-side routing.

## Discord integration conventions

The `server/src/discord/` directory is **shared infrastructure** — never duplicate the reminder or interaction patterns per feature domain.

### Button interactions
- Button `custom_id` must follow the pattern `{action}:{domain}:{id}` — e.g. `complete:plant:42`, `snooze:task:7`.
- `interactions.ts` maintains a handler registry keyed on `{action}:{domain}`. Adding a new button type = registering a new handler, not adding an `if` branch.
- Snooze is available to any domain that has `intervalDays` (scheduled tasks). On-demand tasks (no interval) must not offer a snooze button.

### Prefix commands (`!command`)
- All `!prefix` commands are registered in `discord/commands.ts` — one registry, not one file per command.
- The bot listens for `MESSAGE_CREATE` gateway events via a WebSocket connection to Discord. This requires the **Message Content** privileged intent to be enabled.
- Every command must reply with a confirmation message (feedback loop) — never silently succeed.
- Member lookup/creation happens inside the command handler: look up by Discord user ID, create with display name if not found.
- Unknown commands are silently ignored (no reply) to avoid spam from unrelated bot messages.

### Reminders
- `reminders.ts` exports `sendReminders(config: ReminderConfig)`. Adding a new remindable domain = passing a new config, not writing a new function.
- The cron in `index.ts` calls `sendReminders` once per registered domain.

### Task event logging
- Household task completions write to `taskLogs` (FK → tasks, FK → members).
- Plant watering completions continue to write to `wateringEvents` — do not merge the two tables. They serve different query patterns and the plant history predates this system.
- The activity feed page may query both tables and merge results in application code.

### Members
- `members` are auto-created from Discord display name on first interaction. Do not require pre-registration.
- Web UI may allow renaming a member later, but creation is always automatic.

## Production deployment (Raspberry Pi)

The app runs on a Raspberry Pi on the local network.

- **Host**: Static IP set in `/etc/dhcpcd.conf` on the Pi
- **Process manager**: PM2 — both the app and tunnel are registered and start on boot
- **PM2 processes**: `ziber` (the app via `npm start`) and `tunnel` (ngrok via `npm run tunnel -w server`)
- **Interactions endpoint**: ngrok exposes `https://<NGROK_DOMAIN>/api/discord/interactions` so Discord can reach the Pi. The domain is set via `NGROK_DOMAIN` in `server/.env` and must match the Interactions Endpoint URL in the Discord developer portal.

### Useful commands on the Pi

```bash
pm2 list                  # check process status
pm2 logs ziber            # app logs (cron errors, DB, reminders)
pm2 logs tunnel           # ngrok connection status
curl http://localhost:4040/api/tunnels   # verify ngrok tunnel is live
pm2 restart ziber tunnel  # restart both after a config/env change
```

### If Discord notifications stop working

1. Check `pm2 logs ziber` for `EAI_AGAIN` (DNS failure) or `Missing DISCORD_BOT_TOKEN`
2. Check `pm2 logs tunnel` / `curl localhost:4040/api/tunnels` to verify ngrok is connected
3. Confirm the ngrok URL in the Discord developer portal matches `NGROK_DOMAIN`
4. If DNS is broken: `echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf` then `pm2 restart ziber tunnel`
