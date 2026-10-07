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

## Record shared task completions — implemented; local Discord verification pending

Allow one household task completion to be credited to multiple members when people do something together (for example, dinner or a walk). Today `taskLogs` stores one `memberId` per completion, and the Discord completion button credits only the person who clicked it. Nearly all use currently comes through Discord, so deliver the button flow first; prefix commands and web UI can follow later.

- After a reminder's **Complete** button is clicked, let the user choose participants with a Discord-native user-select control and explicitly confirm; opening or changing the picker must not log a completion. Acknowledge success and prevent repeat submissions from creating duplicate completion events
- Resolve/store participants by Discord user ID, never typed display names; deduplicate selected IDs and use Discord-provided user data to create missing household member records
- Preserve today's behavior when no participants are selected: credit the person who clicked **Complete**; when participants are selected, that selection is the complete list, and the clicker is credited only if selected
- Update the data model so one completion event can be linked to multiple members (use a normalized join table, not a free-form string or duplicate completion rows); add a migration that backfills every existing `taskLogs.memberId` as that event's participant
- Keep completion totals event-based (one completion counts once), while member activity/participation credits each linked member
- Show all credited members in the activity feed and `/api/export/task-logs`; update member activity aggregates so shared completions count for every linked member
- Keep `!command` single-member behavior unchanged in the first release; later support mention-based participants using Discord IDs and the same event model
- Add tests for no selection/default clicker, selecting multiple members, selecting the clicker explicitly, duplicate/invalid participant IDs, event-count semantics, and activity/export member lists

Implemented: Discord task reminder **Complete** opens an ephemeral participant picker and confirmation flow; an empty selection credits the clicker, and an explicit selection is authoritative. Completion events now link to participants through `task_log_members`; existing task history is backfilled by migration, and Discord reminder message IDs prevent repeat completions. Activity, task history, exports, and per-member stats expose/count the linked participants. Automated checks pass; manual Discord verification remains.

---

## Undo accidental Discord actions

Add a way to reverse an accidental action in the Discord reminder interface, especially a misclicked **Snooze** button.

- Provide an **Undo** action after snoozing a plant or task
- Restore the previous `snoozedUntil` value and reminder state exactly
- Make the undo window and behavior clear in the Discord response
- Decide whether other reversible actions, such as **Complete**, should use the same pattern
- Add tests covering a snooze followed by undo, including expiry of the undo window

---

## ~~Improve plant removal UX~~ ✅ Done

~~Triggered by INCIDENT-003 — the remove action is immediate, permanent, and silent.~~

~~- **Confirmation dialog**: show a modal before deletion ("Remove *Monstera*? This will also delete all watering history.")~~
~~- **Soft-delete / archive**: instead of hard-deleting, mark `userPlants` as archived (`archivedAt` timestamp). Archived plants are hidden from the main collection but their history is preserved. A separate "Archive" view can show or restore them.~~
~~- **Undo toast**: if soft-delete is implemented, show a brief "Plant removed — Undo" toast that cancels the operation within a few seconds before it is committed.~~

Implemented: soft-delete (`archivedAt`), watering history preserved, undo toast (replaces confirmation banner — 5s to undo after remove), archive view at `/archive` with per-plant restore.

---

## ~~Footer doesn't stick to the bottom~~ ✅ Done

~~The footer renders right below page content instead of sitting at the viewport bottom on short pages.~~

Fixed: `.root` is now a flex column, `<main>` wraps the outlet with `flex: 1`, footer has `margin-top: $space-8` and a top border. Footer shows "Ziber Systems" left-aligned and the version right-aligned.

---

## ~~Activity page pagination~~ ✅ Done
~~When browsing the activity feed, the page can grow long and hard to scan. Add progressive loading in the UI.~~
~~- Show 5 activity items initially~~
~~- Add a "Show more" control below the list~~
~~- Each click loads 5 more items~~
~~- Hide the control when all items are shown~~
~~- Keep current filters working together with pagination~~
### Not implemented
Optional follow-up: if activity volume keeps growing, move to server-side pagination later.

## Personal training schedules
Add training rotations and Discord reminders, reusing the household-task reminder patterns where appropriate without making training a shared household task.

- Each training schedule belongs to a specific member; members only receive their own reminders
- Support different activity types and rotations, such as swimming and gym sessions
- Record completions so the next reminder can follow the configured rotation
- Decide later how rotations are represented, how reminders are delivered, and whether web-based completion is needed

## ~~Updating text~~ ✅ Done
~~We need to update so that the text in discord actually says what room the plants are in, some plants with different intervalls in different rooms are hard to track with the messages we get from discord~~

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

## CI/CD for Raspberry Pi deploys

Currently every deploy is fully manual: push to main, SSH into the Pi, `git pull`, rebuild, restart pm2 by hand. Not a huge investment, but worth automating as a good personal-dev practice — doesn't need to be perfect.

Design principle: the runner is only a remote trigger. The deploy runs in the **existing clone** that PM2 already uses, so the DB, `server/.env`, `node_modules` and the PM2 working directory stay exactly where they are. Nothing that works today is moved or removed, and the manual process stays available as a fallback.

Risks to design around (from INCIDENT-001/002/005/007 and a review of the code):
- **Public repo + self-hosted runner**: the repo is public, so a PR from a fork could run arbitrary code on the Pi (with access to `server/.env`). Only the deploy workflow may use the self-hosted runner, and only via `workflow_dispatch`. `ci.yml` must use `ubuntu-latest`, never `self-hosted`. In GitHub → Settings → Actions, require approval for all outside contributors.
- **Native dependency (INCIDENT-007)**: `better-sqlite3` is compiled per Node version/arch. Never `npm ci`. Only run `npm install` when `package-lock.json` changed in the pull, and then verify the binding (`node -e "new (require('better-sqlite3'))(':memory:').close()"`) and `npm run build` **before** restarting PM2. The `allowScripts` approval lives only on the Pi today and is not in the repo (no `.npmrc`); confirm it is configured at user level so a reinstall can't silently skip compilation.
- **Wrong working directory = silent empty database**: `db/index.ts` does `mkdirSync('data')` and opens `data/data.db` relative to `process.cwd()`, and `.env` is also resolved from `cwd`. If PM2 is ever started from another directory, the app boots healthy against a brand-new empty DB and a health check will not notice. Deploy in the existing clone and keep `pm2 restart` (never `pm2 start` from a new path).
- **Runner user and PATH**: install the runner service as the same user that owns the PM2 daemon (a different user gets its own empty PM2 and `ziber` is "not found", as in INCIDENT-002). The service has a minimal PATH, so `node`, `npm` and `pm2` must be resolvable there (check with a read-only run first, especially if installed via nvm).
- **Pi resources**: don't run `triage` + `test` on the Pi during deploy; cloud CI already does that. Require CI green on the commit instead. The build on the Pi is the same one done manually today.
- **Restart side effects**: pending participant pickers and undo tokens are in-memory and are lost on restart; the 08:00 reminder cron is in-process with no catch-up, so don't deploy around 08:00. The `tunnel` PM2 process is unaffected.
- **Migrations are forward-only and run on boot**: rolling code back after a new migration also requires restoring the pre-deploy DB backup. Take the backup before pulling.

Steps:
- **Step 0 (read-only dry run)**: install the runner, run a workflow that only prints `whoami`, `uname -m`, `node -v`, `pm2 list`, `pwd`. Touches nothing; proves user, PATH and architecture (GitHub's runner may not support 32-bit armv7l; if it doesn't, fall back to a cron/webhook script or manual deploys).
- Add `.github/workflows/ci.yml` — `ubuntu-latest`, on PRs and pushes to `main`: `npm install`, `npm run triage`, `npm run test`. Enable "require status checks" branch protection in GitHub settings.
- Add `.github/workflows/deploy.yml` — `workflow_dispatch` only, `runs-on: [self-hosted, raspberry-pi]`, `concurrency: deploy` (no overlapping runs), only from `main`. No `actions/checkout`; run in the existing clone (`cd` to its path), so there's no `git clean` risk. Order:
  1. Back up the DB with the SQLite backup API (or stop writes first); a plain `cp` of a live DB file can be inconsistent. Keep the last N backups so the SD card doesn't fill.
  2. `git pull --ff-only origin main`.
  3. If `package-lock.json` changed: `npm install`, then the `better-sqlite3` binding check.
  4. `npm run build`; on any failure stop here and leave the running app untouched.
  5. `pm2 restart ziber --update-env`, `pm2 save`.
  6. Verify: `curl -f http://localhost:3000/` and confirm `pm2 jlist` shows `ziber` online with an unchanged restart count after a few seconds (catches crash loops). Do not use `/api/health`: it is behind `authMiddleware` and returns 401 unauthenticated. Exempting it in `server/src/middleware/auth.ts` is possible, but it writes a DB row per call, making that write reachable without login.
- Make the first real deploy a trivial change, and run it while someone can SSH in.
- Update the Pi deploy sections of `README.md` and `CLAUDE.md`: runner setup, the new flow, the manual fallback, and the rollback procedure.
- No auto-rollback in v1: a failed step fails the workflow loudly with the backup already taken. Manual rollback: `git checkout <previous-sha>`, rebuild, restore the DB backup if a migration ran, `pm2 restart ziber`.

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

## Technical debt (found during repo maintenance scan, 2026-09-18)

### ~~Docs/code drift — tunnel provider~~ ✅ Done
~~`CLAUDE.md` describes the tunnel as Cloudflare Tunnel (`tunnel.ts` / `cloudflared`), but the actual code (`server/src/tunnel.ts`, `npm run tunnel -w server`) still spawns the **ngrok** CLI and reads `NGROK_DOMAIN`. `.github/copilot-instructions.md` correctly documents ngrok. Either finish the Cloudflare Tunnel migration (see "Phase 2 — Cloudflare Tunnel" above) or fix `CLAUDE.md` to stop describing a migration that hasn't happened — right now the two docs contradict each other.~~

Fixed: `CLAUDE.md` now correctly describes the ngrok-based tunnel, matching the actual code and `.github/copilot-instructions.md`. The Cloudflare Tunnel migration remains a possible future task (see "Phase 2 — Cloudflare Tunnel" above), not something already in place.

### ~~`console.log`/`console.error` left in server code~~ ✅ Done
~~Project convention is structured logging via `pino` (`log` from `logger.ts`) and never `console.*` in server code, but several files still use raw console calls:~~
~~- `server/src/routes/health.ts:14` — `console.log("Healthcheck PING!")` on every health check (also spams stdout since health checks run frequently)~~
~~- `server/src/routes/discord.ts:29` — `console.error('[Discord] Verify error:', e)` in `verifySignature`, even though the rest of the file already imports and uses `log`~~
~~- `server/src/tunnel.ts` — several `console.log`/`console.error` calls (lower priority, it's a standalone script not the main app, but still inconsistent)~~
~~- `server/src/db/seed.ts:51` — `console.log` summary at end of seed run (also low priority, one-off CLI script)~~

Fixed: all four files now use the shared pino `log` (`log.info`/`log.error`/`log.warn`) instead of `console.*`.

### ~~Inconsistent error handling in client hooks~~ ✅ Done
~~`usePlants` and `useMyPlants` follow the documented hook pattern (own `loading` **and** `error` state, expose `error` to callers). `useMembers`, `useRooms`, and `useTasks` do not — they swallow fetch failures with `console.error` only and never expose an `error` state, so the Members/Rooms/Tasks pages have no way to show the user that a load or mutation failed. Bring these three hooks in line with `usePlants`/`useMyPlants`.~~

Fixed: `useMembers`, `useRooms`, and `useTasks` now expose load errors, and their pages render an error state instead of showing an empty result after a failed request.

### ~~`health.ts` writes a DB row on every check~~ ✅ Done
~~`GET /api/health` inserts a row into `healthChecks` on every single call before responding. If this endpoint is polled frequently by an uptime monitor (see "Admin system health monitoring" above), the table grows unbounded with no cleanup/retention policy. Worth deciding whether every ping needs a persisted row, or only cron/scheduled checks, and adding a retention/cleanup strategy either way.~~

Fixed: health checks older than 30 days are deleted on each health request before the retained row count is returned.
