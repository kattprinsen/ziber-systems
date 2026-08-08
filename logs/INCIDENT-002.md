# INCIDENT-002 — Discord Notifications Stopped / PM2 Process List Lost

**Date:** 2026-08-08 (noticed) — failure likely occurred 2026-08-07  
**Status:** Resolved  
**Severity:** Medium (service degradation — no notifications delivered while `ziber` was down)

## Summary

Discord plant/task reminder notifications stopped being delivered. On investigation via SSH, `pm2 restart ziber` returned `[PM2][ERROR] Process or Namespace ziber not found` — the PM2 process list was empty and the `ziber` process was not running.

## Timeline

| Time | Event |
|------|-------|
| ~2026-08-07 | Pi likely rebooted or PM2 daemon restarted — `ziber` and `tunnel` processes lost |
| ~2026-08-07 | Cron job inside `ziber` stops firing — no Discord notifications sent |
| 2026-08-08 | Admin notices missing notifications, SSHes into Pi |
| 2026-08-08 | `pm2 logs ziber --lines 20` returns garbled output (empty / escape codes only) |
| 2026-08-08 | `pm2 restart ziber` → `[PM2][ERROR] Process or Namespace ziber not found` |
| 2026-08-08 | Processes re-registered and started manually, `pm2 save` run |
| 2026-08-08 | Notifications confirmed working |

## Root Cause

Unknown — admin was not home when failure occurred. Most likely causes:

1. **Pi rebooted** (scheduled OS update, power blip) and `pm2 startup` was not fully configured, so the process list was not restored on boot
2. **PM2 daemon crashed** and restarted with an empty process list

Note: notifications were working after INCIDENT-001, meaning the Pi was healthy at that point. Something triggered a fresh reboot or PM2 reset between then and 2026-08-07. The `pm2 startup` + `pm2 save` step may not have been re-run after INCIDENT-001 recovery.

## Why Notifications Stopped

The cron job that sends Discord reminders runs inside the `ziber` Node.js process. When PM2 has no record of `ziber`, nothing is running — no cron, no API, no reminders.

## Steps Taken

1. SSHed into Pi, ran `pm2 list` — confirmed empty
2. Started processes manually:
   ```bash
   pm2 start "npm run start" --name ziber
   pm2 start "npm run tunnel -w server" --name tunnel
   pm2 save
   ```
3. Ran `pm2 startup` to verify systemd hook — followed any output instructions
4. Confirmed via `pm2 logs ziber` that the app is running and healthy

## Resolution

Resolved. Processes re-registered and `pm2 save` run. Notifications working again.

## Follow-up Actions

- [ ] Verify `pm2 startup` is properly registered with systemd so processes survive future reboots (`pm2 startup` → run the output command → `pm2 save`)
- [ ] Implement admin health monitoring so downtime is caught proactively — see backlog item "Admin system health monitoring"
- [ ] Consider a daily heartbeat Discord message as a simple liveness check
