# API Contract: Tidig External API

**Date**: February 23, 2026  
**Feature**: [spec.md](../spec.md) | **Plan**: [../plan.md](../plan.md)  
**Type**: External API (Third-party)

## Overview

This document defines the contract for integrating with the Tidig external API. Tidig serves as the source of truth for employee identity and time reporting data.

---

## Authentication

**Method**: API Key in HTTP Header

**Header**: `x-apikey`

**Configuration**:
```typescript
headers: {
  'x-apikey': process.env.TIDIG_API_KEY
}
```

**Error Responses**:
- **401 Unauthorized**: Invalid or missing API key
- **403 Forbidden**: Valid key but insufficient permissions

---

## Base Configuration

**Base URL**: `process.env.TIDIG_API_URL` (e.g., `https://api.tidig.se`)

**Timeout**: 5000ms (5 seconds) per spec requirement

**Content-Type**: `application/json`

**Client Setup**:
```typescript
const tidigClient = axios.create({
  baseURL: process.env.TIDIG_API_URL,
  timeout: 5000,
  headers: {
    'x-apikey': process.env.TIDIG_API_KEY,
    'Content-Type': 'application/json'
  }
});
```

---

## Endpoints

### 1. GET /Api/Employee/SubTree

**Purpose**: Retrieve employee hierarchy and details. Primary endpoint for user list synchronization.

**Request**:
```http
GET /Api/Employee/SubTree HTTP/1.1
Host: api.tidig.se
x-apikey: {API_KEY}
Content-Type: application/json
```

**Expected Response** (to be validated):
```typescript
interface SubTreeResponse {
  employees: TidigEmployee[];
  // Additional fields TBD during implementation
}

interface TidigEmployee {
  employeeID: string;      // Unique identifier (e.g., "SBQ")
  name: string;            // Full name
  email: string;           // Email address
  // Additional fields TBD
}
```

**Success Response**:
- **Status**: 200 OK
- **Body**: JSON array or object containing employee data

**Error Responses**:
- **401**: Invalid API key
- **403**: Insufficient permissions
- **500**: Tidig server error
- **503**: Service temporarily unavailable

**Timeout**: 5 seconds (configured in client)

**Usage**: Called during application startup to fetch current employee list.

**Notes**:
- Actual response structure to be confirmed during implementation
- Zod schema will validate response at runtime
- Missing or malformed employeeID will trigger warning, user skipped

---

### 2. GET /Api/Employee/TimePermission

**Purpose**: Retrieve employee time reporting permissions.

**Request**:
```http
GET /Api/Employee/TimePermission HTTP/1.1
Host: api.tidig.se
x-apikey: {API_KEY}
Content-Type: application/json
```

**Expected Response** (to be validated):
```typescript
interface TimePermissionResponse {
  permissions: EmployeePermission[];
  // Additional fields TBD
}

interface EmployeePermission {
  employeeID: string;
  // Permission fields TBD
}
```

**Success Response**:
- **Status**: 200 OK
- **Body**: JSON containing permission data

**Error Responses**: Same as SubTree endpoint

**Timeout**: 5 seconds

**Usage**: Called during sync to enrich employee data (if needed for feature).

**Notes**:
- May not be needed for MVP if only basic user data required
- Structure to be confirmed during implementation

---

### 3. GET /Api/Time

**Purpose**: Retrieve time reporting data.

**Request**:
```http
GET /Api/Time HTTP/1.1
Host: api.tidig.se
x-apikey: {API_KEY}
Content-Type: application/json
```

**Query Parameters** (expected, TBD):
- `employeeID?`: Filter by specific employee
- `startDate?`: Date range start
- `endDate?`: Date range end

**Expected Response** (to be validated):
```typescript
interface TimeResponse {
  entries: TimeEntry[];
  // Additional fields TBD
}

interface TimeEntry {
  employeeID: string;
  date: string;           // ISO date
  hours: number;
  // Additional fields TBD
}
```

**Success Response**:
- **Status**: 200 OK
- **Body**: JSON containing time reporting data

**Error Responses**: Same as SubTree endpoint

**Timeout**: 5 seconds

**Usage**: Called during sync to fetch time reporting data (if needed for feature).

**Notes**:
- May not be needed for MVP user list sync
- Structure and parameters to be confirmed during implementation

---

## Error Handling Strategy

### Network Errors

**Timeout** (> 5 seconds):
```typescript
{
  code: 'ECONNABORTED',
  message: 'timeout of 5000ms exceeded'
}
```

**Action**: Log error, mark sync as failed, continue with local data

**No Network**:
```typescript
{
  code: 'ENOTFOUND' | 'ECONNREFUSED',
  message: 'Network error'
}
```

**Action**: Log error, mark sync as failed, notify administrators

---

### HTTP Error Responses

**401 Unauthorized**:
- **Cause**: Invalid or missing API key
- **Action**: Log critical error, mark sync failed, notify administrators immediately
- **Resolution**: Check TIDIG_API_KEY environment variable

**403 Forbidden**:
- **Cause**: Valid key but insufficient permissions
- **Action**: Log critical error, mark sync failed, notify administrators
- **Resolution**: Contact Tidig support for permission adjustment

**404 Not Found**:
- **Cause**: Endpoint doesn't exist (API changed?)
- **Action**: Log error, mark sync failed
- **Resolution**: Verify endpoint URLs, check Tidig API documentation

**429 Too Many Requests**:
- **Cause**: Rate limit exceeded
- **Action**: Log error, mark sync failed (no retry per fast-fail strategy)
- **Resolution**: Review sync frequency, contact Tidig for rate limit increase

**500/502/503 Server Errors**:
- **Cause**: Tidig server issue
- **Action**: Log error, mark sync failed, continue with local data
- **Resolution**: Wait for next startup sync, monitor Tidig status

---

### Data Validation Errors

**Invalid Schema** (Zod validation fails):
- **Cause**: Response doesn't match expected structure
- **Action**: Log actual response structure, mark sync failed
- **Recovery**: Update schemas if Tidig API changed

**Missing employeeID**:
- **Cause**: Employee record lacks employeeID field
- **Action**: Log warning, skip that employee, continue with others
- **Impact**: Partial success

**Duplicate employeeIDs**:
- **Cause**: Same employeeID appears multiple times
- **Action**: Use first occurrence, log warning
- **Impact**: Partial success

---

## Rate Limiting

**Expected Limits**: Unknown - to be discovered during implementation

**Observed Behavior**: Monitor for 429 responses

**Strategy**: 
- Single sync call per startup (low frequency)
- No retry logic (fast-fail approach)
- If rate limiting becomes issue, implement exponential backoff (future enhancement)

---

## Retry Policy

**Policy**: **No automatic retries** per fast-fail requirement

**Rationale**:
- 5-second timeout requirement
- Next startup provides natural retry mechanism
- Keeps implementation simple
- Aligns with 99% API uptime expectation

**Manual Retry**: Administrators can restart application to trigger sync

---

## Testing Strategy

### Unit Tests

Mock axios responses:
```typescript
Mock.getResponse('/Api/Employee/SubTree', {
  employees: [
    { employeeID: 'SBQ', name: 'Simon Bergqvist', email: 'simon@example.com' }
  ]
});
```

### Integration Tests

Use axios-mock-adapter or MSW (Mock Service Worker):
```typescript
mock.onGet('/Api/Employee/SubTree').reply(200, mockEmployees);
mock.onGet('/Api/Employee/SubTree').timeout();  // Test timeout
mock.onGet('/Api/Employee/SubTree').reply(401);  // Test auth error
```

### Contract Tests

Validate actual API responses against expected schemas during development:
```typescript
const response = await tidigClient.get('/Api/Employee/SubTree');
const validation = TidigSubTreeResponseSchema.safeParse(response.data);
if (!validation.success) {
  console.error('Schema mismatch:', validation.error);
}
```

---

## Security Considerations

1. **API Key Storage**: 
   - Store in `.env` file (gitignored)
   - Never commit to repository
   - Use environment variables in production

2. **HTTPS Only**: 
   - Ensure TIDIG_API_URL uses `https://`
   - Reject non-TLS connections

3. **Timeout**: 
   - 5-second timeout prevents hanging requests
   - Protects application startup from slow/unresponsive API

4. **Error Messages**: 
   - Don't expose API key in error logs
   - Don't expose internal system details to frontend

5. **Response Validation**: 
   - Always validate with Zod before processing
   - Prevents code injection via malformed responses

---

## Monitoring & Observability

### Metrics to Track

- **Sync Duration**: Time to complete full sync
- **API Response Times**: Per-endpoint latency
- **Error Rates**: Count of failed requests by error type
- **Timeout Frequency**: How often 5s timeout is hit
- **Success Rate**: Percentage of successful syncs

### Logging Requirements

**Successful Sync**:
```
[INFO] Tidig sync completed successfully
- Duration: 1234ms
- Employees fetched: 45
- New users added: 2
- Users updated: 43
```

**Failed Sync**:
```
[ERROR] Tidig sync failed: SYNC_TIMEOUT
- Endpoint: GET /Api/Employee/SubTree
- Duration: 5000ms
- Error: timeout of 5000ms exceeded
- Fallback: Using local user data
```

**Partial Success**:
```
[WARN] Tidig sync completed with warnings
- Duration: 1456ms
- Employees processed: 44/46
- Warnings: 2 employees missing employeeID
```

---

## Environment Configuration

**Required Variables**:
```bash
# Tidig API Configuration
TIDIG_API_URL=https://api.tidig.se
TIDIG_API_KEY=your-api-key-here
TIDIG_API_TIMEOUT=5000  # Optional, defaults to 5000ms
```

**Validation** (on server startup):
```typescript
if (!process.env.TIDIG_API_URL) {
  throw new Error('TIDIG_API_URL environment variable is required');
}
if (!process.env.TIDIG_API_KEY) {
  throw new Error('TIDIG_API_KEY environment variable is required');
}
```

---

## Development Notes

1. **Schema Discovery**: First implementation should log full response structures to understand actual Tidig API format
2. **Incremental Development**: Start with SubTree endpoint only, add TimePermission and Time later if needed
3. **Mock Data**: Create mock Tidig responses for development/testing without API access
4. **Documentation**: Update this contract once actual API structure is confirmed

---

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-02-23 | Initial contract definition | Feature planning |
| TBD | Update response schemas | After first API integration |

---

**Status**: Draft - Pending validation with actual Tidig API

**Next Review**: After first successful API integration
