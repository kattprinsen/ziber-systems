# Quickstart: Margin Contribution Calculation Per User

**Branch**: `006-margin-contribution`  
**Status**: Implementation guide for developers

---

## What this feature does

Adds a **Margin Contribution** panel to every user's detail page. It fetches that user's  
Tidig time entries for a selected month, classifies hours as billable or non-billable, and  
calculates: `revenue = billableHours × hourlyRate`, `margin = revenue − salary`. Results  
are shown in SEK with working-day context. User cards get a lightweight static indicator  
that shows whether a margin rate has been configured.

---

## Prerequisites

1. Backend and frontend are both running (see top-level `README.md`).
2. The user you're testing has `employeeID` set in `users.json` (e.g., `"C001"` for  
   test user Alpha).
3. The Tidig API is accessible and has time entries for the test user in the current month.

---

## Step 1: Configure hourly rates in users.json

Add `hourlyRate` to one or more users in `backend/src/data/users.json`:

```json
{
  "id": "ad567be5-...",
  "employeeID": "C001",
  "name": "Test User Alpha",
  "currentSalary": 75000,
  "hourlyRate": 1250
}
```

All 15 active users in `users.json` already have `hourlyRate` seeded (C001: 1,250 SEK/h;
C002: 1,150 SEK/h; all others: 1,000 SEK/h). Edit values as needed.

---

## Step 2: Understand billability classification

Any time entry with `customerId === "2"` (Consid AB) is treated as **non-billable**  
overhead or internal time. All other entries count toward billable revenue.

| Entry type | `customerId` | Counted? |
|------------|-------------|----------|
| Customer Project A | `"682"` | ✅ Billable |
| Internal meeting (Consid AB) | `"2"` | ❌ Non-billable |
| Sick day / holiday (Consid AB) | `"2"` | ❌ Non-billable |

---

## Step 3: View the margin panel

1. Navigate to the **Users** page.
2. Click any user who has `hourlyRate` configured.
3. On the detail page, scroll to the **Margin Contribution** section (above Tidig Time).
4. The panel automatically loads the current month's time from Tidig and displays:

   | Field | Example |
   |-------|---------|
   | Month | March 2026 |
   | Billable hours | 120 h |
   | Revenue | 144,000 SEK |
   | Salary cost | 75,000 SEK |
   | Margin | 69,000 SEK |
   | Margin % | 47.9% |
   | Working days | 16 / 21 passed |

---

## Step 4: Navigate months (US3)

Use the `‹` (left) and `›` (right) chevrons in the panel header to navigate months.
The `‹` decrements to any previous month; the `›` increments toward the current month
and is **disabled** when already viewing the current month (future months cannot be selected).
The panel re-fetches Tidig data for the selected month and recalculates all figures.

---

## Step 5: Check user cards

On the **Users** list page, each card shows either:
- `"Margin available"` — the user has an hourly rate configured.
- `"Rate not set"` — no hourly rate; click through to configure one.

The card makes **no API calls** — it reflects only the `hourlyRate` field already loaded  
with the user list.

---

## Error states

| Situation | What you see |
|-----------|-------------|
| Tidig API unreachable | "Failed to load time data from Tidig. The rest of the page is still available." |
| User has no `employeeID` | "Employee ID not linked — cannot fetch time data from Tidig." |
| User has no `hourlyRate` | "Hourly rate not configured for this user." |
| Month has zero billable hours | Zero revenue shown; "No billable time reported yet for this month." note; full salary as cost; negative margin |

---

## Manual calculation check

To verify correctness for SBQ in March 2026:

1. Open the Tidig portal and filter by `empId: SBQ`, dates `2026-03-01` to `2026-03-31`.
2. Sum `hours` for all entries where `customerId ≠ 2`.
3. Multiply by the `hourlyRate` configured in `users.json`.
4. Subtract `currentSalary`.
5. The result must match the `Margin` field in the panel exactly.
