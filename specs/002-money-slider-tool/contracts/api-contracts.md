# API Contracts: Money Slider Tool

**Feature**: Money Slider Tool  
**Branch**: 002-money-slider-tool  
**Date**: February 13, 2026  
**Purpose**: Define REST API endpoint specifications for salary operations

## Base URL

```
Development: http://localhost:3001/api
Production: [TBD]
```

## Authentication

All endpoints require appropriate authorization. Authentication mechanism follows existing system implementation.

**Headers**:
```
Authorization: Bearer <token>  // If applicable
Content-Type: application/json
```

---

## Endpoints

### 1. Get All Users

**Existing Endpoint** - No changes required

**Endpoint**: `GET /api/users`

**Description**: Retrieve list of all users for employee selector dropdown.

**Query Parameters**: None

**Request Headers**:
```
Content-Type: application/json
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "user-123",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "Senior Developer",
      "department": "Engineering",
      "avatar": "https://example.com/avatars/john.jpg",
      "phone": "+1-555-0100",
      "joinedDate": "2020-03-15",
      "status": "active",
      "bio": "Full-stack developer...",
      "skills": ["TypeScript", "React", "Node.js"],
      "location": "San Francisco",
      "currentSalary": 85000.00,
      "salaryHistory": [
        {
          "salary": 80000.00,
          "effectiveDate": "2025-01-15",
          "updatedBy": "user-456",
          "notes": "Annual review increase"
        }
      ]
    }
  ]
}
```

**Response** (500 Internal Server Error):
```json
{
  "success": false,
  "error": "Failed to fetch users",
  "message": "Internal server error"
}
```

**Notes**:
- Returns all users including optional `currentSalary` and `salaryHistory` fields
- Users without salary data will have `undefined` for salary fields
- Frontend should handle cases where `currentSalary` is missing

---

### 2. Get User by ID

**Existing Endpoint** - No changes required

**Endpoint**: `GET /api/users/:id`

**Description**: Retrieve detailed information for a specific user including salary data.

**Path Parameters**:
- `id` (string, required) - User's unique identifier

**Request Example**:
```
GET /api/users/user-123
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "Senior Developer",
    "department": "Engineering",
    "avatar": "https://example.com/avatars/john.jpg",
    "phone": "+1-555-0100",
    "joinedDate": "2020-03-15",
    "status": "active",
    "bio": "Full-stack developer with 10 years experience",
    "skills": ["TypeScript", "React", "Node.js"],
    "location": "San Francisco",
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
}
```

**Response** (404 Not Found):
```json
{
  "success": false,
  "error": "User not found",
  "message": "No user found with ID: user-123"
}
```

**Response** (500 Internal Server Error):
```json
{
  "success": false,
  "error": "Failed to fetch user",
  "message": "Internal server error"
}
```

**Notes**:
- `currentSalary` and `salaryHistory` are optional fields
- `salaryHistory` is sorted by `effectiveDate` in descending order (most recent first)

---

### 3. Update User Salary

**New Endpoint** - Priority P3 (User Story 3)

**Endpoint**: `PUT /api/users/:id/salary`

**Description**: Update a user's current salary and add historical record.

**Path Parameters**:
- `id` (string, required) - User's unique identifier

**Request Body**:
```json
{
  "currentSalary": 90000.00,
  "effectiveDate": "2026-02-13",
  "notes": "Mid-year adjustment"
}
```

**Request Body Schema**:
```typescript
{
  currentSalary: number;      // Required: New salary amount, must be >= 0
  effectiveDate: string;      // Required: ISO 8601 date, must not be future date
  notes?: string;            // Optional: Context for the change, max 500 chars
}
```

**Request Example**:
```
PUT /api/users/user-123/salary
Content-Type: application/json

{
  "currentSalary": 90000.00,
  "effectiveDate": "2026-02-13",
  "notes": "Promotion to Lead Developer"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "name": "John Doe",
    "currentSalary": 90000.00,
    "salaryHistory": [
      {
        "salary": 85000.00,
        "effectiveDate": "2026-02-13",
        "updatedBy": "user-789",
        "notes": "Previous salary"
      },
      {
        "salary": 80000.00,
        "effectiveDate": "2025-01-15",
        "updatedBy": "user-456",
        "notes": "Annual review increase"
      }
    ]
  },
  "message": "Salary updated successfully"
}
```

**Response** (400 Bad Request):
```json
{
  "success": false,
  "error": "Validation error",
  "message": "Invalid salary value",
  "details": [
    "currentSalary must be a positive number",
    "effectiveDate must not be a future date"
  ]
}
```

**Response** (404 Not Found):
```json
{
  "success": false,
  "error": "User not found",
  "message": "No user found with ID: user-123"
}
```

**Response** (403 Forbidden):
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Insufficient permissions to update salary"
}
```

**Response** (500 Internal Server Error):
```json
{
  "success": false,
  "error": "Failed to update salary",
  "message": "Internal server error"
}
```

**Backend Business Logic**:
1. Validate request body (salary >= 0, valid date format, effective date not in future)
2. Fetch current user from storage
3. Create `SalaryHistoryEntry` with current `currentSalary` value
4. Set `updatedBy` to authenticated user's ID (from request context)
5. Append entry to `user.salaryHistory` array
6. Update `user.currentSalary` with new value
7. Ensure `salaryHistory` is sorted by `effectiveDate` descending
8. Persist updated user to storage
9. Return updated user object

**Validation Rules**:
- `currentSalary`: Must be >= 0, max 10,000,000
- `effectiveDate`: Must be valid ISO 8601 date string, must not be future date
- `notes`: Optional, max 500 characters
- User must exist in system
- Requester must have authorization to update salaries

---

## Data Types

### User

```typescript
interface User {
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
  currentSalary?: number;
  salaryHistory?: SalaryHistoryEntry[];
}
```

### SalaryHistoryEntry

```typescript
interface SalaryHistoryEntry {
  salary: number;
  effectiveDate: string;  // ISO 8601 format: "YYYY-MM-DD"
  updatedBy?: string;     // User ID of authorizer
  notes?: string;
}
```

### ApiResponse<T>

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: string[];  // Additional validation error details
}
```

---

## Error Handling

### Standard Error Response Format

```typescript
{
  success: false,
  error: string,      // Error category/type
  message: string,    // Human-readable error message
  details?: string[]  // Optional array of specific error details
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful request |
| 201 | Created | Resource successfully created (if applicable) |
| 400 | Bad Request | Invalid request body, validation errors |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but insufficient permissions |
| 404 | Not Found | Requested user does not exist |
| 500 | Internal Server Error | Server-side error |

---

## Client-Side Integration

### Service Layer Example

**Location**: `src/services/userService.ts`

```typescript
import { User, ApiResponse } from '../types/user';

const API_BASE_URL = 'http://localhost:3001/api';

export async function getUsers(): Promise<User[]> {
  const response = await fetch(`${API_BASE_URL}/users`);
  const result: ApiResponse<User[]> = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch users');
  }
  
  return result.data;
}

export async function getUserById(id: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/users/${id}`);
  const result: ApiResponse<User> = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch user');
  }
  
  return result.data;
}

export async function updateUserSalary(
  id: string,
  currentSalary: number,
  effectiveDate: string,
  notes?: string
): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/users/${id}/salary`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ currentSalary, effectiveDate, notes }),
  });
  
  const result: ApiResponse<User> = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to update salary');
  }
  
  return result.data;
}
```

---

## API Versioning

**Current Version**: v1 (implicit, no version prefix in URL)

**Future Considerations**:
- If breaking changes are needed, introduce `/api/v2/` prefix
- Maintain backward compatibility for v1 endpoints
- Document migration path for clients

---

## Rate Limiting

**Current**: No rate limiting implemented

**Future Considerations**:
- Implement rate limiting for production (e.g., 100 requests/minute per IP)
- Return `429 Too Many Requests` status with `Retry-After` header when limit exceeded

---

## Testing Contracts

### Backend API Tests

**Get All Users**:
- ✓ Returns 200 and user array on success
- ✓ Returns 500 on file read error
- ✓ Includes salary fields when present
- ✓ Excludes salary fields when not present

**Get User by ID**:
- ✓ Returns 200 and user object on success
- ✓ Returns 404 when user not found
- ✓ Returns 500 on file read error
- ✓ Includes complete salary history sorted by date

**Update User Salary**:
- ✓ Returns 200 and updated user on successful update
- ✓ Creates salary history entry with old value
- ✓ Updates currentSalary with new value
- ✓ Returns 400 for negative salary
- ✓ Returns 400 for future effective date
- ✓ Returns 404 when user not found
- ✓ Returns 403 when unauthorized
- ✓ Sets updatedBy to authenticated user ID
- ✓ Persists changes to storage

---

**Document Status**: Complete - Ready for implementation
