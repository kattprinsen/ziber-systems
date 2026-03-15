# Data Model: Tidig home page employees and monthly performance

## Entity: ExternalEmployeeNode

Represents a node in the Tidig employee subtree.

- **Fields**:
  - `id: string` – Unique identifier for the node from Tidig.
  - `parentId: string | null` – Identifier of the parent node; `null` for the root.
  - `name: string` – Display name as provided by Tidig.
  - `hasChildren: boolean` – Indicates whether this node has any child nodes.
  - `children: ExternalEmployeeNode[]` – Child nodes in the subtree (tree representation).

- **Relationships**:
  - Forms a tree rooted at the configured SBQ node.
  - Leaf nodes (where `hasChildren === false` and `children.length === 0`) are candidate employees to render on the home page.

- **Validation Rules**:
  - `id` must be non-empty.
  - `children` must be consistent with `hasChildren` (if `hasChildren === false`, `children` should be empty).

## Entity: InternalEmployeeRecord

Represents an internal employee in `backend/src/data/users.json`.

- **Fields**:
  - `id: string` – Internal identifier used across the dashboard.
  - `externalId: string` – Identifier linking to `ExternalEmployeeNode.id`.
  - `name: string` – Internal display name; may mirror Tidig but is allowed to differ.
  - `role: string` – Role or title used elsewhere in the dashboard.
  - `monthlyHours?: { [monthKey: string]: number }` – Optional map from calendar month key (`YYYY-MM`) to hours worked in that month.
  - `rateSekPerHour?: number` – Optional hourly rate used for SEK calculations (reusing existing salary/margin data where available).

- **Relationships**:
  - Many-to-one with `ExternalEmployeeNode` via `externalId`.
  - Aggregated into SBQ group performance by combining hours and rates.

- **Validation Rules**:
  - `id`, `externalId`, and `name` must be non-empty.
  - Each `monthKey` must match the `YYYY-MM` pattern.
  - Hour values must be non-negative.

## Entity: MonthlyHoursLookup

A derived structure used at runtime to simplify lookups.

- **Fields**:
  - `employeeId: string` – References `InternalEmployeeRecord.id`.
  - `monthKey: string` – Current calendar month (e.g., `"2026-03"`).
  - `hours: number` – Hours worked for that employee in the given month (defaults to `0` when missing).

- **Validation Rules**:
  - `hours` must be `>= 0`.

## Entity: GroupPerformanceSnapshot

Represents the aggregated performance for SBQ employees for the current calendar month.

- **Fields**:
  - `monthKey: string` – Calendar month for the snapshot (`YYYY-MM`).
  - `employeeIds: string[]` – List of internal employee IDs included in the group.
  - `totalHours: number` – Sum of `hours` across all included employees.
  - `totalSek: number` – Sum of `hours * rateSekPerHour` across employees where a rate is available (others contribute hours but not SEK).
  - `perEmployee: Array<{
      employeeId: string;
      hours: number;
      sek: number;
    }>` – Optional breakdown per employee for UI display.

- **Relationships**:
  - Built from `ExternalEmployeeNode` (to select employees) and `InternalEmployeeRecord` (to map to local records and monthly hours).

- **Validation Rules**:
  - `totalHours` must equal the sum of `perEmployee.hours` where provided.
  - `totalSek` must equal the sum of `perEmployee.sek` (within rounding tolerance).

## Derived Views

- **Home Page Employee List**:
  - Input: Tidig subtree rooted at SBQ, internal employee records.
  - Filter: Direct children of SBQ where `hasChildren === false`.
  - Output: List of employees with names, roles, and identifiers used by the dashboard.

- **Group Performance View**:
  - Input: Home page employee list, `monthlyHours` for the current month, and `rateSekPerHour`.
  - Output: `GroupPerformanceSnapshot` used by existing chart components (hours and SEK).
