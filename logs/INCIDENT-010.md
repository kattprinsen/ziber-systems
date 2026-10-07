# INCIDENT-010 — Unresolved Reminders Stack Up in Discord

**Date:** 2026-10-07  
**Status:** Resolved  
**Severity:** Low (channel clutter and stale buttons; no data impact)

## Summary

An overdue task (for example vacuuming) that was neither completed nor snoozed produced a fresh Discord reminder on later runs while the earlier reminder was still visible with live buttons. Plant reminders behaved the same way. Over time the channel filled with duplicate reminders for the same item.

## Root Cause

The reminder job kept no record of what it had already sent. Every 08:00 run recomputed which items were due and posted a new message for each one:

- Interval tasks and plants stay "due" until completed, so they were re-sent every day with a growing "overdue by N days" text.
- Day-of-week tasks were re-sent every week on their weekday regardless of whether last week's reminder was handled.

Nothing compared against the previous Discord message, so earlier reminders were never edited or removed.

## Fix Applied

- [server/src/db/schema.ts](../server/src/db/schema.ts) and migration `0008_aberrant_multiple_man.sql` — new `reminder_messages` table (`domain`, `item_id`, `channel_id`, `message_id`, primary key on `domain` + `item_id`) holding the latest reminder posted per plant or task. It has no foreign key, so deleting a plant or task is never blocked by it. The migration only creates a table and does not touch existing data.
- [server/src/discord/reminder-messages.ts](../server/src/discord/reminder-messages.ts) — `getReminderMessage` and `saveReminderMessage` (upsert).
- [server/src/discord/api.ts](../server/src/discord/api.ts) — added `deleteMessage`.
- [server/src/discord/reminders.ts](../server/src/discord/reminders.ts) — plant and task reminders now go through one shared `sendTrackedReminder` helper. It sends the new reminder, records its message ID, and then deletes the previous reminder for that item. Sending first means a failed send never leaves the item without a live reminder. If the old message is already gone, the failed delete is logged as a warning and does not stop the batch.
- Tests in [server/src/discord/reminders.test.ts](../server/src/discord/reminders.test.ts) and [server/src/discord/api.test.ts](../server/src/discord/api.test.ts) cover replacement for plants and tasks, no delete when nothing was tracked, keeping the old reminder when the send fails, and still tracking the new reminder when the delete fails.

## Notes

- Reminders sent before this deploy are not tracked, so they stay in the channel until removed manually. Only reminders sent after the deploy are cleaned up, starting with the second one per item.
- The previous message is deleted even if it was already resolved (for example "marked as watered"). Completion history remains in the web UI and the activity feed.
- The migration runs automatically on server start.
- Daily re-sending of overdue items is unchanged by design; only the pile-up was fixed. Throttling how often an overdue item is re-sent was considered and left out.
