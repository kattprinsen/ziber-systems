# Feature Specification: Margin Contribution Calculation Per User

**Feature Branch**: `006-margin-contribution`  
**Created**: 2026-03-02  
**Status**: Draft  
**Input**: User description: "Margin contribution calculation on each user using hourly rate minus salary cost, accounting for variable monthly working days. Time data sourced from Tidig API/Time. Quick overview on user card, full breakdown on user detail page."

## User Scenarios & Testing *(mandatory)*

### User Story 1 – Margin Contribution Panel on User Detail Page (Priority: P1)

A manager opens an employee's detail page and sees a dedicated "Margin Contribution" panel for the current month. The panel shows: total billable hours reported so far, total billable revenue (hours × the user's hourly rate), the monthly salary cost, and the resulting margin contribution in both absolute (SEK) and percentage terms. It also shows how many working days have passed out of the total working days in the month, giving context for how complete the picture is.

**Why this priority**: This is the foundational view that makes the calculation transparent and auditable. All other surfaces (card summary, history) derive from this core panel.

**Independent Test**: Open the detail page for user SBQ for the current month. Verify that billable hours match the sum of qualifying Tidig time entries for the period, revenue equals those hours times the configured hourly rate, cost equals `currentSalary`, and margin = revenue − cost.

**Acceptance Scenarios**:

1. **Given** a user with a configured hourly rate and salary, **When** the detail page loads, **Then** the Margin Contribution panel is visible showing the current month, billable hours, revenue (SEK), salary cost (SEK), margin amount (SEK), and margin percentage.
2. **Given** the panel has loaded time data, **When** the figures are displayed, **Then** they are calculated from actual Tidig time entries for the current calendar month to date.
3. **Given** no billable time entries exist for the current month, **When** the panel loads, **Then** it shows zero revenue, full salary as cost, a negative margin, and a "no billable time reported yet" note.
4. **Given** the Tidig API call fails, **When** the panel attempts to load, **Then** a user-friendly error message is shown and the rest of the user detail page remains fully functional.
5. **Given** a user has no hourly rate configured, **When** the panel attempts to calculate, **Then** it displays a "hourly rate not configured" notice instead of silently showing zeros.

---

### User Story 2 – Margin Contribution Entry Point on User Card (Priority: P2)

A manager browsing the users list sees a static "Margin" section on each user card that indicates whether a margin calculation is available for that user (i.e., whether an hourly rate is configured). The card does not fetch live Tidig data; it serves as a quick entry point directing the manager to open the user detail page for the full calculation.

**Why this priority**: The card overview gives a fast signal about whether a margin rate is configured, without creating N parallel Tidig API calls when the list loads. P1 must be stable first.

**Independent Test**: With US1 implemented, verify the card shows the correct state (rate configured vs. not configured) using only the local user record — no network call to Tidig is required.

**Acceptance Scenarios**:

1. **Given** a user card is rendered and the user has a configured hourly rate, **When** the card loads, **Then** the card shows a "Margin available — view details" indicator alongside the user's name and role.
2. **Given** the hourly rate is not configured for a user, **When** the card renders, **Then** the margin area shows "Rate not set" with a neutral style.
3. **Given** any user card, **When** the manager clicks through to the user detail page, **Then** the full Margin Contribution panel with live figures is shown there.

---

### User Story 3 – Month Selector for Historical Margin View (Priority: P3)

A manager can navigate to a previous calendar month on the user detail page's Margin Contribution panel to review the margin contribution for that period, using time entries from Tidig for that month and the salary applicable at query time.

**Why this priority**: Historical analysis is valuable but not blocking — the current-month view (P1) is the primary need.

**Independent Test**: With US1 implemented, add a month picker to the panel. Select a past month for a user with known Tidig entries and verify all calculated figures match a manual calculation for that month.

**Acceptance Scenarios**:

1. **Given** the panel is showing the current month, **When** the manager selects a previous month, **Then** the panel re-fetches Tidig data for that month and recalculates all figures.
2. **Given** a historical month is selected, **When** the data loads, **Then** the working-days count and billable hours reflect the selected month, not the current one.
3. **Given** a historical month has no billable entries, **When** viewed, **Then** the panel shows zero revenue and the full monthly salary as cost.

---

### Edge Cases

- What happens when a user has reported hours spanning a weekend or public holiday? Working-day count should only include Monday–Friday weekdays; reported hours on those days are still counted if present.
- What if the hourly rate changes mid-month? The value configured at the time of viewing is used; historical rate tracking is out of scope.
- What if a user's salary changes mid-month? Same approach — current `currentSalary` is used at query time.
- What if Tidig returns multiple entries for the same employee on the same date? All qualifying entries are summed.
- How are partial-day entries handled (e.g., 4 h sick + 4 h billable on the same day)? Only qualifying billable hours are counted; the classification is per entry, not per day.
- What if a user has no Tidig `employeeID` set? The margin panel cannot fetch data and must display a clear "employee ID not linked" message.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST retrieve time entries for a user from Tidig `/Api/Time` for a given calendar month to calculate margin contribution.
- **FR-002**: The system MUST classify each time entry as either **billable** or **non-billable**. Any entry whose `customerId` equals `"2"` (Consid AB) is non-billable; all other entries are billable. This rule is implemented as a hardcoded constant.
- **FR-003**: Each user record MUST include an optional `hourlyRate` field (SEK/hour) representing the sales price charged to clients.
- **FR-004**: The system MUST use the user's existing `currentSalary` field (monthly gross, SEK) as the full monthly cost regardless of days worked.
- **FR-005**: The system MUST calculate the number of working days (Monday–Friday) in the selected calendar month to display capacity context.
- **FR-006**: Margin contribution MUST be calculated as: **Margin = (billable_hours × hourly_rate) − currentSalary**.
- **FR-007**: The user detail page MUST display a Margin Contribution panel showing: selected month, billable hours, revenue (SEK), salary cost (SEK), margin amount (SEK), margin percentage, working days passed, and total working days in the month.
- **FR-008**: The user card MUST display a static margin availability indicator based solely on whether `hourlyRate` is configured on the user record — no Tidig API call is made from the card. When configured, the card shows a "View margin details" prompt; when not configured, it shows "Rate not set".
- **FR-009**: If a user's `hourlyRate` is not configured, the system MUST show a "hourly rate not configured" notice in both the panel and the card rather than silently displaying zeros.
- **FR-010**: The margin panel MUST load automatically when the user detail page opens, without requiring a manual refresh.
- **FR-011**: The system MUST handle Tidig API failures gracefully, surfacing a user-friendly error on the panel without breaking the rest of the user detail page.
- **FR-012**: The month selector (US3) MUST allow navigating to any previous calendar month and trigger a re-fetch and recalculation for that period.
- **FR-013**: The cost model MUST be designed so that additional cost items (e.g., travel reimbursements) can be added in future without restructuring the feature.
- **FR-014**: All monetary amounts displayed in the UI MUST use international format with a comma as the thousands separator and the ISO currency code as suffix (e.g., `75,000 SEK`). Margin percentage MUST be shown to one decimal place (e.g., `25.0%`).

### Key Entities

- **User**: Existing entity. Extended with `hourlyRate` (SEK/hour, optional). Already has `currentSalary` (monthly SEK). Note: `employeeID` exists in the backend type (`backend/src/types/user.types.ts`) and `users.json` but is **absent from the frontend `User` interface** — T002 adds it (maps to Tidig `empId`).
- **TimeEntry**: Existing entity from Tidig integration. Fields: `date`, `hours`, `customerId`, `customerName`, `projectId`, `projectName`. Billability is determined by checking `customerId` against the internal customer list (FR-002).
- **MarginResult**: Computed structure (not persisted). Fields: `month` (YYYY-MM), `billableHours`, `revenue` (SEK), `salaryCost` (SEK), `margin` (SEK), `marginPercentage` (`(margin ÷ revenue) × 100`; undefined/"N/A" when revenue is zero), `workingDaysInMonth`, `workingDaysPassed`, `hourlyRate`, `hasHourlyRate`.
- **InternalCustomerConfig**: A hardcoded constant (value: `"2"`) identifying Consid AB as the sole non-billable Tidig customer.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The margin contribution panel on the user detail page displays calculated figures within 3 seconds of the page opening under normal network conditions.
- **SC-002**: The static margin indicator on the user card correctly reflects whether `hourlyRate` is configured — showing "Margin available" when set and "Rate not set" when absent — with zero Tidig network requests, 100% of the time.
- **SC-003**: A manager can determine the current month's margin contribution for any user in under 10 seconds by opening that user's detail page.
- **SC-004**: When a Tidig API call fails, the user receives a visible error message within 5 seconds and can still read all other information on the page.
- **SC-005**: Billable hours shown in the margin panel equal the sum of qualifying Tidig time entries for the same user and month with zero rounding discrepancy.

---

## Clarifications

### Session 2026-03-02

- Q: Which formula defines `marginPercentage`? → A: `(margin ÷ revenue) × 100` — margin as a share of revenue. When revenue is zero, `marginPercentage` is undefined and displayed as "N/A".
- Q: How should the user card load margin data? → A: The card does NOT call Tidig. It shows a static "View details" prompt only. Live margin figures are shown exclusively on the user detail page.
- Q: Who can see the Margin Contribution panel and salary/rate figures? → A: Any user who can view the user detail page can see the full margin panel including salary and hourly rate components. No additional access control is applied.
- Q: Where is the internal customer ID list stored? → A: No list needed. Consid AB (`customerId: "2"`) is the sole known internal customer and is hardcoded as a constant. No external config or environment variable required.
- Q: How should SEK monetary amounts be formatted in the UI? → A: International format — comma as thousands separator, ISO currency code suffix: e.g. `75,000 SEK`.

## Assumptions

- Swedish public holidays are **not** excluded from the working-day count in the initial implementation; only Monday–Friday weekdays are counted. Public holiday support can be added in a later iteration.
- Each user has a single hourly rate. Per-customer or per-project rate differentiation is out of scope for this feature.
- Salary cost is the full monthly `currentSalary` — it is treated as a fixed cost for the month regardless of how many days have been worked or reported.
- If hourly rate or salary changes during a month, the value configured at query time is used. Historical rate/salary tracking is out of scope.
- Additional cost items (travel, equipment, etc.) are out of scope but the cost model should allow for future extension.
- Consid AB (`customerId: "2"`) is the only non-billable customer. Its ID is hardcoded as a constant — no external config or list mechanism is needed.
- Access to the Margin Contribution panel, including salary and hourly rate figures, is not restricted beyond the existing user detail page access. No role or permission system is required for this feature.
