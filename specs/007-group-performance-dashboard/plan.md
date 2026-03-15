# Implementation Plan: Group Performance Dashboard

**Branch**: `007-group-performance-dashboard` | **Date**: 2026-03-14 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/007-group-performance-dashboard/spec.md`

## Summary

Transform the home page into a group performance dashboard showing aggregated billed hours for all consultants as a multi-month bar chart with a configurable target reference line. Monthly snapshots are stored as JSON on the backend and captured on-demand when a user navigates to a month. The target value is persisted in a backend JSON config file and is editable inline on the dashboard. The data model is designed to be extended with revenue and margin contribution fields in future iterations.

## Technical Context

**Language/Version**: TypeScript 5.3 (backend), TypeScript ~5.9 (frontend)  
**Primary Dependencies**:
- Frontend: React 19, Vite 7, Recharts (new — justified below), Tailwind CSS 3
- Backend: Express 4, Node.js, fs-extra 11, Zod 3, tsx (dev)  

**Storage**: JSON files on filesystem — `backend/src/data/performance-config.json` (target config) + `backend/src/data/snapshots/{YYYY-MM}.json` (monthly snapshots). Consistent with existing `users.json` pattern.  
**Testing**: Vitest (frontend), Vitest (backend)  
**Target Platform**: Browser (dark-themed SPA) + Node.js backend  
**Project Type**: Web application — separate `src/` (frontend) + `backend/src/` (backend)  
**Performance Goals**: Home page renders graph in < 2 seconds; snapshot fetch from disk in < 100ms  
**Constraints**: Dashboard must render with partial or zero live API data (offline-capable for display); no new database  
**Scale/Scope**: ~10–30 consultants; monthly granularity; 12+ months of navigable history

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status | Notes |
|-----------|------|--------|-------|
| **I: Documentation Privacy** | No real business/customer names in specs, code, or mock data | ✅ PASS | All spec entities use generic names. Snapshot mock data will use role-based aliases (e.g., "Consultant A"). |
| **II: Spec-Driven Development** | Complete spec.md approved before implementation | ✅ PASS | spec.md completed with 5 clarification sessions; all NEEDS CLARIFICATION resolved. |
| **III: No Accidental Dependencies** | New packages justified; prefer existing dependencies | ⚠️ REVIEW | One new package: **recharts**. Justified below in Complexity Tracking. |
| **IV: Frontend Data Derivation** | Calculations on frontend unless performance requires backend | ✅ PASS | Group total is summed on the frontend from raw consultant entries returned by the API. Backend stores raw billed hours per consultant; aggregation is frontend logic. |
| **V: Sensitive Data Handling** | No customer data in logs/errors; use redaction patterns | ✅ PASS | Snapshot service logs only counts and month keys, never consultant names or hour values. Error messages are generic. |

**Post-Design Re-check**: _(Completed after Phase 1: data-model.md, contracts/, quickstart.md)_
- **Changes**: Data model confirmed frontend derives group totals from raw `ConsultantMonthlyEntry` arrays (Principle IV compliant). Snapshot files gitignored — real consultant data never committed. Config file (`performance-config.json`) not sensitive (numeric target only) — not gitignored.
- **New Risks**: None. Recharts dependency justified in Complexity Tracking. No new logging patterns introduced that could violate Principle V.

## Project Structure

### Documentation (this feature)

```text
specs/007-group-performance-dashboard/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── performance-snapshots.openapi.yaml
│   └── performance-config.openapi.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Web application structure

backend/src/
├── data/
│   ├── performance-config.json          # NEW: target config (gitignored)
│   ├── performance-config.json.example  # NEW: example/default
│   └── snapshots/                       # NEW: monthly snapshot files
│       └── {YYYY-MM}.json               # e.g. 2026-03.json
├── types/
│   └── performance.types.ts             # NEW: PerformanceConfig, MonthlySnapshot types
├── services/
│   └── performance.service.ts           # NEW: snapshot read/write, config read/write
├── controllers/
│   └── performance.controller.ts        # NEW: HTTP handlers
└── routes/
    └── performance.routes.ts            # NEW: /api/performance/* routes

src/
├── pages/
│   └── HomePage/                        # NEW: replaces placeholder App.tsx root
│       ├── index.tsx
│       └── HomePage.tsx
├── components/
│   └── dashboard/                       # NEW: dashboard component folder
│       ├── GroupPerformanceChart.tsx    # Bar chart with ReferenceLine
│       ├── MonthNavigator.tsx           # ← / → month navigation
│       ├── ConsultantBreakdown.tsx      # Per-consultant rows
│       ├── TargetEditor.tsx             # Inline edit control for target
│       └── index.ts
├── services/
│   └── performanceService.ts            # NEW: API calls for snapshots + config
└── types/
    └── performance.ts                   # NEW: frontend types (mirrors backend)
```

**Structure Decision**: Web application (frontend `src/` + backend `backend/src/`). New files follow existing conventions — service/controller/routes on backend, components/pages/services on frontend. No new top-level directories.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| **New npm package: `recharts`** | A bar chart with a horizontal reference line and responsive container cannot be built from Tailwind CSS alone. A charting library is required. | `canvas` API directly: far more code, no React integration, no accessibility. `chart.js`: larger bundle, weaker TypeScript support. `recharts` is the most widely used React-native charting library, tree-shakeable, has first-party TypeScript types, and is the established choice in the React/Vite ecosystem. |
