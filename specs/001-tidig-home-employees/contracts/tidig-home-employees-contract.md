# Contract: Tidig home page employees and monthly performance

## Parties

- **Frontend Dashboard** – React/Vite application responsible for rendering the home page, employee list, and group performance chart.
- **Backend API** – Existing Node/Express service that proxies and normalizes data from Tidig and serves internal user data from `backend/src/data/users.json`.
- **Tidig API** – External scheduling system providing the employee subtree.

## Responsibilities

### Tidig API → Backend

- Provide an employee subtree that includes the configured SBQ node and its descendants.
- Ensure each node has stable identifiers and parent/child relationships.

### Backend → Frontend

- Expose an endpoint that returns:
  - The Tidig employee subtree (or a normalized form) that includes SBQ.
  - Internal employee records from `users.json`, including any `monthlyHours` and rate information.
- Guarantee that real data remains server-side in `users.json` and is only exposed to the authenticated frontend as needed for this dashboard.

## Data Contracts

### Employee Subtree Response (conceptual)

```ts
interface EmployeeSubtreeResponse {
  rootId: string;            // Root of the subtree (may be global root or SBQ ancestor)
  nodes: ExternalEmployeeNode[]; // See data-model.md
}
```

### Internal Employees Response (conceptual)

```ts
interface InternalEmployeesResponse {
  employees: InternalEmployeeRecord[]; // See data-model.md
}
```

### Frontend Derivations

The frontend MUST:

1. Use existing configuration to identify the SBQ node within `EmployeeSubtreeResponse`.
2. Derive the home page employee list as direct children of SBQ with `hasChildren === false`.
3. For each derived employee, join to `InternalEmployeeRecord` by `externalId` where possible.
4. For the current calendar month:
   - Read `monthlyHours[monthKey]` (defaulting to `0` when missing).
   - Use `rateSekPerHour` (from existing salary/margin data) to compute SEK.
5. Aggregate a `GroupPerformanceSnapshot` (see data-model.md) and render it via existing chart components.

## Error Handling and Edge Cases

- If SBQ cannot be found in the subtree, the frontend MUST:
  - Render a safe fallback state (e.g., empty list with a neutral message) rather than failing hard.
- If an external employee node has no matching `InternalEmployeeRecord`:
  - The frontend MAY still render the employee in the list but treat their `monthlyHours` as zero until data is added.
- If no `monthlyHours` exist for the current month:
  - The frontend MUST render group performance with zero totals and a neutral explanatory message.

## Non-Goals

- No new backend endpoints dedicated solely to group performance aggregation.
- No new configuration files or environment variables; all routing and IDs come from existing configuration.
