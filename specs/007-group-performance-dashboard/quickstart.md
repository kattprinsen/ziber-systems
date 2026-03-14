# Quickstart: Group Performance Dashboard

**Branch**: `007-group-performance-dashboard`  
**Status**: Implementation guide for developers

---

## What this feature does

Transforms the home page into a **Group Performance Dashboard** showing a multi-month bar chart of combined billed hours across all consultants, with a configurable target reference line. Monthly data is stored as snapshot files on the backend — so the dashboard works even when the Tidig API is unavailable. Users can navigate backwards through months and edit the target value inline on the chart.

---

## Prerequisites

1. Backend and frontend are both running (see top-level `README.md`).
2. `backend/src/data/users.json` exists and has at least one active consultant with an `employeeID` set.
3. The Tidig API should be accessible for live snapshot creation, but the dashboard works without it if snapshots already exist on disk.

---

## Step 1: Install the new frontend dependency

The chart requires **Recharts**. Install it in the root (frontend) project:

```bash
npm install recharts
```

Recharts ships its own TypeScript types — no `@types/recharts` needed.

---

## Step 2: Create the performance config file

The backend reads the target configuration from a JSON file. Create it from the example:

```bash
cp backend/src/data/performance-config.json.example backend/src/data/performance-config.json
```

The example file sets `target: null` — meaning no target is configured yet. The chart will render without a reference line until a target is set.

To set an initial target manually (optional):

```json
{
  "target": 480,
  "updatedAt": "2026-03-14T00:00:00.000Z"
}
```

---

## Step 3: Create the snapshots directory

```bash
mkdir -p backend/src/data/snapshots
```

This directory is gitignored. The backend will create snapshot files here on demand when users navigate to a month.

---

## Step 4: Register the new backend routes

In `backend/src/server.ts`, add the performance router:

```typescript
import performanceRouter from './routes/performance.routes.js';

// After existing routes:
app.use('/api/performance', performanceRouter);
```

---

## Step 5: Start both servers

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
npm run dev
```

Open `http://localhost:5173` — you should see the Group Performance Dashboard on the home page.

---

## Step 6: Test the chart

1. **View current month**: The home page should show a bar chart. If no snapshot exists yet for the current month, the backend will attempt to fetch live data from Tidig and create one.

2. **Navigate months**: Use the `←` and `→` controls to step through months. Future months are disabled.

3. **Set a target**: Click the edit icon next to the target label. Enter a number (e.g., `480`) and click **Save**. The reference line should appear on the chart immediately.

4. **Offline mode**: Stop the backend Tidig API service. Navigate to a month that already has a snapshot — the chart should still render from the cached snapshot file.

---

## Step 7: Verify per-consultant breakdown

Below the chart, a breakdown table lists each consultant's individual billed hours for the selected month. Consultants with `dataStatus: 'missing'` are shown with a "No data" indicator rather than being omitted.

---

## API endpoints (for manual testing)

```bash
# Get current month snapshot (creates it if it doesn't exist)
curl http://localhost:3001/api/performance/snapshots/2026/3

# Force refresh from live API
curl "http://localhost:3001/api/performance/snapshots/2026/3?refresh=true"

# List months with existing snapshots
curl http://localhost:3001/api/performance/snapshots

# Get current target config
curl http://localhost:3001/api/performance/config

# Update target to 480 hours
curl -X PUT http://localhost:3001/api/performance/config \
  -H "Content-Type: application/json" \
  -d '{"target": 480}'

# Clear target
curl -X PUT http://localhost:3001/api/performance/config \
  -H "Content-Type: application/json" \
  -d '{"target": null}'
```

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Chart shows blank/empty state | No snapshot exists and Tidig API unavailable | Check backend logs; verify `employeeID` values in `users.json` |
| Target line not visible | No target configured | Click edit icon on the chart, enter a number and save |
| `ENOENT` error in backend logs | `snapshots/` directory doesn't exist | Run `mkdir -p backend/src/data/snapshots` |
| `Cannot find module 'recharts'` | Recharts not installed | Run `npm install recharts` in root directory |
| Future month navigation enabled | Bug in `MonthNavigator` | Today's year/month must be the upper bound; check date comparison logic |
