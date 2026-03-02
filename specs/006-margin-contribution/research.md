# Research: Margin Contribution Calculation Per User

**Branch**: `006-margin-contribution`  
**Phase**: 0 — Unknowns & Decisions  
**Date**: 2026-03-02

---

## Decision 1: Where to compute the margin (backend vs. frontend)

**Decision**: Compute the margin **entirely on the frontend** using the existing  
`GET /api/users/:userId/time` endpoint.

**Rationale**:
- The existing `timeService.getTimeSummary()` precedent shows that business arithmetic  
  (grouping, summing) already lives in frontend utilities alongside `salaryCalculator.ts`.
- No new backend endpoint is needed: the time entries endpoint already returns all  
  required data; margin math is `(billableHours × hourlyRate) − salary`.
- `currentSalary` and `hourlyRate` are both fields on the `User` object which the  
  frontend already receives via `GET /api/users`. No security argument changes this  
  (no auth layer exists; the spec explicitly allows full access).
- A dedicated `/api/users/:userId/margin` endpoint would duplicate the Tidig fetch  
  already in `time.controller.ts` and add a controller + route for three lines of math.

**Alternatives considered**:
- **Backend endpoint** — Rejected: over-engineered for the current scale and duplicates  
  already-thin time-fetching logic without adding security or testability benefits.
- **BFF aggregation in the time controller** — Rejected: mixes user domain (salary/rate)  
  with time domain in the same handler; harder to evolve independently.

---

## Decision 2: Working-day calculation algorithm

**Decision**: Pure `Date` loop — no external library.

```typescript
export function workingDaysInMonth(year: number, month: number): number {
  // month is 0-based (0 = January)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month, d).getDay(); // 0=Sun…6=Sat
    if (dow >= 1 && dow <= 5) count++;
  }
  return count;
}

export function workingDaysElapsed(year: number, month: number, today: number): number {
  let count = 0;
  for (let d = 1; d <= today; d++) {
    const dow = new Date(year, month, d).getDay();
    if (dow >= 1 && dow <= 5) count++;
  }
  return count;
}
```

**Rationale**: Zero dependencies, easily unit-tested, locale-independent. Public holidays  
are explicitly out of scope for this feature (spec Assumptions).

**Alternatives considered**:
- `date-fns/eachDayOfInterval` — Rejected: adds a dependency for trivially solved logic.  
- Lookup table of public holidays — Rejected: out of scope per spec Assumptions.

---

## Decision 3: Currency formatting for SEK amounts

**Decision**: Use `Intl.NumberFormat` with locale `'en-150'` for `"75,000 SEK"` output.

```typescript
export function formatSEK(amount: number): string {
  return new Intl.NumberFormat('en-150', {
    style: 'currency',
    currency: 'SEK',
    currencyDisplay: 'code',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
// formatSEK(75000)  →  "75,000 SEK"
// formatSEK(-3000)  →  "-3,000 SEK"
```

Margin percentage is formatted to one decimal place: `(24.5).toFixed(1) + '%'`.

**Rationale**: `'en-150'` (English for the World) natively produces the required comma  
thousands separator with the ISO code as suffix. `'en-US'` would put the code as a prefix  
(`"SEK 75,000"`), which is wrong. `'sv-SE'` uses a space separator (`"75 000 SEK"`),  
also wrong per spec FR-014.

**Alternatives considered**:
- `'en-US'` + manual suffix — Rejected: produces prefix format.
- Manual `toLocaleString` replacement — Rejected: less reliable across browser engines.

---

## Decision 4: Billability classification

**Decision**: Any `TimeEntry` whose `customerId === "2"` (Consid AB) is non-billable;  
all other entries are billable.

```typescript
const INTERNAL_CUSTOMER_IDS: ReadonlySet<string> = new Set(['2']);

export function isBillable(entry: TimeEntry): boolean {
  return entry.customerId == null || !INTERNAL_CUSTOMER_IDS.has(entry.customerId);
}
```

**Rationale**: Confirmed by the user during the speckit.clarify session (2026-03-02).  
A `ReadonlySet` constant makes the rule easy to extend later without a config system  
(the set is a single source of truth in `marginCalculator.ts`).

**Alternatives considered**:
- Environment variable list — Rejected by user: no config needed.
- `projectId === null` heuristic — Rejected: would exclude valid billable entries with  
  no project assigned.

---

## Decision 5: Where to add `hourlyRate` to user data

**Decision**: Add `hourlyRate?: number` to both the backend `User` interface  
(`backend/src/types/user.types.ts`) and the frontend `User` interface  
(`src/types/user.ts`). The field is populated manually in `users.json`.

**Rationale**: Mirrors `currentSalary` exactly. No new API endpoint is needed — the  
existing `GET /api/users` and `GET /api/users/:id` routes already expose all user fields  
from `users.json`.

**Alternatives considered**:
- Separate hourly-rate endpoint/file — Rejected: unnecessary indirection for a single field.
- Deriving hourly rate from salary — Rejected: sales rate ≠ cost rate; must be independent.

---

## Summary table

| # | Topic | Decision | Key Rationale |
|---|-------|----------|---------------|
| 1 | Computation location | Frontend (`marginCalculator.ts`) | Consistent with `getTimeSummary`; no new backend needed |
| 2 | Working-day algorithm | Pure `Date` loop | Zero deps; trivially testable |
| 3 | Currency format | `Intl.NumberFormat('en-150')` → `"75,000 SEK"` | Only locale producing correct format |
| 4 | Billability rule | `customerId === "2"` is non-billable | Confirmed by user; hardcoded constant |
| 5 | `hourlyRate` storage | Field on existing `User` type / `users.json` | Mirrors `currentSalary` pattern |
