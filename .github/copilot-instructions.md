# Ziber Systems — Copilot Instructions

## Tech Stack

### Client
- **Framework**: React 19 with TypeScript
- **Build tool**: Vite 6
- **Language**: TypeScript (strict mode, ESM)
- **Package manager**: npm (workspaces monorepo)
- **Routing**: `react-router-dom` — `BrowserRouter` wraps the app in `main.tsx`; routes defined with `<Routes>` / `<Route>` in `App.tsx`

### Server
- **Runtime**: Node.js
- **Framework**: Hono (TypeScript-native, `@hono/node-server` adapter) on port 3000
- **Database**: SQLite via `better-sqlite3`
- **ORM**: Drizzle ORM (TypeScript-first) — use `drizzle-orm >= 0.45.2`
- **Dev runner**: `tsx --watch`

## Project Structure

```
package.json            # Workspace root — runs both client and server
client/
  package.json
  vite.config.ts        # Proxies /api → localhost:3000 (no CORS in dev)
  index.html
  src/
    declarations.d.ts   # Global type declarations (e.g. *.module.scss)
    main.tsx            # React root mount
    App.tsx             # Root component
    api/                # One file per resource — typed fetch wrappers
    components/         # One folder per component, co-located with styles
    hooks/              # Custom hooks (use*.ts)
    styles/             # Global SCSS variables and resets
server/
  package.json
  tsconfig.json
  src/
    index.ts            # Hono app entry point
    db/
      index.ts          # SQLite + Drizzle connection and table init
      schema.ts         # Drizzle table definitions
      seeds/            # JSON seed files for static reference data
      seed.ts           # Idempotent seed script (run with npm run seed -w server)
    routes/             # One file per route group
    tunnel.ts           # Spawns ngrok CLI to expose port 3000 via a static domain
```

## Code Style

- Use **functional components** only — no class components
- Use **named exports** for components, default export only at the bottom of the file
- Prefer `const` arrow functions for components: `const MyComponent = () => { ... }`
- Use TypeScript — always type props explicitly with an `interface` or `type`
- Avoid `any` — use proper types or `unknown`
- Keep components small and focused on a single responsibility

## Component Patterns

- Props interface should be named `{ComponentName}Props`
- Each component lives in its own folder under `src/components/{ComponentName}/`, co-located with its SCSS module
- Prefer composition over prop drilling — use context or pass children when appropriate
- Extract reusable logic into custom hooks (`use*.ts`) in a `src/hooks/` folder

## API Layer (Client)

- All server calls live in `src/api/` — one file per resource (e.g. `items.ts`)
- Export a typed interface for each resource shape alongside the fetch functions
- Throw on non-OK responses so callers can catch uniformly

## Data Fetching & State

- No external state management or form library by default — plain `useState` + custom hooks suffice
- Each resource has a dedicated `use{Resource}` hook in `src/hooks/` that owns fetch, loading, error, and mutate logic
- After a mutation (create/update/delete), re-fetch the list from the server to keep state in sync (no optimistic updates unless needed)
- Introduce TanStack Query or a global state library only if caching/background-sync requirements justify it

## Server Patterns

- Define routes in `server/src/routes/` — one file per route group, mounted in `index.ts`
- DB table schema goes in `server/src/db/schema.ts`; connection + `CREATE TABLE IF NOT EXISTS` bootstrap in `server/src/db/index.ts`
- Route files export a `new Hono()` instance as default; mount with `app.route()`
- Use `cors()` middleware from `hono/cors` on all routes
- Validate request bodies at the route boundary before touching the DB; return `400` with `{ error: string }` on bad input
- Use `.returning()` on Drizzle inserts to return the created row to the client

## Static / Seed Data

- Curated reference data (e.g. plant catalogue) lives as a committed JSON file in `server/src/db/seeds/`
- A `seed.ts` script reads the JSON and inserts rows idempotently (skip by unique field); run once with `npm run seed -w server`
- Prefer owning static datasets over third-party APIs when the data is small, stable, and free to curate

## Routing (Client)

- `BrowserRouter` is mounted once in `main.tsx`
- All routes are declared in `App.tsx` using `<Routes>` / `<Route>`
- Pages live in `src/pages/{PageName}/` with a co-located SCSS module, same conventions as components
- Use `NavLink` for navigation with active styling; use `Link` for plain navigation

## SCSS

- All SCSS modules must `@use '../../styles/variables' as *` (adjust depth as needed)
- Use `@use 'sass:color'` and `color.adjust()` instead of the deprecated `darken()` / `lighten()` functions

## Code Quality

- ESLint flat config lives at the workspace root (`eslint.config.js`) — covers both `client/src` and `server/src` in one pass
- Packages installed at root devDeps: `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `globals`
- Key rules: `@typescript-eslint/no-explicit-any` (error), `@typescript-eslint/no-unused-vars` (error, `_` prefix exempted), `react-hooks/rules-of-hooks` (error), `react-hooks/exhaustive-deps` (warn)
- Server tsconfig has `noUnusedLocals: true` and `noUnusedParameters: true` (client tsconfig.app.json already had these)
- `npm run lint` — lint both workspaces; `npm run triage` — typecheck + lint in parallel, exits non-zero on any failure
- When a partial `useEffect` dep array is intentional (e.g. initialise-once-per-id pattern), add `// eslint-disable-next-line react-hooks/exhaustive-deps` with a comment explaining why — never suppress silently

## Discord Integration

- Discord bot logic lives in `server/src/discord/` — one file per concern: `config.ts`, `api.ts`, `reminders.ts`, `interactions.ts`
- `config.ts` reads env vars lazily via getters so dotenv has time to populate `process.env` before first use
- Interactions endpoint at `POST /api/discord/interactions` — always verify Discord's Ed25519 signature before processing; use `webcrypto.subtle` (Node built-in) with `importKey('raw', ...)` — do NOT use `createVerify` from `crypto`, it cannot accept raw 32-byte keys directly
- Scheduled reminders use `node-cron` started in `server/src/index.ts` after `dotenv/config` is imported
- Bot sends one message per plant with an action-row button (`custom_id: 'water_plant:{id}'`); the interaction handler updates the DB and returns `UPDATE_MESSAGE` (type 7) to edit the original message in-place
- In dev, an ngrok tunnel with a **static domain** exposes port 3000 so Discord can reach the interactions endpoint — use `npm run dev:discord` which spawns the ngrok CLI via `server/src/tunnel.ts`; do NOT use ngrok quick-tunnels (URL changes on every restart)
- The ngrok tunnel uses the CLI directly (`spawn('ngrok', ['http', '--url=...', '3000'])`); do NOT use the `@ngrok/ngrok` SDK (process exits immediately after `ngrok.forward()` resolves)
- Add `POST /api/discord/reminders/trigger?force=true` as a dev-only manual trigger to test without waiting for the cron
- Env vars: `DISCORD_BOT_TOKEN`, `DISCORD_PUBLIC_KEY`, `DISCORD_CHANNEL_ID`, `NGROK_DOMAIN` — template in `server/.env.example`

## Production

- Build: `npm run build` compiles client → `client/dist/` and server → `server/dist/`
- Start: `NODE_ENV=production node server/dist/index.js` **from the project root** — Hono serves static files from `./client/dist` (relative to `process.cwd()`)
- Static serving uses `serveStatic` from `@hono/node-server/serve-static`; guarded by `process.env.NODE_ENV === 'production'` so Vite handles it in dev
- SPA fallback: a second `serveStatic` with `rewriteRequestPath: () => '/index.html'` ensures React Router handles unmatched routes (e.g. `/plants/1`)
- SQLite `data.db` is created at `process.cwd()` — always run the server from the project root
- Discord outbound reminders (cron) work fine on a local network; Discord interactions (button clicks) require a public URL — run ngrok even in production if hosted on LAN
- Use `pm2` for process persistence on a server or Raspberry Pi: `pm2 start "npm run start" --name ziber && pm2 save && pm2 startup`

## Build & Dev

```bash
npm run dev              # Start both client (Vite HMR) and server (tsx --watch) concurrently
npm run dev:discord      # Same as above + ngrok tunnel (required for Discord interactions)
npm run build            # Build client and server
npm run start            # Run production build (NODE_ENV=production, from project root)
npm run triage           # Typecheck both workspaces + lint — run before pushing
npm run lint             # ESLint only
```

```bash
npm run dev -w client    # Client only
npm run dev -w server    # Server only
npm run tunnel -w server # ngrok tunnel only (via server/src/tunnel.ts)
```

