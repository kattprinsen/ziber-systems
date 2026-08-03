# INCIDENT-001 — Raspberry Pi SSH Unreachable

**Date:** 2026-08-03  
**Status:** Investigating  
**Severity:** Low (no data loss, local network only)

## Summary

SSH access to the Raspberry Pi production host was lost. Attempts to connect via hostname (`raspberrypi.local`) and previously known IP failed with `No such host is known`.

## Timeline

| Time | Event |
|------|-------|
| 2026-08-03 | SSH connection attempt fails: `ssh pi@raspberrypi.local` → `No such host is known` |
| 2026-08-03 | ARP table scan (`arp -a`) shows only `.1`, `.11`, `.14` on `192.168.0.x` — Pi not present |
| 2026-08-03 | Direct SSH to `.11` and `.14` — neither is the Pi |
| 2026-08-03 | Ping sweep initiated to locate new IP — ongoing |

## Likely Cause

DHCP lease expired and the Pi received a new IP address. The static IP configuration in `/etc/dhcpcd.conf` may have been lost or is not being applied.

## Steps Taken

1. Checked ARP cache — Pi not listed
2. Tried `raspberrypi.local` mDNS — failed
3. Tried `.11` and `.14` directly — not the Pi
4. Running full subnet ping sweep to find the new IP

## Resolution

_To be filled in once the Pi is located._

## Follow-up Actions

- [ ] Re-apply static IP in `/etc/dhcpcd.conf` once access is restored
- [ ] Or set a DHCP reservation in the router (more resilient than `dhcpcd.conf`)
- [ ] Verify `pm2 list` — confirm `ziber` and `tunnel` processes are still running
- [ ] Check `pm2 logs ziber` for any errors during the downtime
