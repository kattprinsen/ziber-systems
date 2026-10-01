# INCIDENT-009 — Archived Plants Still Trigger Discord Reminders

**Date:** 2026-10-01  
**Status:** Resolved  
**Severity:** Low (archived plants continued to generate scheduled notifications)

## Summary

A plant that had been removed from the active collection sent another Discord watering reminder. The plant was archived, not permanently deleted, so its database row remained available to the reminder query.

## Root Cause

`DELETE /api/my-plants/:id` performs a soft delete by setting `user_plants.archived_at`. The active plant list excludes archived rows, but `sendPlantReminders` selected all `userPlants` rows and did not check `archivedAt`. Archived plants could therefore qualify as due and be sent in scheduled reminders. The same query is used when `forceAll` is enabled.

## Fix Applied

[server/src/discord/reminders.ts](../server/src/discord/reminders.ts) — added `WHERE archived_at IS NULL` to the plant reminder query, so archived plants are excluded whether reminders are scheduled or forced.

Added a regression test in [server/src/discord/reminders.test.ts](../server/src/discord/reminders.test.ts) asserting that the archive filter is present in the database query.

## Notes

- No database migration is required; `archived_at` already exists.
- This prevents future reminders for archived plants. A reminder already sent to Discord remains in the channel until edited or deleted separately.
