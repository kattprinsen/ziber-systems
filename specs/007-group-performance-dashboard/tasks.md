# Tasks: Group Performance Dashboard

**Input**: Design documents from `/specs/007-group-performance-dashboard/`  
**Branch**: `007-group-performance-dashboard`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, contracts/ ✅, quickstart.md ✅

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US4)
- No test tasks — not requested in spec

---

## Phase 1: Setup

**Purpose**: Install new dependency, create data directories and example config files, update gitignore.

- [X] T001 Install `recharts` package in frontend root: run `npm install recharts` and commit updated `package.json` and `package-lock.json`
- [X] T002 [P] Create `backend/src/data/performance-config.json.example` with content `{ "target": null, "updatedAt": null }`
- [X] T003 [P] Add `backend/src/data/performance-config.json` and `backend/src/data/snapshots/` to `.gitignore` (alongside existing `users.json` pattern)
- [X] T004 [P] Create empty `backend/src/data/snapshots/` directory with a `.gitkeep` placeholder so the directory is tracked in git

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend types, service, controller, and routes for performance data. Frontend types and API service. Must be complete before any user story UI work begins.

**⚠️ CRITICAL**: All US1–US4 tasks depend on this phase being complete.

- [X] T005 Create backend TypeScript types in `backend/src/types/performance.types.ts`: define `PerformanceConfig { target: number | null; updatedAt: string | null }`, `ConsultantMonthlyEntry { consultantId: string; consultantName: string; billedHours: number; dataStatus: 'complete' | 'partial' | 'missing'; capturedAt: string; revenue?: number; marginContribution?: number }`, and `MonthlySnapshot { year: number; month: number; totalBilledHours: number; isPartial: boolean; snapshotCapturedAt: string; consultantEntries: ConsultantMonthlyEntry[] }`
- [X] T006 [P] Create `backend/src/services/performance.service.ts` with four async functions: `readConfig()` (ENOENT → return null defaults), `writeConfig(config: PerformanceConfig)`, `readSnapshot(year, month)` (ENOENT → return null), `writeSnapshot(snapshot: MonthlySnapshot)`. Use `fs-extra` `readJson`/`outputJson` with path `../data/performance-config.json` and `../data/snapshots/YYYY-MM.json`. Log only month keys and counts — never consultant names or hour values (Principle V). Depends on T005.
- [X] T007 Create `backend/src/controllers/performance.controller.ts` with four handlers: `getConfig`, `updateConfig` (validate with Zod: target must be positive number or null), `getSnapshot` (reject future months with 422; use `fetchTimeEntries` from `backend/src/services/tidigTime.service.ts` to fetch live data per consultant → aggregate into `MonthlySnapshot` → call `writeSnapshot` → return; fall back to cached snapshot via `readSnapshot` if API call fails; 503 if no cache and API unavailable), `listSnapshots` (read filenames from `snapshots/` dir, return sorted `YYYY-MM` strings). Depends on T005, T006.
- [X] T008 Create `backend/src/routes/performance.routes.ts` with: `GET /config`, `PUT /config`, `GET /snapshots`, `GET /snapshots/:year/:month`. Depends on T007.
- [X] T009 Register performance router in `backend/src/server.ts`: add `import performanceRouter from './routes/performance.routes.js'` and `app.use('/api/performance', performanceRouter)`. Depends on T008.
- [X] T010 [P] Create frontend TypeScript types in `src/types/performance.ts` mirroring backend: `PerformanceConfig`, `ConsultantMonthlyEntry`, `MonthlySnapshot`, and `ChartDataPoint { month: string; hours: number }` for Recharts.
- [X] T011 [P] Create `src/services/performanceService.ts` with functions: `getConfig()`, `updateConfig(target: number | null)`, `getSnapshot(year: number, month: number)`, `listSnapshots()`. Use existing `api.ts` base URL pattern. Depends on T010.

**Checkpoint**: Backend running on `npm run dev` in `backend/`, all four endpoints respond to curl. Frontend types and service compiled without errors.

---

## Phase 3: User Story 1 — View Group Performance on Home Page (P1) 🎯 MVP

**Goal**: Replace the placeholder home page with a working bar chart showing combined billed hours, with graceful handling of missing/partial data and a target reference line when configured.

**Independent Test**: Load `http://localhost:5173` — bar chart renders for the current month. With target set to 480, a dashed reference line appears. With all consultants having zero/missing data, an empty-state message is shown (not an error).

- [X] T012 [US1] Create `src/components/dashboard/GroupPerformanceChart.tsx`: Recharts `BarChart` with `Bar dataKey="hours"`, `XAxis dataKey="month"`, `YAxis`, `CartesianGrid`, `Tooltip`, `ResponsiveContainer`. Conditionally render `ReferenceLine y={target}` only when `target != null`. Accept props: `data: ChartDataPoint[]`, `target: number | null`, `isLoading: boolean`. Show a loading skeleton when `isLoading` is true. Depends on T001, T010.
- [X] T013 [US1] Create `src/pages/HomePage/HomePage.tsx`: fetch current month snapshot via `performanceService.getSnapshot` on mount, fetch config via `performanceService.getConfig`. Derive `ChartDataPoint[]` from snapshot `consultantEntries` by summing `billedHours` per month on the frontend (Principle IV). Handle loading, error, and empty states. Render `GroupPerformanceChart`. Depends on T011, T012.
- [X] T014 [US1] Create `src/pages/HomePage/index.tsx` that re-exports `HomePage` as named and default export.
- [X] T015 [US1] Update `src/main.tsx`: replace `import App from './App.tsx'` and `element={<App />}` on the `/` route with `import { HomePage } from './pages/HomePage'` and `element={<HomePage />}`. Depends on T014.
- [X] T016 [US1] Add empty-state UI to `HomePage.tsx`: when snapshot has no entries or all entries have `dataStatus: 'missing'`, render a message "No data available for this month" instead of the chart. Depends on T013.

**Checkpoint**: US1 fully functional. Home page shows bar chart or empty state. Target line appears when config is set via curl.

---

## Phase 4: User Story 2 — Configure Group Performance Target (P2)

**Goal**: Inline edit control on the dashboard allowing the target to be updated without leaving the page.

**Independent Test**: Click the edit icon next to the target display on the home page, enter `480`, click Save — the `ReferenceLine` appears on the chart immediately. Enter a negative number — an inline error message is shown and the previous value is preserved.

- [X] T017 [US2] Create `src/components/dashboard/TargetEditor.tsx`: renders current target value (or "No target set" placeholder) with a pencil/edit icon. On click, shows an `<input type="number">` pre-filled with current value and Save/Cancel buttons. On Save, calls `performanceService.updateConfig(newTarget)` and updates parent state via an `onTargetChange` callback. Show inline validation error for negative or non-numeric values. Depends on T010, T011.
- [X] T018 [US2] Integrate `TargetEditor` into `HomePage.tsx`: render it above or below the chart, pass current `target` and `onTargetChange` handler that updates local config state (causing chart to re-render with new target). Depends on T013, T017.

**Checkpoint**: US2 fully functional. Target can be set and cleared inline. Chart updates immediately without page reload.

---

## Phase 5: User Story 3 — Navigate Monthly Performance History (P3)

**Goal**: Previous/next month navigation controls that step through months, load the correct snapshot, and disable forward navigation at the current month.

**Independent Test**: Navigate to previous month — chart updates with that month's snapshot data (or empty state). At current month, the next-month button is visually disabled and unclickable. Navigate 12 months back — no errors.

- [X] T019 [US3] Create `src/components/dashboard/MonthNavigator.tsx`: renders `←` and `→` buttons with the current month label (e.g., "March 2026"). Accepts props: `year: number`, `month: number`, `onPrev: () => void`, `onNext: () => void`. Disables the `→` button when `year === currentYear && month === currentMonth`. No future navigation possible. Depends on T010.
- [X] T020 [US3] Update `HomePage.tsx` to hold `selectedYear` / `selectedMonth` state (default: current month). Pass `onPrev`/`onNext` handlers to `MonthNavigator` that decrement/increment month (wrapping year correctly). Re-fetch snapshot when selected month changes via `useEffect`. Integrate `MonthNavigator` above the chart. Depends on T013, T019.
- [X] T021 [US3] Update `performance.controller.ts` snapshot handler to also return the last 6 months of available snapshot keys alongside the requested month's data, so the frontend can pre-populate the chart's rolling window from available history. Alternatively expose this purely from `listSnapshots`. Depends on T007.
- [X] T022 [US3] Update `HomePage.tsx` to build the rolling chart `data` array: fetch up to 6 consecutive months ending at `selectedMonth`, merging available snapshots with zero-filled placeholders for months with no data. Show a grey/muted bar for zero-fill months. Note: the MonthNavigator (T020) allows navigating beyond 6 months — for months outside the rolling window, re-center the 6-month window around the selected month so bars remain visible for any navigable month (satisfies SC-003). Depends on T020, T021.

**Checkpoint**: US3 fully functional. Navigating 12 months back works without errors. Future navigation disabled. Rolling 6-month window visible on chart.

---

## Phase 6: User Story 4 — Individual Consultant Breakdown (P4)

**Goal**: Per-consultant rows below the chart showing each person's billed hours for the selected month, including those with missing data.

**Independent Test**: View the home page — a breakdown table lists all consultants. One with `dataStatus: 'missing'` shows "No data" rather than being absent.

- [X] T023 [US4] Create `src/components/dashboard/ConsultantBreakdown.tsx`: renders a list/table of consultant entries. Accepts `entries: ConsultantMonthlyEntry[]`. Each row shows: consultant name, billed hours (or "No data" badge for `missing` status), and a subtle indicator for `partial` status. Sorts by billed hours descending. Depends on T010.
- [X] T024 [US4] Integrate `ConsultantBreakdown` into `HomePage.tsx`: pass `snapshot?.consultantEntries ?? []` and render below the chart. When loading, show a skeleton. Depends on T013, T023.

**Checkpoint**: US4 fully functional. All consultants visible regardless of data status.

---

## Final Phase: Polish & Cross-Cutting Concerns

- [X] T025 [P] Create `src/components/dashboard/index.ts` barrel export: export `GroupPerformanceChart`, `MonthNavigator`, `ConsultantBreakdown`, `TargetEditor`.
- [X] T026 [P] Verify `.gitignore` correctly excludes `backend/src/data/snapshots/*.json` and `backend/src/data/performance-config.json` (confirm from T003; add if missing).
- [X] T027 Smoke-test the complete quickstart flow from `specs/007-group-performance-dashboard/quickstart.md`: install recharts → start servers → view chart → set target → navigate months → verify breakdown. Fix any deviations.

---

## Dependencies

```
T001 → T012 (recharts must be installed before chart component)
T005 → T006, T010
T006 → T007
T007 → T008
T008 → T009
T009 (backend running) + T011 → T013
T013 → T014 → T015
T013 → T016
T011 + T010 → T017 → T018 → integrates into T013
T013 → T019 → T020 → T022
T007 → T021 → T022
T013 → T023 → T024
T025 depends on T012, T017, T019, T023
```

Story independence:
- **US1** (T012–T016): Can be implemented and demonstrated without US2, US3, US4
- **US2** (T017–T018): Requires US1 home page to exist; otherwise standalone
- **US3** (T019–T022): Requires US1 home page to exist; otherwise standalone
- **US4** (T023–T024): Requires US1 home page to exist; otherwise standalone

---

## Parallel Execution Examples

**Phase 2 parallelism** (once T005 is done):
- T006 (performance service) + T010 (frontend types) + T011 (frontend service) can all run simultaneously

**Phase 3–6 parallelism** (once T013 + T011 are done):
- T017 (TargetEditor) + T019 (MonthNavigator) + T023 (ConsultantBreakdown) can all be built in parallel
- T018, T020, T024 integrate each component back into HomePage sequentially

---

## Implementation Strategy

**Suggested MVP scope**: Complete Phases 1–3 (T001–T016) to deliver a fully working home page dashboard with the bar chart and offline-capable snapshot system. This delivers US1 and validates the full stack end-to-end before adding target editing, navigation, and breakdown.

**Incremental delivery**:
1. **T001–T009**: Backend foundation working, all endpoints curl-testable
2. **T010–T015**: Home page renders chart from live API data
3. **T016**: Graceful empty/error states
4. **T017–T018**: Target editable inline (US2)
5. **T019–T022**: Month navigation + rolling window (US3)
6. **T023–T024**: Consultant breakdown (US4)
7. **T025–T027**: Polish and smoke test

---

## Task Count Summary

| Phase | Tasks | User Story |
|-------|-------|------------|
| Phase 1: Setup | T001–T004 | — |
| Phase 2: Foundational | T005–T011 | — |
| Phase 3: Home Page Chart | T012–T016 | US1 (P1) |
| Phase 4: Target Editor | T017–T018 | US2 (P2) |
| Phase 5: Month Navigation | T019–T022 | US3 (P3) |
| Phase 6: Consultant Breakdown | T023–T024 | US4 (P4) |
| Final: Polish | T025–T027 | — |
| **Total** | **27 tasks** | |

| User Story | Task Count |
|------------|------------|
| US1 – Home Page Chart | 5 tasks (T012–T016) |
| US2 – Target Editor | 2 tasks (T017–T018) |
| US3 – Month Navigation | 4 tasks (T019–T022) |
| US4 – Consultant Breakdown | 2 tasks (T023–T024) |
