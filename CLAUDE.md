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
```

## Architecture

This is an npm workspaces monorepo with two packages: `client/` (React SPA) and `server/` (Hono API).

### Server (`server/src/`)

- **Framework**: [Hono](https://hono.dev/) on Node.js via `@hono/node-server`
- **Database**: SQLite via `better-sqlite3` + Drizzle ORM. The DB file lives at `data/data.db` (created at startup). Schema is in `db/schema.ts`; migrations are applied inline in `db/index.ts` using raw `PRAGMA table_info` checks (no migration runner).
- **Auth**: Cookie-based shared-password auth. Login posts to `/api/auth/login`, which sets a `session` cookie. `middleware/auth.ts` compares it against `AUTH_SECRET` env var. `/api/auth/*` and `/api/discord/interactions` are exempt.
- **Discord integration**: A Discord bot sends daily watering reminders at 08:00 (cron). `discord/reminders.ts` queries due/overdue plants and posts to a channel with a "Mark as watered" button component. `discord/interactions.ts` handles the button callback (POST `/api/discord/interactions`), which updates `lastWateredAt` directly. `discord/api.ts` wraps the Discord REST API.
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
userPlants      — the user's personal collection (FK → plants, FK → rooms, nickname, lastWateredAt)
rooms           — named locations (e.g. "Kitchen") for grouping userPlants
```

### Environment variables

Server reads from `server/.env` (then falls back to root `.env`):

```
AUTH_SECRET             # shared password for the session cookie
DISCORD_BOT_TOKEN       # optional — Discord bot token for reminders
DISCORD_CHANNEL_ID      # optional — channel to post reminders to
DISCORD_PUBLIC_KEY      # optional — for verifying interaction signatures
```

In production, the server serves the built React client as static files from `client/dist/` with a catch-all fallback to `index.html` for client-side routing.
