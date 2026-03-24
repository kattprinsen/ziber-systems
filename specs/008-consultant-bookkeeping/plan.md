# Implementation Plan: Consultant Contribution Bookkeeping MVP

**Branch**: `008-consultant-bookkeeping` | **Date**: 2026-03-23 | **Spec**: ../008-consultant-bookkeeping/spec.md  
**Input**: Feature specification describing a solo-user consultant bookkeeping tool with monthly manual hour entry, individual and team views, and a minimal Node.js + TypeScript backend plus a framework-free Vite + TypeScript client with Tailwind.

## Summary

Build a small full-stack application that lets me (single user) maintain a list of consultants, enter their billable and non-billable hours for each month, and see computed metrics (revenue, cost approximation, margin, utilization) at both individual and team levels. The MVP focuses on:

- Reliable monthly data input and storage via a simple NoSQL/JSON-backed repository.
- A current-month summary view in the UI.
- Basic consultant management (add/update/inactivate) without affecting historical data.
- A simple 3-month rolling team trend view once enough data exists.

## Technical Context

**Language/Version**: Node.js (LTS, e.g., 20.x) with TypeScript; Vite + TypeScript for the client (no heavy SPA framework by default).  
**Primary Dependencies**: Minimal HTTP framework for backend (e.g., Fastify or Express), Vite build tooling for the client, Tailwind CSS for styling, light validation (e.g., zod or custom type guards).  
**Storage**: Start with JSON or embedded NoSQL-style storage (e.g., a simple file-backed document store) hidden behind repository interfaces; later may migrate to a small NoSQL DB without changing domain logic.  
**Testing**: Vitest or Jest for unit tests; lightweight integration tests for API endpoints where helpful.  
**Target Platform**: Single-user desktop/browser usage, running backend locally (e.g., `localhost`) on a developer machine.  
**Project Type**: Web application (backend API + frontend SPA).  
**Performance Goals**: Instant responses for typical operations (sub-100ms locally); able to handle up to ~24 months of data for ~20 consultants without noticeable lag.  
**Constraints**: KISS, minimal dependencies, no heavy ORMs, no authentication, no multi-tenant logic, clear separation between domain logic and storage/UI.  
**Scale/Scope**: Single user, small team (roughly 5–30 consultants), monthly cadence.

## Constitution Check

- Single-user, transparency-first: All metrics must be directly derivable from stored Consultant and MonthlyEntry data; plan keeps all calculations in pure domain functions.
- Minimalist, data-centric design: Only features that support monthly entry, summaries, and short-term trends are included in this MVP; no auth, external integrations, or complex reporting.
- Stable domain model: Consultant, MonthlyEntry, and TeamSummary are the central entities; interfaces and types will be defined in a dedicated domain module and versioned carefully.
- Dependency Injection & testability: Repositories and services are wired via a composition root; tests can swap real storage for in-memory fakes.
- Minimal stack, observable behavior: Stack limited to Node+TS, Vue, Tailwind, and a simple NoSQL/JSON store; logging focuses on domain events like saving entries and changing consultant status.

No constitution violations are anticipated for this MVP; complexity tracking remains empty.

## Project Structure

### Documentation (this feature)

```text
specs/008-consultant-bookkeeping/
├── plan.md              # This file
├── research.md          # (optional) Future research notes
├── data-model.md        # (optional) Detailed domain model if needed
├── quickstart.md        # (optional) How to run this feature end-to-end
├── contracts/           # (optional) API contracts once stabilized
└── tasks.md             # Generated later by /speckit.tasks
```

### Source Code (repository root)

```text
backend/
  src/
    domain/
      consultant.ts
      monthlyEntry.ts
      calculations.ts
    storage/
      repositories/
      adapters/        # JSON/NoSQL implementations
    services/
      consultantService.ts
      entryService.ts
      summaryService.ts
    api/
      routes/
      httpServer.ts
  tests/
    unit/
    integration/

frontend/
  src/
    components/
      ConsultantTable.ts
      TeamSummary.ts
      TrendView.ts
      MonthlyHoursForm.ts
    pages/
      DashboardPage.ts      # current month summary + form
      ConsultantsPage.ts    # manage consultants
    services/
      apiClient.ts
    styles/
      tailwind.css
  tests/
    unit/
```

**Structure Decision**: Web application with a `backend/` Node+TypeScript API and a `frontend/` Vite + TypeScript client (no heavy SPA framework). Backend is responsible for domain logic and persistence via DI-managed repositories; frontend is a thin renderer that calls the API and applies the dark, industrial UI with Tailwind.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|----------------------------------------|
| *(none yet)* | | |

