# Research: Money Slider Tool

**Feature**: Money Slider Tool  
**Branch**: 002-money-slider-tool  
**Date**: February 13, 2026  
**Purpose**: Document technical research and design decisions for salary percentage calculator

## Research Topics

### 1. Real-time Calculation Patterns in React

**Research Question**: What is the best approach for implementing real-time salary percentage calculations as the user types?

**Findings**:
- **Controlled Components**: React's controlled component pattern with `useState` provides immediate state updates suitable for real-time calculations
- **Performance Considerations**: For simple mathematical operations (percentage calculation), no debouncing or throttling is necessary as the calculation is synchronous and fast (<1ms)
- **Input Synchronization**: Using `onChange` event with controlled inputs ensures calculation updates on every keystroke per FR-009 requirement

**Decision**: Use controlled React components with `onChange` handlers for real-time calculation

**Rationale**: 
- Simple percentage calculation (newSalary - currentSalary) / currentSalary * 100 is computationally trivial
- No backend API calls needed for calculation (performed client-side)
- Provides immediate visual feedback for better UX
- Aligns with React best practices for form inputs

**Alternatives Considered**:
- **Debounced input**: Rejected because it introduces artificial delay for a fast calculation
- **Calculate on blur**: Rejected because spec requires real-time update (FR-009)
- **Web Workers**: Rejected due to unnecessary complexity for simple arithmetic

---

### 2. Number Precision and Formatting

**Research Question**: How should we handle decimal precision for salary amounts and percentage calculations to avoid floating-point errors?

**Findings**:
- **JavaScript Number type**: Uses IEEE 754 double-precision (53-bit mantissa) which is sufficient for financial calculations up to ~9 quadrillion with precision
- **Percentage precision**: Specification requires 2 decimal places (e.g., "10.53%")
- **Rounding**: `toFixed(2)` method provides consistent rounding to 2 decimal places
- **Currency formatting**: `Intl.NumberFormat` provides locale-aware currency formatting

**Decision**: 
- Use native JavaScript `Number` type for all salary calculations
- Apply `toFixed(2)` for percentage display
- Use `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })` for salary display

**Rationale**:
- Salary values up to $10M fit well within JavaScript number precision limits
- No need for external decimal libraries (like decimal.js or big.js) given the scale
- `Intl.NumberFormat` provides standard, accessible formatting
- Simple arithmetic operations maintain precision for our use case

**Alternatives Considered**:
- **Decimal.js library**: Rejected due to added complexity and bundle size for unnecessary precision level
- **Storing cents as integers**: Rejected because it complicates UI logic without meaningful benefit for this tool
- **Custom rounding functions**: Rejected in favor of well-tested built-in `toFixed()`

---

### 3. Input Validation Strategies

**Research Question**: What validation approach ensures users enter valid salary values while maintaining good UX?

**Findings**:
- **HTML5 input type="number"**: Provides basic numeric keyboard on mobile and browser validation
- **Pattern validation**: Can enforce numeric-only input at the HTML level
- **Real-time validation**: Validate on each keystroke vs. on blur/submit
- **Error messaging**: Inline error messages provide immediate feedback

**Decision**: 
- Use `input type="number"` with `min={0}` and `step="0.01"` attributes
- Implement real-time validation checking for:
  - Non-numeric characters (filtered automatically by input type)
  - Negative values (prevented by `min={0}`)
  - Empty input (show placeholder state, not error)
  - Values exceeding $10M (show warning but allow)
- Display inline validation messages below input field

**Rationale**:
- `type="number"` provides native browser validation and mobile keyboard optimization
- Real-time validation aligns with real-time calculation requirement
- Graceful handling of edge cases improves user experience
- Accessible error messages support screen readers

**Alternatives Considered**:
- **Text input with regex**: Rejected because `type="number"` provides better mobile UX
- **Validation only on submit**: Rejected because tool has no submit action, operates in real-time
- **Strict maximum limits**: Rejected to allow flexibility for edge cases (executive salaries, multiple currencies)

---

### 4. Visual Slider Implementation

**Research Question**: What approach should be used for the visual salary comparison slider per User Story 2?

**Findings**:
- **HTML5 range input**: Native slider but limited styling control
- **Custom div-based slider**: Full control over appearance, mouse/touch interaction
- **SVG-based visualization**: Scalable, precise positioning, good accessibility
- **CSS gradients**: Can create visual fill effect without JavaScript

**Decision**: 
- Use custom div-based slider with CSS for visual representation
- Implement using:
  - Container div with defined width (% based for responsiveness)
  - Positioned markers for current and proposed salary
  - CSS gradient or filled section showing percentage change
  - Color-coded based on increase (green/orange) vs. decrease (red)

**Rationale**:
- Full control over styling to match dark UI theme (001-dark-ui-layout)
- Can be made fully accessible with ARIA labels
- Responsive design works better with div + CSS vs. constrained range input
- No external charting libraries needed for simple linear visualization

**Alternatives Considered**:
- **HTML5 range input**: Rejected due to limited styling capabilities and different interaction model (user-draggable vs. display-only)
- **Chart library (Chart.js, Recharts)**: Rejected as overkill for simple linear comparison
- **Canvas element**: Rejected due to accessibility challenges and unnecessary complexity

---

### 5. User Data Model Extension

**Research Question**: How should salary information be added to the existing User data model to support yearly updates?

**Findings**:
- **Current User type**: Contains basic employee information but no salary data
- **Salary history requirements**: Per FR-011, need to track historical salary changes
- **Backend storage**: Currently uses JSON file (`backend/src/data/users.json`)
- **Data consistency**: Frontend and backend User types must stay synchronized

**Decision**:
- Add to User interface:
  ```typescript
  currentSalary?: number;  // Optional to support gradual rollout
  salaryHistory?: SalaryHistoryEntry[];
  ```
- Define new type:
  ```typescript
  interface SalaryHistoryEntry {
    salary: number;
    effectiveDate: string;  // ISO 8601 date string
    updatedBy?: string;     // User ID who made the change
    notes?: string;         // Optional context
  }
  ```
- Maintain type definition consistency across frontend (`src/types/user.ts`) and backend (`backend/src/types/user.types.ts`)

**Rationale**:
- Optional `currentSalary` allows existing users without salary data
- Separate `salaryHistory` array enables year-over-year tracking per spec
- ISO date strings are JSON-compatible and sortable
- `updatedBy` field supports audit trail
- Structure supports future reporting and analytics

**Alternatives Considered**:
- **Separate Salary entity**: Rejected because salary is inherently part of user profile
- **Single salary field with update timestamp**: Rejected because it doesn't support history tracking (User Story 3 requirement)
- **Database migration**: Out of scope; continuing with JSON file storage per existing architecture

---

### 6. Testing Strategies

**Research Question**: What testing approach ensures calculation accuracy and component reliability?

**Findings**:
- **Existing test setup**: Vitest + React Testing Library already configured
- **Test types needed**: Unit tests for calculations, component tests for UI, integration tests for data flow
- **Calculation edge cases**: Zero salary, equal salaries, large percentage changes
- **Accessibility testing**: ARIA labels, keyboard navigation, screen reader compatibility

**Decision**:
- **Unit Tests** (`tests/services/salaryCalculator.test.ts`):
  - Test pure calculation function with various input combinations
  - Edge cases: 0% change, negative changes, large changes, zero values
  - Precision validation (2 decimal places)
  
- **Component Tests** (Vitest + RTL):
  - `MoneySlider.test.tsx`: Overall component behavior, employee selection
  - `SalaryInput.test.tsx`: Input validation, error states
  - `PercentageDisplay.test.tsx`: Formatting, sign display (+/-)
  - `VisualSlider.test.tsx`: Visual representation accuracy
  
- **Integration Tests**:
  - Data flow from user selection → salary fetch → calculation → display
  - Backend API calls for salary updates

**Rationale**:
- Isolated calculation logic in pure function for easy unit testing
- Component tests validate UI behavior and user interactions
- Separation of concerns makes debugging easier
- Comprehensive test coverage ensures accuracy per SC-002 (95% accurate calculations)

**Alternatives Considered**:
- **E2E tests only**: Rejected because unit tests provide faster feedback and better error isolation
- **Manual testing**: Insufficient for ensuring calculation accuracy across all edge cases
- **Snapshot testing**: Useful but not sufficient alone for calculation validation

---

## Technology Stack Summary

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Frontend Framework | React | 19.2.0 | UI components and state management |
| Type System | TypeScript | 5.9.3 | Type safety for calculations and data |
| Styling | TailwindCSS | 3.4.19 | Consistent UI styling with dark theme |
| Testing | Vitest + RTL | 4.0.18 | Unit and component testing |
| Backend Runtime | Node.js | (via Express 4.18.2) | API endpoints for salary data |
| Backend Framework | Express | 4.18.2 | RESTful API for user/salary operations |
| Storage | JSON File | N/A | Existing persistent storage mechanism |

## Implementation Priorities

Based on research findings and user story priorities:

1. **P1 - Core Calculation** (User Story 1):
   - Implement `salaryCalculator.ts` pure function
   - Create `MoneySlider.tsx` main component
   - Add `EmployeeSelector.tsx` and `SalaryInput.tsx`
   - Implement `PercentageDisplay.tsx` with formatting
   - Add to Tools page with routing

2. **P2 - Visual Representation** (User Story 2):
   - Create `VisualSlider.tsx` component
   - Implement CSS-based visual comparison
   - Add color-coding for increase/decrease

3. **P3 - Data Persistence** (User Story 3):
   - Extend User types with salary fields
   - Update backend API endpoints
   - Implement salary update functionality
   - Add salary history tracking

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Floating-point precision errors | Low | Medium | Use `toFixed(2)` for display, validate calculation tests |
| User enters invalid salary | Medium | Low | Input validation with `type="number"` and min/max constraints |
| Performance issues with real-time calc | Very Low | Low | Calculation is simple arithmetic, no optimization needed |
| Accessibility issues with custom slider | Medium | Medium | Add proper ARIA labels, keyboard navigation, screen reader support |
| Data inconsistency between FE/BE types | Low | High | Keep type definitions synchronized, add validation tests |
| Breaking existing user data structure | Low | High | Make salary fields optional, support gradual migration |

## Open Questions

**Q1**: Should the tool support multiple currencies or assume USD?  
**A**: Start with USD assumption. Currency formatting can be extracted to configuration later if needed.

**Q2**: Should salary history be limited (e.g., last 10 entries) to prevent data growth?  
**A**: Implement without limit initially. Can add limit in future if storage becomes concern.

**Q3**: Who should have permission to update salaries?  
**A**: Out of scope for this feature. Assume existing authorization system handles permission checks. Document as dependency in plan.

**Q4**: Should the tool support bulk salary updates for multiple employees?  
**A**: Out of scope. Current spec focuses on single-employee calculations. Could be future enhancement.

---

**Research Complete**: All technical decisions documented. Ready to proceed to Phase 1 (data model and contracts generation).
