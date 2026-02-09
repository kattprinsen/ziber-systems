---
description: "Implementation tasks for Dark Mode UI Layout with Two-Column Design"
---

# Tasks: Dark Mode UI Layout with Two-Column Design

**Input**: Design documents from `/specs/001-dark-ui-layout/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/component-interfaces.md

**Tests**: Test tasks are included as optional. Implement tests based on project needs and TDD preferences.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and configure Tailwind CSS

- [ ] T001 Install Tailwind CSS dependencies (tailwindcss@^3.4.0, postcss@^8.4.0, autoprefixer@^10.4.0)
- [ ] T002 Initialize Tailwind configuration with `npx tailwindcss init -p`
- [ ] T003 [P] Configure Tailwind content paths and custom theme colors in tailwind.config.js
- [ ] T004 [P] Add Tailwind directives to src/index.css
- [ ] T005 [P] Install testing dependencies (vitest, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, jsdom)
- [ ] T006 [P] Create vitest.config.ts with React plugin and jsdom environment
- [ ] T007 [P] Create tests/setup.ts with testing-library/jest-dom import

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create TypeScript type definitions that all components will use

**⚠️ CRITICAL**: No component implementation can begin until this phase is complete

- [ ] T008 Create src/types/layout.ts with all component interfaces (NavLink, NavbarProps, TwoColumnLayoutProps, ColumnProps, ButtonProps)
- [ ] T009 [P] Add type definitions for GapSize, ColumnRatio, SpacingSize, BackgroundColor, ButtonVariant, ButtonSize in src/types/layout.ts
- [ ] T010 [P] Create src/utils/constants.ts with color palette constants (THEME_COLORS, GAP_SIZE_CLASSES, COLUMN_RATIO_CLASSES, etc.)

**Checkpoint**: Foundation ready - component implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Dark-Themed Main Interface (Priority: P1) 🎯 MVP

**Goal**: Implement dark-themed interface with functional navigation bar, ensuring WCAG AA contrast standards

**Independent Test**: Load the application and verify dark theme is applied, navbar is visible with working links, and text is readable

### Tests for User Story 1 (OPTIONAL)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T011 [P] [US1] Create tests/components/layout/Navbar.test.tsx with test suite (renders links, mobile menu toggle, keyboard navigation)
- [ ] T012 [P] [US1] Create tests/components/layout/Button.test.tsx with test suite (renders variants, handles clicks, respects disabled state)

### Implementation for User Story 1

- [ ] T013 [P] [US1] Create src/components/layout/Navbar.tsx with responsive navigation component
- [ ] T014 [P] [US1] Create src/components/layout/Button.tsx with orange accent button component
- [ ] T015 [US1] Update src/App.tsx to use Navbar component with sample navigation links
- [ ] T016 [US1] Verify dark theme colors in browser (bg: #0f0f0f, surface: #1a1a1a, text contrast meets WCAG AA)
- [ ] T017 [US1] Test mobile menu functionality (open/close, navigation, keyboard access)
- [ ] T018 [US1] Verify orange accent colors on hover and focus states for all interactive elements

**Checkpoint**: At this point, User Story 1 should be fully functional - dark theme with working navbar

---

## Phase 4: User Story 2 - Navigate Between Two-Column Content Areas (Priority: P2)

**Goal**: Implement responsive two-column layout that stacks on mobile and displays side-by-side on desktop

**Independent Test**: Verify content is displayed in two columns on desktop (≥768px) and stacks vertically on mobile (<768px)

### Tests for User Story 2 (OPTIONAL)

- [ ] T019 [P] [US2] Create tests/components/layout/TwoColumnLayout.test.tsx with responsive behavior tests
- [ ] T020 [P] [US2] Create tests/components/layout/Column.test.tsx with styling and content tests

### Implementation for User Story 2

- [ ] T021 [P] [US2] Create src/components/layout/TwoColumnLayout.tsx with CSS Grid-based layout component
- [ ] T022 [P] [US2] Create src/components/layout/Column.tsx with dark theme styled column wrapper
- [ ] T023 [US2] Update src/App.tsx to use TwoColumnLayout with sample content in both columns
- [ ] T024 [US2] Test layout on desktop viewport (≥768px) - verify side-by-side columns with proper spacing
- [ ] T025 [US2] Test layout on mobile viewport (<768px) - verify columns stack vertically
- [ ] T026 [US2] Verify column spacing meets minimum 16px requirement (gap-4, gap-6, gap-8 options)
- [ ] T027 [US2] Test scrolling behavior in individual columns

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - dark theme with navbar and two-column layout

---

## Phase 5: User Story 3 - Consistent Orange Accent Experience (Priority: P3)

**Goal**: Apply orange accent colors consistently across all interactive elements (buttons, links, inputs, focus states)

**Independent Test**: Review all interactive elements and verify orange accent color (#FF6B35) is consistently applied

### Tests for User Story 3 (OPTIONAL)

- [ ] T028 [P] [US3] Create tests/e2e/accessibility.spec.ts with focus state and contrast ratio tests
- [ ] T029 [P] [US3] Add visual regression tests for hover and active states

### Implementation for User Story 3

- [ ] T030 [P] [US3] Add .focus-orange utility class to src/index.css for consistent focus states
- [ ] T031 [US3] Apply orange accent hover states to all Navbar links in src/components/layout/Navbar.tsx
- [ ] T032 [US3] Verify Button component uses orange accent for all variants (primary, secondary, ghost)
- [ ] T033 [US3] Add orange accent border/highlight to Column component when active or selected
- [ ] T034 [US3] Review all components for consistent orange accent application (links, buttons, inputs, focus rings)
- [ ] T035 [US3] Test keyboard navigation - verify orange focus ring appears on all focusable elements
- [ ] T036 [US3] Run contrast checker on orange accent against all background colors (verify WCAG AA compliance)

**Checkpoint**: All user stories should now be independently functional with consistent visual polish

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final validation

- [ ] T037 [P] Add loading states or skeleton screens for better perceived performance
- [ ] T038 [P] Add transitions/animations to mobile menu and hover states (respecting prefers-reduced-motion)
- [ ] T039 [P] Create src/components/layout/index.ts barrel export for all layout components
- [ ] T040 [P] Add JSDoc comments to all component interfaces in src/types/layout.ts
- [ ] T041 Optimize Tailwind bundle size - verify tree-shaking removes unused classes
- [ ] T042 Run Lighthouse audit - verify performance goals (load <2s, FCP <1.5s, TTI <3s)
- [ ] T043 Test on all target browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)
- [ ] T044 Run complete accessibility audit with axe DevTools or similar
- [ ] T045 Verify implementation against quickstart.md checklist
- [ ] T046 Update README.md with component usage examples

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion (T001-T007) - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion (T008-T010)
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1) - Dark Theme + Navbar**: Can start after Foundational (T008-T010) - No dependencies on other stories
- **User Story 2 (P2) - Two-Column Layout**: Can start after Foundational (T008-T010) - Independent of US1, but integrates with it in App.tsx
- **User Story 3 (P3) - Orange Accents**: Depends on US1 and US2 components existing, applies polish layer on top

### Within Each User Story

- Tests (if included) should be written and FAIL before implementation
- Component files (marked [P]) can be created in parallel
- App.tsx updates happen after components are created
- Manual testing/verification happens after implementation
- Story complete and tested before moving to next priority

### Parallel Opportunities

- **Setup Phase**: T003, T004, T005, T006, T007 can all run in parallel after T001-T002
- **Foundational Phase**: T009, T010 can run in parallel with T008
- **User Story 1**: T011-T012 (tests) in parallel, then T013-T014 (components) in parallel
- **User Story 2**: T019-T020 (tests) in parallel, then T021-T022 (components) in parallel
- **User Story 3**: T028-T029 (tests) in parallel, then T030-T032 (updates) can run in parallel
- **Polish Phase**: T037-T040, T042-T044 can run in parallel
- **Team Strategy**: Once Foundational completes, US1, US2, US3 can be worked on by different developers simultaneously

---

## Parallel Example: User Story 1

```bash
# Launch component creation in parallel:
Task T013: Create src/components/layout/Navbar.tsx
Task T014: Create src/components/layout/Button.tsx

# Then integrate sequentially:
Task T015: Update src/App.tsx
Task T016-T018: Manual verification steps
```

---

## Parallel Example: User Story 2

```bash
# Launch component creation in parallel:
Task T021: Create src/components/layout/TwoColumnLayout.tsx
Task T022: Create src/components/layout/Column.tsx

# Then integrate sequentially:
Task T023: Update src/App.tsx
Task T024-T027: Manual verification steps
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T007)
2. Complete Phase 2: Foundational (T008-T010) - CRITICAL
3. Complete Phase 3: User Story 1 (T011-T018)
4. **STOP and VALIDATE**: Test dark theme and navbar independently
5. Deploy/demo if ready - this is a usable MVP

### Incremental Delivery

1. Complete Setup + Foundational (T001-T010) → Foundation ready
2. Add User Story 1 (T011-T018) → Test independently → Deploy/Demo (MVP: Dark theme + navbar!)
3. Add User Story 2 (T019-T027) → Test independently → Deploy/Demo (MVP + two-column layout!)
4. Add User Story 3 (T028-T036) → Test independently → Deploy/Demo (Full feature with polish!)
5. Add Polish (T037-T046) → Final validation → Production ready

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T010)
2. Once Foundational is done (T010 complete):
   - Developer A: User Story 1 (T011-T018)
   - Developer B: User Story 2 (T019-T027)
   - Developer C: User Story 3 foundation work
3. Stories integrate in App.tsx without conflicts (different components)
4. Team completes Polish together (T037-T046)

---

## Notes

- **[P] tasks**: Different files, no dependencies, can run in parallel
- **[Story] labels**: Map task to specific user story (US1, US2, US3) for traceability
- **Each user story** should be independently completable and testable
- **Tests are optional**: Only implement if TDD approach desired or explicitly requested
- **File paths**: All use single project structure (src/, tests/)
- **Commit strategy**: Commit after each task or logical group (e.g., all components for a user story)
- **Validation checkpoints**: Stop at each checkpoint to verify story works independently
- **Tailwind classes**: Reference research.md for approved color palette and utility classes
- **Accessibility**: All manual tests should include keyboard navigation and contrast checking

---

## Total Task Count

- **Setup**: 7 tasks
- **Foundational**: 3 tasks (BLOCKING)
- **User Story 1 (P1)**: 8 tasks (2 optional tests + 6 implementation)
- **User Story 2 (P2)**: 9 tasks (2 optional tests + 7 implementation)
- **User Story 3 (P3)**: 9 tasks (2 optional tests + 7 implementation)
- **Polish**: 10 tasks
- **TOTAL**: 46 tasks

### Task Count by User Story

- **US1 (Dark Theme + Navbar)**: 8 tasks - MVP scope
- **US2 (Two-Column Layout)**: 9 tasks - Adds structure
- **US3 (Orange Accent Polish)**: 9 tasks - Visual consistency

### Parallel Opportunities Identified

- 5 tasks can run in parallel during Setup
- 2 tasks can run in parallel during Foundational
- 2-4 tasks can run in parallel within each user story (component creation)
- 6 tasks can run in parallel during Polish
- **All 3 user stories can be developed in parallel** after Foundational phase

### Suggested MVP Scope

**Minimum Viable Product**: **Phase 1 (Setup) + Phase 2 (Foundational) + Phase 3 (User Story 1)**

This delivers:
- ✅ Dark-themed interface with WCAG AA compliant colors
- ✅ Functional navigation bar (desktop + mobile)
- ✅ Orange accent on interactive elements
- ✅ Professional appearance
- ✅ Independently testable and deployable

Add User Story 2 and 3 as incremental enhancements.
