# Data Model: Money Slider Tool

**Feature**: Money Slider Tool  
**Branch**: 002-money-slider-tool  
**Date**: February 13, 2026  
**Status**: Phase 1 Design

## Overview

This document defines the data structures required for the Money Slider Tool feature. The feature extends the existing User entity to include salary information and introduces supporting types for salary calculations and history tracking.

## Entity Definitions

### 1. User (Extended)

**Description**: Represents an employee in the system. Extended to include current salary and salary history for the Money Slider tool.

**Attributes**:

| Field | Type | Required | Description | Validation Rules |
|-------|------|----------|-------------|-----------------|
| id | string | Yes | Unique identifier | Existing field |
| name | string | Yes | Employee full name | Existing field |
| email | string | Yes | Employee email address | Existing field |
| role | string | Yes | Job role/title | Existing field |
| department | string | Yes | Department name | Existing field |
| avatar | string | No | Profile image URL | Existing field |
| phone | string | No | Contact phone | Existing field |
| joinedDate | string | Yes | ISO 8601 date of joining | Existing field |
| status | 'active' \| 'inactive' \| 'on-leave' | Yes | Employment status | Existing field |
| bio | string | No | Employee biography | Existing field |
| skills | string[] | No | Array of skill tags | Existing field |
| location | string | No | Work location | Existing field |
| **currentSalary** | **number** | **No** | **Current annual salary in dollars** | **≥ 0, precision to 2 decimals** |
| **salaryHistory** | **SalaryHistoryEntry[]** | **No** | **Historical salary records** | **Sorted by effectiveDate descending** |

**New Fields**:
- `currentSalary`: Optional field to support existing users without salary data. Stores current annual salary as a number (e.g., 75000.00 for $75,000)
- `salaryHistory`: Optional array of historical salary changes, enabling year-over-year tracking and audit trail

**Relationships**:
- User has zero to many SalaryHistoryEntry records
- User is the subject of SalaryCalculation operations

**State Transitions**:
- When `currentSalary` is updated via the Money Slider or other means:
  1. Previous `currentSalary` value is added to `salaryHistory` with effective date
  2. New value becomes the `currentSalary`
  3. `salaryHistory` is maintained in descending chronological order

---

### 2. SalaryHistoryEntry

**Description**: Represents a single historical salary record for an employee, tracking when salaries changed and who authorized the change.

**Attributes**:

| Field | Type | Required | Description | Validation Rules |
|-------|------|----------|-------------|-----------------|
| salary | number | Yes | Salary amount at this point in time | ≥ 0, precision to 2 decimals |
| effectiveDate | string | Yes | ISO 8601 date when salary became effective | Valid ISO 8601 date string, not future date |
| updatedBy | string | No | User ID of person who authorized change | Must reference valid user ID |
| notes | string | No | Optional context or reason for change | Max 500 characters |

**Relationships**:
- Belongs to one User
- `updatedBy` references another User (the authorizer)

**Constraints**:
- `effectiveDate` must not be in the future
- Entries within a User's `salaryHistory` should be unique by `effectiveDate`
- When sorted by `effectiveDate`, entries should not have gaps that contradict the current salary

**Example**:
```json
{
  "salary": 70000.00,
  "effectiveDate": "2025-01-15",
  "updatedBy": "user-456",
  "notes": "Annual performance review increase"
}
```

---

### 3. SalaryCalculation (Transient)

**Description**: Represents a single calculation session in the Money Slider tool. This is a transient data structure (not persisted) used for UI state management and calculation results.

**Attributes**:

| Field | Type | Required | Description | Validation Rules |
|-------|------|----------|-------------|-----------------|
| userId | string | Yes | Selected employee's ID | Must reference existing user |
| currentSalary | number | Yes | Employee's current salary | ≥ 0, from User.currentSalary |
| proposedSalary | number | No | User-entered proposed salary | ≥ 0, precision to 2 decimals |
| percentageChange | number | No | Calculated percentage change | Calculated value, 2 decimal precision |
| calculatedAt | Date | Yes | Timestamp of calculation | Auto-generated |

**Computed Fields**:
- `percentageChange`: Calculated as `((proposedSalary - currentSalary) / currentSalary) * 100`
  - Returns `null` or `0` if `proposedSalary` is not set
  - Returns `0` if `currentSalary` is `0` (edge case handling)
  - Includes sign: positive for increases, negative for decreases

**Lifecycle**:
- Created when user selects an employee in Money Slider
- Updated in real-time as user types proposed salary
- Destroyed when user navigates away or selects different employee
- Not persisted to backend storage

**Example**:
```typescript
{
  userId: "user-123",
  currentSalary: 80000.00,
  proposedSalary: 88000.00,
  percentageChange: 10.00,
  calculatedAt: new Date("2026-02-13T14:30:00Z")
}
```

---

## Data Validation Rules

### Salary Amount Validation

**Rules**:
- Must be non-negative number (≥ 0)
- Maximum value: $10,000,000 (for practical limits)
- Precision: Up to 2 decimal places
- Display format: US currency with commas (e.g., "$85,250.00")

**Error Messages**:
- Negative value: "Salary must be a positive number"
- Non-numeric: "Please enter a valid salary amount"
- Exceeds maximum: "Salary exceeds maximum allowed value of $10,000,000"
- Empty when required: "Current salary is required for calculations"

### Percentage Calculation Validation

**Rules**:
- Display with exactly 2 decimal places (e.g., "10.53%")
- Include sign for positive values: "+10.53%"
- Include sign for negative values: "-5.25%"
- Zero change displays as: "0.00%"
- Handle edge case when currentSalary is 0: Display "N/A" or disable calculation

### Date Validation

**Rules**:
- Must be valid ISO 8601 format: "YYYY-MM-DD"
- Effective dates must not be future dates
- Effective dates should be chronologically consistent within salary history

---

## Data Flow

### 1. Loading Employee for Calculation

```text
User selects employee from dropdown
    ↓
Frontend fetches User data via API (GET /api/users/:id)
    ↓
Extract currentSalary and salaryHistory
    ↓
Initialize SalaryCalculation state with currentSalary
    ↓
Display current salary (read-only)
```

### 2. Real-time Percentage Calculation

```text
User types in proposed salary input
    ↓
Input value updates SalaryCalculation.proposedSalary (onChange)
    ↓
Calculate percentageChange = ((proposed - current) / current) * 100
    ↓
Update PercentageDisplay component with new value
    ↓
Update VisualSlider component with new visual representation
```

### 3. Updating Employee Salary (Future - P3)

```text
User confirms new salary (via separate action)
    ↓
Frontend sends UPDATE request (PUT /api/users/:id/salary)
    ↓
Backend validates new salary value
    ↓
Backend creates SalaryHistoryEntry with old currentSalary
    ↓
Backend updates User.currentSalary with new value
    ↓
Backend appends entry to User.salaryHistory
    ↓
Backend persists updated User to users.json
    ↓
Frontend refetches User data
    ↓
Success message displayed
```

---

## Storage Considerations

### Backend Storage (users.json)

**Current Structure**:
```json
{
  "users": [
    {
      "id": "user-123",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "Senior Developer",
      "department": "Engineering",
      "joinedDate": "2020-03-15",
      "status": "active"
    }
  ]
}
```

**Updated Structure** (with salary fields):
```json
{
  "users": [
    {
      "id": "user-123",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "Senior Developer",
      "department": "Engineering",
      "joinedDate": "2020-03-15",
      "status": "active",
      "currentSalary": 85000.00,
      "salaryHistory": [
        {
          "salary": 80000.00,
          "effectiveDate": "2025-01-15",
          "updatedBy": "user-456",
          "notes": "Annual review increase"
        },
        {
          "salary": 75000.00,
          "effectiveDate": "2024-01-10",
          "updatedBy": "user-456",
          "notes": "Merit increase"
        }
      ]
    }
  ]
}
```

**Migration Strategy**:
- Salary fields are optional, so existing users without salary data remain valid
- New users can be created with or without salary information
- Gradual rollout: Add salary data to users as needed
- No breaking changes to existing API endpoints

---

## Type Definitions Reference

### TypeScript Interfaces

```typescript
// Frontend: src/types/user.ts
// Backend: backend/src/types/user.types.ts

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  avatar?: string;
  phone?: string;
  joinedDate: string;
  status: 'active' | 'inactive' | 'on-leave';
  bio?: string;
  skills?: string[];
  location?: string;
  currentSalary?: number;           // NEW
  salaryHistory?: SalaryHistoryEntry[]; // NEW
}

export interface SalaryHistoryEntry {
  salary: number;
  effectiveDate: string;
  updatedBy?: string;
  notes?: string;
}

// Frontend only: src/types/salary.ts (NEW FILE)
export interface SalaryCalculation {
  userId: string;
  currentSalary: number;
  proposedSalary?: number;
  percentageChange: number;
  calculatedAt: Date;
}
```

---

## Indexes and Queries

### Required Queries

1. **Get user by ID** (existing):
   - Endpoint: `GET /api/users/:id`
   - Returns: Full User object including salary fields

2. **Get all users** (existing):
   - Endpoint: `GET /api/users`
   - Returns: Array of User objects
   - Use case: Populate employee selector dropdown

3. **Update user salary** (new - P3 priority):
   - Endpoint: `PUT /api/users/:id/salary`
   - Request body: `{ currentSalary: number, effectiveDate: string, notes?: string }`
   - Returns: Updated User object

### Performance Considerations

- File-based storage is sufficient for small-to-medium user counts (<1000 users)
- Salary history arrays should be limited per user (suggest max 50 entries) to prevent excessive growth
- Consider adding salary field indexes if migrating to database in future

---

## Summary

**New Entities**: 
- `SalaryHistoryEntry` (persisted within User)
- `SalaryCalculation` (transient, UI state only)

**Extended Entities**:
- `User` (added `currentSalary` and `salaryHistory` fields)

**Storage Impact**:
- Minor addition to existing `users.json` file structure
- Backward compatible (salary fields optional)
- Estimated storage per user: ~200-500 bytes additional (depends on history length)

**Next Steps**:
- Generate TypeScript interface contracts
- Update backend user service to handle salary operations
- Implement frontend calculator logic with defined validation rules
