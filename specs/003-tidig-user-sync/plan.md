# Implementation Plan: Tidig API User Synchronization

**Branch**: `003-tidig-user-sync` | **Date**: February 23, 2026 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-tidig-user-sync/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Integrate with Tidig external API to automatically synchronize user information during application startup, eliminating manual maintenance of the users.json file. The system will use Tidig as the source of truth for user identities and time reporting data while preserving locally-managed properties like salary information. Implementation uses a fast-fail approach with 5-second timeout, employeeID-based matching, and automatic user status management (active/inactive).

## Technical Context

**Language/Version**: TypeScript 5.x with Node.js 20+ (backend), TypeScript 5.x with React 19 (frontend)  
**Primary Dependencies**: Express.js 4.x, cors, helmet (backend); React 19, React Router 7, Vite (frontend)  
**Storage**: File-based JSON (users.json) with write operations during sync  
**Testing**: Vitest (both frontend and backend for consistency)  
**Target Platform**: Web application (Node.js backend + React SPA frontend, development on Windows)
**Project Type**: Web application (frontend + backend)  
**Performance Goals**: Application startup <10 seconds (including 5s API timeout), sync completion <60s for 1000 users  
**Constraints**: 5-second Tidig API timeout, non-blocking startup, preserve data integrity during partial failures  
**Scale/Scope**: 100-1000 users, 3 Tidig API endpoints, infrequent user changes (~1% churn), 99% API uptime expected

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ⚠️ No project constitution defined yet

The `.specify/memory/constitution.md` file exists but contains only template placeholders. No architectural principles, constraints, or quality gates have been defined for this project.

**Recommendation**: Consider establishing constitution for future features to define:
- Architectural patterns and boundaries
- Testing requirements and coverage expectations
- Performance and scalability standards
- Security and data handling policies

**For this feature**: Proceeding without constitutional gates. Will follow existing codebase patterns (Express.js backend, React frontend, TypeScript throughout, file-based storage).

## Project Structure

### Documentation (this feature)

```text
specs/003-tidig-user-sync/
├── spec.md              # Feature specification (completed)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (to be generated)
├── data-model.md        # Phase 1 output (to be generated)
├── quickstart.md        # Phase 1 output (to be generated)
├── contracts/           # Phase 1 output (to be generated)
│   ├── tidig-api.md     # Tidig API endpoint contracts
│   └── sync-service.md  # Internal sync service contract
├── checklists/
│   └── requirements.md  # Validation checklist (completed)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── controllers/     # Existing: user.controller.ts
│   │   └── sync.controller.ts          # NEW: Sync status endpoints
│   ├── data/
│   │   └── users.json   # Existing: Updated by sync
│   ├── middleware/      # Existing: errorHandler, logger
│   ├── models/          # NEW: Directory to create
│   │   └── tidig.model.ts              # Tidig API response types
│   ├── routes/          # Existing: users.routes.ts
│   │   └── sync.routes.ts              # NEW: Sync management routes
│   ├── services/        # Existing: user.service.ts
│   │   ├── tidig.service.ts            # NEW: Tidig API client
│   │   ├── sync.service.ts             # NEW: Sync orchestration
│   │   └── user-merge.service.ts       # NEW: User data merging logic
│   ├── types/           # Existing: user.types.ts
│   │   └── sync.types.ts               # NEW: Sync-related types
│   ├── utils/           # NEW: Directory to create
│   │   └── tidig-client.ts             # NEW: HTTP client with timeout
│   └── server.ts        # Existing: Add startup sync call
├── tests/               # NEW: Directory to create
│   ├── integration/
│   │   ├── tidig-sync.test.ts          # Sync integration tests
│   │   └── user-merge.test.ts          # Merge logic tests
│   └── unit/
│       ├── tidig.service.test.ts       # API client unit tests
│       └── user-merge.service.test.ts  # Merge algorithm tests
├── package.json         # Existing: Add test scripts if missing
└── tsconfig.json        # Existing

frontend/
├── src/
│   ├── components/
│   │   └── sync/        # NEW: Directory for sync UI components
│   │       ├── SyncStatus.tsx          # Sync notification component
│   │       └── SyncIndicator.tsx       # Loading indicator during sync
│   ├── services/        # Existing: api.ts, userService.ts
│   │   └── syncService.ts              # NEW: Frontend sync API client
│   └── types/           # Existing: user.ts, etc.
│       └── sync.ts                     # NEW: Frontend sync types
└── tests/               # Existing: setup.ts
    └── components/
        └── sync/
            └── SyncStatus.test.tsx     # Sync component tests
```

**Structure Decision**: Web application architecture with separate frontend/backend. All Tidig API integration happens server-side (backend) per FR-016. Frontend receives sync status notifications via new API endpoints. Follows existing pattern: services for business logic, controllers for HTTP layer, types for TypeScript definitions.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**Status**: N/A - No constitution defined, therefore no violations to track.

**Note**: When a project constitution is established, this section would track any intentional deviations from architectural principles with justification.
