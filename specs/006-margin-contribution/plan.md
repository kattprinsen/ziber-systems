# Implementation Plan: Margin Contribution Calculation Per User

**Branch**: `006-margin-contribution` | **Date**: 2026-03-02 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/006-margin-contribution/spec.md`

---

## Summary

Add per-user margin contribution calculation (revenue from billable hours minus monthly  
salary cost) visible as a full panel on the user detail page and a lightweight static  
indicator on user cards. Time data is sourced from the existing Tidig `/Api/Time`  
integration. All calculation is done client-side in a new `marginCalculator.ts` utility;  
no new backend endpoint is required. The only backend change is adding `hourlyRate` to  
the `User` type and `users.json`.

---

## Technical Context

**Language/Version**: TypeScript 5.x (frontend: React 19 + Vite; backend: Node.js 20 + Express)  
**Primary Dependencies**: React, React Router, Tailwind CSS (frontend); Express, Zod, axios (backend) — no new dependencies added by this feature  
**Storage**: `backend/src/data/users.json` (flat JSON file, manually edited) — `hourlyRate` field added  
**Testing**: Vitest (frontend unit tests for `marginCalculator.ts`); no backend tests needed (no new backend code)  
**Target Platform**: Browser (desktop-first); backend Node.js  
**Project Type**: Web application (existing backend + frontend)  
**Performance Goals**: Margin panel visible within 3 s of page load (SC-001); card indicator renders synchronously with user data  
**Constraints**: No new npm dependencies; no new backend routes; no auth changes  
**Scale/Scope**: ~10–50 users in `users.json`; single Tidig API call per panel render

---

## Constitution Check

*The constitution file is a placeholder template with no enforced rules. No gates apply.*  
*Re-check after Phase 1 if constitution is updated.*

| Gate | Status | Notes |
|------|--------|-------|
| No banned dependencies introduced | ✅ PASS | No new packages; uses built-in `Intl.NumberFormat` and `Date` |
| Consistent with existing patterns | ✅ PASS | Mirrors `getTimeSummary` + `salaryCalculator.ts` patterns |
| No new backend routes required | ✅ PASS | Reuses existing time and user endpoints |
| Single source of truth for billability | ✅ PASS | `INTERNAL_CUSTOMER_IDS` constant in `marginCalculator.ts` |

---

## Project Structure

### Documentation (this feature)

```text
specs/006-margin-contribution/
├── plan.md              ← this file
├── research.md          ✅ Phase 0 complete
├── data-model.md        ✅ Phase 1 complete
├── quickstart.md        ✅ Phase 1 complete
├── contracts/
│   ├── type-definitions.md      ✅ Phase 1 complete
│   └── component-interfaces.md  ✅ Phase 1 complete
└── tasks.md             (Phase 2 — created by /speckit.tasks)
```

### Source Code

```text
backend/
└── src/
    └── types/
        └── user.types.ts        ← ADD: hourlyRate?: number to User interface

src/
├── types/
│   ├── user.ts                  ← ADD: hourlyRate?: number, employeeID?: string to User
│   └── margin.ts                ← NEW: MarginResult, MarginParams interfaces
├── services/
│   └── marginCalculator.ts      ← NEW: isBillable, workingDaysInMonth,
│                                         workingDaysElapsed, formatSEK,
│                                         formatPercent, calculateMargin
└── components/
    └── users/
        ├── MarginContributionPanel.tsx  ← NEW: full panel, US1 + US3
        ├── MarginCardIndicator.tsx      ← NEW: static card widget, US2
        ├── UserCard.tsx                 ← MODIFY: render <MarginCardIndicator>
        └── index.ts                     ← MODIFY: export new components

src/pages/
└── UserDetailPage/
    └── UserDetailPage.tsx        ← MODIFY: render <MarginContributionPanel>
```

**Structure Decision**: Web application layout (Option 2). Frontend-only calculation;  
no new backend routes. Backend change is limited to the `User` type extension.

---

## Phase 0 Decisions (from research.md)

| # | Decision | Outcome |
|---|----------|---------|
| 1 | Computation location | Frontend `marginCalculator.ts` — consistent with `getTimeSummary` |
| 2 | Working-day algorithm | Pure `Date` loop, no libraries |
| 3 | Currency format | `Intl.NumberFormat('en-150')` → `"75,000 SEK"` |
| 4 | Billability rule | `customerId === "2"` = non-billable (hardcoded constant) |
| 5 | `hourlyRate` storage | New optional field on `User` in `users.json` |

---

## Phase 1 Design Artifacts

- [data-model.md](./data-model.md) — entities, fields, state diagram
- [contracts/type-definitions.md](./contracts/type-definitions.md) — TypeScript types
- [contracts/component-interfaces.md](./contracts/component-interfaces.md) — component props and service API
- [quickstart.md](./quickstart.md) — developer guide

---

## Constitution Check Post-Design

All decisions are consistent with the constitution (placeholder). No violations.  
Complexity is minimal: three new frontend files plus type extensions and two component  
modifications. No new backend surface area.
