# Implementation Plan: Tidig Time Interval Integration

**Branch**: `004-tidig-time-entries` | **Date**: February 24, 2026 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-tidig-time-entries/spec.md`

**Note**: Generated via `/speckit.plan` for implementation planning.

## Summary

Integrate Tidig's `/Api/Time` endpoint into the existing Tidig user sync system so that, from the user detail view, a user (or manager) can:
- Fetch Tidig time entries for a given date interval using `empId`, `fromDate`, and `toDate`.
- Filter those entries by customer and project parameters.
- See both the raw entries and summarized totals (per customer and project).

The backend will add a Tidig time client and an API surface for time queries, reusing the existing Tidig HTTP client and validation patterns. The frontend will extend the `UserDetailPage` to display and filter time entries for the selected user.

## Technical Context

**Language/Version**: 
- Backend: TypeScript (Node.js/Express) – same stack as existing Tidig sync backend.  
- Frontend: TypeScript + React (Vite) – same stack as existing UI.

**Primary Dependencies**: 
- Backend: `axios`, `dotenv`, `fs-extra`, `zod`, `express` (already in use for Tidig user sync and logging).
- Frontend: React, existing `apiClient` wrapper in `src/services/api.ts` and routing/components in `src/pages` and `src/components`.

**Storage**: 
- No persistent storage for time entries; data comes directly from Tidig on request.
- Existing `backend/src/data/users.json` remains the source for user records and their `employeeID`/`empId` mapping.

**Testing**: 
- Backend: Vitest (already configured in `backend/vitest.config.ts`) for unit tests of the Tidig time client and service.
- Frontend: Existing test setup in `tests/setup.ts` with optional component tests for the new time section.

**Target Platform**: 
- Backend: Node.js service running on the same environment as the existing sync server.
- Frontend: Web (Vite dev/build pipeline targeting modern browsers).

**Project Type**: Web application with separate backend (`backend/`) and frontend (`src/`).

**Performance Goals**: 
- Time queries for typical intervals (≤ 1 month) should return and render in under 3 seconds (aligned with SC-001).
- Avoid blocking the main user detail page while time data is loading or when Tidig is unavailable.

**Constraints**: 
- Must respect Tidig rate limits and permissions; no bulk harvesting of time for all users at once.
- API should be scoped to per-user + interval queries, not long-running reports.

**Scale/Scope**: 
- Intended for internal usage within the same user base as the Tidig sync feature (tens to low hundreds of users), with on-demand time lookups from user detail views.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Given the generic constitution template, we apply conservative gates:

- **Library-First / Separation**: Reuse existing Tidig client and sync/service patterns; introduce a focused "time" service module rather than scattering Tidig time calls across controllers.
- **Simplicity**: Avoid introducing new infrastructure (no new databases or queues). Time data is fetched on demand from Tidig with minimal caching (if any).
- **Testability**: Time client and service should be testable with mocked HTTP calls to Tidig.

**Gate Status (pre-design)**:
- No constitution violations identified that require complexity tracking.
- Proceed to Phase 0 research and Phase 1 design using existing backend/frontend structures.

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
backend/
├── src/
│   ├── controllers/        # Existing controllers + new time controller
│   ├── services/           # Existing sync, user services + new tidig-time service
│   ├── utils/              # Existing Tidig API client reused for /Api/Time
│   ├── models/             # zod models for Tidig responses (extend with time models)
│   └── routes/             # New /api/time routes for user time queries
└── tests/
    ├── unit/               # Unit tests for time client/service
    └── integration/        # Optional integration tests with mocked Tidig API

frontend/
├── src/
│   ├── components/
│   │   ├── users/          # Extend user components with a Time section/panel
│   │   └── time/           # (Optional) Shared time-specific components (charts, filters)
│   ├── pages/
│   │   └── UserDetailPage/ # Integrate time view into existing user detail page
│   └── services/           # New time service using apiClient to call backend /api/time
└── tests/
    └── (reuse existing React/Vite test setup)
```

**Structure Decision**: Use the existing web application split with `backend/` and `frontend/src/`. Add a dedicated Tidig time service + controller + routes on the backend, and extend the existing `UserDetailPage` and user components on the frontend with a time panel that calls a new time service.

## Complexity Tracking

No additional complexity beyond existing backend/frontend patterns is planned. If future iterations introduce caching layers or reporting endpoints, this section should be revisited.
