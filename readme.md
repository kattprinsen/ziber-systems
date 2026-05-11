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
| `npm run dev -w client` | Client only |
| `npm run dev -w server` | Server only |
| `npm run build` | Build client and server |
| `npm run seed -w server` | Seed the plant catalogue (idempotent, safe to re-run) |

## Features

### My Plants
Add plants from a catalogue of ~100 common houseplants to your personal collection. Give them an optional nickname, mark them as watered, and see a countdown to their next watering. Cards turn red when a plant is overdue.

### Plant catalogue
Searchable database of ~100 curated houseplants with common name, latin name, watering interval, light requirements, and a description. No third-party API dependency — data is owned and committed to the repo.

### Items
General-purpose item list with create and edit support. Each item has a detail page at `/item/:id`.

## API routes

### Plants
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/plants` | List all plants |
| `GET` | `/api/plants?q=monstera` | Search by common or latin name |
| `GET` | `/api/plants/:id` | Get a single plant |

### My Plants
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/my-plants` | List the user's collection (joined with plant data) |
| `POST` | `/api/my-plants` | Add a plant (`{ plantId, nickname? }`) |
| `PATCH` | `/api/my-plants/:id/water` | Mark as watered now |
| `DELETE` | `/api/my-plants/:id` | Remove from collection |

### Items
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/items` | List all items |
| `POST` | `/api/items` | Create an item (`{ name }`) |
| `GET` | `/api/items/:id` | Get a single item |
| `PUT` | `/api/items/:id` | Update an item (`{ name }`) |

### Health
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Server + DB health check |

## Tech stack

- **Client**: React 19, TypeScript, Vite 6, react-router-dom, SCSS modules
- **Server**: Node.js, Hono, Drizzle ORM, SQLite (`better-sqlite3`)
- **Monorepo**: npm workspaces (`client/`, `server/`)
