# Tasks: Tidig API User Synchronization

**Feature**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md) | **Research**: [research.md](research.md)  
**Date**: February 23, 2026

## Overview

This document breaks down the Tidig user synchronization feature into actionable tasks, organized by user story priority. Each phase represents an independently testable increment of functionality.

**Implementation Strategy**: 
- **MVP First**: Phase 3 (User Story 1) delivers the core value - automatic sync on startup
- **Incremental Delivery**: Each subsequent phase adds functionality without breaking previous phases
- **Independent Testing**: Each user story phase includes clear test criteria for validation

**Total Estimated Effort**: 11-16 hours (1.5-2 days)

---

## Task Checklist Format

All tasks follow this format:
```
- [ ] [TaskID] [P?] [Story?] Description with file path
```

- **[TaskID]**: Sequential task number (T001, T002, etc.)
- **[P]**: Optional marker indicating task can be parallelized (different files, no dependencies)
- **[Story]**: User story label (US1, US2, US3, US4) for story-specific tasks
- **Description**: Clear action with exact file path

---

## Phase 1: Setup & Environment

**Goal**: Prepare development environment and install required dependencies

**Tasks**:

- [X] T001 Create backend environment configuration file at backend/.env
- [X] T002 Configure Tidig API environment variables (TIDIG_API_URL, TIDIG_API_KEY, TIDIG_API_TIMEOUT) in backend/.env
- [X] T003 Update backend/.env.example with Tidig configuration template (without real API key)
- [X] T004 Install backend production dependencies (axios, dotenv, fs-extra, zod) in backend/package.json
- [X] T005 [P] Install backend dev dependencies (@types/fs-extra, vitest, @vitest/ui) in backend/package.json
- [X] T006 [P] Create Vitest configuration file at backend/vitest.config.ts
- [X] T007 [P] Add test scripts to backend/package.json (test, test:watch, test:coverage)
- [X] T008 [P] Verify .env is in backend/.gitignore to prevent committing API keys

---

## Phase 2: Foundational Infrastructure (Blocking)

**Goal**: Build core infrastructure required by all user stories (client, types, validators)

**Must Complete Before**: Any user story implementation can begin

**Tasks**:

- [X] T009 Create TypeScript sync types at backend/src/types/sync.types.ts
- [X] T010 Create Tidig data model with zod schemas at backend/src/models/tidig.model.ts
- [X] T011 Create Tidig API client with axios configuration at backend/src/utils/tidig-client.ts
- [X] T012 Add request/response interceptors for logging to backend/src/utils/tidig-client.ts
- [X] T013 Implement error handling for timeout and network errors in backend/src/utils/tidig-client.ts
- [X] T014 Create test directories structure: backend/tests/unit/ and backend/tests/integration/

---

## Phase 3: User Story 1 (P1) - Automatic Sync on Startup [MVP]

**User Story**: As a system administrator, when I start the application, the system automatically fetches the current user list from Tidig API and updates the local user data store.

**Story Goal**: Enable automatic user synchronization during application startup with basic error handling and timeout support.

**Independent Test**: 
1. Empty users.json
2. Start application
3. Verify users.json populated with all Tidig employees
4. Verify startup completes within 10 seconds

**Acceptance Criteria**:
- ✅ Application fetches users from Tidig on startup
- ✅ users.json updated with Tidig employee data
- ✅ 5-second timeout enforced
- ✅ Application continues on sync failure with notification
- ✅ Sync errors logged for administrator review

**Tasks**:

- [X] T015 [US1] Implement fetchEmployees() method in backend/src/services/tidig.service.ts to call GET /Api/Employee/SubTree
- [X] T016 [US1] Add Tidig response validation using zod schemas in backend/src/services/tidig.service.ts
- [X] T017 [US1] Implement error handling for API failures (401, 403, 500, timeout) in backend/src/services/tidig.service.ts
- [X] T018 [US1] Create sync orchestrator service at backend/src/services/sync.service.ts with performSync() method
- [X] T019 [US1] Implement basic sync flow: fetch from Tidig → write to users.json in backend/src/services/sync.service.ts
- [X] T020 [US1] Add sync operation locking to prevent concurrent syncs in backend/src/services/sync.service.ts
- [X] T021 [US1] Implement sync logging (start time, duration, status) in backend/src/services/sync.service.ts
- [X] T022 [US1] Add startup sync call in backend/src/server.ts (before app.listen)
- [X] T023 [US1] Implement graceful failure handling (log error, continue startup) in backend/src/server.ts
- [X] T024 [US1] Add console notification for sync failure visible to administrators in backend/src/server.ts
- [X] T025 [US1] Test startup flow: empty users.json → start server → verify populated
- [X] T026 [US1] Test timeout scenario: mock slow API → verify 5-second timeout → verify startup continues

**Parallel Work Opportunities**:
- T015-T017 (Tidig service) can run parallel to T018-T021 (Sync service structure)
- T025-T026 (Testing) can be prepared while implementation is ongoing

---

## Phase 4: User Story 2 (P2) - Detect and Add New Users

**User Story**: As a system administrator, when new employees are added to Tidig, I want them to automatically appear in my management system on the next startup.

**Story Goal**: Automatically detect and add new Tidig employees that don't exist in the local users.json.

**Independent Test**:
1. Start with existing users.json
2. Have a new user in Tidig (not in local)
3. Restart application
4. Verify new user added to users.json with correct default values

**Acceptance Criteria**:
- ✅ New Tidig users automatically added during sync
- ✅ Local fields set to null/empty for new users
- ✅ Multiple new users added in single operation
- ✅ Added users logged for administrator review

**Tasks**:

- [X] T027 [P] [US2] Implement compareUsers() function to identify new Tidig users in backend/src/services/sync.service.ts
- [X] T028 [US2] Implement addNewUser() function with default local field values in backend/src/services/sync.service.ts
- [X] T029 [US2] Update performSync() to detect and add new users before updating existing in backend/src/services/sync.service.ts
- [X] T030 [US2] Add usersAdded counter to sync log in backend/src/services/sync.service.ts
- [X] T031 [US2] Log list of newly added users (employeeID, name) in backend/src/services/sync.service.ts
- [X] T032 [US2] Test new user detection: existing users.json + new Tidig user → verify added correctly
- [X] T033 [US2] Test multiple new users: 3 new Tidig users → verify all added in single sync

**Parallel Work Opportunities**:
- T027 (comparison logic) can start while T028 (user creation) is designed

---

## Phase 5: User Story 3 (P3) - Preserve Local Properties During Sync

**User Story**: As a system administrator, when user information is synced from Tidig, I want locally-managed properties to be preserved, so I don't lose important HR data.

**Story Goal**: Implement 3-way merge to update Tidig fields while preserving local fields (salary, department, etc.).

**Independent Test**:
1. Set salary and local properties for existing user
2. Update user info in Tidig (name, email)
3. Sync from Tidig
4. Verify Tidig fields updated, local fields preserved

**Acceptance Criteria**:
- ✅ Salary and local properties unchanged during sync
- ✅ Tidig fields (name, email) updated from API
- ✅ Merged record contains current data from both sources
- ✅ No data loss for any field

**Tasks**:

- [X] T034 [P] [US3] Create user merge service at backend/src/services/user-merge.service.ts
- [X] T035 [US3] Implement mergeUserData() with field-level merge logic in backend/src/services/user-merge.service.ts
- [X] T036 [US3] Define Tidig-managed fields list (employeeID, name, email) in backend/src/services/user-merge.service.ts
- [X] T037 [US3] Define locally-managed fields list (salary, role, department, avatar, phone, bio, skills, location, currentSalary, salaryHistory) in backend/src/services/user-merge.service.ts
- [X] T038 [US3] Update performSync() to use mergeUserData() instead of full replacement in backend/src/services/sync.service.ts
- [X] T039 [US3] Add usersUpdated counter to sync log in backend/src/services/sync.service.ts
- [X] T040 [P] [US3] Implement atomic file write using fs-extra (write temp file → rename) in backend/src/services/sync.service.ts
- [X] T041 [US3] Add file write error handling with rollback logic in backend/src/services/sync.service.ts
- [X] T042 [US3] Test merge logic: user with salary → sync from Tidig → verify salary preserved, name updated
- [X] T043 [US3] Test multiple field preservation: salary, department, bio → sync → verify all local fields preserved

**Parallel Work Opportunities**:
- T034-T037 (merge service) can be built independently
- T040-T041 (atomic writes) can be implemented in parallel to merge logic

---

## Phase 6: User Story 4 (P4) - Handle Synchronization Conflicts

**User Story**: As a system administrator, when discrepancies exist between local and Tidig data, I want the system to handle this gracefully by preserving local data and logging the discrepancy.

**Story Goal**: Mark users not in Tidig as inactive, support filtering by status, automatically reactivate returning users.

**Independent Test**:
1. Have user in users.json not in Tidig
2. Sync from Tidig
3. Verify user marked inactive, data preserved
4. Add user back to Tidig, sync again
5. Verify user reactivated, Tidig fields updated, local fields preserved

**Acceptance Criteria**:
- ✅ Local-only users marked as inactive
- ✅ Inactive users preserved with all data intact
- ✅ Discrepancies logged for administrator review
- ✅ Inactive users can be filtered in UI
- ✅ Returning users automatically reactivated
- ✅ Reactivated users: Tidig fields updated, local preserved

**Tasks**:

- [X] T044 [P] [US4] Add status field to User type ('active' | 'inactive' | 'on-leave') in backend/src/types/user.types.ts
- [X] T045 [P] [US4] Add syncStatus metadata to User type in backend/src/types/user.types.ts
- [X] T046 [US4] Implement detectInactiveUsers() to find local users not in Tidig in backend/src/services/sync.service.ts
- [X] T047 [US4] Implement markUserInactive() to set status='inactive' in backend/src/services/sync.service.ts
- [X] T048 [US4] Update performSync() to detect and mark inactive users after processing Tidig data in backend/src/services/sync.service.ts
- [X] T049 [US4] Add usersInactivated counter to sync log in backend/src/services/sync.service.ts
- [X] T050 [US4] Log list of inactivated users (employeeID, name) with warning in backend/src/services/sync.service.ts
- [X] T051 [US4] Implement detectReactivations() to find inactive users that returned to Tidig in backend/src/services/sync.service.ts
- [X] T052 [US4] Implement reactivateUser() to set status='active' and update syncStatus.wasInactive in backend/src/services/sync.service.ts
- [X] T053 [US4] Update performSync() to check for reactivations before marking new inactives in backend/src/services/sync.service.ts
- [X] T054 [US4] Add usersReactivated counter to sync log in backend/src/services/sync.service.ts
- [X] T055 [P] [US4] Add status query parameter to GET /api/users endpoint in backend/src/routes/users.routes.ts
- [X] T056 [P] [US4] Implement status filtering logic in backend/src/services/user.service.ts
- [X] T057 [US4] Test inactive marking: local user not in Tidig → sync → verify status='inactive'
- [X] T058 [US4] Test data preservation: inactive user retains all fields (salary, bio, etc.)
- [X] T059 [US4] Test reactivation: inactive user returns to Tidig → sync → verify status='active' + wasInactive flag
- [X] T060 [US4] Test reactivation merge: verify Tidig fields updated, local fields preserved during reactivation

**Parallel Work Opportunities**:
- T044-T045 (type updates) can be done first
- T055-T056 (filtering endpoint) can be built in parallel to inactive logic (T046-T054)
- T057-T060 (testing) can be prepared in parallel

---

## Phase 7: Polish & Cross-Cutting Concerns

**Goal**: Add monitoring, status reporting, and frontend integration for complete user experience

**Tasks**:

- [X] T061 [P] Create sync controller at backend/src/controllers/sync.controller.ts with getStatus() handler
- [X] T062 [P] Create sync routes at backend/src/routes/sync.routes.ts with GET /api/sync/status endpoint
- [X] T063 Register sync routes in backend/src/server.ts (app.use('/api/sync', syncRoutes))
- [X] T064 [P] Implement in-memory sync status tracking in backend/src/services/sync.service.ts
- [X] T065 [P] Update performSync() to update status tracking (idle → syncing → success/failed) in backend/src/services/sync.service.ts
- [X] T066 [P] Create sync status API response type in backend/src/types/sync.types.ts
- [X] T067 [P] Create sync service client at frontend/src/services/syncService.ts with fetchSyncStatus()
- [X] T068 [P] Create sync types at frontend/src/types/sync.ts matching backend response
- [X] T069 [P] Create SyncIndicator component at frontend/src/components/sync/SyncIndicator.tsx
- [X] T070 [P] Create SyncStatus component at frontend/src/components/sync/SyncStatus.tsx with detailed sync info
- [X] T071 Add SyncIndicator to Navbar in frontend/src/components/layout/Navbar.tsx
- [X] T072 [P] Implement sync status polling (every 30 seconds) in frontend/src/components/sync/SyncIndicator.tsx
- [X] T073 [P] Add error notification display (toast/alert) when sync fails in frontend/src/components/sync/SyncIndicator.tsx
- [X] T074 [P] Add sync logs endpoint GET /api/sync/logs in backend/src/routes/sync.routes.ts (optional enhancement)
- [X] T075 Test end-to-end: start app → sync runs → frontend shows status → simulate failure → verify notification

---

## Dependency Graph

**User Story Completion Order**:

```
Phase 1 (Setup) → Phase 2 (Foundation) → Phase 3 (US1 - MVP)
                                              ↓
                                         Phase 4 (US2)
                                              ↓
                                         Phase 5 (US3)
                                              ↓
                                         Phase 6 (US4)
                                              ↓
                                         Phase 7 (Polish)
```

**Dependencies**:
- **Phase 2 blocks all**: Must complete foundational infrastructure before any user story
- **US1 blocks US2**: Must have basic sync before detecting new users
- **US2 blocks US3**: Must have user addition before implementing merge logic
- **US3 blocks US4**: Must have merge logic before handling status transitions
- **US1-4 block Phase 7**: Polish requires core sync functionality complete

**Independent Work**:
- Within Phase 1: All setup tasks are independent
- Within Phase 2: Types (T009-T010) independent from client (T011-T013)
- Within Phase 7: Frontend components (T067-T073) parallel to backend endpoints (T061-T066)

---

## Parallel Execution Examples

### Phase 3 (US1) Parallelization

**Parallel Stream A**: Tidig Service
- T015: Implement fetchEmployees()
- T016: Add validation
- T017: Error handling

**Parallel Stream B**: Sync Service
- T018: Create sync.service.ts
- T019: Basic sync flow
- T020: Locking
- T021: Logging

**Sequential**: T022-T024 (server integration) requires both A+B complete

### Phase 5 (US3) Parallelization

**Parallel Stream A**: Merge Logic
- T034: Create user-merge.service.ts
- T035-T037: Implement merge

**Parallel Stream B**: Atomic Writes
- T040: Write-and-rename pattern
- T041: Error handling

**Sequential**: T038-T039 (integration) requires both A+B complete

### Phase 7 Parallelization

**Parallel Stream A**: Backend
- T061: Sync controller
- T062: Sync routes
- T064-T066: Status tracking

**Parallel Stream B**: Frontend
- T067-T068: Sync service + types
- T069-T070: Components
- T072-T073: Polling + notifications

**Sequential**: T071 (Navbar integration) and T075 (E2E test) require both A+B complete

---

## Testing Strategy

### Manual Testing Workflow

**US1 Testing**:
1. Delete backend/src/data/users.json
2. Start backend: `cd backend && npm run dev`
3. Verify users.json created and populated
4. Check console for sync logs

**US2 Testing**:
1. Add new user to Tidig system (or mock in test)
2. Restart backend
3. Verify new user in users.json with null local fields
4. Check logs for "Added new users: [employeeID]"

**US3 Testing**:
1. Edit users.json: set salary, department for existing user
2. Update user in Tidig (change name/email)
3. Restart backend (triggers sync)
4. Verify salary/department unchanged, name/email updated

**US4 Testing**:
1. Add user to users.json not in Tidig
2. Restart backend
3. Verify user status='inactive', data preserved
4. Check logs for inactive warning
5. Add user back to Tidig, restart
6. Verify status='active', wasInactive=true

### Automated Testing (Optional)

If implementing automated tests:

**Unit Tests**:
- `backend/tests/unit/user-merge.service.test.ts`: Test merge logic with various scenarios
- `backend/tests/unit/sync-utils.test.ts`: Test comparison, detection functions

**Integration Tests**:
- `backend/tests/integration/tidig-sync.test.ts`: Test full sync with mocked Tidig API
- Mock Tidig responses with MSW or nock
- Test all user stories end-to-end

---

## Validation Checklist

Before considering the feature complete, verify:

### User Story 1 (MVP)
- [ ] Application starts within 10 seconds with sync
- [ ] users.json populated from Tidig on empty start
- [ ] 5-second timeout enforced
- [ ] App continues on sync failure
- [ ] Sync failure displayed to admin

### User Story 2
- [ ] New Tidig users added automatically
- [ ] Local fields null/empty for new users
- [ ] Multiple new users handled in single sync
- [ ] Added users logged

### User Story 3
- [ ] Salary preserved during sync
- [ ] Tidig fields updated from API
- [ ] No data loss for any field
- [ ] Atomic file writes prevent corruption

### User Story 4
- [ ] Local-only users marked inactive
- [ ] Inactive users preserved with full data
- [ ] Inactive users filterable in UI
- [ ] Returning users automatically reactivated
- [ ] Reactivation preserves local properties
- [ ] Discrepancies logged

### Polish
- [ ] GET /api/sync/status endpoint functional
- [ ] Frontend displays sync status
- [ ] Sync failure notifications shown
- [ ] Logs accessible for troubleshooting

---

## Implementation Notes

### MVP Scope

**Recommended MVP** (1 day):
- Phase 1: Setup
- Phase 2: Foundation
- Phase 3: User Story 1 (Automatic sync on startup)
- Phase 7: Minimal polish (basic status endpoint + console logging)

**Estimated Time**: 6-8 hours

This delivers immediate value: automatic user sync eliminates manual list maintenance.

### Full Feature Scope

**Complete Implementation** (1.5-2 days):
- All phases (1-7)
- All user stories (US1-US4)
- Frontend status display
- Full logging and monitoring

**Estimated Time**: 11-16 hours

### Task Estimation

- **Phase 1 (Setup)**: 0.5 hours
- **Phase 2 (Foundation)**: 1.5 hours
- **Phase 3 (US1 - MVP)**: 2.5-3 hours
- **Phase 4 (US2)**: 1.5 hours
- **Phase 5 (US3)**: 2-2.5 hours
- **Phase 6 (US4)**: 2.5-3 hours
- **Phase 7 (Polish)**: 1.5-2 hours

**Total**: 11-16 hours

---

## Success Criteria Mapping

| Success Criterion | Phase | Tasks |
|-------------------|-------|-------|
| SC-001: Startup <10s | Phase 3 | T015-T026 |
| SC-002: Zero manual adds | Phase 4 | T027-T033 |
| SC-003: Local properties preserved | Phase 5 | T034-T043 |
| SC-004: 99.9% data accuracy | Phase 3-5 | T015-T043 |
| SC-005: Functional during outage | Phase 3 | T023-T024 |
| SC-006: Status visibility <30s | Phase 7 | T061-T073 |
| SC-007: New users <5min | Phase 4 | T027-T033 |
| SC-008: Zero data loss | Phase 5 | T034-T043 |

---

## Next Steps

1. **Review this task breakdown** with the team
2. **Start with Phase 1** (setup) to configure environment
3. **Complete Phase 2** (foundation) to build core infrastructure
4. **Implement MVP** (Phase 3) for immediate value
5. **Iterate through Phase 4-7** based on priority and capacity

**Questions?** Refer to:
- [spec.md](spec.md) for requirements and acceptance criteria
- [plan.md](plan.md) for architecture and file structure
- [research.md](research.md) for technical decisions
- [quickstart.md](quickstart.md) for code examples and setup