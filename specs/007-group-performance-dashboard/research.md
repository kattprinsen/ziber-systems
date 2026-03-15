# Research: Group Performance Dashboard

**Feature**: `007-group-performance-dashboard`  
**Date**: 2026-03-14  
**Status**: Complete — all NEEDS CLARIFICATION from Technical Context resolved

---

## Decision 1: Chart Library

**Decision**: Use **Recharts** for the bar chart with reference line.

**Rationale**: Recharts is React-native (components, not canvas wrappers), ships first-party TypeScript declarations, is tree-shakeable, and has the most straightforward API for the specific use case (BarChart + ReferenceLine + ResponsiveContainer). The entire chart can be implemented with built-in components and no custom renderers.

**Alternatives considered**:
- `chart.js` + `react-chartjs-2`: Larger bundle, less idiomatic React, weaker TypeScript.
- Raw `<canvas>` API: Greatly more code, no accessibility, no React integration.
- `victory`: Less maintained, heavier API surface for a simple bar chart.

**Implementation pattern**:
```tsx
<ResponsiveContainer width="100%" height="100%">
  <BarChart data={chartData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="month" />
    <YAxis />
    <Tooltip />
    <Bar dataKey="hours" fill="#f59e0b" />
    {target != null && (
      <ReferenceLine y={target} stroke="#f59e0b" strokeDasharray="6 3"
        label={{ value: `Target: ${target}h`, position: 'insideTopRight', fill: '#f59e0b' }} />
    )}
  </BarChart>
</ResponsiveContainer>
```

**Key findings**:
- `ReferenceLine` must NOT be rendered when target is `null`/`undefined` — pass no `y` prop and Recharts will error.
- `ResponsiveContainer` requires a fixed-height ancestor div; `height="100%"` collapses otherwise.
- Data shape: `Array<{ month: string; hours: number }>` — one object per month.
- No `@types/recharts` needed — v2 ships its own types.

---

## Decision 2: Snapshot Storage Strategy

**Decision**: Store monthly snapshots as individual **JSON files per month** at `backend/src/data/snapshots/{YYYY-MM}.json`.

**Rationale**: One file per month keeps reads isolated (loading one month never reads all history), makes file naming self-documenting, and allows easy inspection/manual editing during development. Consistent with existing `users.json` pattern using fs-extra.

**Alternatives considered**:
- Single `snapshots.json` with all months as an array: Grows unbounded; every read loads all history.
- Database (SQLite, etc.): New dependency, violates Principle III for this scale.
- In-memory only: Would not survive server restarts, defeating the offline-capable requirement.

**Snapshot capture trigger**: On-demand when the frontend requests a month's data. If the live Tidig API is available, a fresh snapshot is written; if unavailable, the existing file is returned. The `dataStatus` field on each consultant entry records completeness.

**File path pattern**: `backend/src/data/snapshots/2026-03.json`  
**gitignore**: The `snapshots/` directory should be gitignored (same as `users.json`) — it contains real production data.

---

## Decision 3: Performance Config Persistence

**Decision**: Store the target configuration in `backend/src/data/performance-config.json` using **fs-extra `readJson`/`outputJson`** with ENOENT fallback.

**Rationale**: Mirrors the existing users.json pattern. `outputJson` creates parent directories automatically. ENOENT catch returns a default `{ target: null, updatedAt: null }` without crashing on first run.

**Alternatives considered**:
- Environment variable: Cannot be updated without restarting the server.
- Frontend localStorage: Violates Principle IV (business state not derived from API).
- Database config table: Overkill; introduces a new dependency.

**Read pattern**:
```typescript
async function readConfig(): Promise<PerformanceConfig> {
  try {
    return await readJson(CONFIG_PATH);
  } catch (err: any) {
    if (err.code === 'ENOENT') return { target: null, updatedAt: null };
    throw err;
  }
}
```

**Write pattern**: Use `outputJson(CONFIG_PATH, config, { spaces: 2 })` — creates file if missing.  
**Concurrent write safety**: Low-risk for a single-user config endpoint; no file locking required at this scale.

---

## Decision 4: TypeScript Extensible Record Pattern

**Decision**: Use an **open/optional-fields interface** with explicit `billedHours` as the v1 primary field, and reserve space for `revenue?: number` and `marginContribution?: number` as optional fields on `ConsultantMonthlyEntry`.

**Rationale**: TypeScript optional fields on an interface allow future additions without breaking existing code that reads old JSON files. Old snapshot files simply won't have the new fields — TypeScript will treat them as `undefined`, which is correct. No migration needed.

**v1 shape**:
```typescript
interface ConsultantMonthlyEntry {
  consultantId: string;
  billedHours: number;
  dataStatus: 'complete' | 'partial' | 'missing';
  // Future fields (already reserved):
  revenue?: number;
  marginContribution?: number;
}
```

**Alternatives considered**:
- Generic `metrics: Record<string, number>`: Flexible but loses type safety.
- Versioned schema with migration scripts: Unnecessary complexity for optional field additions.

---

## Decision 5: Home Page Integration

**Decision**: Create a new `src/pages/HomePage/` directory and wire it into a React Router route at `/`. The current `App.tsx` placeholder content is replaced.

**Rationale**: The project already uses React Router (`react-router-dom ^7.13.0` is installed). Matching the existing `UsersPage/`, `ToolsPage/` folder convention keeps the codebase consistent.

**Key finding**: `src/main.tsx` needs to be checked for router setup — if no router exists yet, one must be added. If routing already exists, the home route simply replaces the current `App.tsx` content.
