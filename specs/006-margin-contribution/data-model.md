# Data Model: Margin Contribution Calculation Per User

**Branch**: `006-margin-contribution`  
**Phase**: 1 — Design  
**Date**: 2026-03-02

---

## Entities

### 1. User *(extended)*

Existing entity in `backend/src/types/user.types.ts` and `src/types/user.ts`.

**New field added:**

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| `hourlyRate` | `number` | No (optional) | `> 0` when present | Sales price in SEK/hour charged to clients |

**Existing relevant fields:**

| Field | Type | Notes |
|-------|------|-------|
| `employeeID` | `string?` | Maps to Tidig `empId`; required to fetch time data |
| `currentSalary` | `number?` | Monthly gross salary in SEK; used as full monthly cost |

**Data source**: `backend/src/data/users.json` — populated and edited manually.

**Validation rules:**
- `hourlyRate` must be a positive number if present; `null` / missing → "Rate not set" state.
- `currentSalary` must be a positive number if present; `null` / missing → cost displays as 0.

---

### 2. TimeEntry *(existing, read-only for this feature)*

Lives in `src/types/time.ts` (frontend) and `backend/src/models/tidigTime.ts` (backend).  
No changes to this entity.

| Field | Type | Notes |
|-------|------|-------|
| `date` | `string` | ISO date `YYYY-MM-DD` |
| `hours` | `number` | Hours logged for this entry |
| `customerId` | `string?` | `"2"` = Consid AB (non-billable); all others = billable |
| `customerName` | `string?` | Display name |
| `projectId` | `string?` | Optional project reference |
| `projectName` | `string?` | Optional project display name |

**Billability rule:**  
`isBillable(entry)` = `entry.customerId !== "2"` (and non-null).

---

### 3. MarginResult *(new, computed — never persisted)*

Computed in the frontend `marginCalculator.ts` service. Not stored anywhere.

| Field | Type | Notes |
|-------|------|-------|
| `month` | `string` | `YYYY-MM` — the period this result covers |
| `billableHours` | `number` | Sum of `hours` for all billable entries in the month |
| `revenue` | `number` | `billableHours × hourlyRate` (SEK) |
| `salaryCost` | `number` | Full `currentSalary` for the month (SEK); 0 if not set |
| `margin` | `number` | `revenue − salaryCost` (SEK); can be negative |
| `marginPercentage` | `number \| null` | `(margin / revenue) × 100`; `null` when `revenue === 0` |
| `workingDaysInMonth` | `number` | Total Mon–Fri days in the selected month |
| `workingDaysPassed` | `number` | Mon–Fri days from 1st to today (or last day if past month) |
| `hourlyRate` | `number \| null` | The rate used; `null` if user has no hourly rate |
| `hasHourlyRate` | `boolean` | `true` when `hourlyRate` is a positive number |

**Derivation rules:**
- `revenue = 0` and `hasHourlyRate = false` → show "Rate not configured" notice; do not show revenue/margin figures.
- `marginPercentage = null` → display as `"N/A"`.
- `workingDaysPassed` clamps to `workingDaysInMonth` when viewing a fully elapsed month.

---

## Relationships

```
User (1) ──── employeeID ────> Tidig /Api/Time  (0..*)  TimeEntry
User (1) ──── currentSalary ─┐
User (1) ──── hourlyRate ─────┤──> (computed) ──> MarginResult
                              │
            TimeEntry (0..*) ─┘  (billable subset)
```

---

## State Diagram: MarginPanel UI States

```
[Loading] ──(data loaded, hasHourlyRate=false)──> [Rate Not Set]
[Loading] ──(Tidig API error)──────────────────> [Error]
[Loading] ──(no employeeID)────────────────────> [No Employee ID]
[Loading] ──(success, billableHours=0)─────────> [No Billable Time]
[Loading] ──(success, billableHours>0)─────────> [Showing Figures]
[Showing Figures] ──(month changed)────────────> [Loading]
[Error] ──(retry)──────────────────────────────> [Loading]
```

---

## Notes

- `MarginResult` is intentionally a pure value object with no identity or persistence.  
  Future addition of cost items (travel, etc.) adds fields alongside `salaryCost` without restructuring.
- `INTERNAL_CUSTOMER_IDS` constant lives in `marginCalculator.ts` and acts as the single  
  source of truth for billability rules.
