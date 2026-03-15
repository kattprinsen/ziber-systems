# Implementation Plan: Tidig home page employees and monthly performance

**Branch**: `[001-tidig-home-employees]` | **Date**: 2026-03-15 | **Spec**: [specs/001-tidig-home-employees/spec.md](specs/001-tidig-home-employees/spec.md)
**Input**: Feature specification from `/specs/001-tidig-home-employees/spec.md`

**Note**: This plan is produced by the `/speckit.plan` workflow for the Tidig home page employees and monthly performance feature.

## Summary

This feature refines the home page so that employees are sourced consistently from the external Tidig employee subtree while monthly hours and monetary performance (SEK) are maintained locally.

At a high level, the approach is to:
- Reuse the existing Tidig integration to fetch the configured SBQ employee subtree and derive the home page employee list from SBQ’s direct children, excluding structural nodes that have children.
- Extend the existing internal user data structure to include per-employee monthly hours for the current calendar month, maintained manually in the same file and configuration pathway.
- Update the group performance calculation to combine the Tidig-derived employee set and local monthly hours, presenting both total hours and SEK for the current month without introducing new configuration files or environment keys.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.9 for the React/Vite frontend and Node.js 20 LTS for tooling and backend services.  
**Primary Dependencies**: Frontend: React 19, React Router 7, Vite 7, Recharts for charting. Backend: Express, axios for Tidig API calls, dotenv, zod, fs-extra. No new external services or npm packages are planned for this feature.  
**Storage**: File-based internal data in the existing backend `data/users.json` file (git-ignored) for real user data; no database tables or new storage mechanisms are introduced.  
**Testing**: Vitest test suites in both frontend and backend, plus existing React Testing Library tests where relevant. Group performance and filtering changes will be validated using unit tests for transformation utilities and component-level tests for the dashboard.  
**Target Platform**: Browser-based React frontend served by the existing Vite build, backed by the current Node/Express API that already integrates with Tidig. 
**Project Type**: Web application with a React/Vite frontend under `src/` and a Node/Express backend under `backend/`.  
**Performance Goals**: Home page employee and group performance calculations should complete within a single render cycle on typical devices; deriving employees from the Tidig subtree and aggregating monthly hours for the current month should not introduce noticeable latency beyond existing dashboard rendering.  
**Constraints**: No new configuration files or environment variables; all behavior must be driven by existing Tidig configuration and the extended `users.json` structure. Sensitive, real user data remains confined to `backend/src/data/users.json` and is never logged inappropriately.  
**Scale/Scope**: Intended for an internal dashboard with a limited number of SBQ employees; the Tidig subtree size is expected to be manageable enough for in-memory processing in frontend or backend without special scaling measures.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

<!--
  ACTION REQUIRED: Validate this feature against all constitutional principles.
  Mark each gate as ✅ PASS, ⚠️ REVIEW (needs justification), or ❌ FAIL (blocks feature).
  See `.specify/memory/constitution.md` for full principle definitions.
-->

| Principle | Gate | Status | Notes |
|-----------|------|--------|-------|
| **I: Documentation Privacy** | No real business/customer names in specs, code, or mock data | ✅ | This feature works with real employee data only in `backend/src/data/users.json`, which is git-ignored; all other documentation and code paths use generic terms and aliases. |
| **II: Spec-Driven Development** | Complete spec.md approved before implementation | ✅ | Specification [specs/001-tidig-home-employees/spec.md](specs/001-tidig-home-employees/spec.md) defines user stories, requirements, and success criteria before implementation begins. |
| **III: No Accidental Dependencies** | New packages justified; prefer existing dependencies | ✅ | Plan reuses existing Tidig integration, React/Recharts components, and user data file; no new npm dependencies are required. Any future additions will be explicitly justified here. |
| **IV: Frontend Data Derivation** | Calculations on frontend unless performance requires backend | ✅ | Group performance aggregation for the current month is derived from existing API responses and user data; no new backend aggregation endpoints are introduced. |
| **V: Sensitive Data Handling** | No customer data in logs/errors; use redaction patterns | ✅ | Real employee data remains in `backend/src/data/users.json` and is not logged. Any additional logging added for this feature will use generic messages and avoid names, financial figures, or other sensitive fields. |

**Post-Design Re-check**: _(Filled after Phase 1: data-model.md, contracts/, quickstart.md)_
- **Changes**: Design keeps all real user data in the existing `users.json` file and avoids introducing new configuration surfaces; calculations for group performance remain on the frontend using derived data.
- **New Risks**: No new constitutional risks identified beyond existing use of real data in `users.json`, which remains git-ignored and is handled carefully.

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
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
ziber-systems/
├── src/                         # React/Vite frontend
│   ├── components/
│   │   └── dashboard/           # Home/dashboard components including group performance
│   ├── pages/
│   ├── services/
│   └── utils/
├── backend/                     # Node/Express backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── data/
│   │   └── users.json           # (deprecated path, kept for backwards-compat examples only)
│   └── tests/
├── specs/
│   └── 001-tidig-home-employees/
│       ├── spec.md
│       ├── plan.md
│       ├── research.md          # Phase 0 output
│       ├── data-model.md        # Phase 1 output
│       ├── quickstart.md        # Phase 1 output
│       └── contracts/           # Phase 1 output
└── tests/
  └── components/              # Frontend component tests for dashboard
```

**Structure Decision**: The project is a web application with a React/Vite frontend under `src/` and a Node/Express backend under `backend/`. This feature lives mainly in dashboard components (for rendering) and the existing `backend/src` Tidig integration and `backend/src/data/users.json` file for data; no additional apps or packages are introduced.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
