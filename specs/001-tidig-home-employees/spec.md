# Feature Specification: Tidig home page employees and monthly performance

**Feature Branch**: `[001-tidig-home-employees]`  
**Created**: 2026-03-15  
**Status**: Draft  
**Input**: User description: "lets refactor, on the home page i only want the employees that i get from the tidig api, basically lets look at the employee/subtree if it has children, then lets not render them, only render the children of SBQ, and lets use the existing config instead of creating a new config, with the users.json lets extend that so we add month array and each month we can go in and manually enter hours worked for that month, and lets use that when we render the group performance"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Filtered home page employees from Tidig (Priority: P1)

As a user viewing the home page, I want to see only the relevant employees from the external scheduling system, so that I am not confused by structural or grouping nodes and can focus on the actual people in the SBQ group.

**Why this priority**: The home page is the primary entry point; showing the wrong employees or structural nodes undermines trust in the dashboard and makes later performance metrics less meaningful.

**Independent Test**: Connect to a representative Tidig employee subtree that includes SBQ and its descendants, then verify that the home page only shows direct SBQ child employees that are not parents of other nodes (no structural/group nodes rendered).

**Acceptance Scenarios**:

1. **Given** the external employee subtree includes a node representing SBQ with one or more child employees, **When** the home page loads, **Then** only the employee nodes that are direct children of SBQ are rendered and SBQ itself is not listed as an employee.
2. **Given** a node in the subtree has children (for example, is itself a group or manager node), **When** the home page renders employees, **Then** that parent node is not rendered in the employee list even if it appears in the subtree response.

---

### User Story 2 - Maintain monthly hours per employee (Priority: P2)

As someone maintaining internal data, I want to be able to record, month by month, how many hours each employee has worked using an existing user data file, so that the group performance view can reflect actual work without requiring changes to the external system.

**Why this priority**: Group performance needs controlled, manually curated data for hours worked; extending an existing user data file is less error-prone than introducing new configuration mechanisms.

**Independent Test**: Update the user data file for a small set of employees by adding monthly hour entries for a few months, reload the dashboard, and verify that the new values appear in group performance calculations without changing the external system.

**Acceptance Scenarios**:

1. **Given** the user data file defines a set of employees, **When** monthly hours are added for a specific employee for a given month, **Then** that month’s hours are available for use in group performance calculations.
2. **Given** some employees do not yet have any monthly hours recorded, **When** the group performance view loads, **Then** these employees are still present but contribute zero recorded hours until data is added.

---

### User Story 3 - Use existing configuration for group performance (Priority: P3)

As the person responsible for configuration, I want the home page employee filtering and monthly hours to use the existing configuration and user data structures, so that I do not have to manage new configuration files or environment settings.

**Why this priority**: Reusing existing configuration paths and user data structures keeps the system simpler and reduces the likelihood of configuration drift or mistakes.

**Independent Test**: Configure the SBQ group and user data using current mechanisms, deploy the changes, and verify that no new configuration files or environment keys are required to achieve the new behavior.

**Acceptance Scenarios**:

1. **Given** the existing configuration already identifies which subtree and group to use for the home page, **When** the feature is enabled, **Then** no additional configuration file or environment variable is required to determine which employees to render.
2. **Given** the user data file already exists, **When** the monthly hours structure is added, **Then** all existing consumers of the user data continue to work without needing to read new configuration locations.

---

### Edge Cases

- What happens when the external employee subtree for SBQ contains no child employees (for example, due to misconfiguration or upstream changes)?
- How should the home page behave when an employee appears in the external subtree but does not exist in the user data file?
- How is group performance displayed for months where no hours have been recorded yet for any employee?
- What happens if monthly hours data is partially filled in (some employees have some months, others have none)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST derive the home page employee list from the external employee subtree for the configured SBQ node and MUST only render employee nodes that are direct children of SBQ.
- **FR-002**: The system MUST exclude from the home page employee list any subtree nodes that themselves have children, treating these as structural or grouping nodes rather than employees to display.
- **FR-003**: The system MUST store, for each employee in the user data file, an optional collection of monthly hour entries that can be maintained manually without interacting with the external system.
- **FR-004**: The system MUST use the monthly hour entries from the user data file for the current calendar month as an input when computing and displaying group performance on the home page.
- **FR-005**: The system MUST reuse existing configuration mechanisms (for example, existing identifiers or flags for which subtree and group to use) and MUST NOT require new configuration files or environment settings to enable the filtered employee list and monthly hours behavior.
- **FR-006**: The system MUST display, alongside monthly hours, a monetary group performance measure in SEK on the home page. SEK MUST be derived by multiplying each employee’s current-calendar-month hours from `monthlyHours` with that employee’s configured SEK rate (reusing existing salary/margin rate fields and calculator utilities), summing over all SBQ employees. The calculation MUST apply a consistent rounding rule (for example, rounding to the nearest whole SEK) and formatting (for example, `12 345 SEK`).

### Key Entities *(include if feature involves data)*

- **Employee node (external)**: Represents a person or structural node in the external employee subtree, including identifiers, parent relationships, and an indication of whether the node has children.
- **Employee record (internal)**: Represents the local representation of an employee in the user data file, including identifiers that map to external employee nodes and any additional local attributes.
- **Monthly hours entry**: Represents the manually maintained number of hours worked for a specific employee in a specific calendar month, associated with an employee record.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On the home page, 100% of rendered employees originate from the configured SBQ subtree and none of the rendered entries correspond to structural or grouping nodes that have children.
- **SC-002**: After updating monthly hours for a given employee and month in the user data file, the group performance view reflects the updated values on the next refresh without additional configuration changes.
- **SC-003**: No new configuration files or environment settings are introduced to support this feature; all behavior is controlled through existing configuration and the extended user data file.
- **SC-004**: Across three consecutive calendar months of manual data entry, at least 90% of sampled home page checks (minimum 10 checks per month) show employee lists and group performance values that match the underlying `users.json` data within a ±2% tolerance on both hours and SEK totals.
- **SC-005**: For the current calendar month, the group performance view’s total hours and total SEK for SBQ employees match the sum of the corresponding `monthlyHours` and rate data in `users.json` within ±1% (or ±1 SEK if lower) for all validation samples during manual QA.

## Clarifications

### Session 2026-03-15

- Q: For the group performance on the home page, over what time period should the monthly hours data be aggregated by default? → A: Use the current calendar month only as the default aggregation period.
- Q: Should the group performance view also display SEK values or only billable hours? → A: It should display SEK as well as hours, using the same data sources as the hours-based calculation.
