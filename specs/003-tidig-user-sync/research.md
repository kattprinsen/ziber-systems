# Research: Tidig API User Synchronization

**Date**: February 23, 2026  
**Feature**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

## Purpose

This document captures technical research and decisions made during Phase 0 to resolve unknowns identified in the Technical Context and support implementation planning.

## Research Questions

### 1. Backend Testing Framework

**Question**: Which testing framework should be used for backend testing?

**Context**: Frontend uses Vitest. Backend has no tests directory currently. Need consistency and TypeScript support.

**Decision**: **Vitest**

**Rationale**:
- **Consistency**: Frontend already uses Vitest, reducing cognitive overhead
- **TypeScript**: First-class TypeScript support with fast type checking
- **Speed**: Much faster than Jest for TypeScript projects (no babel transpilation needed)
- **Modern**: Native ESM support, watch mode, parallel execution
- **Compatible**: Jest-compatible API means easy migration if needed
- **Tooling**: Works well with tsx (already in project) for ES module execution

**Alternatives Considered**:
- **Jest**: Most popular, but slower with TypeScript, requires additional config
- **Mocha**: Minimal, but requires more setup for TypeScript and assertions
- **AVA**: Fast, but smaller ecosystem and different assertion style

**Implementation Notes**:
- Add vitest to backend devDependencies
- Create vitest.config.ts in backend directory
- Add test scripts to backend package.json: `test`, `test:watch`, `test:coverage`

---

### 2. HTTP Client for Tidig API

**Question**: Which HTTP client library should be used for Tidig API calls with timeout support?

**Context**: Need reliable timeout handling (5-second limit), header management (x-apikey), error handling. Backend is Node.js/TypeScript.

**Decision**: **axios**

**Rationale**:
- **Timeout support**: Built-in timeout configuration per request
- **TypeScript**: Excellent TypeScript definitions included
- **Interceptors**: Can add request/response interceptors for logging, error handling
- **Error handling**: Distinguishes between network errors, timeouts, and HTTP errors
- **Widely adopted**: Large ecosystem, well-tested, maintained
- **Familiar**: Common choice in Express.js backends

**Alternatives Considered**:
- **node-fetch**: Minimal, but timeout handling requires AbortController boilerplate
- **got**: Modern, but heavier and less familiar to most developers
- **Native http/https**: Too low-level, requires significant boilerplate

**Implementation Pattern**:
```typescript
import axios, { AxiosInstance } from 'axios';

const tidigClient: AxiosInstance = axios.create({
  baseURL: process.env.TIDIG_API_URL,
  timeout: 5000, // 5 seconds
  headers: {
    'x-apikey': process.env.TIDIG_API_KEY,
    'Content-Type': 'application/json'
  }
});
```

---

### 3. Atomic File Writes for users.json

**Question**: How to prevent data corruption when writing users.json during concurrent operations?

**Context**: Sync updates users.json. Must handle partial failures, prevent corruption during write, handle concurrent access.

**Decision**: **Write-and-rename pattern with fs-extra**

**Rationale**:
- **Atomicity**: Write to temp file, then atomic rename ensures all-or-nothing
- **Resilience**: If process crashes during write, original file is untouched
- **Simple**: fs-extra provides clean async/await API
- **Reliable**: Widely used pattern for atomic file updates

**Alternatives Considered**:
- **Direct write**: Risky - corruption if process dies mid-write
- **Database**: Overkill for current scale (100-1000 users)
- **File locking**: Complex, platform-dependent, not needed with write-and-rename

**Implementation Pattern**:
```typescript
import fs from 'fs-extra';
import path from 'path';

async function saveUsersAtomic(users: User[]): Promise<void> {
  const usersFile = path.join(__dirname, '../data/users.json');
  const tempFile = `${usersFile}.tmp`;
  
  // Write to temp file
  await fs.writeJSON(tempFile, users, { spaces: 2 });
  
  // Atomic rename (replaces original)
  await fs.move(tempFile, usersFile, { overwrite: true });
}
```

**Dependencies**: Add `fs-extra` and `@types/fs-extra` to backend

---

### 4. Error Handling and Retry Strategy

**Question**: Should failed API calls be retried? How to handle different failure types?

**Context**: 5-second timeout, fail-fast approach, 99% expected uptime. Need clear error categorization.

**Decision**: **No retries, clear error categorization**

**Rationale**:
- **Spec alignment**: Fast-fail approach (5s timeout) explicitly chosen for stable API
- **User experience**: Immediate feedback better than waiting for retries during startup
- **Simplicity**: No retry logic reduces complexity and edge cases
- **Next opportunity**: Sync runs on every startup - natural retry mechanism
- **Error visibility**: Clear error messages enable manual intervention if needed

**Error Categories**:
1. **Network/Timeout**: `SYNC_TIMEOUT` - Could not reach Tidig API within 5s
2. **Authentication**: `SYNC_AUTH_FAILED` - Invalid API key
3. **API Error**: `SYNC_API_ERROR` - Tidig returned error response (4xx, 5xx)
4. **Data Invalid**: `SYNC_DATA_INVALID` - Response doesn't match expected schema
5. **Write Failed**: `SYNC_WRITE_FAILED` - Could not save users.json

**Alternatives Considered**:
- **Exponential backoff retry**: Contradicts fast-fail requirement, delays startup
- **Circuit breaker**: Over-engineered for infrequent startup sync
- **Background retry**: Adds complexity, spec doesn't require it

---

### 5. Tidig API Response Structure

**Question**: What is the actual structure of responses from the 3 Tidig endpoints?

**Context**: Need to parse responses from:
- GET /Api/Time
- GET /Api/Employee/TimePermission  
- GET /Api/Employee/SubTree

**Decision**: **Define TypeScript interfaces based on common patterns, validate at runtime**

**Rationale**:
- **Type safety**: TypeScript interfaces provide compile-time checking
- **Runtime validation**: Use zod or similar for runtime validation of API responses
- **Flexibility**: Can adapt when actual API is accessed during development
- **Documentation**: Interfaces serve as API documentation

**Expected Structure** (to be validated):
```typescript
// SubTree - likely returns employee list with hierarchy
interface TidigEmployee {
  employeeID: string;      // e.g., "SBQ"
  name: string;
  email: string;
  // ... other fields TBD
}

interface TidigSubTreeResponse {
  employees: TidigEmployee[];
  // ... other fields TBD
}

// TimePermission - likely returns permission settings per employee
interface TidigTimePermission {
  employeeID: string;
  // ... fields TBD
}

// Time - likely returns time reporting data
interface TidigTimeEntry {
  employeeID: string;
  // ... fields TBD
}
```

**Validation Approach**:
- Use `zod` for schema validation
- Validate response structure before processing
- Log validation errors with actual response shape for debugging
- Fail gracefully if response doesn't match expected structure

**Alternatives Considered**:
- **No validation**: Risky - runtime errors if API changes
- **Runtime type checking only**: Less type safety during development
- **OpenAPI/Swagger**: Would be ideal if Tidig provides it, but likely not available

---

### 6. Environment Variable Management

**Question**: How should API keys and configuration be managed securely?

**Context**: Need to store Tidig API key, base URL, timeout settings. Backend currently uses process.env.

**Decision**: **dotenv with .env.example template**

**Rationale**:
- **Standard**: dotenv is de-facto standard for Node.js environment config
- **Security**: .env file in .gitignore prevents credential leakage
- **Documentation**: .env.example provides template without secrets
- **Validation**: Can validate required vars at startup

**Required Variables**:
```bash
# Tidig API Configuration
TIDIG_API_URL=https://api.tidig.se  # or actual base URL
TIDIG_API_KEY=your-api-key-here
TIDIG_API_TIMEOUT=5000              # milliseconds

# Existing
PORT=3001
FRONTEND_URL=http://localhost:5173
```

**Implementation**:
- Add `dotenv` to backend dependencies if not present
- Create `.env.example` in backend directory
- Load in server.ts: `import 'dotenv/config';`
- Validate required vars at startup before initializing services

**Alternatives Considered**:
- **Environment only**: Less developer-friendly, no local defaults
- **Config file**: More complex, dotenv is simpler for this scale
- **Secrets manager**: Overkill for development, consider for production

---

### 7. User Matching and Merging Logic

**Question**: How to reliably match and merge users between Tidig and local data?

**Context**: Use employeeID as unique key. Must preserve local fields (salary, etc.), update Tidig fields (name, email), handle new/inactive users.

**Decision**: **Three-way merge with field-level tracking**

**Strategy**:
1. **Index existing users** by employeeID into Map for O(1) lookup
2. **Process Tidig users**:
   - If employeeID exists locally: Update Tidig-managed fields, preserve local fields
   - If employeeID is new: Create user with Tidig data + null local fields
   - Mark all processed users as "active"
3. **Process remaining local users**: Users not in Tidig batch → mark "inactive"
4. **Handle reactivation**: If inactive user appears in Tidig → reactivate, update Tidig fields

**Field Classification**:
- **Tidig-managed** (always update from Tidig):
  - `name`, `email`, `employeeID`
  - Time reporting data (when integrated)
  - organizational hierarchy info
  
- **Locally-managed** (preserve during sync):
  - `currentSalary`, `salaryHistory`
  - `role`, `department` (unless Tidig provides these)
  - `bio`, `skills`, `location`
  - `joinedDate`, `phone`, `avatar`

**Edge Case Handling**:
- **Missing employeeID in Tidig**: Log warning, skip user
- **Duplicate employeeIDs in Tidig**: Use first, log warning
- **Invalid email format**: Accept as-is (validation is Tidig's responsibility)
- **Empty name**: Use "Unknown" placeholder, log warning

**Alternatives Considered**:
- **Replace entire user**: Loses local data (rejected per spec)
- **Manual merge decisions**: Contradicts auto-sync requirement
- **Last-write-wins**: Too simplistic, doesn't preserve designated local fields

---

### 8. Sync Notification UI

**Question**: How should sync status be communicated to administrators in the frontend?

**Context**: Must display notification when sync fails (per FR-006b), show sync in progress.

**Decision**: **Toast notification + status indicator**

**Components**:
1. **SyncIndicator**: Small icon in navbar showing sync status (syncing/success/failed)
2. **Toast notification**: Appears on sync failure with clear message
3. **Admin logs**: Link to detailed sync logs for troubleshooting

**Notification Types**:
- **Success** (subtle): "User sync completed" - auto-dismiss after 3s
- **Failure** (prominent): "User sync failed - using last known data" - manual dismiss
- **Warning** (moderate): "X users marked inactive" - auto-dismiss after 5s

**State Management**:
- Use React Context or existing state management for sync status
- Poll `/api/sync/status` endpoint on mount and after operations
- WebSocket for real-time updates (future enhancement)

**Alternatives Considered**:
- **No UI**: Violates FR-006b requirement for notification
- **Modal dialog**: Too intrusive for startup process
- **Banner**: Less dismissible, takes screen space

---

## Technology Choices Summary

| Component | Technology | Version | Justification |
|-----------|-----------|---------|---------------|
| Backend Testing | Vitest | ^4.0 | Speed, TypeScript, consistency with frontend |
| HTTP Client | axios | ^1.6 | Timeout support, interceptors, TypeScript |
| File Operations | fs-extra | ^11.2 | Atomic writes, clean async API |
| Validation | zod | ^3.22 | Runtime type validation, TypeScript integration |
| Environment | dotenv | ^16.4 | Standard Node.js config management |
| Frontend Notifications | Toast library TBD | - | To be decided during implementation |

## Open Questions for Implementation

1. **Tidig API actual response format**: Will be discovered when first calling APIs, interfaces will need adjustment
2. **Backend testing framework setup**: Confirm Vitest or Jest based on team preference [Answered: Vitest]
3. **Toast library choice**: react-toastify, react-hot-toast, or custom? [To be decided in tasks phase]
4. **Sync status persistence**: Should sync success/failure be logged to file for audit? [To be decided in tasks phase]
5. **Manual sync trigger**: Should admins be able to manually trigger sync? [To be decided in tasks phase - spec only mentions startup]

## Dependencies to Add

### Backend
```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "dotenv": "^16.4.0",
    "fs-extra": "^11.2.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/fs-extra": "^11.0.0",
    "vitest": "^4.0.0"
  }
}
```

### Frontend
```json
{
  "dependencies": {
    "[toast-library]": "TBD"
  }
}
```

## Next Steps

Phase 0 complete. Proceed to Phase 1:
1. Generate data-model.md (user entity updates, sync entities)
2. Generate API contracts (Tidig external, internal sync endpoints)
3. Generate quickstart.md (developer setup guide)
4. Update agent context with new technologies
