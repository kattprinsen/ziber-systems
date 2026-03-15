# Feature Specification: Group Performance Dashboard

**Feature Branch**: `007-group-performance-dashboard`  
**Created**: 2026-03-14  
**Status**: Draft  
**Input**: User description: "lets build so that the home page actually displays what all the consultants togheter make and contribute togheter, as a joined view of how the group is performing..."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Group Performance on Home Page (Priority: P1)

A manager or team member visits the home page and immediately sees how the group of consultants is performing as a whole for the current month. The dashboard shows aggregated contribution compared against a configured target, displayed in a clear graph.

**Why this priority**: This is the core value of the feature — turning the home page from an empty landing into a meaningful at-a-glance view of collective output. Everything else builds on top of this.

**Independent Test**: Can be fully tested by loading the home page and verifying that a graph appears showing combined consultant contribution with a visible target line, even when some consultant data is missing or incomplete.

**Acceptance Scenarios**:

1. **Given** the home page is loaded, **When** the user views the page, **Then** a performance graph is visible showing the combined contribution of all consultants for the current month.
2. **Given** one or more consultants have no time data for the month, **When** the graph renders, **Then** it still displays correctly using available data, treating missing contributors as zero or excluding them gracefully with a visual indicator.
3. **Given** a target value has been configured, **When** the graph renders, **Then** a target line is visually displayed alongside the actual contribution value.
4. **Given** no target has been configured, **When** the graph renders, **Then** the graph still renders without the target line and shows a placeholder indicating no target is set.

---

### User Story 2 - Configure Group Performance Target (Priority: P2)

A manager can set and update a monthly billed-hours target for the group directly on the dashboard using an inline edit control next to the target line, without leaving the page.

**Why this priority**: Without a target, the graph shows a number in a vacuum. The target is what makes the dashboard actionable and meaningful.

**Independent Test**: Can be tested independently by clicking the inline edit icon next to the target line, entering a numeric hours target, saving, and confirming the chart's reference line updates without a page navigation.

**Acceptance Scenarios**:

1. **Given** the user clicks the inline edit control on the target line, **When** they enter a numeric target value and save, **Then** the graph updates to display the new target line immediately.
2. **Given** a target is already saved, **When** the user changes the value and saves again, **Then** the new target replaces the old one on the graph.
3. **Given** a non-numeric or invalid value is entered, **When** the user attempts to save, **Then** an error is shown and the previous target is preserved.

---

### User Story 3 - Navigate Monthly Performance History (Priority: P3)

A user can browse the group's past performance month by month, going backwards and forwards in time to review historical contribution data.

**Why this priority**: A single current-month view is useful, but historical context is essential for tracking trends and understanding if performance is improving or declining over time.

**Independent Test**: Can be tested independently by navigating to the previous month on the dashboard and verifying the graph updates to show that month's data (or an empty/partial state if no data exists for that month).

**Acceptance Scenarios**:

1. **Given** the user is viewing the current month, **When** they click "previous month", **Then** the graph updates to show the previous month's aggregated group performance.
2. **Given** the user has navigated multiple months back, **When** they click "next month", **Then** the graph steps forward month by month.
3. **Given** the user is viewing the current month, **When** they attempt to navigate to a future month, **Then** forward navigation is disabled.
4. **Given** no data exists for a historical month, **When** the user navigates to that month, **Then** the graph displays an appropriate empty state rather than an error.

---

### User Story 4 - View Individual Consultant Contributions Within Group (Priority: P4)

Within the group performance view, a user can see how each individual consultant contributed to the group total for the selected month.

**Why this priority**: The group total is the headline, but understanding which consultants are driving or lagging behind performance adds meaningful diagnostic value.

**Independent Test**: Can be tested independently by verifying that each consultant's individual contribution is visible as a breakdown within the group view using only available data.

**Acceptance Scenarios**:

1. **Given** the group performance dashboard is visible, **When** the user views it, **Then** a per-consultant breakdown is shown alongside the group total.
2. **Given** a consultant has no data for the selected month, **When** the breakdown is displayed, **Then** that consultant appears with a zero or "no data" indicator rather than being silently omitted.

---

### Edge Cases

- What happens when **no consultants have data** for the selected month? → Empty state is shown with a clear message; the graph does not error or break.
- What happens when the **Tidig API is unavailable**? → Previously saved snapshot data is used; no live-fetch errors surface to the user.
- What happens when **only partial data exists** (e.g., some consultants missing)? → Available data is shown; missing users are visually indicated.
- What happens when a consultant is **added or removed** mid-month? → History reflects who was active at the time; current month reflects current roster.
- What happens when the **target is not yet configured**? → Graph renders without a target line; a placeholder or call-to-action is shown.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The home page MUST display a multi-month bar chart showing the combined billed hours of all consultants (the primary metric for this iteration), with one bar per month and a horizontal target line across all bars. The chart MUST show a rolling window of recent months and update when the user navigates months. The data model MUST support replacing billed hours with margin contribution (SEK) once full cost data is available, without breaking existing snapshots.
- **FR-002**: The graph MUST display a configurable target line representing the group's monthly goal.
- **FR-003**: The target value MUST be stored in a JSON config file on the backend and editable via an inline edit control on the dashboard (e.g., an edit icon next to the target line), with no code change or redeployment required.
- **FR-004**: The dashboard MUST render correctly even when time data is incomplete or unavailable for some or all consultants.
- **FR-005**: Users MUST be able to navigate backwards and forwards through months to view historical group performance.
- **FR-006**: The system MUST store a monthly performance snapshot per consultant so historical views are possible without depending on live API availability. Snapshots are captured or refreshed on-demand when a user navigates to a month; if the live API is unavailable at that point, the last saved snapshot is used instead.
- **FR-007**: Each consultant's individual contribution MUST be visible as a breakdown within the group view.
- **FR-008**: The data model for each consultant's monthly record MUST be extensible to accommodate additional cost and quality fields in future iterations without requiring a breaking schema change or migration of historical records.
- **FR-009**: The system MUST handle missing or partial data gracefully, displaying what is available without surfacing errors to the user.
- **FR-010**: Navigation to future months MUST be prevented or disabled.

### Key Entities

- **MonthlyGroupSnapshot**: Represents the aggregated group performance for a single calendar month. Key attributes: year, month, total billed hours, isPartial flag, snapshot timestamp, list of consultant entries. (Target value is stored separately in `PerformanceTarget` and is not embedded in the snapshot.)
- **ConsultantMonthlyEntry**: Represents an individual consultant's contribution within a monthly snapshot. Key attributes: consultant reference, billed hours (primary metric for this iteration), data completeness status (complete / partial / missing). Designed to accept additional fields (e.g., revenue, direct cost, margin contribution) without breaking existing records.
- **PerformanceTarget**: A stored configuration representing the group's monthly goal, persisted in a JSON config file on the backend. Key attributes: target amount, period it applies to, who last updated it, when it was last updated. Editable via an in-app settings form. Supports one active target with per-month override capability as a future extension.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The home page loads and displays the group performance graph in under 2 seconds under normal conditions.
- **SC-002**: The dashboard remains fully functional and displays available data even when 100% of live time-entry API data is unavailable (offline/degraded mode).
- **SC-003**: A user can navigate at least 6 months back in history without errors or broken states. The rolling chart window displays the 6 most recent months ending at the selected month; navigating beyond 6 months is supported by the navigation controls and shows available snapshot data.
- **SC-004**: The target value can be updated and reflected in the graph within a single user interaction (enter and save), with no code deployment required.
- **SC-005**: Adding a new data field to the consultant monthly record (e.g., direct cost, billable hours) requires no changes to existing stored records and no data migration.
- **SC-006**: All consultants present in the system are accounted for in the group view — none are silently omitted, even when their data is missing.

## Assumptions

- "Contribution" for this iteration is **billed hours**, sourced from Tidig time entry data. The data model is designed so that revenue and margin contribution (revenue minus direct costs) can be added as additional fields per consultant monthly entry without altering existing records, consistent with the `006-margin-contribution` feature patterns.
- The target is a single numeric value per month for the whole group; per-consultant targets are out of scope for this iteration.
- Monthly is the granularity unit for history; weekly or daily breakdowns are out of scope.
- The "home page" refers to the existing root route of the application.
- Authorization for target configuration follows the existing application's access patterns; no new auth system is introduced.
- The existing consultant/user list (from `users.json` or Tidig sync) is the source of truth for who is in the group.

## Clarifications

### Session 2026-03-14

- Q: When/how are monthly performance snapshots written? → A: On-demand when a user navigates to a month; cached snapshot is used if live API is unavailable at that time.
- Q: What is the primary graph visual structure? → A: Multi-month bar chart — one bar per month, horizontal target line across all bars.
- Q: Where is the performance target stored and how is it configured? → A: JSON config file on the backend; editable via a small in-app settings form.
- Q: What is the primary contribution metric and y-axis unit for the graph? → A: Billed hours (from Tidig time entries) for this iteration; schema supports adding revenue and margin contribution later without migration.
- Q: Where does the target configuration UI live? → A: Inline on the dashboard — edit icon next to the target line; no separate settings page or route needed.
