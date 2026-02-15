# Feature Specification: Money Slider Tool

**Feature Branch**: `002-money-slider-tool`  
**Created**: February 13, 2026  
**Status**: Draft  
**Input**: User description: "lets create a tool, we can add it to the tools page and call it money-slider, it is basicaly a slider used in salaraydiscussions with users, i want one input field where the suggested salary can be input, and then i want to calculate how much that input in numbers would mean in %increase, we need to add somethings to the user profile salary, this changes yearly"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Calculate Salary Increase Percentage (Priority: P1)

A manager preparing for salary review discussions needs to quickly calculate what percentage increase a proposed salary represents for an employee. They navigate to the Money Slider tool on the Tools page, select an employee from the list, enter the proposed new salary amount, and immediately see the percentage change displayed.

**Why this priority**: This is the core value proposition - enabling quick salary comparison calculations during negotiations. Without this, the tool has no purpose.

**Independent Test**: Can be fully tested by selecting any employee with a current salary, entering a new salary value, and verifying the percentage calculation is displayed correctly and delivers immediate insight into the salary change magnitude.

**Acceptance Scenarios**:

1. **Given** a user is viewing a specific employee's profile with current salary of $50,000, **When** they navigate to the Money Slider tool and enter proposed salary of $55,000, **Then** the system displays "+10%" increase
2. **Given** a user enters a proposed salary lower than current salary, **When** the calculation is performed, **Then** the system displays the result as a negative percentage (e.g., "-5%")
3. **Given** a user enters a proposed salary equal to current salary, **When** the calculation is performed, **Then** the system displays "0%" change
4. **Given** a user has not yet entered a proposed salary, **When** viewing the tool, **Then** the percentage display shows a neutral state or placeholder

---

### User Story 2 - Visual Salary Comparison Slider (Priority: P2)

A manager using the Money Slider tool wants to visually understand the salary adjustment magnitude. After entering a proposed salary, they see an interactive visual slider that shows the current salary position, the proposed salary position, and the percentage change represented graphically along a scale.

**Why this priority**: Visual representation aids quick understanding and makes salary discussions more intuitive, but the tool is functional without it (P1 covers basic calculation).

**Independent Test**: Can be tested by entering various salary amounts and verifying that the visual slider accurately represents the percentage change with appropriate positioning and visual indicators. Delivers enhanced user experience through visual feedback.

**Acceptance Scenarios**:

1. **Given** a percentage increase is calculated, **When** the visual slider is displayed, **Then** the current salary appears as a marker on the left, proposed salary as a marker on the right, with the percentage fill between them
2. **Given** a salary decrease is proposed, **When** the slider renders, **Then** visual styling indicates a reduction (e.g., different color)
3. **Given** a large percentage change (>20%), **When** displayed on the slider, **Then** the scale adjusts appropriately to show the full range clearly

---

### User Story 3 - Track Yearly Salary Updates (Priority: P3)

HR administrators need to maintain current salary information for all employees as salaries change annually. When an employee's salary is updated through the Money Slider tool or elsewhere in the system, their user profile reflects the new current salary and maintains a history of previous salaries with effective dates.

**Why this priority**: Essential for data accuracy over time and enables year-over-year comparisons, but the tool can function with manually updated salaries for initial release.

**Independent Test**: Can be tested by updating an employee's salary, verifying it persists in their profile, and confirming the Money Slider tool uses the updated value for subsequent calculations. Delivers long-term data integrity and historical tracking.

**Acceptance Scenarios**:

1. **Given** an employee's current salary is recorded in their profile, **When** the salary is updated, **Then** the new salary becomes the baseline for future Money Slider calculations
2. **Given** a salary has been updated, **When** viewing the employee profile, **Then** the salary change is timestamped with the effective date
3. **Given** an employee has multiple historical salary entries, **When** using the Money Slider tool, **Then** only the most recent current salary is used for percentage calculations

---

### Edge Cases

- What happens when a user enters non-numeric values or negative numbers in the proposed salary field?
- How does the system handle salary values of zero for either current or proposed amounts?
- What occurs when proposed salary creates an extremely large percentage change (e.g., 500% increase)?
- How does the tool behave when an employee profile has no current salary recorded?
- What happens if the user deletes all content from the salary input field?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a dedicated Money Slider tool accessible from the Tools page
- **FR-002**: System MUST allow users to select an employee from the existing user list to perform salary calculations
- **FR-003**: System MUST display the selected employee's current salary as a read-only reference value
- **FR-004**: System MUST provide an input field for entering proposed salary amounts
- **FR-005**: System MUST validate that proposed salary inputs are positive numeric values
- **FR-006**: System MUST calculate the percentage difference between current and proposed salary when a valid proposed amount is entered
- **FR-007**: System MUST display percentage results with appropriate sign (+ for increases, - for decreases)
- **FR-008**: System MUST display percentage values with 2 decimal places (e.g., "10.53%")
- **FR-009**: System MUST show calculated results immediately as the user types with real-time calculation updating on each keystroke
- **FR-010**: User profiles MUST include a current salary field to store employee salary information
- **FR-011**: System MUST allow authorized users to update employee salary information in user profiles
- **FR-012**: System MUST display appropriate error messages for invalid salary inputs (negative numbers, non-numeric characters)
- **FR-013**: System MUST handle cases where an employee has no current salary recorded with a clear message
- **FR-014**: System MUST preserve precision in salary and percentage calculations to avoid rounding errors in displayed amounts
- **FR-015**: System MUST present the visual slider representation showing current salary, proposed salary, and percentage change magnitude

### Key Entities

- **User Profile**: Represents an employee in the system, includes current salary amount, salary history with effective dates, and other employee information. Related to salary calculations performed in the Money Slider tool.
- **Salary Calculation**: Represents a single calculation instance showing current salary, proposed salary, calculated percentage change, and timestamp of when calculation was performed. Related to both User Profile (whose salary is being evaluated) and the Money Slider Tool session.

## Assumptions and Dependencies

### Assumptions

- Users have appropriate authorization to view and access employee salary information
- The existing user management system provides a list of employees that can be queried
- Users understand basic percentage calculations and salary comparison concepts
- Currency format and locale handling will follow system-wide standards already established
- Real-time calculation performance is sufficient for typical salary value ranges (not requiring debouncing or throttling)

### Dependencies

- **Tools Page Infrastructure**: Feature requires an existing Tools page where the Money Slider tool can be added
- **User Management System**: Feature depends on existing user profiles and user list functionality
- **User Profile System**: Feature requires ability to read and update user profile data, including adding salary fields
- **Authorization System**: Feature assumes existing role-based or permission-based access control to manage who can view/edit salary information

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete a salary percentage calculation in under 15 seconds from opening the tool to seeing results
- **SC-002**: 95% of salary calculations produce mathematically accurate percentage results with no rounding errors in the displayed percentage
- **SC-003**: Users can successfully perform salary comparisons for any employee in the system who has a current salary recorded
- **SC-004**: The tool correctly handles and displays results for salary changes ranging from -50% to +200% without visual or calculation errors
- **SC-005**: 90% of users successfully complete their first salary calculation without assistance or error messages
- **SC-006**: The visual slider displays correctly and proportionally for all valid salary ranges without clipping or overflow
- **SC-007**: Salary updates persist in user profiles and are immediately available for subsequent calculations without requiring page refresh
