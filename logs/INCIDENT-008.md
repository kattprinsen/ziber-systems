# INCIDENT-008 — Task Reminder Buttons Stay Active After Completion

**Date:** 2026-09-29  
**Status:** Resolved  
**Severity:** Low (UX degradation — stale buttons remained clickable, risk of duplicate completions)

## Summary

After completing a household task through the Discord reminder's **Mark as done** button and confirming via the ephemeral participant picker, the original reminder message in the channel kept its **Mark as done** / **Snooze** buttons active. The message never disappeared or updated, so it looked like the completion hadn't registered, and the buttons could be clicked again.

## Root Cause

The completion flow uses two separate Discord messages: the original reminder (posted by `sendTaskReminders`) and a new ephemeral picker message created in response to the **Mark as done** click. `confirmTaskCompletion` in `discord/interactions.ts` returned `UPDATE_MESSAGE` (type 7), which only edits the ephemeral picker message the Confirm button lives on. The original reminder message's `discordMessageId` was stored on the pending completion (for de-duplication) but was never used to edit that message directly — its buttons were left untouched indefinitely.

## Fix Applied

- [server/src/discord/api.ts](../server/src/discord/api.ts) — added `editMessage(channelId, messageId, payload)`, a thin wrapper around Discord's `PATCH /channels/:id/messages/:id`.
- [server/src/discord/interactions.ts](../server/src/discord/interactions.ts) — threaded `channel_id` from the interaction payload through the button-handler chain and stored it on `PendingTaskCompletion`. After a non-duplicate `confirmTaskCompletion`, the handler now calls `editMessage` with `{ components: [] }` to strip the buttons from the original reminder message, wrapped in try/catch so a since-deleted message doesn't fail the confirmation.
- Added tests in [server/src/discord/interactions.test.ts](../server/src/discord/interactions.test.ts) confirming `editMessage` is called with the original channel/message ID on success, and is not called on a duplicate confirmation.

## Notes

- Duplicate-submission protection (via the unique `discord_message_id` on `task_logs`) already prevented double-logging in the database — this incident was purely a stale-UI issue, not a data integrity one.
- Same class of bug as INCIDENT-004 (not-found case for the same buttons); this incident covers the happy-path completion instead.
