# Feature Specification: Tidig Time Interval Integration

**Feature Branch**: `004-tidig-time-entries`  
**Created**: February 24, 2026  
**Status**: Draft  
**Input**: User description: "lets create and integrate timeintervall api from tidig aswell, lets connect the data with the users and lets make sure when i click on the user i can get and use the different parameters, im pasting the parameters and also how the endpoint example looks"

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - See My Tidig Time For A Period (Priority: P1)

As a consultant, I want to open my profile and see all my recorded Tidig time for a selected date range so that I can quickly understand how my time is distributed without logging in to Tidig separately.

**Why this priority**: This delivers immediate value to every user by surfacing their own time data directly in the app. It is self-contained (only needs current user context) and can be implemented without permissions for viewing other users.

**Independent Test**: Can be fully tested by logging in as a regular user, opening the user detail page, selecting a date interval (e.g., this month), and verifying that the list of time entries matches Tidig for that user and period.

**Acceptance Scenarios**:

1. **Given** I am logged in and on my user detail page, **When** I select a date interval and request my time, **Then** the system shows a list of my time entries from Tidig for that interval with date, customer, project, and hours.
2. **Given** I have no recorded time in Tidig for the selected interval, **When** I request my time, **Then** the system clearly shows that there are no entries instead of an error.

---

### User Story 2 - Filter My Time By Customer And Project (Priority: P2)

As a consultant, I want to filter my Tidig time by customer and project on my user page so that I can quickly see how much time I spent on a specific client or project for a given interval.

**Why this priority**: This adds analytical value on top of US1, helping users and managers understand where time is invested without leaving the app. It can be implemented once US1 (basic interval fetch) works.

**Independent Test**: Can be tested by choosing a date interval, selecting a specific customer/project combination, and verifying that only relevant entries for that customer/project are returned and that totals match Tidig.

**Acceptance Scenarios**:

1. **Given** I am viewing my time for a date interval, **When** I filter by a customer, **Then** only time entries for that customer are shown and totals are updated accordingly.
2. **Given** I am viewing my time for a date interval, **When** I filter by both customer and project, **Then** only time entries for that project under that customer are shown.

---

### User Story 3 - See Time Summary On User Detail (Priority: P3)

As a manager or consultant, I want to see a summary of a user's recorded time for a period (totals per customer and project) on the user detail page so that I can quickly understand overall allocation without going through raw rows.

**Why this priority**: Summaries help decision-making (where time goes, workload balance) but are less critical than simply being able to see the raw entries.

**Independent Test**: Can be tested by choosing a date interval with known time entries and verifying that the per-customer and per-project totals on the user detail page match the sum of the underlying entries from Tidig.

**Acceptance Scenarios**:

1. **Given** there are multiple time entries for a user and interval, **When** I open the time summary section, **Then** I see total hours grouped by customer and project.
2. **Given** there are no time entries for the interval, **When** I open the summary section, **Then** I see a clear "no data" state instead of zeroes that could be misinterpreted.

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- User selects a very large date interval (e.g., multiple years) and the Tidig API returns a large dataset – system must still respond within an acceptable time or show a clear loading/error state.
- User selects `fromDate` later than `toDate` – system should either prevent this selection or show a clear validation error before calling Tidig.
- Tidig API returns partial or malformed data – system should handle validation errors gracefully and show a friendly error message instead of crashing.
- Tidig API is unavailable or returns an error – system should show a clear "time data unavailable" state and allow the rest of the user page to work.
- User does not have permission to view another user's time – system must not attempt to bypass Tidig's built-in permissions and should rely on Tidig to restrict which users' time entries can be fetched.

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST allow a logged-in user to request their own Tidig time entries for a given date interval using the Tidig `/Api/Time` endpoint with `empId`, `fromDate` (inclusive), and `toDate` (exclusive).
- **FR-002**: System MUST display the fetched time entries on the user detail page, including at minimum: date, customer name or ID, project name or ID, and number of hours for each entry.
- **FR-003**: System MUST allow the user to select or change the date interval (at least start and end dates) from the user interface and refresh the displayed time entries accordingly.
- **FR-004**: System MUST allow filtering of the displayed time entries by customer and project based on Tidig parameters `customerId`, `customerName`, `projectId`, and/or `projectName`.
- **FR-005**: System MUST calculate and display summary information (e.g., total hours per customer and per project) for the selected interval on the user detail page.
- **FR-006**: System MUST validate date inputs (`fromDate`, `toDate`) before calling Tidig, preventing clearly invalid combinations (such as `fromDate` after or equal to `toDate`) from being sent.
- **FR-007**: System MUST handle Tidig API errors (network failures, 4xx/5xx responses, or invalid data) by showing a clear error state in the time section while keeping the rest of the user page functional.
- **FR-008**: System MUST log failures to fetch or process Tidig time data in a way that administrators can review (e.g., via existing logging mechanisms).
- **FR-009**: System MUST ensure that time entries are associated with the correct internal user records using the existing Tidig employee identifier (e.g., `empId` mapped from the user's `employeeID` field).
- **FR-010**: System MUST respect Tidig permissions and only access time data that Tidig returns for the current request, without adding extra restrictions beyond what Tidig enforces.

### Key Entities *(include if feature involves data)*

- **User**: Represents a person in the system with an associated Tidig employee identifier (e.g., `empId` / `employeeID`) used to request time data from Tidig.
- **Time Entry**: Represents a single recorded block of time in Tidig, including attributes such as date, number of hours, customer (ID and name), project (ID and name), and any relevant description or classification returned by the API.
- **Time Filter / Interval**: Represents the selection criteria for time queries, including `fromDate`, `toDate`, optional `empId` (derived from the current user or target user), and optional customer/project parameters.

Relationships:

- A **User** has zero or more **Time Entries** for any given interval.
- A **Time Filter / Interval** is used to query Tidig and determine which **Time Entries** are displayed for a given **User**.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: A logged-in user can load their own time entries for a typical one-month interval in under 3 seconds under normal network conditions.
- **SC-002**: At least 95% of successful time queries (for intervals up to three months) return the correct set of entries as compared to Tidig when spot-checked.
- **SC-003**: At least 90% of users in a pilot test can successfully view their own time for a selected interval without assistance.
- **SC-004**: Managers report at least a 30% reduction in the need to log into Tidig just to answer "where did the time go?" questions for the pilot group, within one month of rollout.
- **SC-005**: In the event of Tidig downtime or API errors, the rest of the user detail page remains functional, and time-related errors are clearly communicated in 100% of such cases during testing.
