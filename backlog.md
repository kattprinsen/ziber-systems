# Backlog

## ~~Rooms / grouping~~ ✅ Done
~~Group plants by room (e.g. "Kitchen", "Bedroom"). Needs a new `rooms` concept in the DB, UI to assign plants to a room, and filtered views per room.~~

## ~~Better UI~~ ✅ Done
~~Cards are too large — 12+ plants causes heavy scrolling. Consider a compact list view or a denser grid, with the card detail only on click/expand.~~

## Logging
Zero production logging right now. Need structured logs for key operations: adding a plant, watering a plant, Discord reminder sent, errors. Goal: be able to debug failures after the fact.

## Authentication + Public Hosting (Cloudflare Tunnel)

### Phase 1 — Shared login auth (implement first)

Stateless cookie-based auth, no DB changes, one shared password for the whole household.

**How it works:**
- `AUTH_PASSWORD` env var = the household passphrase
- `AUTH_SECRET` env var = a long random string that doubles as the session cookie value
- Login: `POST /api/auth/login` with `{ password }` → if correct, set httpOnly `session` cookie (value = `AUTH_SECRET`)
- Middleware: checks `session` cookie on all `/api/*` routes; exempts `/api/auth/*` and `/api/discord/interactions`
- Logout: deletes the cookie

**Files to create/change:**
- `server/.env.example` — add `AUTH_PASSWORD` and `AUTH_SECRET` entries
- `server/src/routes/auth.ts` — new: `POST /login`, `POST /logout`, `GET /me`
- `server/src/middleware/auth.ts` — new: cookie check, exemptions
- `server/src/index.ts` — mount auth route then apply middleware (order matters)
- `client/src/api/auth.ts` — new: `login()`, `logout()`, `checkAuth()` fetch wrappers
- `client/src/pages/LoginPage/` — new: password form page
- `client/src/App.tsx` — add auth state, `/login` route, redirect guard
- `client/src/components/Layout/Layout.tsx` — add logout button

### Phase 2 — Cloudflare Tunnel (RPi setup, no code changes)

Buy a domain via Cloudflare Registrar (~$5–12/yr, nameservers already on Cloudflare). Then on the Pi:

```bash
# 1. Install cloudflared (ARMv7)
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm
chmod +x cloudflared-linux-arm && sudo mv cloudflared-linux-arm /usr/local/bin/cloudflared

# 2. Authenticate & create tunnel
cloudflared tunnel login
cloudflared tunnel create ziber

# 3. Create ~/.cloudflared/config.yml
# tunnel: <tunnel-id>
# credentials-file: /home/ziber1337/.cloudflared/<tunnel-id>.json
# ingress:
#   - hostname: ziber.yourdomain.com
#     service: http://localhost:3000
#   - service: http_status:404

# 4. Add DNS record
cloudflared tunnel route dns ziber ziber.yourdomain.com

# 5. Run via pm2 (replaces ngrok)
pm2 start "cloudflared tunnel run ziber" --name tunnel && pm2 save
```

After tunnel is up:
- Update Discord Developer Portal interactions URL → `https://ziber.yourdomain.com/api/discord/interactions`
- Remove ngrok process from pm2: `pm2 delete <ngrok-process-name> && pm2 save`
