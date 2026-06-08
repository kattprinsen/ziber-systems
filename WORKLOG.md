# Worklog — Ziber Systems

A running dev diary of sessions working on this project.

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
