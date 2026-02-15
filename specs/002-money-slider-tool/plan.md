# Implementation Plan: Money Slider Tool

**Branch**: `002-money-slider-tool` | **Date**: February 13, 2026 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-money-slider-tool/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Create a Money Slider tool for salary discussions that enables managers to calculate percentage changes when proposing new salaries for employees. The tool will include an employee selector, input field for proposed salary, real-time percentage calculation with 2 decimal precision, and a visual slider representation. Technical approach will use React components within the existing React + TypeScript + Vite web application, add salary fields to user profiles in both frontend and backend, and integrate the tool into the existing Tools page.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.9.3 (frontend), TypeScript 5.3.3 (backend), React 19.2.0  
**Primary Dependencies**: React 19.2.0, React Router 7.13.0, Vite 7.2.4, TailwindCSS 3.4.19, Express 4.18.2  
**Storage**: JSON file-based storage (backend/src/data/users.json) - existing storage mechanism  
**Testing**: Vitest 4.0.18 + React Testing Library for frontend, backend testing framework TBD  
**Target Platform**: Web browsers (Chrome, Firefox, Safari, Edge - latest 2 versions), responsive design  
**Project Type**: Web application (separate frontend SPA and backend API)  
**Performance Goals**: Real-time calculation (<50ms response), smooth input handling (60 fps), tool accessible within 1s from Tools page  
**Constraints**: Calculation precision to 2 decimal places, must handle salary ranges $0-$10M without overflow, compatible with existing dark UI theme  
**Scale/Scope**: Single tool page, ~3-5 new React components, updates to existing User type/interface, ~15 functional requirements

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ PASS (No constitution violations detected)

### Initial Evaluation (Before Phase 0)

Since the project constitution file contains only template placeholders without specific rules, the following general software engineering principles are evaluated:

- ✅ **Component Reusability**: Money Slider components will be designed as reusable, independently testable React components
- ✅ **Data Consistency**: User salary data will be synchronized between frontend and backend type definitions
- ✅ **Type Safety**: TypeScript interfaces ensure compile-time type checking for salary calculations
- ✅ **Real-time UX**: React state management enables real-time calculation updates without performance concerns
- ✅ **Testing**: Component tests for calculation logic and UI interactions planned
- ✅ **Simplicity**: Straightforward feature extending existing user data model with salary information
- ✅ **Integration**: Uses existing Tools page routing, user service patterns, and styling conventions

### Re-evaluation After Phase 1 Design

**Status**: ✅ PASS - All principles maintained

Post-design review confirms:

- ✅ **Component Architecture**: Five main components (MoneySlider, EmployeeSelector, SalaryInput, PercentageDisplay, VisualSlider) follow single-responsibility principle
- ✅ **Type Safety**: Comprehensive TypeScript interfaces defined in contracts documentation, synchronized between frontend and backend
- ✅ **Pure Functions**: Calculation logic extracted to pure functions (`calculateSalaryPercentage`, `validateSalaryInput`) for testability
- ✅ **Testing Strategy**: Vitest + RTL for unit/component tests, clear test cases defined for edge cases
- ✅ **Data Model**: Optional salary fields maintain backward compatibility, no breaking changes to existing User type
- ✅ **Performance**: Client-side calculations ensure <50ms response time, no backend calls needed for calculation
- ✅ **Accessibility**: ARIA labels, semantic HTML, keyboard navigation, and screen reader support addressed in component contracts
- ✅ **Documentation**: Complete research, data model, API contracts, component interfaces, and quickstart guide provided

**Conclusion**: Feature design adheres to all applicable engineering principles. Ready to proceed to Phase 2 (task breakdown for implementation).

## Project Structure

### Documentation (this feature)

```text
specs/002-money-slider-tool/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── types/
│   │   └── user.types.ts         # UPDATE: Add salary, salaryHistory fields
│   ├── data/
│   │   └── users.json            # UPDATE: Add salary data to existing users
│   ├── services/
│   │   └── user.service.ts       # UPDATE: Add salary update methods
│   ├── controllers/
│   │   └── user.controller.ts    # UPDATE: Add endpoints for salary operations
│   └── routes/
│       └── users.routes.ts       # UPDATE: Add salary-related routes
└── tests/                        # NEW: Add tests for salary operations

frontend/src/
├── components/
│   └── tools/                        # NEW directory
│       ├── MoneySlider/              # NEW: Main tool component
│       │   ├── MoneySlider.tsx
│       │   ├── EmployeeSelector.tsx  # NEW: Dropdown for selecting employee
│       │   ├── SalaryInput.tsx       # NEW: Input field for proposed salary
│       │   ├── PercentageDisplay.tsx # NEW: Display calculated percentage
│       │   ├── VisualSlider.tsx      # NEW: Visual representation
│       │   └── index.ts
├── pages/
│   └── ToolsPage/
│       └── ToolsPage.tsx         # UPDATE: Add MoneySlider integration
├── services/
│   ├── userService.ts            # UPDATE: Add salary-related API calls
│   └── salaryCalculator.ts       # NEW: Pure calculation logic
├── types/
│   └── user.ts                   # UPDATE: Add salary, salaryHistory fields
└── utils/
    └── formatters.ts             # NEW/UPDATE: Currency and percentage formatters

tests/
├── components/
│   └── tools/
│       └── MoneySlider/          # NEW: Component tests
│           ├── MoneySlider.test.tsx
│           ├── SalaryInput.test.tsx
│           └── PercentageDisplay.test.tsx
└── services/
    └── salaryCalculator.test.ts  # NEW: Calculation logic tests
```

**Structure Decision**: Web application structure with separate frontend and backend. The Money Slider tool components are organized under `src/components/tools/MoneySlider/` in the frontend, following the existing pattern where features are grouped by functionality. Backend changes extend the existing user service layer to add salary management capabilities. Calculation logic is extracted to a pure function for testability.

## Complexity Tracking

**Status**: N/A - No constitution violations requiring justification

This feature extends the existing user data model with salary information and introduces standard React component patterns for the Money Slider tool. No architectural complexity or deviations from established project patterns are required. The feature follows existing conventions:

- Uses file-based JSON storage consistent with current backend approach
- Follows established component organization patterns (feature-based directories)
- Leverages existing service layer architecture
- Maintains type consistency between frontend and backend
- Real-time calculation uses standard React state management
