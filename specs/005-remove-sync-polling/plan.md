# Implementation Plan: Remove Sync Status Polling

**Branch**: `005-remove-sync-polling` | **Date**: March 2, 2026 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-remove-sync-polling/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Remove the automatic 30-second polling mechanism from the sync status indicator component, replacing it with a single API call on component mount and optional manual refresh capability. This change eliminates unnecessary network traffic (reducing API calls by ~95%), decreases client-side resource usage, and reduces server load while maintaining full visibility into sync status through on-demand updates.

## Technical Context

**Language/Version**: TypeScript 5.x with Node.js 20+ (backend), TypeScript 5.x with React 19 (frontend)  
**Primary Dependencies**: Express.js 4.x (backend); React 19, React Router 7, Vite (frontend)  
**Storage**: N/A (modification to frontend state management only)  
**Testing**: Vitest (frontend component testing, user interaction testing)  
**Target Platform**: Web application (Node.js backend + React SPA frontend, development on Windows)
**Project Type**: Web application (frontend + backend, but primarily frontend changes)  
**Performance Goals**: Reduce API calls from ~120 per hour per client to ~1-5 per hour per client (95%+ reduction), component mount/render <100ms  
**Constraints**: Must preserve existing error display behavior, maintain backward compatibility with backend sync status endpoint, no new dependencies  
**Scale/Scope**: Affects single frontend component (SyncIndicator.tsx), single service method (fetchSyncStatus), ~155 lines of code modification

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ⚠️ No project constitution defined yet

The `.specify/memory/constitution.md` file exists but contains only template placeholders. No architectural principles, constraints, or quality gates have been defined for this project.

**Recommendation**: Consider establishing constitution for future features to define:
- Architectural patterns and boundaries
- Testing requirements and coverage expectations
- Performance and scalability standards

**For this feature**: Proceeding without constitutional gates. Will follow existing codebase patterns (React hooks, TypeScript throughout, existing component structure).

## Project Structure

### Documentation (this feature)

```text
specs/005-remove-sync-polling/
├── spec.md              # Feature specification (completed)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (to be generated)
├── data-model.md        # Phase 1 output (to be generated) 
├── quickstart.md        # Phase 1 output (to be generated)
├── contracts/           # Phase 1 output (to be generated)
│   └── component-api.md # SyncIndicator component interface
├── checklists/
│   └── requirements.md  # Validation checklist (completed)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── components/
│   │   └── sync/
│   │       └── SyncIndicator.tsx       # MODIFY: Remove setInterval, add manual refresh
│   ├── services/
│   │   └── syncService.ts              # NO CHANGE: Keep fetchSyncStatus as-is
│   └── types/
│       └── sync.ts                     # NO CHANGE: Existing types sufficient
└── tests/
    └── components/
        └── sync/
            └── SyncIndicator.test.tsx  # NEW: Component tests

backend/
├── src/
│   └── controllers/
│       └── sync.controller.ts          # NO CHANGE: Backend unaffected
```

**Structure Decision**: This is a frontend-focused change affecting primarily the SyncIndicator component. The web application structure (Option 2) with separate frontend/ and backend/ directories is already in place. No backend changes required since the sync status endpoint remains unchanged.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

N/A - No constitutional violations. No constitution defined for this project.
