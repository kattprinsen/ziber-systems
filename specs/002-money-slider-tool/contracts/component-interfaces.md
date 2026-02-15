# Component Interfaces: Money Slider Tool

**Feature**: Money Slider Tool  
**Branch**: 002-money-slider-tool  
**Date**: February 13, 2026  
**Purpose**: Define React component prop interfaces and contracts

## Component Hierarchy

```text
MoneySlider (main container)
├── EmployeeSelector
├── SalaryInput
├── PercentageDisplay
└── VisualSlider
```

---

## 1. MoneySlider (Main Component)

**Description**: Main container component for the Money Slider tool. Manages state for selected employee, current salary, proposed salary, and calculated percentage.

**Location**: `src/components/tools/MoneySlider/MoneySlider.tsx`

**Props**: None (standalone page component)

**State**:
```typescript
interface MoneySliderState {
  selectedUserId: string | null;
  currentSalary: number | null;
  proposedSalary: number | null;
  percentageChange: number;
  users: User[];
  isLoading: boolean;
  error: string | null;
}
```

**Responsibilities**:
- Fetch list of users for employee selector
- Fetch selected user's current salary
- Calculate percentage change when proposed salary changes
- Pass data down to child components
- Handle error states and loading states

**Callbacks**:
- `handleEmployeeSelect(userId: string): void` - Updates selected employee and fetches salary
- `handleSalaryInputChange(value: number): void` - Updates proposed salary and recalculates percentage
- `calculatePercentage(current: number, proposed: number): number` - Pure calculation function

---

## 2. EmployeeSelector

**Description**: Dropdown selector component for choosing an employee from the user list.

**Location**: `src/components/tools/MoneySlider/EmployeeSelector.tsx`

**Props**:
```typescript
interface EmployeeSelectorProps {
  users: User[];
  selectedUserId: string | null;
  onSelect: (userId: string) => void;
  disabled?: boolean;
  className?: string;
}
```

**Prop Descriptions**:
- `users` - Array of user objects to display in dropdown
- `selectedUserId` - Currently selected user ID (controlled component)
- `onSelect` - Callback fired when user selects an employee
- `disabled` - Optional flag to disable the selector
- `className` - Optional additional CSS classes for styling

**Accessibility**:
- Uses semantic `<select>` element or custom accessible dropdown
- Includes `<label>` with `htmlFor` association
- ARIA attributes: `aria-label="Select employee"`, `aria-required="true"`
- Keyboard navigation support (arrow keys, Enter to select)

**Display Format**:
- Shows user name and department: "John Doe - Engineering"
- Placeholder text when no selection: "Select an employee..."
- Alphabetically sorted by last name

---

## 3. SalaryInput

**Description**: Number input field for entering proposed salary with validation and formatting.

**Location**: `src/components/tools/MoneySlider/SalaryInput.tsx`

**Props**:
```typescript
interface SalaryInputProps {
  value: number | null;
  onChange: (value: number) => void;
  currentSalary: number | null;
  disabled?: boolean;
  error?: string;
  className?: string;
}
```

**Prop Descriptions**:
- `value` - Current input value (controlled component)
- `onChange` - Callback fired on input change, receives number value
- `currentSalary` - Read-only display of current salary for reference
- `disabled` - Optional flag to disable input (when no employee selected)
- `error` - Optional error message to display
- `className` - Optional additional CSS classes

**Validation Rules** (enforced internally):
- Minimum value: 0
- Maximum value: 10,000,000 (with warning, not hard limit)
- Numeric input only (`type="number"`)
- Decimal precision: Up to 2 places

**Display**:
- Label: "Proposed Salary"
- Current salary display: Shows current value above/beside input as context
- Placeholder: "Enter proposed salary"
- Input formatting: Accepts plain numbers, displays with $ and commas on blur
- Error styling: Red border and error message below input

**Accessibility**:
- `aria-label="Proposed salary amount"`
- `aria-describedby="salary-error"` when error present
- `aria-invalid="true"` when validation fails

---

## 4. PercentageDisplay

**Description**: Read-only display component showing the calculated percentage change with appropriate styling and sign.

**Location**: `src/components/tools/MoneySlider/PercentageDisplay.tsx`

**Props**:
```typescript
interface PercentageDisplayProps {
  percentageChange: number;
  currentSalary: number | null;
  proposedSalary: number | null;
  className?: string;
}
```

**Prop Descriptions**:
- `percentageChange` - Calculated percentage value to display
- `currentSalary` - Current salary (for context and N/A cases)
- `proposedSalary` - Proposed salary (for determining if calculation is valid)
- `className` - Optional additional CSS classes

**Display Logic**:
- **Positive change**: `"+10.53%"` in green/orange color
- **Negative change**: `"-5.25%"` in red color
- **Zero change**: `"0.00%"` in neutral gray
- **No proposed value**: `"—"` or placeholder text
- **Current salary is 0**: `"N/A"` with info icon

**Styling**:
- Large, prominent font size (2-3x body text)
- Color-coded based on direction (increase/decrease/neutral)
- Smooth transition when value changes
- Optional animated counting effect when value changes

**Accessibility**:
- `aria-live="polite"` for screen reader announcements on value change
- `role="status"` to indicate dynamic content

---

## 5. VisualSlider

**Description**: Visual representation of salary comparison showing current and proposed salary positions with percentage fill.

**Location**: `src/components/tools/MoneySlider/VisualSlider.tsx`

**Props**:
```typescript
interface VisualSliderProps {
  currentSalary: number;
  proposedSalary: number | null;
  percentageChange: number;
  className?: string;
}
```

**Prop Descriptions**:
- `currentSalary` - Starting salary position
- `proposedSalary` - Ending salary position (null if not entered)
- `percentageChange` - Used for fill color determination
- `className` - Optional additional CSS classes

**Visual Elements**:
1. **Container bar** (full width)
   - Background: dark gray (theme background)
   - Border: 1px solid theme border color
   - Height: 60px
   - Border radius: 8px

2. **Current salary marker**
   - Position: Left side of bar
   - Label: "Current: $80,000"
   - Style: Vertical line with text label

3. **Proposed salary marker** (when proposedSalary is set)
   - Position: Calculated based on percentage
   - Label: "Proposed: $88,000"
   - Style: Vertical line with text label

4. **Fill section** (between current and proposed)
   - Color: 
     - Green/orange for increase (theme accent color)
     - Red for decrease
   - Opacity: 0.6 for subtle effect
   - Animated: Smooth expansion/contraction on change

5. **Scale indicators**
   - Optional percentage markers (0%, 10%, 20%, etc.) below bar
   - Adapts scale based on percentage range

**Display Behaviors**:
- **No proposed salary**: Shows only current marker, no fill
- **Small change (<5%)**: Scale shows -10% to +10% range
- **Medium change (5-20%)**: Scale shows -25% to +25% range
- **Large change (>20%)**: Scale adapts to show full range + 10% buffer

**Accessibility**:
- `role="img"` with descriptive `aria-label`
- Example: `aria-label="Salary comparison: $80,000 current to $88,000 proposed, 10% increase"`
- Text labels ensure information is available without relying on color alone

---

## Shared Types

**Location**: `src/types/salary.ts` (NEW FILE)

```typescript
/**
 * Represents the state of a salary calculation session
 */
export interface SalaryCalculation {
  userId: string;
  currentSalary: number;
  proposedSalary?: number;
  percentageChange: number;
  calculatedAt: Date;
}

/**
 * Props for monetary value display formatting
 */
export interface MoneyDisplayProps {
  amount: number;
  currency?: string;
  showDecimals?: boolean;
}

/**
 * Validation result for salary input
 */
export interface SalaryValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}
```

---

## Utility Functions

**Location**: `src/utils/formatters.ts`

```typescript
/**
 * Format number as currency string
 */
export function formatCurrency(
  amount: number, 
  currency: string = 'USD', 
  showDecimals: boolean = true
): string;

/**
 * Format percentage with sign and precision
 */
export function formatPercentage(
  value: number, 
  decimals: number = 2, 
  showSign: boolean = true
): string;

/**
 * Parse currency string to number
 */
export function parseCurrency(currencyString: string): number;
```

**Location**: `src/services/salaryCalculator.ts`

```typescript
/**
 * Calculate percentage change between two salary values
 * @param currentSalary - Starting salary amount
 * @param proposedSalary - Proposed new salary amount
 * @returns Percentage change with 2 decimal precision
 */
export function calculateSalaryPercentage(
  currentSalary: number,
  proposedSalary: number
): number;

/**
 * Validate salary input value
 * @param value - Salary amount to validate
 * @returns Validation result with error/warning messages
 */
export function validateSalaryInput(value: number): SalaryValidationResult;
```

---

## Component Testing Contracts

### MoneySlider Tests
- ✓ Renders employee selector when loaded
- ✓ Fetches users on mount
- ✓ Updates selected employee when selection changes
- ✓ Calculates percentage when proposed salary changes
- ✓ Displays error when fetch fails
- ✓ Disables input when no employee selected

### EmployeeSelector Tests
- ✓ Renders user list in dropdown
- ✓ Calls onSelect with correct userId when selection changes
- ✓ Displays users in "Name - Department" format
- ✓ Sorts users alphabetically by last name
- ✓ Disables selector when disabled prop is true
- ✓ Shows placeholder when no selection

### SalaryInput Tests
- ✓ Accepts numeric input only
- ✓ Validates minimum value (0)
- ✓ Shows warning for values > $10M but allows input
- ✓ Displays error message when error prop provided
- ✓ Formats currency with commas and $ on blur
- ✓ Calls onChange with parsed number value
- ✓ Disables input when disabled prop is true

### PercentageDisplay Tests
- ✓ Displays percentage with 2 decimal places
- ✓ Shows + sign for positive changes
- ✓ Shows - sign for negative changes
- ✓ Uses correct color for increase (green/orange)
- ✓ Uses correct color for decrease (red)
- ✓ Shows neutral color for 0% change
- ✓ Shows placeholder when no proposed salary
- ✓ Shows "N/A" when current salary is 0

### VisualSlider Tests
- ✓ Renders container bar
- ✓ Shows current salary marker at correct position
- ✓ Shows proposed salary marker when proposedSalary is set
- ✓ Displays fill section between markers
- ✓ Uses correct color for increase (theme accent)
- ✓ Uses correct color for decrease (red)
- ✓ Adapts scale based on percentage magnitude
- ✓ Includes accessible aria-label with values

---

## Integration Points

### React Router
- **Route**: `/tools/money-slider`
- **Component**: `<MoneySlider />`
- **Parent**: Tools page includes link/button to navigate to Money Slider

### API Services
- **UserService**: `getUserById(id: string): Promise<User>`
- **UserService**: `getAllUsers(): Promise<User[]>`
- **UserService** (future): `updateUserSalary(id: string, salary: number): Promise<User>`

### State Management
- Component-level state (useState) for Money Slider session
- No global state required
- API calls via existing userService.ts

---

**Document Status**: Complete - Ready for implementation
