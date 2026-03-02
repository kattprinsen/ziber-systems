# Component Interfaces: Margin Contribution Calculation Per User

**Branch**: `006-margin-contribution`

---

## New frontend components & services

### `src/services/marginCalculator.ts` *(new)*

Pure utility — no React, no side effects. All functions are synchronous.

```typescript
// --- Billability ---
export const INTERNAL_CUSTOMER_IDS: ReadonlySet<string>;
export function isBillable(entry: TimeEntry): boolean;

// --- Working day helpers ---
export function workingDaysInMonth(year: number, month: number): number;
// month: 0-based (0 = January)

export function workingDaysElapsed(year: number, month: number, upToDay: number): number;
// upToDay: 1-based day-of-month; pass new Date().getDate() for current month

// --- Formatting ---
export function formatSEK(amount: number): string;
// Returns: "75,000 SEK" using Intl.NumberFormat('en-150')

export function formatPercent(value: number | null): string;
// Returns: "24.5%" or "N/A" when value is null

// --- Core calculation ---
export function calculateMargin(params: MarginParams): MarginResult;
```

---

### `src/components/users/MarginContributionPanel.tsx` *(new)*

Full calculation panel rendered in `UserDetailPage`.

```typescript
interface MarginContributionPanelProps {
  userId: string;
  employeeID?: string;       // Tidig empId — if absent, shows "not linked" notice
  hourlyRate?: number | null;
  currentSalary?: number | null;
}
```

**Responsibilities:**
- Maintains `month` state (default: current `YYYY-MM`).
- Fetches time entries via `timeService.getUserTimeEntries(userId, { fromDate, toDate })`.
- Calls `calculateMargin()` to produce `MarginResult`.
- Renders the result table; handles loading, error, no-hourly-rate, and no-employee-id states.
- For US3: renders previous/next month navigation chevrons (month selector).

**Internal states:** `loading | error | no-employee-id | rate-not-set | no-billable-time | showing-figures`

---

### `src/components/users/MarginCardIndicator.tsx` *(new)*

Compact, static indicator for `UserCard`. Makes **no API calls**.

```typescript
interface MarginCardIndicatorProps {
  hourlyRate?: number | null;
}
```

**Behaviour:**
- `hourlyRate` present → renders `"Margin available"` badge (teal/neutral style) linking  
  to the user detail page.
- `hourlyRate` absent → renders `"Rate not set"` text (muted style).
- No loading state — purely derived from props.

---

## Modified components

### `src/pages/UserDetailPage/UserDetailPage.tsx`

Render `<MarginContributionPanel>` below the existing skills section, before `<UserTimeSection>`:

```tsx
<MarginContributionPanel
  userId={user.id}
  employeeID={user.employeeID}
  hourlyRate={user.hourlyRate}
  currentSalary={user.currentSalary}
/>
```

### `src/components/users/UserCard.tsx`

Render `<MarginCardIndicator>` in the card footer area:

```tsx
<MarginCardIndicator hourlyRate={user.hourlyRate} />
```

---

## API contract (no new endpoints)

The feature reuses the existing endpoint:

```
GET /api/users/:userId/time?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD
```

`fromDate` = first day of selected month, `toDate` = last day of selected month.  
Response: `ApiResponse<TimeEntry[]>` — already defined.

```
GET /api/users and GET /api/users/:id
```

Both now return `hourlyRate` (and `employeeID`) as part of the `User` object once the  
type extensions are applied.
