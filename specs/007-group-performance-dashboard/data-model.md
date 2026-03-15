# Data Model: Group Performance Dashboard

**Feature**: `007-group-performance-dashboard`  
**Date**: 2026-03-14  
**Phase**: 1 (Design)

---

## Entities

### 1. `ConsultantMonthlyEntry`

Represents an individual consultant's contribution within a single monthly snapshot. Stored as part of a `MonthlySnapshot` file.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `consultantId` | `string` | ✅ | References `User.id` from the existing user store |
| `consultantName` | `string` | ✅ | Denormalized display name (avoids requiring a user lookup to render the breakdown) |
| `billedHours` | `number` | ✅ | Total billed hours for this consultant in the month. `0` when data is available but empty. |
| `dataStatus` | `'complete' \| 'partial' \| 'missing'` | ✅ | Completeness indicator. `complete` = full month data from API; `partial` = some days missing; `missing` = no API data available at all |
| `revenue` | `number` | ❌ | Optional. Gross revenue in SEK for this consultant this month. Not populated in v1. |
| `marginContribution` | `number` | ❌ | Optional. Revenue minus direct costs in SEK. Not populated in v1. |
| `capturedAt` | `string` | ✅ | ISO 8601 timestamp of when this entry was last updated from the live API |

**Notes**:
- `billedHours` is `0` for `dataStatus: 'missing'` — the field is always present to allow aggregation without null checks.
- `revenue` and `marginContribution` are reserved optional fields. Old snapshots without them remain valid.
- `consultantName` is denormalized intentionally — snapshot files are self-contained records.

**Example**:
```json
{
  "consultantId": "con-001",
  "consultantName": "Consultant A",
  "billedHours": 152,
  "dataStatus": "complete",
  "capturedAt": "2026-03-14T08:00:00.000Z"
}
```

---

### 2. `MonthlySnapshot`

Represents the full group performance record for one calendar month. Stored as `backend/src/data/snapshots/{YYYY-MM}.json`.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `year` | `number` | ✅ | Calendar year (e.g., `2026`) |
| `month` | `number` | ✅ | Calendar month, 1-indexed (e.g., `3` for March) |
| `totalBilledHours` | `number` | ✅ | Sum of `billedHours` across all consultant entries. Frontend re-derives this but backend stores it for cheap reads. |
| `consultantEntries` | `ConsultantMonthlyEntry[]` | ✅ | One entry per known consultant. Consultants with no data are included with `dataStatus: 'missing'` and `billedHours: 0`. |
| `snapshotCapturedAt` | `string` | ✅ | ISO 8601 timestamp of when this snapshot was last written |
| `isPartial` | `boolean` | ✅ | `true` if any entry has `dataStatus !== 'complete'`. Surfaced to the frontend for UX indication. |

**File naming**: `backend/src/data/snapshots/2026-03.json`  
**gitignore**: The `snapshots/` directory is gitignored (contains real consultant data).

**Example file** (`2026-03.json`):
```json
{
  "year": 2026,
  "month": 3,
  "totalBilledHours": 456,
  "isPartial": false,
  "snapshotCapturedAt": "2026-03-14T08:00:00.000Z",
  "consultantEntries": [
    {
      "consultantId": "con-001",
      "consultantName": "Consultant A",
      "billedHours": 152,
      "dataStatus": "complete",
      "capturedAt": "2026-03-14T08:00:00.000Z"
    },
    {
      "consultantId": "con-002",
      "consultantName": "Consultant B",
      "billedHours": 168,
      "dataStatus": "complete",
      "capturedAt": "2026-03-14T08:00:00.000Z"
    },
    {
      "consultantId": "con-003",
      "consultantName": "Consultant C",
      "billedHours": 0,
      "dataStatus": "missing",
      "capturedAt": "2026-03-14T08:00:00.000Z"
    }
  ]
}
```

---

### 3. `PerformanceConfig`

Stores the group's configured monthly target. Stored as `backend/src/data/performance-config.json`.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `target` | `number \| null` | ✅ | Target billed hours for the group per month. `null` = not yet configured. |
| `updatedAt` | `string \| null` | ✅ | ISO 8601 timestamp of last update. `null` on first run. |

**File**: `backend/src/data/performance-config.json`  
**gitignore**: No — this file contains only a numeric target value, not sensitive data. An `.example` file is provided for developers.

**Example** (`performance-config.json`):
```json
{
  "target": 480,
  "updatedAt": "2026-03-14T09:30:00.000Z"
}
```

**Example** (`performance-config.json.example`):
```json
{
  "target": null,
  "updatedAt": null
}
```

---

## Relationships

```
User (existing)
  └── referenced by ConsultantMonthlyEntry.consultantId

MonthlySnapshot (1 per YYYY-MM)
  └── has many ConsultantMonthlyEntry (1 per known consultant)

PerformanceConfig (1 global config)
  └── target value rendered as ReferenceLine on chart
```

---

## Frontend Types (mirrors backend)

Defined in `src/types/performance.ts`:

```typescript
export type DataStatus = 'complete' | 'partial' | 'missing';

export interface ConsultantMonthlyEntry {
  consultantId: string;
  consultantName: string;
  billedHours: number;
  dataStatus: DataStatus;
  capturedAt: string;
  // Optional future fields:
  revenue?: number;
  marginContribution?: number;
}

export interface MonthlySnapshot {
  year: number;
  month: number;
  totalBilledHours: number;
  isPartial: boolean;
  snapshotCapturedAt: string;
  consultantEntries: ConsultantMonthlyEntry[];
}

export interface PerformanceConfig {
  target: number | null;
  updatedAt: string | null;
}

// Chart presentation type (derived on frontend from MonthlySnapshot[])
export interface ChartDataPoint {
  month: string;      // e.g. "Mar 2026"
  hours: number;      // totalBilledHours
  isPartial: boolean; // drives visual indicator on bar
}
```

---

## Validation Rules

| Entity | Field | Rule |
|--------|-------|------|
| `PerformanceConfig` | `target` | Must be a positive integer when set; `null` is valid |
| `ConsultantMonthlyEntry` | `billedHours` | Must be `>= 0`; never negative |
| `MonthlySnapshot` | `month` | Must be 1–12 |
| `MonthlySnapshot` | `year` | Must be >= 2020 (reasonable lower bound) |

---

## State Transitions

### `ConsultantMonthlyEntry.dataStatus`

```
[no API call made]  →  'missing'
[API call made, incomplete data]  →  'partial'
[API call made, full month data]  →  'complete'
```

Once a snapshot is written as `complete`, it is not re-fetched unless explicitly refreshed (out of scope for v1).
