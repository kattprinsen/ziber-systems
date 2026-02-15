---

description: "Task list for Money Slider Tool implementation"
---

# Tasks: Money Slider Tool

**Feature**: Money Slider Tool  
**Branch**: 002-money-slider-tool  
**Input**: Design documents from `/specs/002-money-slider-tool/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Tests are OPTIONAL for this feature. Tasks focus on implementation. Tests can be added later if needed.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/` (as shown in plan.md)
- Tasks use absolute paths from repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization for Money Slider feature

- [X] T001 Create directory structure for Money Slider components at src/components/tools/MoneySlider/
- [X] T002 Create directory structure for salary types at src/types/
- [X] T003 Create directory structure for calculator service at src/services/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core type definitions and utilities that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 [P] Update User interface in src/types/user.ts to add currentSalary and salaryHistory fields
- [X] T005 [P] Update User interface in backend/src/types/user.types.ts to add currentSalary and salaryHistory fields
- [X] T006 [P] Create SalaryHistoryEntry interface in src/types/user.ts
- [X] T007 [P] Create SalaryHistoryEntry interface in backend/src/types/user.types.ts
- [X] T008 [P] Create new salary types file src/types/salary.ts with SalaryCalculation, SalaryValidationResult, and format option interfaces
- [X] T009 [P] Add sample salary data to 2-3 test users in backend/src/data/users.json
- [X] T010 Create salary calculator utility in src/services/salaryCalculator.ts with calculateSalaryPercentage and validateSalaryInput functions
- [X] T011 Create formatters utility in src/utils/formatters.ts with formatCurrency and formatPercentage functions
- [X] T012 Update constants file src/utils/constants.ts to add SALARY_CONSTANTS and error messages

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Calculate Salary Increase Percentage (Priority: P1) 🎯 MVP

**Goal**: Enable managers to select an employee, enter a proposed salary, and see the calculated percentage change in real-time.

**Independent Test**: Select any employee with salary data, enter various proposed salary values (higher, lower, equal), and verify percentage displays with correct sign and 2 decimal precision.

### Implementation for User Story 1

- [X] T013 [P] [US1] Create EmployeeSelector component in src/components/tools/MoneySlider/EmployeeSelector.tsx
- [X] T014 [P] [US1] Create SalaryInput component in src/components/tools/MoneySlider/SalaryInput.tsx
- [X] T015 [P] [US1] Create PercentageDisplay component in src/components/tools/MoneySlider/PercentageDisplay.tsx
- [X] T016 [US1] Create main MoneySlider container component in src/components/tools/MoneySlider/MoneySlider.tsx integrating selector, input, and display
- [X] T017 [US1] Create barrel export file src/components/tools/MoneySlider/index.ts
- [X] T018 [US1] Update ToolsPage component in src/pages/ToolsPage/ToolsPage.tsx to add Money Slider tool card with link
- [X] T019 [US1] Add route for Money Slider tool in src/App.tsx (or router config) at /tools/money-slider
- [X] T020 [US1] Test end-to-end flow: navigate to Tools page, click Money Slider, select employee, enter salary, verify percentage calculation

**Checkpoint**: At this point, User Story 1 should be fully functional - users can calculate salary percentages in real-time. This is the MVP.

---

## Phase 4: User Story 2 - Visual Salary Comparison Slider (Priority: P2)

**Goal**: Add visual representation of salary comparison with graphical slider showing current/proposed positions and percentage change.

**Independent Test**: Enter various salary amounts in the working Money Slider tool and verify the visual slider accurately shows current position, proposed position, fill color, and adapts scale appropriately.

### Implementation for User Story 2

- [X] T021 [US2] Create VisualSlider component in src/components/tools/MoneySlider/VisualSlider.tsx with container, markers, and fill section
- [X] T022 [US2] Implement visual positioning logic to calculate marker positions based on percentage change
- [X] T023 [US2] Add color-coding logic: orange/green for increases, red for decreases
- [X] T024 [US2] Implement adaptive scale logic for small (<5%), medium (5-20%), and large (>20%) percentage changes
- [X] T025 [US2] Add VisualSlider component to main MoneySlider component in src/components/tools/MoneySlider/MoneySlider.tsx
- [X] T026 [US2] Update VisualSlider export in src/components/tools/MoneySlider/index.ts
- [X] T027 [US2] Test visual slider with various percentage ranges: positive, negative, zero, small, large changes

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - users get visual feedback along with numerical percentage.

---

## Phase 5: User Story 3 - Track Yearly Salary Updates (Priority: P3)

**Goal**: Enable salary updates to persist in user profiles with history tracking, so updated salaries become the new baseline for future calculations.

**Independent Test**: Update an employee's salary via the backend API, verify it persists in users.json, verify history entry is created, and confirm Money Slider uses new value for calculations.

### Implementation for User Story 3

- [ ] T028 [P] [US3] Add UpdateSalaryRequest interface in backend/src/types/user.types.ts
- [ ] T029 [P] [US3] Update ApiResponse interface in both src/types/user.ts and backend/src/types/user.types.ts to include details field
- [ ] T030 [US3] Create updateSalary method in backend/src/services/user.service.ts to handle salary updates and history creation
- [ ] T031 [US3] Add updateUserSalary controller function in backend/src/controllers/user.controller.ts with validation
- [ ] T032 [US3] Add PUT /api/users/:id/salary route in backend/src/routes/users.routes.ts
- [ ] T033 [US3] Create updateUserSalary function in src/services/userService.ts for frontend API calls
- [ ] T034 [US3] Test backend endpoint with Postman or curl: update salary, verify response, check users.json file
- [ ] T035 [US3] Test full flow: update salary via API, reload Money Slider, verify new salary is current baseline

**Checkpoint**: All user stories should now be independently functional. Salary data persists across sessions.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements, error handling, and validation

- [X] T036 [P] Add comprehensive error handling for failed user fetch in MoneySlider component
- [X] T037 [P] Add error handling for employees without salary data in MoneySlider component
- [X] T038 [P] Enhance input validation messages in SalaryInput component for better UX
- [X] T039 [P] Add loading states and spinners in MoneySlider component
- [X] T040 [P] Add ARIA labels and accessibility attributes to all Money Slider components
- [ ] T041 [P] Verify dark theme compatibility with existing 001-dark-ui-layout feature
- [ ] T042 Test all edge cases from spec.md: non-numeric input, negative values, zero values, empty input, no salary data
- [ ] T043 Run through quickstart.md validation scenarios to ensure all steps work
- [ ] T044 Update README.md with Money Slider tool documentation (if applicable)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after User Story 1 (T016-T020) - Extends the working tool with visual component
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Independently adds backend persistence, though works best after US1 is complete for testing

### Within Each User Story

**User Story 1**:
- T013, T014, T015 can run in parallel (different components)
- T016 depends on T013, T014, T015 (integrates them)
- T017-T019 depend on T016
- T020 is validation

**User Story 2**:
- T021-T024 can be done together (single component with different aspects)
- T025 depends on T021 (integration)
- T026-T027 are finalization

**User Story 3**:
- T028, T029 can run in parallel (type definitions)
- T030-T032 are sequential backend work
- T033 is frontend work (can parallel with T030-T032 if backend contract is clear)
- T034-T035 are validation

### Parallel Opportunities

**Foundational Phase (T004-T012)**:
- T004-T009 can ALL run in parallel (different files)
- T010-T012 can run in parallel (different utility files)

**User Story 1 (T013-T015)**:
```bash
# These three components can be built simultaneously:
T013: "Create EmployeeSelector component in src/components/tools/MoneySlider/EmployeeSelector.tsx"
T014: "Create SalaryInput component in src/components/tools/MoneySlider/SalaryInput.tsx"
T015: "Create PercentageDisplay component in src/components/tools/MoneySlider/PercentageDisplay.tsx"
```

**User Story 3 (T028-T029)**:
```bash
# Type definitions can be done in parallel:
T028: "Add UpdateSalaryRequest interface in backend/src/types/user.types.ts"
T029: "Update ApiResponse interface in both type files"
```

**Polish Phase (T036-T041)**:
```bash
# All polish tasks marked [P] can run in parallel:
T036: "Add error handling for failed user fetch"
T037: "Add error handling for employees without salary data"
T038: "Enhance input validation messages"
T039: "Add loading states and spinners"
T040: "Add ARIA labels and accessibility attributes"
T041: "Verify dark theme compatibility"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only) - Recommended Approach

1. **Complete Phase 1: Setup** (T001-T003) - ~15 minutes
2. **Complete Phase 2: Foundational** (T004-T012) - ~2 hours
   - CRITICAL: Must finish before starting US1
3. **Complete Phase 3: User Story 1** (T013-T020) - ~3-4 hours
4. **STOP and VALIDATE**: Test User Story 1 independently
   - Can users select employees?
   - Does percentage calculate correctly?
   - Does real-time update work?
5. **Deploy/demo if ready** - You now have a functional MVP!

**Time Estimate for MVP**: 5-7 hours total

### Incremental Delivery

1. **Foundation** (Phases 1-2) → Foundation ready
2. **Add User Story 1** (Phase 3) → Test independently → **Deploy/Demo (MVP!)**
3. **Add User Story 2** (Phase 4) → Test independently → Deploy/Demo (enhanced UX)
4. **Add User Story 3** (Phase 5) → Test independently → Deploy/Demo (full persistence)
5. **Polish** (Phase 6) → Final refinements

Each story adds value without breaking previous stories.

### Parallel Team Strategy

With multiple developers:

1. **Team completes Setup + Foundational together** (T001-T012)
2. **Once Foundational is done:**
   - **Developer A**: User Story 1 (T013-T020) - MVP
   - **Developer B**: User Story 3 (T028-T035) - Backend persistence (can work in parallel if types are clear)
3. **After US1 complete:**
   - **Developer A or B**: User Story 2 (T021-T027) - Visual enhancement
4. **Team**: Polish phase (T036-T044) - everyone can take tasks

---

## Task Count Summary

- **Phase 1 (Setup)**: 3 tasks
- **Phase 2 (Foundational)**: 9 tasks - BLOCKS everything
- **Phase 3 (User Story 1 - P1 MVP)**: 8 tasks
- **Phase 4 (User Story 2 - P2)**: 7 tasks
- **Phase 5 (User Story 3 - P3)**: 8 tasks
- **Phase 6 (Polish)**: 9 tasks

**Total**: 44 tasks

**Parallel Opportunities**: 
- Phase 2: Up to 9 tasks can run in parallel
- User Story 1: Up to 3 tasks can run in parallel (T013-T015)
- Polish: Up to 6 tasks can run in parallel (T036-T041)

**MVP Delivery** (P1 only): T001-T020 = 20 tasks (~5-7 hours)

---

## Notes

- **[P] tasks** = different files, no dependencies, can run in parallel
- **[Story] label** maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group of related tasks
- Stop at any checkpoint to validate story independently
- **MVP Strategy**: Complete through Phase 3 (T001-T020) for a fully functional tool
- **Incremental Value**: Each phase adds standalone value that can be demoed

---

## Suggested MVP Scope

For fastest time to value, implement **ONLY User Story 1 (P1)**:

✅ T001-T020: Setup + Foundational + User Story 1

This delivers:
- Employee selection
- Proposed salary input
- Real-time percentage calculation with 2 decimal precision
- Proper formatting and validation
- Integration with existing Tools page

**Defer for later:**
- ⏭️ User Story 2 (Visual slider) - Enhancement, not critical
- ⏭️ User Story 3 (Salary persistence) - Can update manually for now

**Estimated MVP Development Time**: 5-7 hours for a working tool
