# Backlog

## ~~Rooms / grouping~~ ✅ Done
~~Group plants by room (e.g. "Kitchen", "Bedroom"). Needs a new `rooms` concept in the DB, UI to assign plants to a room, and filtered views per room.~~

## ~~Better UI~~ ✅ Done
~~Cards are too large — 12+ plants causes heavy scrolling. Consider a compact list view or a denser grid, with the card detail only on click/expand.~~

## ~~Household Tasks (chores tracker)~~ ✅ Done

~~A chore tracking system where household members log completed tasks via Discord (`!dishes`, `!vacuum`, etc.) or the web UI. Data is tied to named household members auto-created from Discord display names.~~

**~~Phase 1 — Shared infrastructure~~ ✅ Done**
~~- Added `members`, `tasks`, `taskLogs` tables to schema + migration~~
~~- Refactored `interactions.ts` to a dispatcher registry (button IDs: `action:domain:id`)~~
~~- Created `discord/gateway.ts` — WebSocket gateway for receiving `MESSAGE_CREATE` events~~
~~- Created `discord/commands.ts` — DB-driven `!command` handler with member auto-creation~~
~~- Wired gateway into `index.ts`; bot replies with confirmation in the originating channel~~

**~~Phase 2 — Server routes + web UI for task management~~ ✅ Done**
~~- `GET/POST /api/tasks` — list and create tasks~~
~~- `DELETE /api/tasks/:id`, `PATCH /api/tasks/:id` — edit/delete~~
~~- `GET /api/members` — list members~~
~~- `PATCH /api/members/:id` — rename a member (web UI)~~
~~- Tasks management page (`/tasks`): add tasks (name, `!command` word, optional interval), edit, delete~~
~~- Members management page or section: see members, rename display names~~

**~~Phase 3 — Discord reminders for scheduled tasks~~ ✅ Done**
~~- Extend `reminders.ts` to send daily reminders for tasks with `intervalDays` set and overdue/due today~~
~~- Register `complete:task:id` and `snooze:task:id` button handlers in `interactions.ts`~~
~~- On-demand tasks (no interval) get no reminder — Discord `!command` only~~

**~~Phase 4 — Activity feed web UI~~ ✅ Done**
~~- Recent log view: who did what and when, across both `taskLogs` and `wateringEvents`~~
~~- Filter by member and/or task type~~

---

## ~~Improve plant removal UX~~ ✅ Done

~~Triggered by INCIDENT-003 — the remove action is immediate, permanent, and silent.~~

~~- **Confirmation dialog**: show a modal before deletion ("Remove *Monstera*? This will also delete all watering history.")~~
~~- **Soft-delete / archive**: instead of hard-deleting, mark `userPlants` as archived (`archivedAt` timestamp). Archived plants are hidden from the main collection but their history is preserved. A separate "Archive" view can show or restore them.~~
~~- **Undo toast**: if soft-delete is implemented, show a brief "Plant removed — Undo" toast that cancels the operation within a few seconds before it is committed.~~

Implemented: soft-delete (`archivedAt`), watering history preserved, undo toast (replaces confirmation banner — 5s to undo after remove), archive view at `/archive` with per-plant restore.

---

## Footer doesn't stick to the bottom

The footer renders right below page content instead of sitting at the viewport bottom on short pages. `.root` has `min-height: 100vh` but no flex column, so there's nothing pushing the footer down.

Fix: make `.root` a flex column, add a wrapping `<main>` that takes `flex: 1`, and give the footer a `margin-top: auto` (or equivalent). Also add some top margin to the footer so it doesn't feel cramped on long pages.

---

## Updating text
We need to update so that the text in discord actually says what room the plants are in, some plants with different intervalls in different rooms are hard to track with the messages we get from discord

## Create backup of database
What would happen today if the rpi would break, it would be impossible to re-creatge the database, we need to secure that and future proof it

## ~~Create datapipeline~~ ✅ Done

~~We need to create some sort of data-engineering pipeline to create reports and other things based on the database~~

Read-only export API added at `/api/export/*`, authenticated via `X-Api-Key` header (`EXPORT_API_KEY` env var). Endpoints:
- `GET /api/export/plants` — collection with room and catalogue data
- `GET /api/export/watering-events` — full watering history
- `GET /api/export/tasks` — tasks with completion count and last completed
- `GET /api/export/task-logs` — raw task log with member names
- `GET /api/export/members` — members with activity stats
- `GET /api/export/summary` — dashboard snapshot (overdue plants, tasks this week, most active member)

## Admin system health monitoring
No alerting exists when the system goes down. As admin you only find out when you notice notifications have stopped (see INCIDENT-002). Options to explore:
- **Heartbeat Discord message**: have the server send a daily "system alive" message to a private channel — silence = something is wrong
- **External uptime monitor**: point UptimeRobot or a similar free service at the ngrok health endpoint (`/api/health`) — alerts via email/Discord when it stops responding
- **PM2 startup hardening**: ensure `pm2 startup` + `pm2 save` are run after every deployment so processes auto-restore on reboot
- **Systemd watchdog**: configure PM2 with `--watch` or a systemd unit as a fallback if PM2 itself crashes

## Pi network resilience
The Pi lost network connectivity and required physical access to recover (see INCIDENT-001). Investigate options to prevent this:
- Set a DHCP reservation in the router for the Pi's MAC address
- Look into a remote access fallback such as Tailscale so the Pi can be reached even if it drops off the local network
- Explore a network watchdog script (e.g. ping check + auto-reconnect via `cron`) to self-heal without manual intervention

## Versioning + release cycle
Show the app version (from `package.json`) in the UI footer. Use `npm version patch/minor/major` to bump + tag before deploying to the Pi, so you can always see what's running without SSH-ing in.

## Logging
Zero production logging right now. Need structured logs for key operations: adding a plant, watering a plant, Discord reminder sent, errors. Goal: be able to debug failures after the fact.

## Authentication + Public Hosting (Cloudflare Tunnel)

### ~~Phase 1 — Shared login auth~~ ✅ Done

~~Stateless cookie-based auth, no DB changes, one shared password for the whole household.~~

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
