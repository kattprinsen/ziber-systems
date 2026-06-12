# Worklog — Ziber Systems

A running dev diary of sessions working on this project.

---

DATE      : 2026-06-12
TIME      : ~local session
SESSION   : 005

LOG
---
1. Fixed deprecated Sass `lighten()` call in RoomsPage.module.scss — replaced with `color.scale()` and added `@use 'sass:color'` import
2. Planned and designed the household tasks feature (chores tracker) — agreed on Discord-first UX, auto-created members from Discord display names, snooze for scheduled tasks
3. Decided on `!prefix` commands (e.g. `!dishes`) over slash commands for simplicity; bot replies with confirmation on every command
4. Updated CLAUDE.md with architecture conventions: button ID format `action:domain:id`, dispatcher registry pattern, shared reminder infrastructure, command registry rules, member auto-creation
5. Added `members`, `tasks`, and `taskLogs` tables to `db/schema.ts` and generated migration `0002_cynical_tigra.sql`
6. Refactored `interactions.ts` from hardcoded if-chain to a handler registry dispatching on `action:domain` key; added backward compat for old `water_plant:` / `snooze_plant:` button IDs
7. Updated `reminders.ts` button IDs to new `water:plant:id` / `snooze:plant:id` format
8. Added `discord/config.ts` `commandPrefix` (defaults to `!`, configurable via `DISCORD_COMMAND_PREFIX`)
9. Created `discord/commands.ts` — DB-driven command handler; looks up task by command word, auto-upserts member, inserts `taskLog`, clears snooze on manual completion
10. Created `discord/gateway.ts` — minimal Discord WebSocket gateway client with heartbeat, auto-reconnect, and 4004 auth-failure guard
11. Wired gateway into `index.ts` — starts on boot, routes `MESSAGE_CREATE` to `handleCommand`, replies in the originating channel
12. Fixed test mock in `interactions.test.ts` to include `db.insert` — all 11 tests passing, triage clean
13. Debugged Discord gateway code 4014 — root cause was Message Content privileged intent not enabled in Discord developer portal; resolved by enabling it
14. Verified Phase 1 end-to-end: gateway connects, `!dishes` command logs to DB and bot replies with confirmation

---

DATE      : 2026-06-11
TIME      : ~local session
SESSION   : 004

LOG
---
1. Discussed missing room management UX — decided to build a dedicated /rooms page rather than inline editing on the home page
2. Added PATCH /api/rooms/:id endpoint to the server for renaming rooms (with unique-name constraint handled naturally by SQLite)
3. Added renameRoom() to client api/rooms.ts
4. Added rename() method to useRooms hook
5. Created RoomsPage (pages/RoomsPage/) with full CRUD: list rooms, inline rename per row, delete with confirmation, and an add-room form
6. Styled RoomsPage to match the rest of the app using existing SCSS variables
7. Registered /rooms route in App.tsx and added "Rooms" nav link in Layout.tsx
8. Home page left untouched — room filter bar and inline room creation remain as-is
9. Verified in browser with npm run dev; triage (typecheck + lint) passed clean

---

DATE      : 2026-06-09
TIME      : ~local session
SESSION   : 003

LOG
---
1. Added requirement: a room must be selected when adding a plant (user feedback)
2. Updated POST /api/my-plants server route to require roomId and validate it exists
3. Updated addMyPlant client API function to accept roomId as a required parameter
4. Updated useMyPlants hook — add and addCustom now thread roomId through to the API
5. Added room selector (required) to both the search confirm card and the custom plant form in MyPlantsPage
6. Inline "create a room" input initially only shown when no rooms exist — then extended to always show
7. Refactored handleCreateRoom to call createRoomApi directly (gets id back) instead of re-fetching all rooms
8. Exposed reload from useRooms hook so MyPlantsPage can refresh the room list after creation
9. New room is auto-selected in the dropdown immediately after creation

---

DATE      : 2026-06-08
TIME      : ~local session
SESSION   : 002

LOG
---
1. Pulled latest main — all PRs from previous session merged and verified
2. Added watering history feature — new watering_events table with source and wateredBy fields
3. Extended Discord interaction type to capture username from member.user or user fields
4. Added GET /api/my-plants/:id/history endpoint returning events newest first
5. History panel added to detail panel in UI, reloads on plant select and after watering
6. Created WORKLOG.md as a running dev diary for the project
7. Created .claude/commands/log.md — a /log slash command for future session logging
8. Created README.md update strategy — command only updates README for user-facing changes

---

DATE      : 2026-06-08
TIME      : ~local session
SESSION   : 001

LOG
---
1. Reconnected to Pi after IP change — diagnosed DNS failure (EAI_AGAIN), fixed with Google DNS
2. Set static IP on Pi via /etc/dhcpcd.conf to prevent future IP changes
3. Set up PM2 autostart (pm2 save + pm2 startup) so ziber and tunnel survive reboots
4. Discovered AUTH_SECRET / AUTH_PASSWORD misconfiguration — app requires both env vars
5. Fixed Secure cookie bug — cookie had secure: true in production but Pi serves over HTTP
6. Initialised CLAUDE.md with architecture docs, deployment runbook and troubleshooting guide
7. Fixed "Water today" status (was showing "Overdue by 0 days" for daysUntil === 0)
8. Added snooze feature — snoozedUntil column, PATCH /:id/snooze endpoint, UI button, Discord button
9. Replaced inline PRAGMA migrations with drizzle-kit — migrations now live in server/drizzle/
10. Updated hono to 4.12.23 (dependabot security fix)
11. Derived server API types from Drizzle schema via $inferSelect — single source of truth
12. Added watering history — watering_events table, GET /:id/history, history panel in UI, Discord username attribution
