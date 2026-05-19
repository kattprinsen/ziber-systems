# Ziber Systems — Household Plant Tracker

Track your household plants, get watering reminders, and manage your collection. Built with React, Hono, Drizzle ORM, and SQLite.

## Getting started

```bash
npm install
npm run seed -w server   # Populate the plant catalogue (run once)
npm run dev              # Start client + server concurrently
```

Client runs at `http://localhost:5173`, server at `http://localhost:3000`. The Vite dev server proxies `/api` to the server so no CORS configuration is needed in development.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start both client (Vite HMR) and server (`tsx --watch`) |
| `npm run dev:discord` | Same as above + ngrok tunnel (required for Discord interactions) |
| `npm run dev -w client` | Client only |
| `npm run dev -w server` | Server only |
| `npm run build` | Build client and server |
| `npm run seed -w server` | Seed the plant catalogue (idempotent, safe to re-run) |

## Features

### My Plants
Add plants from a catalogue of ~100 common houseplants to your personal collection. Give them an optional nickname, mark them as watered, and see a countdown to their next watering. Cards turn red when a plant is overdue.

### Custom plants
Can't find your plant in the catalogue? Create a custom entry directly from the "Add a plant" page by filling in the name, watering interval, light requirements, and description.

### Edit plants
Click the edit button on any card to update the plant's details (name, latin name, watering interval, light, description) or change its nickname.

### Plant catalogue
Searchable database of ~100 curated houseplants with common name, latin name, watering interval, light requirements, and a description. No third-party API dependency — data is owned and committed to the repo.

### Discord reminders
A daily scheduled job (8am) sends a Discord message for each plant that is overdue or due today. Each message includes a 💧 button — clicking it marks the plant as watered directly from Discord without opening the app.

## API routes

### Plants
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/plants` | List all plants |
| `GET` | `/api/plants?q=monstera` | Search by common or latin name |
| `GET` | `/api/plants/:id` | Get a single plant |
| `POST` | `/api/plants` | Create a custom plant |
| `PATCH` | `/api/plants/:id` | Update a plant's details |

### My Plants
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/my-plants` | List the user's collection (joined with plant data) |
| `POST` | `/api/my-plants` | Add a plant (`{ plantId, nickname? }`) |
| `PATCH` | `/api/my-plants/:id` | Update nickname |
| `PATCH` | `/api/my-plants/:id/water` | Mark as watered now |
| `DELETE` | `/api/my-plants/:id` | Remove from collection |

### Discord
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/discord/interactions` | Discord interactions endpoint (button clicks) |
| `POST` | `/api/discord/reminders/trigger` | Manually trigger reminders (`?force=true` to send for all plants) |

### Health
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Server + DB health check |

## Discord integration setup

1. Create an application at https://discord.com/developers/applications
2. Under **Bot** — copy the token → `DISCORD_BOT_TOKEN`
3. Under **General Information** — copy the public key → `DISCORD_PUBLIC_KEY`
4. Invite the bot to your server (OAuth2 → URL Generator, scope `bot`, permission `Send Messages`)
5. Copy a channel ID (right-click channel → Copy Channel ID, requires Developer Mode) → `DISCORD_CHANNEL_ID`
6. Create a free [ngrok](https://ngrok.com) account:
   - Install the [ngrok CLI](https://ngrok.com/download) and log in: `ngrok config add-authtoken <your-token>`
   - Dashboard → **Domains** → create a free static domain → copy (without `https://`) → `NGROK_DOMAIN`
7. Create `server/.env` from `server/.env.example` and fill in all values
8. In Discord app settings → **Interactions Endpoint URL**: `https://<your-ngrok-domain>/api/discord/interactions`
9. Start everything: `npm run dev:discord`

> The ngrok static domain is permanent — you only need to set it in Discord once.

## Tech stack

- **Client**: React 19, TypeScript, Vite 6, react-router-dom, SCSS modules
- **Server**: Node.js, Hono, Drizzle ORM, SQLite (`better-sqlite3`), node-cron
- **Discord**: Bot API (REST only, no gateway), Ed25519 signature verification via Node.js `webcrypto`
- **Monorepo**: npm workspaces (`client/`, `server/`)
