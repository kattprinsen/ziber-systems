# Research: Tidig home page employees and monthly performance

## R-001: Where to derive the home page employee list

- **Decision**: Derive the filtered SBQ employee list on the frontend from the Tidig employee subtree response, using the existing configuration to locate the SBQ node.
- **Rationale**: This aligns with Principle IV (Frontend Data Derivation) by keeping aggregation and filtering logic close to the UI. It avoids adding new backend endpoints and lets the home page control exactly which nodes are rendered. The external Tidig API already provides the full subtree; we only need to transform it.
- **Alternatives considered**:
  - Perform the filtering in the backend and expose a dedicated "SBQ employees" endpoint. Rejected because it increases backend API surface and pushes purely presentational filtering away from the UI without a clear performance or security benefit.
  - Hard-code a static list of SBQ employees in configuration. Rejected because it would drift from the Tidig source of truth and require manual updates when the subtree changes.

## R-002: Identifying SBQ and leaf employees in the Tidig subtree

- **Decision**: Use the existing Tidig configuration (group or node identifier already used for SBQ) to find the SBQ node in the subtree, then treat only its direct children with no children of their own as employees to render.
- **Rationale**: Reuses established configuration and avoids introducing new identifiers (Principle III / FR-005). Treating leaf nodes as employees matches the user requirement to hide structural/group nodes and keeps logic simple: "direct child" + "no children".
- **Alternatives considered**:
  - Introduce a new configuration flag per node (e.g., `isEmployee`) from Tidig. Rejected because it would require upstream changes and new configuration pathways.
  - Infer employees by role titles or other metadata. Rejected as brittle and more complex than using tree structure (has-children) as the discriminator.

## R-003: Shape of monthly hours data in users.json

- **Decision**: Extend each internal employee record in `backend/src/data/users.json` with an optional `monthlyHours` map keyed by calendar month (e.g., `"2026-03"`) to a numeric hours value for that month.
- **Rationale**: A month-keyed map makes it easy to look up the current calendar month (FR-004) without adding nested array structures. It keeps all internal employee data together in a single object per user and can be edited manually with minimal friction.
- **Alternatives considered**:
  - Represent monthly hours as an array of `{ year, month, hours }` objects. Rejected as more verbose for simple lookups and harder to edit by hand.
  - Create a separate file for monthly hours per employee. Rejected because it violates FR-005 and increases configuration complexity.

## R-004: Where to compute group performance (hours and SEK)

- **Decision**: Compute group performance (total hours and SEK for the current month) on the frontend from Tidig-derived employees, `monthlyHours` from `users.json`, and existing rate/margin utilities.
- **Rationale**: This respects Principle IV by keeping aggregation in the frontend, and it reuses existing margin/salary calculators instead of introducing new backend aggregation logic. The data volumes are small (SBQ team size), so there is no performance need for a backend aggregation endpoint.
- **Alternatives considered**:
  - Add a backend endpoint that returns pre-aggregated monthly totals for SBQ. Rejected as unnecessary complexity and contrary to the thin-backend principle.
  - Store precomputed monthly totals in `users.json`. Rejected because it risks drift between stored totals and underlying hours; it is safer to recompute from base data.

## R-005: Handling missing or partial data

- **Decision**: Treat missing `monthlyHours` entries as zero for that month, and still include the employee in group performance with zero contribution; surface a safe, neutral UI state when no employees or no hours exist for the current month.
- **Rationale**: This matches the spec’s edge cases (employees without data, months with no entries, partial data) and avoids confusing gaps or errors in the UI. It also ensures that adding data later will immediately adjust totals without needing any structural changes.
- **Alternatives considered**:
  - Hide employees without monthly hours from group performance. Rejected because it makes the group view harder to reconcile with the Tidig employee list.
  - Show error states when data is incomplete. Rejected in favor of a softer, more informative zeroed baseline that still allows the dashboard to load.
