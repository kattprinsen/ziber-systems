# INCIDENT-001 — Raspberry Pi SSH Unreachable

**Date:** 2026-08-03  
**Status:** Resolved  
**Severity:** Low (no data loss, local network only)

## Summary

SSH access to the Raspberry Pi production host was lost. Attempts to connect via hostname (`raspberrypi.local`) and previously known IP failed with `No such host is known`.

## Timeline

| Time | Event |
|------|-------|
| 2026-08-03 | SSH connection attempt fails: `ssh pi@raspberrypi.local` → `No such host is known` |
| 2026-08-03 | ARP table scan (`arp -a`) shows only `.1`, `.11`, `.14` on `192.168.0.x` — Pi not present |
| 2026-08-03 | Direct SSH to `.11` and `.14` — neither is the Pi |
| 2026-08-03 | Ping sweep initiated to locate new IP — no result |
| 2026-08-03 | Connected monitor, keyboard and mouse directly to the Pi |
| 2026-08-03 | Pi had lost network connectivity entirely — reconnected manually via on-screen prompt |
| 2026-08-03 | Completed system updates prompted on login |
| 2026-08-03 | Verified recovery via `pm2 logs ziber` — all services running normally |

## Root Cause

The Pi lost its network connection (likely after a system update or dhcpcd service failure). Without network access it was invisible to ARP scans and mDNS, making remote recovery impossible.

## Steps Taken

1. Checked ARP cache — Pi not listed
2. Tried `raspberrypi.local` mDNS — failed
3. Tried direct SSH to `.11` and `.14` — not the Pi
4. Ran full subnet ping sweep — no result
5. Connected HDMI + keyboard/mouse directly to the Pi
6. Reconnected to network via on-screen prompt
7. Applied pending system updates
8. Confirmed `pm2 logs ziber` — `ziber` and `tunnel` processes healthy

## Resolution

Resolved via physical access. Pi reconnected to network and system updates applied. All services confirmed healthy.

## Follow-up Actions

- [x] Verify `pm2 list` and `pm2 logs ziber` — services running
- [ ] Set a DHCP reservation in the router so the Pi always gets the same IP
- [ ] Investigate auto-reconnect / watchdog options to avoid needing physical access next time
- [ ] Consider enabling remote access fallback (e.g. Tailscale) — see backlog
