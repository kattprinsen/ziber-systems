# Feature Specification: Consultant Contribution Analysis MVP

**Feature Branch**: `008-consultant-bookkeeping`
**Created**: 2026-03-23  
**Status**: Draft  
**Input**: Solo analysis tool for tracking consultant contributions via monthly manual hour input (billable + non-billable), with individual and team views, using a minimalist Node.js + TypeScript backend plus a framework-free Vite + TypeScript client with Tailwind.

## User Scenarios & Testing (mandatory)

### User Story 1 - Record Monthly Hours & View Current Month Summary (Priority: P1)

As the solo user, I want to input each consultant's billable and non-billable hours for a given month and immediately see a summary of individual and team contributions so that I can understand performance for that period.

**Why this priority**: This is the core workflow of the system; without it the tool provides no value.

**Independent Test**: With a set of consultants and a chosen month, I can enter hours for each active consultant, save, and then see a table of per-consultant metrics (revenue, cost approximation, margin, utilization) plus a team-level summary for that same month.

**Acceptance Scenarios**:

1. **Given** a set of active consultants with configured salary and hourly rate, **when** I open the app and select a month, **then** I see an empty hours input form for that month for each active consultant.
2. **Given** that I have entered billable and non-billable hours for each consultant for the selected month, **when** I click save, **then** the system persists the data and shows a current-month summary with per-consultant metrics and an aggregate team summary.
3. **Given** that monthly hours have already been entered for a consultant, **when** I reopen the same month, **then** the previously saved hours are pre-filled so I can review or adjust them.

---

### User Story 2 - Manage Consultants (Priority: P2)

As the solo user, I want to add, update, and inactivate consultants so that the system reflects the current team composition without losing historical data.

**Why this priority**: The team changes over time; being able to manage consultants is necessary to keep monthly analysis accurate and avoid editing data files by hand.

**Independent Test**: I can create a new consultant, update salary/hourly rate, and mark a consultant as inactive while still being able to see their historical contributions in past months.

**Acceptance Scenarios**:

1. **Given** no consultants have been defined, **when** I create a new consultant with name, salary, hourly rate, and active status, **then** the consultant appears in the list and in the monthly hours form for the current and future months.
2. **Given** an existing active consultant, **when** I update their salary or hourly rate, **then** future month calculations use the new values while past months remain consistent with their stored inputs.
3. **Given** an existing active consultant with historical entries, **when** I mark them as inactive, **then** they no longer appear in new months' input forms but their past contributions remain visible in historical views.

---

### User Story 3 - View 3-Month Team Trend (Priority: P3)

As the solo user, I want to see a rolling 3-month view of team revenue, cost, margin, and utilization so that I can quickly understand short-term trends.

**Why this priority**: Trends over a few months give better insight than isolated monthly snapshots, but this can be added after the core monthly workflow is reliable.

**Independent Test**: With at least three months of entries, I can open a 3-month trend view and see aggregated metrics per month for the team.

**Acceptance Scenarios**:

1. **Given** at least three consecutive months with saved entries, **when** I open the 3-month trend view, **then** I see a compact visualization (e.g., table or simple chart) of revenue, cost approximation, margin, and utilization per month.
2. **Given** additional months are added, **when** I open the 3-month trend view, **then** it automatically shows the last three fully entered months.

---

### Edge Cases

- What happens when a consultant has 0 total hours (billable + non-billable) for a month? (Utilization should be treated as 0 or "N/A"; no division-by-zero errors.)
- How does the system handle a consultant whose monthlySalary is 0 (pure hourly contractor)? (Cost approximation should handle this without errors.)
- What happens when I try to enter hours for a month in the future? (Either allow but clearly label, or restrict to past and current months.)
- How does the system behave when a consultant is reactivated after being inactive? (They should reappear in future months' input forms without corrupting historical data.)

## Requirements (mandatory)

### Functional Requirements

- **FR-001**: System MUST allow the user to define consultants with id, name, monthlySalary, hourlyRate, status (active/inactive), and optional notes.
- **FR-002**: System MUST allow the user to record, per consultant and per month (YYYY-MM), billableHours and nonBillableHours.
- **FR-003**: System MUST compute per-consultant metrics for a month: revenue, cost approximation, margin, and utilization.
- **FR-004**: System MUST compute a team-level summary for a month: totalRevenue, totalCost approximation, totalMargin, and averageUtilization.
- **FR-005**: System MUST present a current-month view with both per-consultant metrics and the team summary.
- **FR-006**: System MUST allow the user to add new consultants and mark existing consultants as inactive without deleting their historical data.
- **FR-007**: System MUST ensure that inactive consultants do not appear in new months' input forms but remain visible in historical views.
- **FR-008**: System MUST provide a 3-month rolling team trend view summarizing revenue, cost approximation, margin, and utilization per month once at least three months of data exist.
- **FR-009**: System MUST persist data in a NoSQL-style database or JSON-based storage behind a repository interface, not via direct ad-hoc file or DB access from UI or domain logic.
- **FR-010**: System MUST expose a minimal HTTP API consumed by a Vite + TypeScript client; no business logic is allowed directly in the client.

### Key Entities

- **Consultant**: Represents an individual consultant with stable id, name, monthlySalary, hourlyRate, status (active/inactive), startDate/endDate, and notes.
- **MonthlyEntry**: Represents a consultant's work for a specific month (YYYY-MM), including billableHours, nonBillableHours, and optional notes.
- **TeamSummary**: Represents derived metrics for a given month at the team level, including totalRevenue, totalCost approximation, totalMargin, averageUtilization, and per-consultant summary rows.

## Success Criteria (mandatory)

### Measurable Outcomes

- **SC-001**: I can complete monthly hour entry for all active consultants and view the current-month summary in under 5 minutes for a team of up to 20 consultants.
- **SC-002**: All metrics displayed in the UI (per consultant and team-level) can be traced back to underlying MonthlyEntry and Consultant data without ambiguity.
- **SC-003**: The system can display correct summaries for at least 24 months of historical data without noticeable performance issues on a typical developer laptop.
- **SC-004**: Adding or inactivating a consultant never corrupts or removes historical MonthlyEntry data.
- **SC-005**: Given at least three months of data, the 3-month trend view always shows values consistent with the underlying per-month summaries.
