# INCIDENT-003 — Remove Plant Returns 500 in Production

**Date:** 2026-08-16  
**Status:** Resolved  
**Severity:** Low (data loss risk — action blocked, no corruption occurred)

## Summary

Clicking the remove button on a plant in the web UI returned a 500 error in production. The same action worked on localhost.

## Root Cause

`DELETE /api/my-plants/:id` deleted the `userPlants` row without first removing the related `wateringEvents` rows that reference it via a foreign key (`watering_events.user_plant_id → user_plants.id`, `ON DELETE no action`). In production, all plants have accumulated watering history — the FK constraint was violated and the query threw an unhandled exception. On localhost, test plants had no watering events, so the constraint was never triggered.

## Fix Applied

[server/src/routes/my-plants.ts](../server/src/routes/my-plants.ts) — added a `DELETE wateringEvents WHERE userPlantId = id` before the `DELETE userPlants` step.

## Follow-up

- No archive/undo mechanism exists — a removed plant and all its history are permanently deleted with no confirmation step in the UI. See backlog for planned improvements.
