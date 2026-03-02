# Data Model: Tidig API User Synchronization

**Date**: February 23, 2026  
**Feature**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md) | **Research**: [research.md](research.md)

## Purpose

Defines the data structures, entities, relationships, and state transitions for the Tidig user synchronization feature.

## Core Entities

### User (Enhanced)

**Description**: Represents an individual managed by the system. Extended to support Tidig synchronization with field-level tracking and active/inactive status.

**Source**: Hybrid - Tidig API + local management

**Fields**:

| Field | Type | Source | Required | Description | Sync Behavior |
|-------|------|--------|----------|-------------|---------------|
| `id` | string | Local | Yes | Internal unique ID (UUID-like) | Preserved |
| `employeeID` | string | Tidig | Yes | **Unique matching key** from Tidig (e.g., "SBQ") | Update from Tidig |
| `name` | string | Tidig | Yes | Full name | Update from Tidig |
| `email` | string | Tidig | Yes | Email address | Update from Tidig |
| `role` | string | Local | No | Job title/role | Preserved (local) |
| `department` | string | Local | No | Department name | Preserved (local) |
| `avatar` | string? | Local | No | Avatar URL | Preserved (local) |
| `phone` | string? | Local | No | Phone number | Preserved (local) |
| `joinedDate` | string | Local | Yes | ISO date when added to system | Preserved (local) |
| `status` | UserStatus | Computed | Yes | Active/inactive based on Tidig presence | Computed during sync |
| `syncStatus` | SyncStatus? | Computed | No | Sync metadata | Updated during sync |
| `bio` | string? | Local | No | Biography/description | Preserved (local) |
| `skills` | string[]? | Local | No | Skills array | Preserved (local) |
| `location` | string? | Local | No | Work location | Preserved (local) |
| `currentSalary` | number? | Local | No | Current salary amount | Preserved (local) |
| `salaryHistory` | SalaryHistoryEntry[]? | Local | No | Salary change history | Preserved (local) |

**NEW FIELDS (added by this feature)**:
- `employeeID`: Matching key from Tidig
- `syncStatus`: Metadata about last sync

**Status Enum**:
```typescript
type UserStatus = 'active' | 'inactive' | 'on-leave';
```

- `active`: User exists in Tidig and local system
- `inactive`: User exists only locally (not in Tidig) - former employee or removed from Tidig
- `on-leave`: (existing) User is on leave - preserved for future use

**Validation Rules**:
- `employeeID` must be unique across all users
- `email` should follow email format (validated by Tidig, accepted as-is)
- `name` cannot be empty string (fallback to "Unknown" if missing from Tidig)
- `currentSalary` must be >= 0 if present
- `joinedDate` must be valid ISO 8601 date string

---

### SyncStatus (NEW)

**Description**: Metadata about user sync status, embedded in User entity.

**Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `lastSync` | string (ISO datetime) | Yes | When user was last synced from Tidig |
| `source` | 'tidig' \| 'local' | Yes | Where user originated |
| `wasInactive` | boolean? | No | True if user was previously inactive and got reactivated |

**Example**:
```typescript
{
  lastSync: "2026-02-23T14:30:00Z",
  source: "tidig",
  wasInactive: false
}
```

---

### SyncLog (NEW)

**Description**: Record of a synchronization operation. Stored separately for audit trail.

**Storage**: Could be in-memory (for MVP) or file-based (future: database table)

**Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `syncId` | string | Yes | Unique ID for this sync operation (UUID) |
| `timestamp` | string (ISO datetime) | Yes | When sync started |
| `duration` | number | Yes | Sync duration in milliseconds |
| `status` | SyncResultStatus | Yes | Overall sync outcome |
| `usersProcessed` | number | Yes | Total users from Tidig |
| `usersAdded` | number | Yes | Count of new users added |
| `usersUpdated` | number | Yes | Count of existing users updated |
| `usersInactivated` | number | Yes | Count of users marked inactive |
| `usersReactivated` | number | Yes | Count of inactive users reactivated |
| `errors` | SyncError[] | Yes (can be empty) | Errors encountered during sync |
| `warnings` | SyncWarning[] | Yes (can be empty) | Non-fatal warnings |

**SyncResultStatus Enum**:
```typescript
type SyncResultStatus = 
  | 'success'           // Fully successful
  | 'partial_success'   // Completed with warnings
  | 'failed';           // Failed to complete
```

---

### SyncError (NEW)

**Description**: Represents an error that occurred during synchronization.

**Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | ErrorCode | Yes | Machine-readable error code |
| `message` | string | Yes | Human-readable error message |
| `context` | Record<string, any>? | No | Additional context (endpoint, user ID, etc.) |
| `timestamp` | string (ISO datetime) | Yes | When error occurred |

**ErrorCode Enum**:
```typescript
type ErrorCode =
  | 'SYNC_TIMEOUT'          // Tidig API timeout (>5s)
  | 'SYNC_AUTH_FAILED'      // Invalid API key
  | 'SYNC_API_ERROR'        // Tidig returned error response
  | 'SYNC_DATA_INVALID'     // Response doesn't match schema
  | 'SYNC_WRITE_FAILED'     // Could not save users.json
  | 'SYNC_NETWORK_ERROR';   // Network connectivity issue
```

---

### SyncWarning (NEW)

**Description**: Non-fatal issue encountered during sync.

**Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | WarningCode | Yes | Machine-readable warning code |
| `message` | string | Yes | Human-readable warning message |
| `context` | Record<string, any>? | No | Additional context |

**WarningCode Enum**:
```typescript
type WarningCode =
  | 'MISSING_EMPLOYEE_ID'    // User in Tidig missing employeeID
  | 'DUPLICATE_EMPLOYEE_ID'  // Duplicate employeeID in Tidig response
  | 'INCOMPLETE_USER_DATA'   // User missing expected fields
  | 'INVALID_EMAIL_FORMAT'   // Email doesn't match expected format
  | 'USERS_INACTIVATED';     // Some users marked inactive
```

---

### TidigEmployee (NEW)

**Description**: User data structure from Tidig API `/Api/Employee/SubTree` endpoint.

**Source**: External (Tidig API)

**Fields** (expected - to be validated with actual API):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `employeeID` | string | Yes | Unique employee identifier (e.g., "SBQ") |
| `name` | string | Yes | Full name |
| `email` | string | Yes | Email address |
| `[additional fields]` | any | No | Other fields returned by Tidig (TBD) |

**Note**: Actual structure will be discovered during implementation and validated with zod schema.

---

### SalaryHistoryEntry (Existing)

**Description**: Entry in user's salary history. No changes needed.

**Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `salary` | number | Yes | Salary amount at this point |
| `effectiveDate` | string (ISO date) | Yes | When this salary became effective |
| `updatedBy` | string? | No | Who updated the salary |
| `notes` | string? | No | Notes about the change |

---

## State Transitions

### User Status Lifecycle

```
[New from Tidig]
       ↓
   [active] ←─────────────┐
       ↓                   │
   (Not in Tidig)     (Reappears in Tidig)
       ↓                   │
   [inactive] ─────────────┘
       ↓
   (Manually deleted - future)
       ↓
   [deleted]
```

**Transitions**:

1. **New User Added** (`null` → `active`):
   - Trigger: employeeID appears in Tidig, not in local
   - Action: Create user with Tidig data + null local fields
   - Status: `active`
   - `syncStatus.source`: `"tidig"`

2. **Existing User Updated** (`active` → `active`):
   - Trigger: employeeID exists in both Tidig and local
   - Action: Update Tidig-managed fields, preserve local fields
   - Status: Remains `active`
   - `syncStatus.lastSync`: Updated to current time

3. **User Inactivated** (`active` → `inactive`):
   - Trigger: employeeID exists locally but not in Tidig
   - Action: Mark status as `inactive`, preserve all data
   - Status: `inactive`
   - Log: Add to warnings

4. **User Reactivated** (`inactive` → `active`):
   - Trigger: Previously inactive employeeID reappears in Tidig
   - Action: Update Tidig-managed fields, preserve local fields, mark as active
   - Status: `active`
   - `syncStatus.wasInactive`: Set to `true`
   - Log: Record reactivation in sync log

5. **User on Leave** (`active` → `on-leave`):
   - Trigger: Manual update (not part of sync)
   - Action: User-initiated status change
   - Note: Sync does not modify `on-leave` status

---

## Data Relationships

```
User 1─────┐
           │ contains
           ↓
      SyncStatus 1

User 1─────┐
           │ contains
           ↓
      SalaryHistoryEntry *

SyncLog 1──┐
           │ contains
           ├─→ SyncError *
           └─→ SyncWarning *
```

**Notes**:
- `User` has embedded `syncStatus` (one-to-one)
- `User` has array of `salaryHistory` (one-to-many)
- `SyncLog` is independent, not directly linked to users
- `SyncLog` contains arrays of errors and warnings

---

## Field-Level Classification

**For Merge Logic** (see [research.md](research.md) Section 7):

### Tidig-Managed Fields (Always Update)
- `employeeID` - unique key
- `name` - employee name
- `email` - contact email
- *(Future)* Time reporting data
- *(Future)* Organizational hierarchy

### Locally-Managed Fields (Always Preserve)
- `id` - internal UUID
- `role` - job title
- `department` - department assignment
- `avatar` - profile picture URL
- `phone` - phone number
- `bio` - biography text
- `skills` - skills array
- `location` - work location
- `currentSalary` - current salary amount
- `salaryHistory` - salary change history
- `joinedDate` - when added to system

### Computed Fields (Calculated During Sync)
- `status` - `active` if in Tidig, otherwise `inactive`
- `syncStatus.lastSync` - timestamp of last sync
- `syncStatus.wasInactive` - reactivation flag

---

## Data Storage

### users.json (Enhanced)

**Format**: JSON array of User objects

**Location**: `backend/src/data/users.json`

**Write Strategy**: Atomic write-and-rename (see [research.md](research.md) Section 3)

**Sample Structure**:
```json
[
  {
    "id": "user-001",
    "employeeID": "SBQ",
    "name": "Simon Bergqvist",
    "email": "simon@zibersystems.com",
    "role": "Senior Developer",
    "department": "Engineering",
    "status": "active",
    "syncStatus": {
      "lastSync": "2026-02-23T14:30:00Z",
      "source": "tidig",
      "wasInactive": false
    },
    "currentSalary": 85000,
    "salaryHistory": [
      {
        "salary": 85000,
        "effectiveDate": "2026-01-01",
        "notes": "Annual review"
      }
    ],
    "joinedDate": "2023-01-15",
    "avatar": "https://i.pravatar.cc/150?img=1",
    "phone": "+46 70 123 4567",
    "bio": "Developer at Ziber Systems",
    "skills": ["TypeScript", "React", "Node.js"],
    "location": "Stockholm, Sweden"
  }
]
```

---

### Sync Logs (Future Enhancement)

**Format**: JSON array or database table (not implemented in MVP)

**Location**: `backend/src/data/sync-logs.json` (if file-based)

**Note**: For MVP, sync logs may be in-memory only and logged to console/file logs. Persistent sync logs can be added later.

---

## Validation Schemas

### User Schema (Zod)

```typescript
import { z } from 'zod';

const UserStatusSchema = z.enum(['active', 'inactive', 'on-leave']);

const SyncStatusSchema = z.object({
  lastSync: z.string().datetime(),
  source: z.enum(['tidig', 'local']),
  wasInactive: z.boolean().optional(),
});

const SalaryHistoryEntrySchema = z.object({
  salary: z.number().nonnegative(),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  updatedBy: z.string().optional(),
  notes: z.string().optional(),
});

const UserSchema = z.object({
  id: z.string(),
  employeeID: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.string().optional(),
  department: z.string().optional(),
  avatar: z.string().url().optional(),
  phone: z.string().optional(),
  joinedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: UserStatusSchema,
  syncStatus: SyncStatusSchema.optional(),
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
  location: z.string().optional(),
  currentSalary: z.number().nonnegative().optional(),
  salaryHistory: z.array(SalaryHistoryEntrySchema).optional(),
});
```

### Tidig API Response Schema (Expected)

```typescript
const TidigEmployeeSchema = z.object({
  employeeID: z.string().min(1),
  name: z.string().min(1),
  email: z.string(), // Accept as-is from Tidig
  // Additional fields TBD when API is accessed
});

const TidigSubTreeResponseSchema = z.object({
  employees: z.array(TidigEmployeeSchema),
  // Additional fields TBD
});
```

**Note**: These schemas will be refined once actual Tidig API responses are observed.

---

## Migration Plan

### Existing users.json Enhancement

**Changes Required**:
1. Add `employeeID` field to all existing users
   - **Strategy**: Derive from name (e.g., "Test User" → "C001") or ask for manual mapping
   - **Alternative**: Leave null initially, populate during first sync (requires manual mapping)

2. Add `syncStatus` field
   - **Strategy**: Add during first successful sync
   - **Initial value**: `null` for existing users, populated after first sync

**Migration Script** (to be created if needed):
```typescript
// pseudo-code
for each user in users.json:
  if user.employeeID is missing:
    user.employeeID = deriveEmployeeID(user.name)
    user.syncStatus = null
```

---

## Data Integrity Rules

1. **employeeID Uniqueness**: No two active users can have the same employeeID
2. **Atomic Updates**: All changes to users.json must be atomic (write-and-rename)
3. **Status Consistency**: `status` must match sync outcome (active if in Tidig, inactive otherwise)
4. **History Preservation**: salaryHistory is append-only, never deleted during sync
5. **Required Fields**: All required fields must be present before saving
6. **Validation on Load**: users.json validation on server startup to catch corruption

---

## Next Steps

Phase 1 continues:
1. ✅ Data model defined
2. → Generate API contracts (Tidig external + internal endpoints)
3. → Generate quickstart.md
4. → Update agent context
