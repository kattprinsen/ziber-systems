# Tasks: Consultant Contribution Bookkeeping MVP

**Input**: Design documents from `/specs/008-consultant-bookkeeping/`  
**Prerequisites**: plan.md (present), spec.md (present); research.md, data-model.md, contracts/ optional for MVP.

**Tests**: Include tests where they add confidence with minimal overhead; prioritize pure domain calculations and critical API flows.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies).
- **[Story]**: US1 (monthly hours + summary), US2 (manage consultants), US3 (3-month trend), Shared (cross-cutting).
- Include exact file paths in descriptions where known.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Ensure backend and frontend foundations exist for this feature.

- [X] T001 [P] [Shared] Verify or initialize Node.js + TypeScript backend project in `backend/` with basic tooling (tsconfig, lint, test runner).
- [X] T002 [P] [Shared] Add or verify a `backend/src/` entrypoint for the HTTP server (e.g., `backend/src/api/httpServer.ts`).
- [X] T003 [P] [Shared] Initialize a Vite + TypeScript frontend in `frontend/` (framework-free) alongside existing projects.
- [X] T004 [P] [Shared] Configure Tailwind CSS in `frontend/` and wire it into the main entry (e.g., `frontend/src/main.ts`).
- [X] T005 [Shared] Establish dark, industrial base theme (global styles, Tailwind config) with orange/yellow accents.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core domain, storage, and API scaffolding required for all user stories.

- [X] T010 [P] [Shared] Define domain types for Consultant, MonthlyEntry, and TeamSummary in `backend/src/domain/consultant.ts`, `backend/src/domain/monthlyEntry.ts`, and `backend/src/domain/teamSummary.ts`.
- [X] T011 [P] [Shared] Implement pure calculation functions (revenue, cost approximation, margin, utilization, team aggregation) in `backend/src/domain/calculations.ts`.
- [X] T012 [Shared] Define repository interfaces for consultants and monthly entries in `backend/src/storage/repositories/consultantRepository.ts` and `backend/src/storage/repositories/monthlyEntryRepository.ts`.
- [X] T013 [P] [Shared] Implement initial JSON or embedded NoSQL-backed repository adapters in `backend/src/storage/adapters/` that satisfy the repository interfaces.
- [X] T014 [Shared] Introduce a simple dependency injection/composition root in `backend/src/api/httpServer.ts` to wire repositories into services and routes.
- [X] T015 [P] [Shared] Create backend services (`consultantService.ts`, `entryService.ts`, `summaryService.ts`) under `backend/src/services/` using the DI-managed repositories and domain calculations.
- [X] T016 [Shared] Set up base HTTP routing structure in `backend/src/api/routes/`, including health check and version endpoint.
- [X] T017 [P] [Shared] Implement a minimal frontend API client in `frontend/src/services/apiClient.ts` for calling backend endpoints.
- [X] T018 [Shared] Create core layout/shell modules (dark mode) in `frontend/src/components/` and a root dashboard module in `frontend/src/pages/DashboardPage.ts`.

**Checkpoint**: Domain model, repositories, DI wiring, and basic frontend shell are in place; no user stories fully implemented yet.

---

## Phase 3: User Story 1 - Record Monthly Hours & View Current Month Summary (P1)

**Goal**: End-to-end flow to input monthly billable/non-billable hours for each active consultant and view current-month individual + team summary.

### Backend

- [X] T020 [US1] Implement service methods in `entryService.ts` to create/update MonthlyEntry records per consultant and month.
- [X] T021 [US1] Extend `summaryService.ts` to compute per-consultant and team summaries for a given month using domain calculations.
- [X] T022 [US1] Add API endpoints in `backend/src/api/routes/entries.ts` for:
  - Upserting monthly hours (billable + non-billable) per consultant.
  - Fetching current-month summary (per-consultant + team).
- [X] T023 [P] [US1] Add basic validation for monthly input payloads (e.g., via zod or custom guards) and map validation errors to HTTP responses.

### Frontend

- [X] T024 [P] [US1] Create `frontend/src/components/MonthlyHoursForm.ts` for listing active consultants and capturing billable/non-billable hours for the selected month.
- [X] T025 [P] [US1] Create `frontend/src/components/ConsultantTable.ts` to display per-consultant metrics for the current month.
- [X] T026 [P] [US1] Create `frontend/src/components/TeamSummary.ts` to display team-level metrics for the current month.
- [X] T027 [US1] Wire `DashboardPage.ts` to:
  - Select a month (default to current).
  - Load existing entries and summaries via `apiClient.ts`.
  - Submit updated monthly hours and refresh the summary on save.

### Tests (recommended)

- [ ] T028 [P] [US1] Add unit tests for calculation functions in `backend/tests/unit/calculations.test.ts` covering revenue, cost approximation, margin, and utilization (including 0-hours edge cases).
- [ ] T029 [US1] Add a simple integration test in `backend/tests/integration/entriesAndSummary.test.ts` that exercises creating entries and retrieving a summary for one month.

**Checkpoint**: Monthly hours can be entered and saved; current-month summary view works end to end.

---

## Phase 4: User Story 2 - Manage Consultants (P2)

**Goal**: Manage consultants (add/update/inactivate) without losing historical data.

### Backend

- [ ] T040 [US2] Extend `consultantService.ts` with methods to create, update, list, and inactivate consultants while preserving historical MonthlyEntry records.
- [ ] T041 [US2] Add consultant management API endpoints in `backend/src/api/routes/consultants.ts` for CRUD and status changes.
- [ ] T042 [P] [US2] Ensure repository implementations handle status changes and maintain referential integrity with MonthlyEntry data.

### Frontend

- [ ] T043 [P] [US2] Create `frontend/src/pages/ConsultantsPage.ts` to list consultants and show key fields (name, salary, hourlyRate, status).
- [ ] T044 [P] [US2] Add form components in `frontend/src/components/` for creating/updating a consultant and toggling active/inactive status.
- [ ] T045 [US2] Integrate consultant management UI with `apiClient.ts`, updating lists and ensuring inactive consultants disappear from new months in `MonthlyHoursForm.vue` while remaining visible in historical views.

### Tests (recommended)

- [ ] T046 [US2] Add unit tests for `consultantService.ts` behavior around activation/inactivation and updates.

**Checkpoint**: Consultants can be managed through the UI; monthly workflow reflects active status correctly.

---

## Phase 5: User Story 3 - View 3-Month Team Trend (P3)

**Goal**: Show a rolling 3-month view of team metrics.

### Backend

- [ ] T050 [US3] Extend `summaryService.ts` to compute summaries for a range of months and select the last three fully entered months.
- [ ] T051 [US3] Add an API endpoint in `backend/src/api/routes/summary.ts` to return a 3-month rolling trend dataset for team metrics.

### Frontend

- [ ] T052 [P] [US3] Create `frontend/src/components/TrendView.ts` to visualize 3-month revenue, cost approximation, margin, and utilization (table or simple chart).
- [ ] T053 [US3] Integrate `TrendView.ts` into `DashboardPage.ts` or a dedicated trends section, loading data from the new trend endpoint.

### Tests (recommended)

- [ ] T054 [US3] Add unit tests for the multi-month aggregation logic in `calculations.ts` or `summaryService.ts`.

**Checkpoint**: 3-month team trends are visible and consistent with single-month summaries.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improve usability, reliability, and maintainability.

- [ ] T060 [P] [Shared] Add minimal structured logging for key domain events (saving entries, managing consultants) in backend services.
- [ ] T061 [P] [Shared] Refine dark industrial UI (spacing, typography, color balance) to keep focus on key metrics.
- [ ] T062 [P] [Shared] Update or create `specs/008-consultant-bookkeeping/quickstart.md` with steps to run backend and frontend together.
- [ ] T063 [Shared] Manual validation against success criteria SC-001–SC-005 from `spec.md` and document any gaps.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies; do this first.
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2; delivers the MVP core.
- **Phase 4 (US2)**: Depends on Phase 2; can proceed after or in parallel with late US1 work.
- **Phase 5 (US3)**: Depends on stable summaries from US1; can proceed once summaries are reliable.
- **Phase 6 (Polish)**: Depends on desired user stories being in place.

### Parallel Opportunities

- [P] tasks in Phases 1 and 2 can run concurrently where they touch different modules.
- Within each user story, [P] tasks that touch different layers/files (e.g., backend vs frontend) can proceed in parallel.
- Trends (US3) can be developed while UI polish tasks are underway.
