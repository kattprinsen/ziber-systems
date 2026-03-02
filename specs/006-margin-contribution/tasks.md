# Tasks: Margin Contribution Calculation Per User

**Input**: Design documents from `/specs/006-margin-contribution/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: No automated test tasks included — not requested in the spec. The `marginCalculator.ts` utility is pure and synchronous, making it straightforward to add unit tests later if desired.

**Organization**: Tasks grouped by user story. Each story is independently implementable and testable once the foundational phase is complete.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete-task dependencies)
- **[Story]**: User story label (US1 / US2 / US3) — setup and foundational phases have no story label
- Exact file paths included in all descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create all new files and apply all type extensions that every user story depends on. No behaviour yet — scaffolding only.

- [X] T001 [P] Add `hourlyRate?: number` to the `User` interface in `backend/src/types/user.types.ts`
- [X] T002 [P] Add `hourlyRate?: number` and `employeeID?: string` to the `User` interface in `src/types/user.ts`
- [X] T003 [P] Create `src/types/margin.ts` with the `MarginResult` and `MarginParams` interfaces per `contracts/type-definitions.md`
- [X] T004 [P] Create `src/services/marginCalculator.ts` as an empty module with exported stubs for `INTERNAL_CUSTOMER_IDS`, `isBillable`, `workingDaysInMonth`, `workingDaysElapsed`, `formatSEK`, `formatPercent`, and `calculateMargin`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement the core calculation logic in `marginCalculator.ts` and seed test data. All user story components depend on this phase being complete.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T005 Implement `INTERNAL_CUSTOMER_IDS` constant (`new Set(['2'])`) and `isBillable(entry: TimeEntry): boolean` in `src/services/marginCalculator.ts`
- [X] T006 [P] Implement `workingDaysInMonth(year, month): number` and `workingDaysElapsed(year, month, upToDay): number` using pure `Date` loop in `src/services/marginCalculator.ts`
- [X] T007 [P] Implement `formatSEK(amount): string` using `Intl.NumberFormat('en-150', { style: 'currency', currency: 'SEK', currencyDisplay: 'code', minimumFractionDigits: 0 })` and `formatPercent(value: number | null): string` returning `"N/A"` when null in `src/services/marginCalculator.ts`
- [X] T008 Implement `calculateMargin(params: MarginParams): MarginResult` — filters entries with `isBillable`, sums hours, computes revenue / salaryCost / margin / marginPercentage / workingDays fields — in `src/services/marginCalculator.ts`
- [X] T009 [P] Add `hourlyRate` to user SBQ (and any other users with `employeeID`) in `backend/src/data/users.json` for testing

**Checkpoint**: `marginCalculator.ts` is fully implemented and `users.json` has test rates. User story work can begin.

---

## Phase 3: User Story 1 – Margin Contribution Panel on User Detail Page (Priority: P1) 🎯 MVP

**Goal**: Opening a user detail page automatically shows a Margin Contribution panel with the current month's billable hours, revenue, salary cost, margin (SEK + %), and working-day context. All five states (loading, error, no-employee-id, rate-not-set, showing-figures) are handled.

**Independent Test**: Open the detail page for user SBQ. Verify the panel shows billable hours matching the Tidig entries for the current month, revenue = hours × configured rate, cost = currentSalary, and margin = revenue − cost. Confirm the rest of the page works normally if the Tidig call fails.

### Implementation for User Story 1

- [X] T010 [P] [US1] Create `src/components/users/MarginContributionPanel.tsx` with the props interface (`userId`, `employeeID?`, `hourlyRate?`, `currentSalary?`) and five UI state shells: `loading`, `error`, `no-employee-id`, `rate-not-set`, `showing-figures`
- [X] T011 [US1] Implement time-entry fetching in `MarginContributionPanel`: derive `fromDate` / `toDate` from the current `YYYY-MM` month state and call `timeService.getUserTimeEntries(userId, { fromDate, toDate })` in `src/components/users/MarginContributionPanel.tsx`
- [X] T012 [US1] Wire `calculateMargin()` call in `MarginContributionPanel` to produce `MarginResult` from fetched entries and render the figures table (billable hours, revenue, salary cost, margin, margin %, working days passed / total) using `formatSEK` and `formatPercent` in `src/components/users/MarginContributionPanel.tsx`
- [X] T013 [US1] Implement the `no-billable-time` sub-state within `showing-figures`: show zero revenue row and a "No billable time reported yet for this month" note in `src/components/users/MarginContributionPanel.tsx`
- [X] T014 [US1] Integrate `<MarginContributionPanel userId={user.id} employeeID={user.employeeID} hourlyRate={user.hourlyRate} currentSalary={user.currentSalary} />` into `src/pages/UserDetailPage/UserDetailPage.tsx` below the Skills section and before `<UserTimeSection>`
- [X] T015 [US1] Export `MarginContributionPanel` from `src/components/users/index.ts`

**Checkpoint**: User Story 1 independently testable — full margin panel is live on the user detail page with all five states working.

---

## Phase 4: User Story 2 – Margin Contribution Entry Point on User Card (Priority: P2)

**Goal**: Each user card shows a static indicator — "Margin available" when `hourlyRate` is set, "Rate not set" when not — with no API calls.

**Independent Test**: Verify the card correctly shows "Margin available" for SBQ (who has `hourlyRate` configured) and "Rate not set" for a user without it, with no network request triggered. Confirm the indicator appears on the card after US1 is stable.

### Implementation for User Story 2

- [X] T016 [P] [US2] Create `src/components/users/MarginCardIndicator.tsx` with a single `hourlyRate?: number | null` prop — renders a styled "Margin available" badge when the rate is present, or muted "Rate not set" text when absent
- [X] T017 [US2] Render `<MarginCardIndicator hourlyRate={user.hourlyRate} />` in the footer area of `src/components/users/UserCard.tsx`
- [X] T018 [US2] Export `MarginCardIndicator` from `src/components/users/index.ts`

**Checkpoint**: User Story 2 independently testable — card indicator reflects `hourlyRate` presence with zero network activity.

---

## Phase 5: User Story 3 – Month Selector for Historical Margin View (Priority: P3)

**Goal**: The Margin Contribution panel has `<` / `>` chevron navigation to switch to any previous calendar month, re-fetching Tidig data and recalculating for that period.

**Independent Test**: With US1 working, click `<` in the panel header. Verify the panel re-fetches with `fromDate`/`toDate` dates for the previous month, recalculates working-days correctly for that month, and displays the accurate historical figures.

### Implementation for User Story 3

- [X] T019 [P] [US3] Add `month` state (default: current `YYYY-MM`) and `<` / `>` chevron navigation buttons to `MarginContributionPanel`; the `<` button decrements the month, the `>` button increments toward the current month and is **disabled** when already on the current month (future navigation is not permitted); derive `fromDate` / `toDate` from the `month` state instead of hardcoded current date in `src/components/users/MarginContributionPanel.tsx`
- [X] T020 [US3] Wire `month` state change in `MarginContributionPanel` to trigger a re-fetch and recalculate — updating `useEffect` dependencies to include `month` in `src/components/users/MarginContributionPanel.tsx`
- [X] T021 [US3] Update `calculateMargin` / `workingDaysElapsed` in `src/services/marginCalculator.ts` to clamp `workingDaysPassed` to `workingDaysInMonth` when the selected month is fully in the past (i.e., `month < current month`)

**Checkpoint**: User Story 3 independently testable — navigating to a past month shows correct historical figures and working-day counts.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation, consistency pass, and documentation finalisation.

- [X] T022 [P] Verify all monetary amounts across `MarginContributionPanel` use `formatSEK()` and all percentages use `formatPercent()` — no raw `.toFixed()` or template literals for currency in `src/components/users/MarginContributionPanel.tsx`
- [X] T023 [P] Add `hourlyRate` to all remaining active users (those with `employeeID`) in `backend/src/data/users.json`
- [X] T024 Run `npm run build` at repo root and in `backend/` and resolve any TypeScript errors introduced by the new `hourlyRate` and `employeeID` fields
- [X] T025 [P] Update `specs/006-margin-contribution/quickstart.md` with any final configuration steps or corrections discovered during implementation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — all tasks scaffold new files / extend existing types. All four T001–T004 are parallelisable.
- **Foundational (Phase 2)**: Depends on Phase 1 completion (types must exist). T005 → T008 must execute in order (each builds on the previous); T006 and T007 can run in parallel with each other after T005.
- **User Stories (Phases 3–5)**: All depend on Phase 2 (Foundational) completion.
  - US1 (P1) is the MVP and should be completed first.
  - US2 (P2) can begin after Phase 2; it does not depend on US1 being complete.
  - US3 (P3) requires US1 to be complete (extends `MarginContributionPanel`).
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### Within User Story 1

- T010 (scaffold) → T011 (fetch) → T012 (calculate + render) → T013 (no-billable sub-state) must run in sequence.
- T014 (integrate into page) and T015 (export) can run in parallel after T010.

### Within User Story 3

- T019 (month state) must complete before T020 (wire re-fetch).
- T021 (`calculateMargin` clamp) can run in parallel with T019.

---

## Parallel Execution Examples

### Phase 2 (after T005 is done)

| Stream A | Stream B |
|----------|----------|
| T006 `workingDays*` helpers | T007 `formatSEK` / `formatPercent` |
| ↓ T008 `calculateMargin` (needs both) | |

### Phase 3 + Phase 4 (after Phase 2 is complete)

| Stream A | Stream B |
|----------|----------|
| T010 scaffold panel | T016 scaffold card indicator |
| T011 fetch logic | T017 render in UserCard |
| T012 calculate + render | T018 export |
| T013 no-billable state | |
| T014 integrate into UserDetailPage | |
| T015 export | |

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup) — all four tasks can run in parallel.
2. Complete Phase 2 (Foundational) — implements `marginCalculator.ts` and seeds `users.json`.
3. Complete Phase 3 (US1) — full panel is live, all states handled.
4. Validate: open SBQ detail page, confirm figures match manual calculation.
5. Ship / demo as MVP.

### Incremental Delivery

1. After MVP (US1), add Phase 4 (US2) — card indicator is purely additive.
2. Add Phase 5 (US3) — month selector extends the existing panel.
3. Close with Phase 6 (Polish) — formatting validation + full `users.json` seeding.

### Suggested Task Count per Story

| Phase | Tasks | Parallelisable |
|-------|-------|---------------|
| Setup | 4 | 4 |
| Foundational | 5 | 3 (T006, T007, T009) |
| US1 (P1) | 6 | 2 (T010, T014+T015) |
| US2 (P2) | 3 | 2 (T016, T017+T018) |
| US3 (P3) | 3 | 1 (T021) |
| Polish | 4 | 3 (T022, T023, T025) |
| **Total** | **25** | |
