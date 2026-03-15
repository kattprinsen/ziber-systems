# Tasks: Tidig home page employees and monthly performance

**Input**: Design documents from `/specs/001-tidig-home-employees/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Tests are OPTIONAL. This feature relies primarily on manual verification steps described in the spec’s "Independent Test" sections, plus targeted unit/component tests where helpful.

**Organization**: Tasks are grouped by phase and user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- All tasks include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm existing project wiring and documentation for this feature.

- [x] T001 Verify Tidig integration configuration documentation in [specs/003-tidig-user-sync/quickstart.md](specs/003-tidig-user-sync/quickstart.md) is still accurate for SBQ subtree usage
- [x] T002 [P] Ensure frontend dashboard directory exists for group performance components in [src/components/dashboard](src/components/dashboard)
- [x] T003 [P] Confirm backend user data file path and `.gitignore` entry for [backend/src/data/users.json](backend/src/data/users.json)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data and wiring that MUST be complete before any user story implementation.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T004 Create or update internal employee data model to allow `externalId` and `monthlyHours` map in [backend/src/types/user.types.ts](backend/src/types/user.types.ts)
- [x] T005 [P] Add safe loader utility for `users.json` with graceful fallback and validation in [backend/src/utils](backend/src/utils)
- [x] T006 Wire backend service to expose internal employees (including `monthlyHours`) from `users.json` in [backend/src/services/user.service.ts](backend/src/services/user.service.ts)
- [x] T007 [P] Ensure existing Tidig subtree endpoint used by the frontend exposes SBQ subtree structure including `hasChildren` metadata in [backend/src/controllers/sync.controller.ts](backend/src/controllers/sync.controller.ts)
- [x] T008 Document updated data flow (Tidig subtree + `users.json` → frontend) in [specs/001-tidig-home-employees/quickstart.md](specs/001-tidig-home-employees/quickstart.md)

**Checkpoint**: Foundation ready – frontend can now derive employees and group performance from the combined Tidig + `users.json` data.

---

## Phase 3: User Story 1 - Filtered home page employees from Tidig (Priority: P1) 🎯 MVP

**Goal**: Home page shows only SBQ’s direct child employees that are not parents of other nodes (no structural/group nodes).

**Independent Test**: Connect to a representative Tidig subtree including SBQ and descendants; verify that only direct SBQ child leaf nodes (no children) are rendered as employees on the home page.

### Implementation for User Story 1

- [x] T009 [P] [US1] Add selector/utility to locate SBQ node and identify direct child leaf employees from Tidig subtree in [src/services/syncService.ts](src/services/syncService.ts)
- [x] T010 [P] [US1] Expose a typed representation of `ExternalEmployeeNode` used by the dashboard in [src/types/sync.ts](src/types/sync.ts)
- [x] T011 [US1] Update home page/group performance data-fetch path to use Tidig subtree-derived SBQ employees instead of any existing hard-coded list in [src/components/dashboard/GroupPerformanceChart.tsx](src/components/dashboard/GroupPerformanceChart.tsx)
- [x] T012 [US1] Ensure SBQ itself and any nodes with children are excluded from the rendered employee list in [src/components/dashboard/GroupPerformanceChart.tsx](src/components/dashboard/GroupPerformanceChart.tsx)
- [x] T013 [P] [US1] Add a small unit test for the SBQ leaf-employee selector using sample subtree data in [tests/components/sync](tests/components/sync)
- [ ] T014 [US1] Manually validate the home page against a real Tidig subtree so only SBQ direct child employees with no children are rendered (no structural nodes)

**Checkpoint**: User Story 1 is fully functional and can be demonstrated independently.

---

## Phase 4: User Story 2 - Maintain monthly hours per employee (Priority: P2)

**Goal**: Allow monthly hours per employee to be stored in the existing user data file and used for group performance.

**Independent Test**: Add monthly hours entries for a subset of employees in `users.json`, reload the dashboard, and verify that group performance reflects the updated current-month hours without any Tidig changes.

### Implementation for User Story 2

- [x] T015 [US2] Extend `InternalEmployeeRecord` to include `monthlyHours` map keyed by `YYYY-MM` in [backend/src/types/user.types.ts](backend/src/types/user.types.ts)
- [x] T016 [P] [US2] Update `users.json` loader to validate `monthlyHours` shape and default missing months to `0` in [backend/src/utils](backend/src/utils)
- [x] T017 [US2] Join Tidig SBQ employees with internal records (by `externalId`) so monthly hours for the current calendar month can be read in [backend/src/services/tidig.service.ts](backend/src/services/tidig.service.ts)
- [x] T018 [P] [US2] Update frontend types for internal employee records and monthly hours in [src/types/user.ts](src/types/user.ts)
- [x] T019 [US2] Adjust frontend data-fetch logic so group performance receives per-employee current-month hours from the combined Tidig + `users.json` data in [src/services/userService.ts](src/services/userService.ts)
- [x] T020 [US2] Update group performance calculation to use current-month hours from internal data and, where a SEK rate is available, compute per-employee SEK and total SEK (applying the rounding/formatting rules from FR-006) in [src/components/dashboard/GroupPerformanceChart.tsx](src/components/dashboard/GroupPerformanceChart.tsx)
- [ ] T021 [P] [US2] Add example `monthlyHours` entries to a few internal employees in [backend/src/data/users.json](backend/src/data/users.json) for manual validation (real data allowed, file is git-ignored)
- [ ] T022 [US2] Manually validate that updating `monthlyHours` for the current month in `users.json` changes the home page group performance totals on refresh

**Checkpoint**: User Stories 1 and 2 both work independently and together produce correct current-month hours for SBQ employees.

---

## Phase 5: User Story 3 - Use existing configuration for group performance (Priority: P3)

**Goal**: Ensure the feature relies only on existing configuration and user data structures (no new config files or env vars).

**Independent Test**: Configure SBQ and user data with current mechanisms; deploy changes and verify that no new configuration files or env keys were required to achieve the new behavior.

### Implementation for User Story 3

- [x] T023 [P] [US3] Confirm SBQ identification uses existing Tidig configuration (no new env vars) in [backend/src/services/tidig.service.ts](backend/src/services/tidig.service.ts)
- [x] T024 [US3] Verify that all new behavior (filtered employees, monthly hours, group performance) reads from existing endpoints and [backend/src/data/users.json](backend/src/data/users.json) only, with no new config sources introduced
- [x] T025 [P] [US3] Update documentation to explicitly state that no new configuration files or environment variables are required in [specs/001-tidig-home-employees/quickstart.md](specs/001-tidig-home-employees/quickstart.md)
- [ ] T026 [US3] Perform a configuration-only test: adjust SBQ-related config and `users.json` as today, then verify the home page behavior updates correctly without touching any new config paths

**Checkpoint**: All three user stories are independently verifiable and rely solely on existing configuration + `users.json`.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improve robustness, clarity, and maintainability across all stories.

- [x] T027 [P] Review and tidy TypeScript types and utility functions for Tidig subtree and internal employees in [src/types](src/types) and [src/services](src/services)
- [x] T028 [P] Add or update dashboard component tests for group performance behavior across edge cases (no SBQ children, missing `monthlyHours`, partial data) in [tests/components](tests/components)
- [x] T029 Improve inline and higher-level documentation for the SBQ employee derivation and group performance logic in [src/components/dashboard/GroupPerformanceChart.tsx](src/components/dashboard/GroupPerformanceChart.tsx)
- [x] T030 Run through the quickstart instructions end-to-end, updating any mismatches between docs and behavior in [specs/001-tidig-home-employees/quickstart.md](specs/001-tidig-home-employees/quickstart.md)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies – can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion – BLOCKS all user stories.
- **User Stories (Phase 3–5)**: All depend on Foundational phase completion.
  - User Story 1 (P1) should be implemented first as the MVP.
  - User Story 2 (P2) can start once the foundational data shape is in place and SBQ employees are derived (US1), but its tests should not assume US3.
  - User Story 3 (P3) can start after US1/US2 wiring exists but focuses on configuration reuse and verification.
- **Polish (Phase 6)**: Depends on desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Requires Tidig subtree and SBQ configuration from foundational work; no dependency on monthly hours.
- **User Story 2 (P2)**: Depends on US1’s ability to derive SBQ employees, plus foundational `users.json` support.
- **User Story 3 (P3)**: Depends on US1 and US2 existing so configuration reuse and behavior can be validated end-to-end.

### Within Each User Story

- Derivation and type utilities before component wiring.
- Backend data shaping before frontend consumption.
- Manual validation after implementation.

---

## Parallel Execution Examples

### Phase 1–2 Parallelism

- T002 and T003 can run in parallel while T001 is being verified.
- T005 and T007 can run in parallel after T004 is outlined, as they touch different backend files.

### User Story 1 Parallelism

- T009 (selector utility) and T010 (types) can be implemented in parallel.
- T011 and T012 can be developed once the selector utility stabilizes.
- T013 (unit test) can be written in parallel with T011/T012, using fixture data from the spec.

### User Story 2 Parallelism

- T016 (loader validation) and T018 (frontend types) can progress in parallel.
- T017 (backend join) and T019/T020 (frontend usage) can iterate once types are available.

### User Story 3 Parallelism

- T023 and T025 are documentation/config review tasks that can run alongside T024/T026 validation.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (CRITICAL – blocks all stories).
3. Implement Phase 3: User Story 1 (SBQ leaf employees from Tidig subtree).
4. Stop and validate: Confirm the home page only shows SBQ direct child leaf employees, no structural/group nodes.

### Incremental Delivery

1. After MVP (US1), implement Phase 4 (US2) to introduce current-month `monthlyHours` from `users.json` into group performance.
2. Validate that editing `monthlyHours` directly in `users.json` updates group performance without touching Tidig.
3. Implement Phase 5 (US3) to harden configuration reuse and ensure no new config files/env vars were added.
4. Run Phase 6 polish tasks to firm up tests and documentation.

### Team Parallel Strategy

- Once Phase 2 is complete:
  - Developer A focuses on User Story 1 (T009–T014).
  - Developer B focuses on User Story 2 (T015–T022), coordinating on shared types and data shapes.
  - Developer C focuses on User Story 3 (T023–T026) and Phase 6 polish (T027–T030).

Each story remains independently testable and deliverable, with clear checkpoints after each phase.
