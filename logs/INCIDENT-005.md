# INCIDENT-005 — Duplicate Discord Replies from Dev/Prod Bot Conflict

**Date:** 2026-08-24  
**Status:** Resolved  
**Severity:** Low (incorrect Discord replies — commands were still logged correctly by production)

## Summary

Every Discord command (`!disken`, `!matlagning`, etc.) produced two bot replies: one "Unknown command" message and one success confirmation. This made it appear that commands were broken, even though the underlying task logging was working correctly on the production server.

## Root Cause

The local dev server (`npm run dev`) was started during a testing session for a web UI feature. The dev server uses the **same `DISCORD_BOT_TOKEN`** as the production Raspberry Pi, causing both servers to connect to Discord's gateway simultaneously. Every `MESSAGE_CREATE` event was delivered to **both** gateway connections and processed independently.

The two servers have divergent SQLite databases:
- **Dev** (`server/data/data.db`): tasks `!dinner` and `!dishes` only
- **Production** (`data/data.db`): full task set including `!disken` (Diskat), `!matlagning`, etc.

When a production command like `!disken` was typed, the dev server could not find it and replied "Unknown command. Available: !dinner, !dishes". The production server found it and replied "✅ Diskat logged for kattprinsen!". Both replies appeared in the channel grouped under the same bot name.

## Fix Applied

Killed the local dev server. Discord commands are now processed by the production Pi only.

## Prevention

To avoid recurrence when running the dev server locally, set `DISCORD_BOT_TOKEN=` (empty) in `server/.env` on developer machines, or provision a separate Discord bot for development. This prevents the dev gateway from connecting at all while still allowing the web UI to run.
