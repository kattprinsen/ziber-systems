# INCIDENT-004 — Deleted Plant Leaves Zombie Discord Reminder

**Date:** 2026-08-17  
**Status:** Resolved  
**Severity:** Low (UX degradation — stale buttons remained clickable indefinitely)

## Summary

After removing a plant from the collection, its Discord watering reminder stayed in the channel with the "Mark as watered" and "Snooze" buttons still active. Clicking either button sent an ephemeral "Plant not found" error visible only to the clicker — the original message was never updated and the buttons never disappeared.

## Root Cause

The `water:plant` and `snooze:plant` button handlers in `discord/interactions.ts` returned response type `CHANNEL_MESSAGE` (type 4) on a not-found plant. Type 4 creates a new ephemeral message for the clicker but leaves the original reminder message completely untouched. The buttons remained live and the reminder persisted until manually deleted from Discord.

## Fix Applied

[server/src/discord/interactions.ts](../server/src/discord/interactions.ts) — changed the not-found response for `water:plant`, `snooze:plant`, and `complete:task` from `CHANNEL_MESSAGE` (type 4) to `UPDATE_MESSAGE` (type 7) with content `🗑️ This plant/task has been removed.` and `components: []`. This edits the original message in-place and strips the buttons on the first click after deletion.

## Notes

- Existing stuck reminders will self-clear the next time someone clicks one of their buttons — no manual Discord cleanup needed.
- This is a downstream symptom of INCIDENT-003 (hard delete with no archive). If soft-delete is implemented (see backlog), reminders could be proactively disabled at removal time instead.
