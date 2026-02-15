# Quickstart Guide: Money Slider Tool

**Feature**: Money Slider Tool  
**Branch**: 002-money-slider-tool  
**Date**: February 13, 2026  
**Purpose**: Developer guide for implementing the Money Slider feature

## Overview

This guide walks through implementing the Money Slider tool, a salary percentage calculator for HR and management use during salary review discussions. The feature enables real-time calculation of percentage changes between current and proposed salaries.

**Implementation Priority**:
- **Phase 1 (P1)**: Core calculation functionality (MVP)
- **Phase 2 (P2)**: Visual slider representation
- **Phase 3 (P3)**: Salary persistence and history tracking

---

## Prerequisites

- Existing React + TypeScript + Vite application running
- Backend Express API running on port 3001
- TailwindCSS configured (from 001-dark-ui-layout feature)
- Vitest test environment set up

---

## Implementation Steps

### Phase 1: Core Calculation (P1 - MVP)

#### Step 1.1: Update Type Definitions

**1.1a. Update Frontend User Types**

File: `src/types/user.ts`

```typescript
// Add these fields to the User interface:
export interface User {
  // ... existing fields ...
  currentSalary?: number;              // NEW
  salaryHistory?: SalaryHistoryEntry[]; // NEW
}

// Add new interface:
export interface SalaryHistoryEntry {
  salary: number;
  effectiveDate: string;
  updatedBy?: string;
  notes?: string;
}
```

**1.1b. Create New Salary Types File**

File: `src/types/salary.ts` (NEW)

```typescript
export interface SalaryCalculation {
  userId: string;
  currentSalary: number;
  proposedSalary: number | null;
  percentageChange: number;
  calculatedAt: Date;
}

export interface SalaryValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

export interface CurrencyFormatOptions {
  locale?: string;
  currency?: string;
  showSymbol?: boolean;
  showDecimals?: boolean;
}

export interface PercentageFormatOptions {
  decimals?: number;
  showSign?: boolean;
  showSymbol?: boolean;
}
```

**1.1c. Update Backend User Types**

File: `backend/src/types/user.types.ts`

```typescript
// Add the same fields to backend User interface:
export interface User {
  // ... existing fields ...
  currentSalary?: number;              // NEW
  salaryHistory?: SalaryHistoryEntry[]; // NEW
}

// Add the same SalaryHistoryEntry interface
export interface SalaryHistoryEntry {
  salary: number;
  effectiveDate: string;
  updatedBy?: string;
  notes?: string;
}
```

---

#### Step 1.2: Add Sample Salary Data

File: `backend/src/data/users.json`

Add salary data to a few test users:

```json
{
  "users": [
    {
      "id": "user-001",
      "name": "John Doe",
      "currentSalary": 80000.00,
      "salaryHistory": [
        {
          "salary": 75000.00,
          "effectiveDate": "2025-01-15",
          "notes": "Annual review increase"
        }
      ]
      // ... other fields ...
    }
  ]
}
```

---

#### Step 1.3: Create Utility Functions

**1.3a. Salary Calculator**

File: `src/services/salaryCalculator.ts` (NEW)

```typescript
/**
 * Calculate percentage change between salaries
 */
export function calculateSalaryPercentage(
  currentSalary: number,
  proposedSalary: number
): number {
  if (currentSalary === 0) {
    return 0; // Avoid division by zero
  }
  
  const change = ((proposedSalary - currentSalary) / currentSalary) * 100;
  return Number(change.toFixed(2)); // 2 decimal precision
}

/**
 * Validate salary input
 */
export function validateSalaryInput(value: number): SalaryValidationResult {
  if (value < 0) {
    return {
      isValid: false,
      error: 'Salary must be a positive number'
    };
  }
  
  if (value > 10_000_000) {
    return {
      isValid: true,
      warning: 'Salary exceeds $10M'
    };
  }
  
  return { isValid: true };
}
```

**1.3b. Formatters**

File: `src/utils/formatters.ts` (NEW or UPDATE existing)

```typescript
import { CurrencyFormatOptions, PercentageFormatOptions } from '../types/salary';

/**
 * Format number as currency
 */
export function formatCurrency(
  amount: number,
  options?: CurrencyFormatOptions
): string {
  const formatter = new Intl.NumberFormat(options?.locale || 'en-US', {
    style: 'currency',
    currency: options?.currency || 'USD',
    minimumFractionDigits: options?.showDecimals !== false ? 2 : 0,
    maximumFractionDigits: options?.showDecimals !== false ? 2 : 0,
  });
  
  return formatter.format(amount);
}

/**
 * Format percentage with sign
 */
export function formatPercentage(
  value: number,
  options?: PercentageFormatOptions
): string {
  const decimals = options?.decimals ?? 2;
  const showSign = options?.showSign !== false;
  const showSymbol = options?.showSymbol !== false;
  
  const sign = showSign && value > 0 ? '+' : '';
  const symbol = showSymbol ? '%' : '';
  
  return `${sign}${value.toFixed(decimals)}${symbol}`;
}
```

---

#### Step 1.4: Create React Components

**1.4a. Employee Selector Component**

File: `src/components/tools/MoneySlider/EmployeeSelector.tsx` (NEW)

```typescript
import { User } from '../../../types/user';

interface EmployeeSelectorProps {
  users: User[];
  selectedUserId: string | null;
  onSelect: (userId: string) => void;
  disabled?: boolean;
}

export function EmployeeSelector({
  users,
  selectedUserId,
  onSelect,
  disabled = false
}: EmployeeSelectorProps) {
  return (
    <div className="mb-4">
      <label 
        htmlFor="employee-select" 
        className="block text-sm font-medium mb-2"
      >
        Select Employee
      </label>
      <select
        id="employee-select"
        value={selectedUserId || ''}
        onChange={(e) => onSelect(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 border rounded-lg bg-gray-800 border-gray-700 text-white"
        aria-label="Select employee"
      >
        <option value="">Select an employee...</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} - {user.department}
          </option>
        ))}
      </select>
    </div>
  );
}
```

**1.4b. Salary Input Component**

File: `src/components/tools/MoneySlider/SalaryInput.tsx` (NEW)

```typescript
import { formatCurrency } from '../../../utils/formatters';

interface SalaryInputProps {
  value: number | null;
  onChange: (value: number) => void;
  currentSalary: number | null;
  disabled?: boolean;
  error?: string;
}

export function SalaryInput({
  value,
  onChange,
  currentSalary,
  disabled = false,
  error
}: SalaryInputProps) {
  return (
    <div className="mb-4">
      {currentSalary !== null && (
        <div className="text-sm text-gray-400 mb-2">
          Current Salary: <span className="font-semibold text-white">
            {formatCurrency(currentSalary)}
          </span>
        </div>
      )}
      
      <label 
        htmlFor="proposed-salary" 
        className="block text-sm font-medium mb-2"
      >
        Proposed Salary
      </label>
      
      <input
        id="proposed-salary"
        type="number"
        min="0"
        step="0.01"
        value={value ?? ''}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-lg bg-gray-800 text-white ${
          error ? 'border-red-500' : 'border-gray-700'
        }`}
        placeholder="Enter proposed salary"
        aria-label="Proposed salary amount"
        aria-invalid={!!error}
      />
      
      {error && (
        <p className="mt-1 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
```

**1.4c. Percentage Display Component**

File: `src/components/tools/MoneySlider/PercentageDisplay.tsx` (NEW)

```typescript
import { formatPercentage } from '../../../utils/formatters';

interface PercentageDisplayProps {
  percentageChange: number;
  proposedSalary: number | null;
}

export function PercentageDisplay({
  percentageChange,
  proposedSalary
}: PercentageDisplayProps) {
  if (proposedSalary === null) {
    return (
      <div className="text-center py-8">
        <span className="text-4xl text-gray-500">—</span>
        <p className="text-sm text-gray-400 mt-2">Enter a proposed salary to calculate</p>
      </div>
    );
  }
  
  const isIncrease = percentageChange > 0;
  const isDecrease = percentageChange < 0;
  const colorClass = isIncrease 
    ? 'text-orange-500' 
    : isDecrease 
    ? 'text-red-500' 
    : 'text-gray-400';
  
  return (
    <div className="text-center py-8" role="status" aria-live="polite">
      <div className={`text-5xl font-bold ${colorClass}`}>
        {formatPercentage(percentageChange)}
      </div>
      <p className="text-sm text-gray-400 mt-2">
        {isIncrease ? 'Increase' : isDecrease ? 'Decrease' : 'No Change'}
      </p>
    </div>
  );
}
```

**1.4d. Main MoneySlider Component**

File: `src/components/tools/MoneySlider/MoneySlider.tsx` (NEW)

```typescript
import { useState, useEffect } from 'react';
import { User } from '../../../types/user';
import { getUsers, getUserById } from '../../../services/userService';
import { calculateSalaryPercentage, validateSalaryInput } from '../../../services/salaryCalculator';
import { EmployeeSelector } from './EmployeeSelector';
import { SalaryInput } from './SalaryInput';
import { PercentageDisplay } from './PercentageDisplay';

export function MoneySlider() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [currentSalary, setCurrentSalary] = useState<number | null>(null);
  const [proposedSalary, setProposedSalary] = useState<number | null>(null);
  const [percentageChange, setPercentageChange] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);

  // Fetch users on mount
  useEffect(() => {
    async function loadUsers() {
      try {
        const fetchedUsers = await getUsers();
        setUsers(fetchedUsers);
      } catch (err) {
        setError('Failed to load users');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadUsers();
  }, []);

  // Fetch selected user's salary
  const handleEmployeeSelect = async (userId: string) => {
    setSelectedUserId(userId);
    setProposedSalary(null);
    setPercentageChange(0);
    setInputError(null);
    
    try {
      const user = await getUserById(userId);
      if (user.currentSalary !== undefined) {
        setCurrentSalary(user.currentSalary);
      } else {
        setCurrentSalary(null);
        setError('Selected employee has no salary data');
      }
    } catch (err) {
      setError('Failed to load employee salary');
      console.error(err);
    }
  };

  // Calculate percentage on proposed salary change
  const handleSalaryChange = (value: number) => {
    setProposedSalary(value);
    
    const validation = validateSalaryInput(value);
    if (!validation.isValid) {
      setInputError(validation.error || null);
      return;
    }
    
    setInputError(null);
    
    if (currentSalary !== null) {
      const percentage = calculateSalaryPercentage(currentSalary, value);
      setPercentageChange(percentage);
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Money Slider Tool</h1>
      
      {error && (
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <EmployeeSelector
        users={users}
        selectedUserId={selectedUserId}
        onSelect={handleEmployeeSelect}
      />
      
      <SalaryInput
        value={proposedSalary}
        onChange={handleSalaryChange}
        currentSalary={currentSalary}
        disabled={!selectedUserId || currentSalary === null}
        error={inputError || undefined}
      />
      
      <PercentageDisplay
        percentageChange={percentageChange}
        proposedSalary={proposedSalary}
      />
    </div>
  );
}
```

**1.4e. Index Barrel Export**

File: `src/components/tools/MoneySlider/index.ts` (NEW)

```typescript
export { MoneySlider } from './MoneySlider';
export { EmployeeSelector } from './EmployeeSelector';
export { SalaryInput } from './SalaryInput';
export { PercentageDisplay } from './PercentageDisplay';
```

---

#### Step 1.5: Add Route to Tools Page

File: `src/pages/ToolsPage/ToolsPage.tsx`

```typescript
import { Link } from 'react-router-dom';

export function ToolsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Tools</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Add this card */}
        <Link 
          to="/tools/money-slider"
          className="p-6 bg-gray-800 border border-gray-700 rounded-lg hover:border-orange-500 transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">Money Slider</h2>
          <p className="text-gray-400">
            Calculate salary percentage changes for negotiations
          </p>
        </Link>
        
        {/* Other tool cards... */}
      </div>
    </div>
  );
}
```

---

#### Step 1.6: Add Route to Router

File: `src/App.tsx` or your router configuration

```typescript
import { MoneySlider } from './components/tools/MoneySlider';

// Add to your routes:
<Route path="/tools/money-slider" element={<MoneySlider />} />
```

---

#### Step 1.7: Write Tests

**Test Calculator Logic**

File: `tests/services/salaryCalculator.test.ts` (NEW)

```typescript
import { describe, it, expect } from 'vitest';
import { calculateSalaryPercentage, validateSalaryInput } from '../../src/services/salaryCalculator';

describe('calculateSalaryPercentage', () => {
  it('calculates positive percentage increase', () => {
    expect(calculateSalaryPercentage(80000, 88000)).toBe(10.00);
  });

  it('calculates negative percentage decrease', () => {
    expect(calculateSalaryPercentage(80000, 76000)).toBe(-5.00);
  });

  it('returns 0 for no change', () => {
    expect(calculateSalaryPercentage(80000, 80000)).toBe(0.00);
  });

  it('handles zero current salary', () => {
    expect(calculateSalaryPercentage(0, 80000)).toBe(0);
  });

  it('returns 2 decimal precision', () => {
    expect(calculateSalaryPercentage(77777, 88888)).toBe(14.28);
  });
});

describe('validateSalaryInput', () => {
  it('validates positive salary', () => {
    const result = validateSalaryInput(85000);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('rejects negative salary', () => {
    const result = validateSalaryInput(-1000);
    expect(result.isValid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('warns for very high salary', () => {
    const result = validateSalaryInput(15000000);
    expect(result.isValid).toBe(true);
    expect(result.warning).toBeTruthy();
  });
});
```

**Test Component**

File: `tests/components/tools/MoneySlider/MoneySlider.test.tsx` (NEW)

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MoneySlider } from '../../../../src/components/tools/MoneySlider/MoneySlider';
import * as userService from '../../../../src/services/userService';

vi.mock('../../../../src/services/userService');

describe('MoneySlider', () => {
  it('renders employee selector', async () => {
    vi.mocked(userService.getUsers).mockResolvedValue([]);
    render(<MoneySlider />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/select employee/i)).toBeInTheDocument();
    });
  });

  it('calculates percentage when salary is entered', async () => {
    const mockUser = {
      id: 'user-1',
      name: 'John Doe',
      currentSalary: 80000,
      // ... other required fields
    };
    
    vi.mocked(userService.getUsers).mockResolvedValue([mockUser]);
    vi.mocked(userService.getUserById).mockResolvedValue(mockUser);
    
    const user = userEvent.setup();
    render(<MoneySlider />);
    
    // Select employee
    await waitFor(() => {
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    });
    await user.selectOptions(screen.getByLabelText(/select employee/i), 'user-1');
    
    // Enter proposed salary
    const input = screen.getByLabelText(/proposed salary/i);
    await user.type(input, '88000');
    
    // Check percentage display
    await waitFor(() => {
      expect(screen.getByText(/\+10\.00%/)).toBeInTheDocument();
    });
  });
});
```

---

#### Step 1.8: Run Tests

```bash
npm test
```

---

#### Step 1.9: Manual Testing

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `npm run dev`
3. Navigate to `/tools`
4. Click "Money Slider" tool
5. Select an employee with salary data
6. Enter proposed salary values
7. Verify percentage calculates in real-time
8. Test edge cases (negative, zero, very large values)

---

### Phase 2: Visual Slider (P2)

Once Phase 1 is working, implement visual representation:

**Step 2.1: Create VisualSlider Component**

File: `src/components/tools/MoneySlider/VisualSlider.tsx` (NEW)

```typescript
interface VisualSliderProps {
  currentSalary: number;
  proposedSalary: number | null;
  percentageChange: number;
}

export function VisualSlider({
  currentSalary,
  proposedSalary,
  percentageChange
}: VisualSliderProps) {
  if (!proposedSalary) return null;
  
  const isIncrease = percentageChange > 0;
  const fillColor = isIncrease ? 'bg-orange-500' : 'bg-red-500';
  
  // Calculate visual positions (simplified)
  const fillWidth = Math.min(Math.abs(percentageChange), 100);
  
  return (
    <div className="mt-8" role="img" aria-label={`Salary comparison: ${currentSalary} to ${proposedSalary}, ${percentageChange}% change`}>
      <div className="relative h-16 bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        {/* Current marker */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-white" />
        
        {/* Fill section */}
        <div 
          className={`absolute top-0 bottom-0 ${fillColor} opacity-60 transition-all duration-300`}
          style={{ 
            left: '0',
            width: `${fillWidth}%`
          }}
        />
        
        {/* Proposed marker */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white"
          style={{ left: `${fillWidth}%` }}
        />
      </div>
      
      {/* Labels */}
      <div className="flex justify-between mt-2 text-sm text-gray-400">
        <span>Current: ${currentSalary.toLocaleString()}</span>
        <span>Proposed: ${proposedSalary.toLocaleString()}</span>
      </div>
    </div>
  );
}
```

**Step 2.2: Add to MoneySlider**

Update `src/components/tools/MoneySlider/MoneySlider.tsx`:

```typescript
import { VisualSlider } from './VisualSlider';

// Add after PercentageDisplay:
{currentSalary !== null && proposedSalary !== null && (
  <VisualSlider
    currentSalary={currentSalary}
    proposedSalary={proposedSalary}
    percentageChange={percentageChange}
  />
)}
```

---

### Phase 3: Salary Persistence (P3)

Implement backend endpoints and salary update functionality:

**Step 3.1: Add Backend Route**

File: `backend/src/routes/users.routes.ts`

```typescript
router.put('/:id/salary', updateUserSalary);
```

**Step 3.2: Add Backend Controller**

File: `backend/src/controllers/user.controller.ts`

```typescript
export async function updateUserSalary(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { currentSalary, effectiveDate, notes } = req.body;
    
    // Validation
    if (currentSalary < 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Salary must be positive'
      });
    }
    
    const updatedUser = await userService.updateSalary(
      id,
      currentSalary,
      effectiveDate,
      notes
    );
    
    res.json({
      success: true,
      data: updatedUser,
      message: 'Salary updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update salary'
    });
  }
}
```

**Step 3.3: Add Service Method**

File: `backend/src/services/user.service.ts`

```typescript
export async function updateSalary(
  userId: string,
  currentSalary: number,
  effectiveDate: string,
  notes?: string
): Promise<User> {
  const users = await readUsersFromFile();
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Create history entry
  if (user.currentSalary) {
    const historyEntry: SalaryHistoryEntry = {
      salary: user.currentSalary,
      effectiveDate,
      notes
    };
    
    user.salaryHistory = user.salaryHistory || [];
    user.salaryHistory.unshift(historyEntry);
  }
  
  // Update current salary
  user.currentSalary = currentSalary;
  
  await writeUsersToFile(users);
  return user;
}
```

---

## Testing Checklist

- [ ] All unit tests pass
- [ ] Component tests pass
- [ ] Manual testing completed for:
  - [ ] Employee selection
  - [ ] Salary input and validation
  - [ ] Real-time percentage calculation
  - [ ] Error states (no salary data, invalid input)
  - [ ] Edge cases (0%, negative %, very large %)
  - [ ] Visual slider display (Phase 2)
  - [ ] Salary update persistence (Phase 3)

---

## Troubleshooting

**Issue**: Percentage not updating in real-time

- Check that `onChange` is wired correctly in `SalaryInput`
- Verify `calculateSalaryPercentage` is being called


**Issue**: "Employee has no salary data" error

- Add `currentSalary` field to test users in `backend/src/data/users.json`

**Issue**: Type errors between frontend and backend

- Ensure User interfaces match exactly in both locations
- Restart TypeScript server in VS Code

---

## Next Steps

After completing implementation:

1. Run full test suite: `npm test`
2. Perform manual testing
3. Run `git status` to review changes
4. Commit changes to feature branch
5. Push to remote: `git push origin 002-money-slider-tool`
6. Open pull request for review

---

**Documentation Links**:
- [Feature Specification](./spec.md)
- [Data Model](./data-model.md)
- [Component Contracts](./contracts/component-interfaces.md)
- [API Contracts](./contracts/api-contracts.md)

**Estimated Time**: 
- Phase 1 (P1): 4-6 hours
- Phase 2 (P2): 2-3 hours  
- Phase 3 (P3): 3-4 hours

**Total: 9-13 hours**
