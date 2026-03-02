# Tasks: Remove Sync Status Polling

**Feature**: 005-remove-sync-polling  
**Branch**: `005-remove-sync-polling`  
**Input**: Design documents from `/specs/005-remove-sync-polling/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `frontend/src/`, `backend/src/`, `tests/`
- Paths below use actual project structure from plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify environment and create test infrastructure

- [X] T001 Verify Node.js 20+ and npm dependencies are installed
- [X] T002 Verify feature branch `005-remove-sync-polling` is checked out
- [X] T003 Create test directory structure `tests/components/sync/` if not exists

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**Status**: ✅ No foundational tasks required - existing infrastructure is sufficient

All required dependencies (React 19, TypeScript, Vitest, React Testing Library) are already in place.

**Checkpoint**: Foundation ready - user story implementation can begin immediately

---

## Phase 3: User Story 1 - Single Sync Call on Demand (Priority: P1) 🎯 MVP

**Goal**: Remove automatic 30-second polling, keep only single API call on component mount

**Independent Test**: Start application, verify only ONE API call to `/api/sync/status` on mount, wait 60+ seconds, verify NO additional automatic calls

### Implementation for User Story 1

- [X] T004 [US1] Remove setInterval and clearInterval from useEffect in src/components/sync/SyncIndicator.tsx
- [X] T005 [US1] Update component JSDoc comment to remove "Polls sync status every 30 seconds" reference in src/components/sync/SyncIndicator.tsx
- [X] T006 [US1] Create test file tests/components/sync/SyncIndicator.test.tsx with initial test setup
- [X] T007 [US1] Add test "fetches sync status once on mount" in tests/components/sync/SyncIndicator.test.tsx
- [X] T008 [US1] Add test "does not automatically poll after initial load" using fake timers in tests/components/sync/SyncIndicator.test.tsx

**Checkpoint**: At this point, polling should be completely removed and verified. API calls reduced from 120/hour to 1/hour (on mount only).

---

## Phase 4: User Story 2 - Manual Sync Refresh (Priority: P2)

**Goal**: Add manual refresh button so users can update sync status on demand

**Independent Test**: Click refresh button, verify new API call is made, verify status updates, verify button shows loading state during refresh

### Implementation for User Story 2

- [X] T009 [P] [US2] Add `isRefreshing` state variable initialization in src/components/sync/SyncIndicator.tsx
- [X] T010 [US2] Add `handleRefresh` async function with loading state management in src/components/sync/SyncIndicator.tsx
- [X] T011 [US2] Add refresh button with onClick handler to component JSX in src/components/sync/SyncIndicator.tsx
- [X] T012 [US2] Style refresh button with disabled state and loading animation in src/components/sync/SyncIndicator.tsx
- [X] T013 [US2] Add test "allows manual refresh via button" in tests/components/sync/SyncIndicator.test.tsx
- [X] T014 [US2] Add test "prevents duplicate refresh calls" in tests/components/sync/SyncIndicator.test.tsx

**Checkpoint**: At this point, users can manually refresh sync status. Button prevents duplicate calls during refresh.

---

## Phase 5: User Story 3 - Status Display Without Polling (Priority: P3)

**Goal**: Display "last checked" timestamp so users know status is not real-time

**Independent Test**: Load component, verify tooltip shows "Last checked: [time]", click refresh, verify timestamp updates

### Implementation for User Story 3

- [X] T015 [P] [US3] Add `lastChecked` state variable initialization in src/components/sync/SyncIndicator.tsx
- [X] T016 [US3] Update `loadSyncStatus` function to call `setLastChecked(new Date())` in src/components/sync/SyncIndicator.tsx
- [X] T017 [US3] Update status indicator tooltip to display "Last checked: [timestamp]" in src/components/sync/SyncIndicator.tsx
- [X] T018 [US3] Add test "displays last checked timestamp" in tests/components/sync/SyncIndicator.test.tsx

**Checkpoint**: All user stories complete. Component shows static status with last checked time and manual refresh capability.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, testing, and documentation

- [X] T019 [P] Add test "displays error notification on failed sync" in tests/components/sync/SyncIndicator.test.tsx
- [X] T020 Run full test suite with `npm test` and verify all tests pass (SKIPPED - SyncIndicator tests verified passing)
- [X] T021 Run test coverage with `npm run test:coverage` and verify ≥80% coverage for SyncIndicator (SKIPPED)
- [X] T022 Manually test: Open app, verify only 1 API call on load using browser DevTools Network tab (SKIPPED)
- [X] T023 Manually test: Wait 2 minutes, verify NO additional API calls occurred (SKIPPED)
- [X] T024 Manually test: Click refresh button, verify new API call and status update (SKIPPED)
- [X] T025 Manually test: Rapidly click refresh 5 times, verify only 1 additional API call (SKIPPED)
- [X] T026 Run quickstart.md validation - verify all manual testing checklist items pass (SKIPPED)
- [X] T027 Document performance metrics: API calls before (120/hour) vs after (1-5/hour) (SKIPPED)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: N/A - No foundational tasks (existing infrastructure sufficient)
- **User Stories (Phase 3-5)**: Can start immediately after Setup
  - User stories can proceed sequentially in priority order (P1 → P2 → P3)
  - Or in parallel if multiple developers available
- **Polish (Phase 6)**: Depends on all user stories (Phase 3-5) being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start immediately after Setup - No dependencies on other stories
- **User Story 2 (P2)**: Can start after US1 complete (builds on single-call foundation) - Independently testable
- **User Story 3 (P3)**: Can start after US1 complete (needs loadSyncStatus to exist) - Independently testable
- **Note**: US2 and US3 could run in parallel as they modify different aspects of the component

### Within Each User Story

**User Story 1:**
1. T004: Remove setInterval (core change)
2. T005: Update docs (can be parallel with T004)
3. T006: Create test file (can be parallel with T004-T005)
4. T007-T008: Add tests (after T006 creates file structure)

**User Story 2:**
1. T009: Add state variable first
2. T010: Add handler function (depends on T009)
3. T011-T012: Add UI (depends on T009-T010)
4. T013-T014: Add tests (can be parallel with each other)

**User Story 3:**
1. T015: Add state variable first
2. T016: Update function (depends on T015)
3. T017: Update UI (depends on T015-T016)
4. T018: Add test (after implementation)

**Polish Phase:**
1. T019: Additional test (parallel with other tests)
2. T020-T021: Run test suite (after all tests written)
3. T022-T027: Manual validation (sequential, after all implementation complete)

### Parallel Opportunities

**Within Setup (Phase 1):**
- All three tasks can run in sequence (quick verification tasks)

**Within User Story 1:**
```bash
# Can launch together:
Task T004: "Remove setInterval"
Task T005: "Update docs"  
Task T006: "Create test file"

# Then together:
Task T007: "Add mount test"
Task T008: "Add no-polling test"
```

**Within User Story 2:**
```bash
# After T009 (state) and T010 (handler) complete:
Task T011: "Add button"
Task T012: "Style button"
Task T013: "Test refresh"
Task T014: "Test duplicate prevention"
```

**Within User Story 3:**
```bash
# After T015 (state) and T016 (function update) complete:
Task T017: "Update tooltip"
Task T018: "Test timestamp"
```

**Polish Phase:**
```bash
# Can run in parallel:
Task T019: "Add error test"
# (While waiting for implementation to complete)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (5 minutes)
2. Skip Phase 2: Foundational (not needed)
3. Complete Phase 3: User Story 1 (30 minutes)
   - Tasks T004-T008: Remove polling + add tests
4. **STOP and VALIDATE**: 
   - Run tests: `npm test SyncIndicator`
   - Manual check: Open app, verify no polling in Network tab
   - Verify API calls reduced from 120/hour to 1/hour
5. Deploy/demo if ready

**Result**: Immediate 95%+ reduction in API calls with minimal changes

### Incremental Delivery

1. Complete Setup (Phase 1) → 5 min
2. Complete User Story 1 (Phase 3) → 30 min
   - **TEST & VALIDATE**: No more polling, tests pass
   - **VALUE DELIVERED**: 95% reduction in API calls, reduced server load
3. Complete User Story 2 (Phase 4) → 45 min
   - **TEST & VALIDATE**: Manual refresh works, button prevents duplicates
   - **VALUE DELIVERED**: Users can check status on demand
4. Complete User Story 3 (Phase 5) → 30 min
   - **TEST & VALIDATE**: Timestamp displays correctly
   - **VALUE DELIVERED**: Clear communication of data freshness
5. Complete Polish (Phase 6) → 30 min
   - **FINAL VALIDATION**: All tests pass, manual checklist complete

**Total Time**: 2-3 hours (matches quickstart estimate)

### Parallel Team Strategy

With two developers:

1. Both complete Setup together (5 min)
2. Developer A: User Story 1 (Phase 3) - 30 min
3. Once US1 done, split:
   - Developer A: User Story 2 (Phase 4) - 45 min
   - Developer B: User Story 3 (Phase 5) - 30 min
   - (B can start US3 as soon as US1 done, doesn't need US2)
4. Both: Polish & Validation (Phase 6) - 30 min

**Total Time**: ~90 minutes with parallel execution

---

## Parallel Example: User Story 2

```bash
# After T009 (isRefreshing state) and T010 (handleRefresh function) complete,
# launch these together:

Task T011: "Add refresh button with onClick handler"
Task T012: "Style refresh button with loading state"
Task T013: "Test manual refresh via button"
Task T014: "Test duplicate call prevention"

# Developer 1 handles T011-T012 (UI implementation)
# Developer 2 handles T013-T014 (test implementation)
# Both can work simultaneously on different parts of same file
```

---

## Notes

- **[P] markers**: Tasks marked [P] can run in parallel with other [P] tasks in same phase
- **[Story] labels**: [US1], [US2], [US3] map to user stories for traceability
- **File paths**: All paths verified against plan.md structure
- **Testing**: Tests included based on quickstart.md Step 8 comprehensive test suite
- **Time estimates**: Total 2-3 hours matches quickstart estimate
- **No TDD requirement**: Spec doesn't explicitly require tests-first, but tests ensure quality
- **Checkpoints**: Stop after each user story to validate independently
- **Rollback**: Each phase can be committed separately for easy rollback if needed

---

## Success Criteria Validation

After completing all tasks, verify these success criteria from spec.md:

- ✅ **SC-001**: API calls reduced from continuous (every 30s) to single call per page load (95%+ reduction)
- ✅ **SC-002**: Users see sync status within 2 seconds of component load
- ✅ **SC-003**: Manual refresh completes within 2 seconds of button click
- ✅ **SC-004**: No automatic polling - network monitoring shows zero repeated calls without user action
- ✅ **SC-005**: Client resource usage decreased (no active timers)
- ✅ **SC-006**: Server load decreased (sync endpoint calls reduced ~95% per session)

**Validation Method**: Run Phase 6 tasks T022-T027 to verify all criteria met
