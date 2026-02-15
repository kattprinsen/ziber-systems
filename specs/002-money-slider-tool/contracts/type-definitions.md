# Type Definitions: Money Slider Tool

**Feature**: Money Slider Tool  
**Branch**: 002-money-slider-tool  
**Date**: February 13, 2026  
**Purpose**: Complete TypeScript interface definitions for type safety

## File Organization

```text
Frontend Types:
├── src/types/user.ts          # Extended User interface (UPDATE)
├── src/types/salary.ts        # New salary-specific types (NEW)
└── src/types/layout.ts        # Existing layout types (NO CHANGE)

Backend Types:
└── backend/src/types/user.types.ts  # Extended User interface (UPDATE)
```

---

## Frontend Type Definitions

### src/types/user.ts (UPDATED)

```typescript
/**
 * User entity representing an employee in the system
 * Extended to include salary information for Money Slider tool
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  avatar?: string;
  phone?: string;
  joinedDate: string;  // ISO 8601 date string
  status: 'active' | 'inactive' | 'on-leave';
  bio?: string;
  skills?: string[];
  location?: string;
  
  // NEW FIELDS for Money Slider Tool:
  currentSalary?: number;              // Current annual salary in dollars
  salaryHistory?: SalaryHistoryEntry[]; // Historical salary records
}

/**
 * Salary history entry tracking previous salary values
 */
export interface SalaryHistoryEntry {
  salary: number;           // Salary amount at this point in history
  effectiveDate: string;    // ISO 8601 date when salary became effective
  updatedBy?: string;       // User ID of person who authorized change
  notes?: string;           // Optional context or reason for change
}

/**
 * API response wrapper (existing)
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: string[];  // NEW: Validation error details
}
```

---

### src/types/salary.ts (NEW FILE)

```typescript
/**
 * Transient state for salary calculation in Money Slider tool
 * Not persisted to backend
 */
export interface SalaryCalculation {
  userId: string;              // Selected employee's ID
  currentSalary: number;       // Employee's current salary
  proposedSalary: number | null;  // User-entered proposed salary
  percentageChange: number;    // Calculated percentage difference
  calculatedAt: Date;          // Timestamp of calculation
}

/**
 * Input validation result for salary values
 */
export interface SalaryValidationResult {
  isValid: boolean;       // Whether validation passed
  error?: string;         // Critical error message (blocks submission)
  warning?: string;       // Warning message (informational only)
}

/**
 * Options for formatting monetary values
 */
export interface CurrencyFormatOptions {
  locale?: string;        // Locale for formatting (default: 'en-US')
  currency?: string;      // Currency code (default: 'USD')
  showSymbol?: boolean;   // Include currency symbol (default: true)
  showDecimals?: boolean; // Include decimal places (default: true)
  minimumFractionDigits?: number;  // Min decimals (default: 2)
  maximumFractionDigits?: number;  // Max decimals (default: 2)
}

/**
 * Options for formatting percentage values
 */
export interface PercentageFormatOptions {
  decimals?: number;      // Decimal places (default: 2)
  showSign?: boolean;     // Include +/- sign (default: true)
  showSymbol?: boolean;   // Include % symbol (default: true)
}

/**
 * Salary update request payload
 */
export interface SalaryUpdateRequest {
  currentSalary: number;      // New salary value
  effectiveDate: string;      // ISO 8601 date when change is effective
  notes?: string;             // Optional context
}

/**
 * Salary calculation configuration
 */
export interface CalculationConfig {
  minSalary: number;          // Minimum valid salary (default: 0)
  maxSalary: number;          // Maximum valid salary (default: 10000000)
  warningThreshold: number;   // Percentage change that triggers warning (default: 50)
}
```

---

## Backend Type Definitions

### backend/src/types/user.types.ts (UPDATED)

```typescript
/**
 * User entity representing an employee in the system
 * Extended to include salary information for Money Slider tool
 * 
 * MUST stay synchronized with frontend src/types/user.ts
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  avatar?: string;
  phone?: string;
  joinedDate: string;  // ISO 8601 date string
  status: 'active' | 'inactive' | 'on-leave';
  bio?: string;
  skills?: string[];
  location?: string;
  
  // NEW FIELDS for Money Slider Tool:
  currentSalary?: number;              // Current annual salary in dollars
  salaryHistory?: SalaryHistoryEntry[]; // Historical salary records
}

/**
 * Salary history entry tracking previous salary values
 * 
 * MUST stay synchronized with frontend src/types/user.ts
 */
export interface SalaryHistoryEntry {
  salary: number;           // Salary amount at this point in history
  effectiveDate: string;    // ISO 8601 date when salary became effective
  updatedBy?: string;       // User ID of person who authorized change
  notes?: string;           // Optional context or reason for change (max 500 chars)
}

/**
 * API response wrapper (existing)
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: string[];  // NEW: Validation error details
}

/**
 * Request body for updating user salary
 */
export interface UpdateSalaryRequest {
  currentSalary: number;    // New salary value, must be >= 0
  effectiveDate: string;    // ISO 8601 date, must not be future date
  notes?: string;           // Optional context, max 500 chars
}

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;      // Field name that failed validation
  message: string;    // Error message
  value?: any;        // The invalid value (optional)
}
```

---

## Component Prop Types

### React Component Props

**Location**: Inline with component definitions or in separate `.types.ts` files

```typescript
// src/components/tools/MoneySlider/MoneySlider.types.ts

import { User } from '../../../types/user';
import { SalaryCalculation } from '../../../types/salary';

/**
 * Internal state for MoneySlider component
 */
export interface MoneySliderState {
  selectedUserId: string | null;
  currentSalary: number | null;
  proposedSalary: number | null;
  percentageChange: number;
  users: User[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Props for EmployeeSelector component
 */
export interface EmployeeSelectorProps {
  users: User[];                          // List of users to display
  selectedUserId: string | null;          // Currently selected user ID
  onSelect: (userId: string) => void;     // Selection callback
  disabled?: boolean;                     // Disable the selector
  className?: string;                     // Additional CSS classes
}

/**
 * Props for SalaryInput component
 */
export interface SalaryInputProps {
  value: number | null;                   // Current input value
  onChange: (value: number) => void;      // Change callback
  currentSalary: number | null;           // Reference salary for context
  disabled?: boolean;                     // Disable the input
  error?: string;                         // Error message to display
  className?: string;                     // Additional CSS classes
}

/**
 * Props for PercentageDisplay component
 */
export interface PercentageDisplayProps {
  percentageChange: number;               // Calculated percentage
  currentSalary: number | null;           // For context
  proposedSalary: number | null;          // For determining validity
  className?: string;                     // Additional CSS classes
}

/**
 * Props for VisualSlider component
 */
export interface VisualSliderProps {
  currentSalary: number;                  // Starting position
  proposedSalary: number | null;          // Ending position
  percentageChange: number;               // Used for color coding
  className?: string;                     // Additional CSS classes
}
```

---

## Utility Function Signatures

### src/utils/formatters.ts

```typescript
/**
 * Format a number as currency string
 * 
 * @param amount - Numeric amount to format
 * @param options - Formatting options
 * @returns Formatted currency string (e.g., "$85,000.00")
 * 
 * @example
 * formatCurrency(85000) // "$85,000.00"
 * formatCurrency(85000, { showDecimals: false }) // "$85,000"
 */
export function formatCurrency(
  amount: number,
  options?: CurrencyFormatOptions
): string;

/**
 * Format a number as percentage string
 * 
 * @param value - Numeric percentage value (10.5 for 10.5%)
 * @param options - Formatting options
 * @returns Formatted percentage string (e.g., "+10.53%")
 * 
 * @example
 * formatPercentage(10.5) // "+10.50%"
 * formatPercentage(-5.2) // "-5.20%"
 * formatPercentage(0) // "0.00%"
 */
export function formatPercentage(
  value: number,
  options?: PercentageFormatOptions
): string;

/**
 * Parse currency string to number
 * 
 * @param currencyString - Currency string with symbols and commas
 * @returns Numeric value
 * @throws Error if string cannot be parsed
 * 
 * @example
 * parseCurrency("$85,000.00") // 85000
 * parseCurrency("85000") // 85000
 */
export function parseCurrency(currencyString: string): number;
```

### src/services/salaryCalculator.ts

```typescript
/**
 * Calculate percentage change between two salary values
 * 
 * @param currentSalary - Starting salary amount
 * @param proposedSalary - Proposed new salary amount
 * @returns Percentage change with 2 decimal precision
 * @throws Error if currentSalary is negative
 * 
 * @example
 * calculateSalaryPercentage(80000, 88000) // 10.00
 * calculateSalaryPercentage(80000, 76000) // -5.00
 * calculateSalaryPercentage(80000, 80000) // 0.00
 */
export function calculateSalaryPercentage(
  currentSalary: number,
  proposedSalary: number
): number;

/**
 * Validate salary input value
 * 
 * @param value - Salary amount to validate
 * @param config - Optional validation configuration
 * @returns Validation result with error/warning messages
 * 
 * @example
 * validateSalaryInput(85000) 
 * // { isValid: true }
 * 
 * validateSalaryInput(-1000)
 * // { isValid: false, error: "Salary must be a positive number" }
 * 
 * validateSalaryInput(15000000)
 * // { isValid: true, warning: "Salary exceeds typical range" }
 */
export function validateSalaryInput(
  value: number,
  config?: CalculationConfig
): SalaryValidationResult;
```

---

## Type Guards

### src/types/salary.ts

```typescript
/**
 * Type guard to check if a value is a valid salary number
 */
export function isSalaryValue(value: any): value is number {
  return typeof value === 'number' 
    && !isNaN(value) 
    && isFinite(value) 
    && value >= 0;
}

/**
 * Type guard to check if an object is a SalaryHistoryEntry
 */
export function isSalaryHistoryEntry(obj: any): obj is SalaryHistoryEntry {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.salary === 'number' &&
    typeof obj.effectiveDate === 'string' &&
    (obj.updatedBy === undefined || typeof obj.updatedBy === 'string') &&
    (obj.notes === undefined || typeof obj.notes === 'string')
  );
}

/**
 * Type guard to check if a User has salary data
 */
export function hasUserSalaryData(user: User): user is User & { currentSalary: number } {
  return user.currentSalary !== undefined && user.currentSalary !== null;
}
```

---

## Constants

### src/utils/constants.ts (UPDATED)

```typescript
/**
 * Salary calculation constants
 */
export const SALARY_CONSTANTS = {
  MIN_SALARY: 0,
  MAX_SALARY: 10_000_000,
  WARNING_THRESHOLD_PERCENTAGE: 50,  // Warn if change > 50%
  DECIMAL_PRECISION: 2,
  DEFAULT_CURRENCY: 'USD',
  DEFAULT_LOCALE: 'en-US',
} as const;

/**
 * Validation error messages
 */
export const SALARY_ERROR_MESSAGES = {
  NEGATIVE_VALUE: 'Salary must be a positive number',
  INVALID_NUMBER: 'Please enter a valid salary amount',
  EXCEEDS_MAX: `Salary exceeds maximum allowed value of $${SALARY_CONSTANTS.MAX_SALARY.toLocaleString()}`,
  REQUIRED: 'Current salary is required for calculations',
  NO_SALARY_DATA: 'Employee does not have salary information',
  FUTURE_DATE: 'Effective date cannot be in the future',
  INVALID_DATE: 'Please provide a valid date',
} as const;

/**
 * Calculation config defaults
 */
export const DEFAULT_CALCULATION_CONFIG: CalculationConfig = {
  minSalary: SALARY_CONSTANTS.MIN_SALARY,
  maxSalary: SALARY_CONSTANTS.MAX_SALARY,
  warningThreshold: SALARY_CONSTANTS.WARNING_THRESHOLD_PERCENTAGE,
} as const;
```

---

## Type Compatibility Matrix

| Type | Frontend Location | Backend Location | Must Sync? |
|------|------------------|------------------|------------|
| `User` | `src/types/user.ts` | `backend/src/types/user.types.ts` | ✅ YES |
| `SalaryHistoryEntry` | `src/types/user.ts` | `backend/src/types/user.types.ts` | ✅ YES |
| `ApiResponse<T>` | `src/types/user.ts` | `backend/src/types/user.types.ts` | ✅ YES |
| `SalaryCalculation` | `src/types/salary.ts` | N/A | ❌ Frontend only |
| `SalaryUpdateRequest` | `src/types/salary.ts` | `backend/src/types/user.types.ts` | ⚠️ Similar, not identical |
| Component Props | Component `.types.ts` files | N/A | ❌ Frontend only |

**Important**: Keep `User`, `SalaryHistoryEntry`, and `ApiResponse<T>` definitions synchronized between frontend and backend to prevent type mismatches.

---

## Type Aliases

```typescript
// Convenience type aliases

/**
 * User with guaranteed salary data
 */
export type UserWithSalary = User & Required<Pick<User, 'currentSalary'>>;

/**
 * Sorted salary history (most recent first)
 */
export type SortedSalaryHistory = SalaryHistoryEntry[] & { readonly sorted: true };
```

---

**Document Status**: Complete - Ready for implementation
