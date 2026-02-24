# Tasks: Tidig Time Interval Integration

**Input**: Design documents from `/specs/004-tidig-time-entries/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Automated tests are optional for this feature; tasks below focus on implementation. Add test tasks explicitly if you decide to drive specific areas with TDD.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare backend and frontend structure needed for Tidig time integration without implementing user-facing behavior yet.

 - [X] T001 [P] Create backend time models file in backend/src/models/tidigTime.ts
 - [X] T002 [P] Create backend Tidig time service file in backend/src/services/tidigTime.service.ts
 - [X] T003 [P] Create backend time controller file in backend/src/controllers/time.controller.ts
 - [X] T004 [P] Create backend time routes file in backend/src/routes/time.routes.ts
 - [X] T005 [P] Create frontend time types file in src/types/time.ts
 - [X] T006 [P] Create frontend time service file in src/services/timeService.ts
 - [X] T007 [P] Prepare user detail time section container in src/pages/UserDetailPage/UserDetailPage.tsx

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented. These pieces are reused by all user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

 - [X] T008 Define Tidig time entry and filter types and Zod schemas in backend/src/models/tidigTime.ts
 - [X] T009 Implement Tidig `/Api/Time` HTTP client function using existing Tidig client patterns in backend/src/services/tidigTime.service.ts
 - [X] T010 Wire base `/api/users/:userId/time` route to controller in backend/src/routes/time.routes.ts
 - [X] T011 Implement time controller handler to call Tidig time service and return validated entries in backend/src/controllers/time.controller.ts
 - [X] T012 Connect time routes into main Express app bootstrap in backend/src/server.ts
 - [X] T013 Implement frontend time entry and filter TypeScript types in src/types/time.ts
 - [X] T014 Implement frontend time service function to call `/api/users/:userId/time` with query parameters in src/services/timeService.ts
 - [X] T015 Ensure UserDetailPage can access selected user id and pass it to time section in src/pages/UserDetailPage/UserDetailPage.tsx

**Checkpoint**: Backend time API and frontend time service are wired; user stories can now build on top of these.

---

## Phase 3: User Story 1 - See My Tidig Time For A Period (Priority: P1) 🎯 MVP

**Goal**: A logged-in user can open the user detail page, select a date interval, and see their Tidig time entries (date, customer, project, hours) for that period.

**Independent Test**: Log in as a user, open the user detail page, select a one-month interval, and verify that the displayed entries and totals match Tidig for that user and interval. The rest of the page must work even if time loading fails.

### Implementation for User Story 1

 - [X] T016 [P] [US1] Add date interval pickers and state (fromDate, toDate) to the user detail time section in src/pages/UserDetailPage/UserDetailPage.tsx
 - [X] T017 [US1] Call frontend time service when interval changes and handle loading and error state in src/pages/UserDetailPage/UserDetailPage.tsx
 - [X] T018 [P] [US1] Implement time entries list component to render date, customer, project, and hours in src/components/users/UserTimeEntries.tsx
 - [X] T019 [US1] Integrate UserTimeEntries component into the user detail time section and wire it to fetched data in src/pages/UserDetailPage/UserDetailPage.tsx
 - [X] T020 [US1] Implement clear "no entries" state when no time is returned for the interval in src/pages/UserDetailPage/UserDetailPage.tsx
 - [X] T021 [US1] Implement user-facing error message for failed time loads while keeping the rest of the user page functional in src/pages/UserDetailPage/UserDetailPage.tsx

**Checkpoint**: User Story 1 is fully functional and independently testable: users can see their own time entries for a chosen interval or clear no-data/error states.

---

## Phase 4: User Story 2 - Filter My Time By Customer And Project (Priority: P2)

**Goal**: A user can filter their visible Tidig time entries by customer and project on the user detail page for a given interval.

**Independent Test**: With known data in Tidig, choose a date interval, then apply customer and project filters and verify that only matching entries are shown and that they correspond to Tidig's filtered view.

### Implementation for User Story 2

 - [X] T022 [P] [US2] Extend backend time service to accept optional customer and project parameters and forward them to Tidig `/Api/Time` in backend/src/services/tidigTime.service.ts
 - [X] T023 [US2] Update time controller to parse customer and project filter query parameters and pass them to the service in backend/src/controllers/time.controller.ts
 - [ ] T024 [US2] Document accepted query parameters for `/api/users/:userId/time` (customerId, customerName, projectId, projectName) in backend/README.md
 - [X] T025 [P] [US2] Add customer and project filter controls (e.g., dropdowns or text inputs) to the user detail time section in src/pages/UserDetailPage/UserDetailPage.tsx
 - [X] T026 [US2] Wire filter controls into time service calls so that changes refetch filtered data in src/pages/UserDetailPage/UserDetailPage.tsx
 - [X] T027 [US2] Ensure UI clearly indicates active filters and allows resetting filters to show all entries in src/pages/UserDetailPage/UserDetailPage.tsx

**Checkpoint**: User Story 2 is independently testable: with User Story 1 foundation, users can refine visible time entries by customer and project.

---

## Phase 5: User Story 3 - See Time Summary On User Detail (Priority: P3)

**Goal**: A manager or consultant can see summarized totals of time per customer and per project for a user and interval on the user detail page.

**Independent Test**: For a given interval with known entries, open the summary section and verify that per-customer and per-project totals match the sum of the raw entries from Tidig. When there are no entries, a clear "no data" state is shown.

### Implementation for User Story 3

- [X] T028 [P] [US3] Implement frontend helper to group time entries by customer and project and compute total hours in src/services/timeService.ts
- [X] T029 [P] [US3] Create time summary component to display totals per customer and project in src/components/users/UserTimeSummary.tsx
- [X] T030 [US3] Integrate UserTimeSummary component into the user detail time section and wire it to grouped data in src/pages/UserDetailPage/UserDetailPage.tsx
- [X] T031 [US3] Implement clear "no summary data" state for intervals without entries in src/components/users/UserTimeSummary.tsx

**Checkpoint**: User Story 3 is independently testable: summaries reflect the underlying entries accurately and degrade gracefully when no data exists.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements and hardening across all user stories.

- [ ] T032 [P] Add logging for Tidig time request successes and failures using existing logger in backend/src/middleware/logger.ts and backend/src/services/tidigTime.service.ts
- [ ] T033 [P] Improve error messages and loading states styling for the time section in src/pages/UserDetailPage/UserDetailPage.tsx
- [ ] T034 Review and align time-related naming and types across backend/src/models/tidigTime.ts and src/types/time.ts
- [ ] T035 [P] Update feature documentation and quickstart with time feature usage steps in specs/004-tidig-time-entries/quickstart.md
- [ ] T036 Run manual validation of time feature using scenarios from specs/004-tidig-time-entries/spec.md and record findings in specs/004-tidig-time-entries/research.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies – can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion – BLOCKS all user stories.
- **User Stories (Phases 3–5)**: All depend on Foundational phase completion.
  - User Story 1 (P1) should be completed first as MVP.
  - User Story 2 (P2) builds on the same API and UI but remains independently testable.
  - User Story 3 (P3) builds on the data from User Story 1 but can be implemented after P1 is stable.
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) – no dependencies on other stories and forms the MVP.
- **User Story 2 (P2)**: Can start after Foundational (Phase 2); assumes basic time listing from User Story 1 is available but can be tested independently by focusing on filtered results.
- **User Story 3 (P3)**: Can start after Foundational (Phase 2); relies on time entries being available from User Story 1 but is independently testable via summary correctness.

### Within Each User Story

- Backend adjustments (service, controller, routes) before frontend behavior that depends on them.
- Data structures and helpers before UI components that render or summarize them.
- Core implementation before visual polish.

### Parallel Opportunities

- All tasks marked [P] can be worked on in parallel as long as file paths and dependencies do not conflict.
- Phase 1 setup tasks for backend and frontend can be parallelized across team members.
- Within Phase 2, backend model/client wiring and frontend type/service setup can proceed in parallel.
- In User Story 1, UI shell (date controls) and list component can be built in parallel once the time service contract is clear.
- In User Story 3, summary helper logic and summary component UI can be implemented in parallel.

---

## Parallel Example: User Story 1

Example parallel work streams once Foundational phase is complete:

- Task stream A:
  - T016 [P] [US1] Add date interval pickers and state in src/pages/UserDetailPage/UserDetailPage.tsx
  - T017 [US1] Wire time service calls and loading/error handling in src/pages/UserDetailPage/UserDetailPage.tsx

- Task stream B:
  - T018 [P] [US1] Implement UserTimeEntries list component in src/components/users/UserTimeEntries.tsx
  - T019 [US1] Integrate UserTimeEntries into UserDetailPage in src/pages/UserDetailPage/UserDetailPage.tsx

Both streams can proceed in parallel if the shape of the time entry data from src/types/time.ts is agreed upfront.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (CRITICAL – blocks all stories).
3. Complete Phase 3: User Story 1.
4. Validate that users can load their own time for an interval, with correct data and graceful handling of no-data and error states.
5. Deploy/demo as an MVP if acceptable.

### Incremental Delivery

1. After MVP (US1), implement Phase 4: User Story 2 to add filtering by customer and project.
2. Implement Phase 5: User Story 3 to add summaries per customer and project.
3. Use Phase 6: Polish to refine UX, logging, and documentation.

### Parallel Team Strategy

With multiple developers:

- Developer A focuses on backend time client, service, controller, and routes (T001–T004, T008–T012, T022–T024).
- Developer B focuses on frontend time types, service, and UserDetailPage integration (T005–T007, T013–T017, T020–T027).
- Developer C focuses on summary logic, UI components, and polish (T028–T031, T032–T036).

Each story remains independently testable, and work can be staggered or merged depending on capacity.
