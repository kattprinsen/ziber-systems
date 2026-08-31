# INCIDENT-006 — Duplicate Member Records from Button vs Command Paths

**Date:** 2026-08-31  
**Status:** Resolved  
**Severity:** Medium (incorrect attribution in task logs and activity feed)

## Summary

Completing a task via the Discord button registered the action under a different member than completing it via the `!command`. The same physical user appeared as two separate members in the activity feed and member list.

## Root Cause

Two separate code paths handled member lookup with incompatible strategies:

- **`!command` handler** (`commands.ts`): looked up and created members by `discordId` (the real Discord snowflake, e.g. `"123456789012345678"`)
- **Button handler** (`interactions.ts`, `complete:task`): looked up members by `discordName` (the username string), and when creating a new member stored `discordId: username` — using the username string as the ID instead of the actual Discord ID

If a user clicked the button first, their member record was created with `discordId = "kattprinsen"`. When they later used `!dishes`, the command handler searched for `discordId = "123456789012345678"`, found nothing, and created a second record. Result: two members for the same person.

## Fix Applied

- [server/src/discord/interactions.ts](../server/src/discord/interactions.ts) — extended `DiscordInteraction` interface to include `member.user.id` / `user.id`. Added `discordUserId` as a third parameter to `ButtonHandler`. The `complete:task` handler now looks up and creates members by `discordId` (real snowflake), matching the `!command` path exactly.
- [server/src/discord/interactions.test.ts](../server/src/discord/interactions.test.ts) — updated test payloads to include `id` in `member.user`; also corrected three stale test assertions that expected `CHANNEL_MESSAGE` (type 4) for not-found cases — these were left over from before the INCIDENT-004 fix and should have been `UPDATE_MESSAGE` (type 7).

## Notes

- Existing duplicate member records in production are not auto-merged. They can be cleaned up manually via the Members page (rename + delete) or directly in the DB.
- The `wateredBy` field on `wateringEvents` is a free-text string (not a FK to members) and is unaffected by this fix.
