# Ziber Systems — Copilot Instructions

## Tech Stack

### Client
- **Framework**: React 19 with TypeScript
- **Build tool**: Vite 6
- **Language**: TypeScript (strict mode, ESM)
- **Package manager**: npm (workspaces monorepo)

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
    main.tsx            # React root mount
    App.tsx             # Root component
server/
  package.json
  tsconfig.json
  src/
    index.ts            # Hono app entry point
    db/
      index.ts          # SQLite + Drizzle connection and table init
      schema.ts         # Drizzle table definitions
    routes/             # One file per route group
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
- Co-locate component-specific styles, hooks, and utils in the same folder as the component
- Prefer composition over prop drilling — use context or pass children when appropriate
- Extract reusable logic into custom hooks (`use*.ts`) in a `src/hooks/` folder

## Server Patterns

- Define routes in `server/src/routes/` — one file per route group, mounted in `index.ts`
- DB table schema goes in `server/src/db/schema.ts`; connection + `CREATE TABLE IF NOT EXISTS` bootstrap in `server/src/db/index.ts`
- Route files export a `new Hono()` instance as default; mount with `app.route()`
- Use `cors()` middleware from `hono/cors` on all routes

## Build & Dev

```bash
npm run dev       # Start both client (Vite HMR) and server (tsx --watch) concurrently
npm run build     # Build client and server
```

```bash
npm run dev -w client   # Client only
npm run dev -w server   # Server only
```

