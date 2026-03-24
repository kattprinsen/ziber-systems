<!--
Sync Impact Report
- Version change: 0.0.0 → 1.0.0
- Modified principles: (new document)
- Added sections: Core Principles, Technical Constraints & Stack, Workflow & Iteration, Governance
- Removed sections: None
- Templates updated:
	- ✅ .specify/templates/plan-template.md (Constitution Check references generic)
	- ✅ .specify/templates/spec-template.md (no conflicting constraints)
	- ✅ .specify/templates/tasks-template.md (phase structure aligned with small, vertical slices)
- Follow-up TODOs:
	- TODO(RATIFICATION_DATE): Set to actual project start date if different from 2026-03-23
-->
<!--
Sync Impact Report
- Version change: 1.0.0 
  to 2.0.0
- Modified principles: V. Minimal Stack, Observable Behavior; Technical Constraints & Stack (frontend)
- Added sections: None
- Removed sections: None
- Templates updated:
	- ✅ .specify/templates/plan-template.md (still generic; no Vue-specific assumptions)
	- ✅ .specify/templates/spec-template.md (still generic; no Vue-specific assumptions)
	- ✅ .specify/templates/tasks-template.md (still generic; no Vue-specific assumptions)
- Follow-up TODOs:
	- TODO(RATIFICATION_DATE): Set to actual project start date if different from 2026-03-23
	- TODO(UPDATE_FEATURE_008_DOCS): Update specs/008-consultant-bookkeeping/spec.md and plan.md to say "Vite + TypeScript client" instead of "Vue".
-->
hours, reviewing individual contributions, and understanding team trends over
time. Non-essential features (auth, external integrations, complex reporting)
are deferred until there is a concrete need.

### III. Stable Domain Model
The core entities (Consultant, MonthlyEntry, TeamSummary) form a stable domain
model. Changes to these entities MUST be deliberate and versioned. All
calculations (revenue, cost approximation, margin, utilization) MUST be
implemented as pure functions over this domain model and remain independent of
storage and transport technology.

### IV. Dependency Injection & Testability
Backend services MUST depend on abstractions, not concrete infrastructure.
All access to the database (or JSON/NoSQL storage) MUST go through injected
interfaces, enabling tests to run with in-memory fakes. No module is allowed
to instantiate database clients directly; construction happens at the
composition root (e.g., app/server bootstrap).

### V. Minimal Stack, Observable Behavior
The stack MUST remain minimal: Node.js + TypeScript backend, a framework-free
Vite + TypeScript client, Tailwind CSS for styling, and a simple NoSQL-style
database (or JSON files in early phases) behind a repository layer. Logging
SHOULD be structured and focused on domain events (e.g., "monthly entry saved",
"consultant inactivated") so behavior is easy to follow when something looks wrong.

## Technical Constraints & Stack

- Backend: Node.js (LTS) with TypeScript.
- Storage: Start with JSON or embedded NoSQL; evolve to a simple NoSQL
	database when needed. All database access goes through dependency-injected
	repositories.
- DI: Use a lightweight dependency injection pattern or library. There MUST be
	a clear composition root that wires repositories, services, and controllers.
- Frontend: Vite + TypeScript client with no heavy SPA framework by default.
- Styling: Tailwind CSS.
- UI Theme: Dark mode by default, industrial feel with orange and yellow
	accent colors, inspired by a 90s retro vibe but with a modern, clean layout.
- Realtime: WebSockets MAY be used to push live updates from backend to
	client, but are optional; polling or manual refresh is acceptable in early
	iterations.

Non-goals (initially):

- No heavy ORMs.
- No complex microservice architectures.
- No authentication/authorization or multi-tenant logic.

## Workflow & Iteration

- Work in very small, vertical slices: each change SHOULD deliver a complete,
	testable step from storage through backend to UI where applicable.
- Monthly workflow is the north star:
	- Quickly input billable and non-billable hours per active consultant.
	- Easily add or inactivate consultants as the team changes.
	- Immediately see individual and team contributions for the current period.
	- Review trends over the last 3 months and per year.
- Client-side code SHOULD be mostly read-only: it renders aggregated data and
	simple forms; domain logic stays on the backend.
- Prefer pure functions and simple modules over clever abstractions.

## Governance

- This constitution defines the non-negotiable constraints for this
	bookkeeping project. Implementation plans (plan.md), specs (spec.md), and
	tasks (tasks.md) MUST be consistent with these principles.
- Any change that:
	- Alters core entities (Consultant, MonthlyEntry, TeamSummary),
	- Switches major technologies (e.g., database type, frontend framework), or
	- Significantly changes UX principles (e.g., abandoning dark/industrial
		design or the monthly workflow focus)
	MUST be accompanied by an explicit constitution amendment.
- Versioning policy:
	- MAJOR: Backward-incompatible changes to domain model, storage contracts,
		or governance rules.
	- MINOR: New principles, sections, or significant expansions of existing
		guidance.
	- PATCH: Clarifications, wording-only edits, and typo fixes.
- Reviews (including self-review) for new specs/plans/tasks MUST check for
	alignment with:
	- Single-user scope and transparency,
	- Minimal stack and DI requirements,
	- Monthly workflow being supported and not hindered.

**Version**: 2.0.0 | **Ratified**: TODO(RATIFICATION_DATE): set when first project commit is made | **Last Amended**: 2026-03-23
