# Implementation Plan: Dark Mode UI Layout with Two-Column Design

**Branch**: `001-dark-ui-layout` | **Date**: February 9, 2026 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-dark-ui-layout/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Create a dark-themed user interface with a two-column layout and top navigation bar. The interface will use a vibrant orange color as the accent for interactive elements, implement responsive design patterns for mobile and desktop viewports, and ensure WCAG AA accessibility standards are met. Technical approach will utilize Tailwind CSS for styling and responsive utilities within the existing React + TypeScript + Vite application.

## Technical Context

**Language/Version**: TypeScript 5.9.3, React 19.2.0  
**Primary Dependencies**: React 19.2.0, React-DOM 19.2.0, Vite 7.2.4, Tailwind CSS (to be installed)  
**Storage**: N/A (purely presentational UI layer)  
**Testing**: Vitest (to be installed) + React Testing Library for component tests, Playwright or Cypress for E2E visual testing (to be determined)  
**Target Platform**: Web browsers (Chrome, Firefox, Safari, Edge - latest 2 versions), responsive across 320px-2560px viewports  
**Project Type**: Single-page web application (React SPA)  
**Performance Goals**: Initial page load <2s on 5 Mbps connection, First Contentful Paint <1.5s, Time to Interactive <3s  
**Constraints**: WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text), responsive breakpoint at 768px, minimum 16px column spacing  
**Scale/Scope**: Single feature affecting main layout structure, ~5-8 new React components, Tailwind configuration with custom colors

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ PASS (No constitution violations detected)

### Initial Evaluation (Before Phase 0)

Since the project constitution file contains only template placeholders without specific rules, the following general software engineering principles are evaluated:

- ✅ **Component Reusability**: Layout components (Navbar, TwoColumnLayout) will be designed as reusable, independently testable React components
- ✅ **Styling Standards**: Tailwind CSS utility-first approach maintains consistent styling patterns across the project
- ✅ **Accessibility**: WCAG AA standards explicitly required in functional requirements (FR-005)
- ✅ **Responsive Design**: Mobile-first approach with defined breakpoints aligns with modern web standards
- ✅ **Testing**: Component and visual regression testing planned to ensure layout integrity
- ✅ **Simplicity**: Pure presentational feature, no complex state management or business logic required

### Re-evaluation After Phase 1 Design

**Status**: ✅ PASS - All principles maintained

Post-design review confirms:

- ✅ **Component Architecture**: Four main components (Navbar, TwoColumnLayout, Column, Button) follow single-responsibility principle
- ✅ **Type Safety**: Comprehensive TypeScript interfaces defined in contracts documentation
- ✅ **Testing Strategy**: Vitest + RTL for unit tests, Playwright for E2E, clear test coverage plan
- ✅ **Accessibility**: Focus states, ARIA labels, keyboard navigation, and contrast ratios all addressed in design
- ✅ **Performance**: Leverages Vite's built-in optimizations, Tailwind tree-shaking, no custom build complexity
- ✅ **Documentation**: Complete quickstart guide, data model, and contracts documentation provided

**Conclusion**: Feature design adheres to all applicable engineering principles. Ready to proceed to Phase 2 (implementation tasks).

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx              # Top navigation bar component
│   │   ├── TwoColumnLayout.tsx     # Main two-column layout wrapper
│   │   └── Column.tsx              # Individual column component
│   ├── ConsultantCard/             # Existing
│   └── ConsultantList/             # Existing
├── styles/
│   └── theme.ts                    # Tailwind theme configuration (colors, etc.)
├── App.tsx                         # Updated to use new layout
├── main.tsx                        # Existing entry point
└── index.css                       # Tailwind directives

tests/
├── components/
│   └── layout/
│       ├── Navbar.test.tsx
│       ├── TwoColumnLayout.test.tsx
│       └── Column.test.tsx
└── e2e/
    └── layout.spec.ts              # Visual and responsive tests

tailwind.config.js                  # Tailwind configuration (NEW)
postcss.config.js                   # PostCSS configuration (NEW)
```

**Structure Decision**: Single project structure (React SPA). Since this is a pure frontend feature, all code resides in `src/` with layout components organized under `src/components/layout/`. Testing follows the same structure under `tests/`. Tailwind configuration files are added to the project root per Tailwind CSS conventions.

## Complexity Tracking

**Status**: N/A - No constitution violations requiring justification

This feature introduces standard React component patterns and Tailwind CSS utility classes. No architectural complexity or deviations from best practices are required.
