# API Contract: Internal Sync Service

**Date**: February 23, 2026  
**Feature**: [spec.md](../spec.md) | **Plan**: [../plan.md](../plan.md)  
**Type**: Internal REST API (Backend ↔ Frontend)

## Overview

This document defines the internal REST API for sync status management and monitoring. These endpoints allow the frontend to display sync status, notifications, and access sync logs.

---

## Base Configuration

**Base URL**: `/api/sync`

**Authentication**: Session-based (inherits from existing auth if implemented)

**Content-Type**: `application/json`

---

## Endpoints

### 1. GET /api/sync/status

**Purpose**: Get current sync status and last sync information.

**Request**:
```http
GET /api/sync/status HTTP/1.1
Host: localhost:3001
Content-Type: application/json
```

**Success Response**:
```typescript
{
  "success": true,
  "data": {
    "currentStatus": "idle" | "syncing" | "success" | "failed",
    "lastSync": {
      "syncId": "550e8400-e29b-41d4-a716-446655440000",
      "timestamp": "2026-02-23T14:30:00Z",
      "duration": 1234,  // milliseconds
      "status": "success",
      "usersProcessed": 45,
      "usersAdded": 2,
      "usersUpdated": 42,
      "usersInactivated": 1,
      "usersReactivated": 0,
      "errors": [],
      "warnings": [
        {
          "code": "USERS_INACTIVATED",
          "message": "1 user marked inactive (not in Tidig)",
          "context": { "userIds": ["user-005"] }
        }
      ]
    }
  }
}
```

**Status**: 200 OK

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `currentStatus` | string | Current sync state: `idle`, `syncing`, `success`, `failed` |
| `lastSync` | SyncLog? | Last sync operation details, null if never synced |
| `lastSync.syncId` | string | Unique ID for the sync operation |
| `lastSync.timestamp` | string | ISO datetime when sync started |
| `lastSync.duration` | number | Duration in milliseconds |
| `lastSync.status` | string | `success`, `partial_success`, or `failed` |
| `lastSync.usersProcessed` | number | Total users from Tidig |
| `lastSync.usersAdded` | number | New users added |
| `lastSync.usersUpdated` | number | Existing users updated |
| `lastSync.usersInactivated` | number | Users marked inactive |
| `lastSync.usersReactivated` | number | Inactive users reactivated |
| `lastSync.errors` | SyncError[] | Errors encountered (empty if successful) |
| `lastSync.warnings` | SyncWarning[] | Warnings (empty if no issues) |

**Error Response**:
```typescript
{
  "success": false,
  "error": "Failed to retrieve sync status",
  "message": "Internal server error"
}
```

**Status**: 500 Internal Server Error

**Usage**: 
- Frontend calls on mount to display current sync status
- Polls periodically during sync operation (e.g., every 2 seconds)
- Displays notification if `lastSync.status === 'failed'`

---

### 2. POST /api/sync/trigger (Optional - Future Enhancement)

**Purpose**: Manually trigger a sync operation (not in MVP).

**Note**: Spec only requires automatic startup sync. Manual trigger is future enhancement.

**Request**:
```http
POST /api/sync/trigger HTTP/1.1
Host: localhost:3001
Content-Type: application/json
```

**Success Response**:
```typescript
{
  "success": true,
  "data": {
    "syncId": "550e8400-e29b-41d4-a716-446655440000",
    "message": "Sync triggered successfully",
    "estimatedDuration": 5000  // milliseconds
  }
}
```

**Status**: 202 Accepted (async operation)

**Error Responses**:

**409 Conflict** - Sync already in progress:
```typescript
{
  "success": false,
  "error": "Sync already in progress",
  "details": ["Current sync started at 2026-02-23T14:30:00Z"]
}
```

**503 Service Unavailable** - Rate limited or temporarily disabled:
```typescript
{
  "success": false,
  "error": "Sync temporarily unavailable",
  "message": "Please wait before triggering another sync"
}
```

**Usage**: 
- Admin triggers manual sync from UI
- Returns immediately, sync runs in background
- Frontend polls GET /api/sync/status for progress

**Implementation Priority**: Low (not in MVP)

---

### 3. GET /api/sync/logs

**Purpose**: Retrieve sync operation history (last N syncs).

**Request**:
```http
GET /api/sync/logs?limit=10 HTTP/1.1
Host: localhost:3001
Content-Type: application/json
```

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | 10 | Number of logs to retrieve (max 100) |
| `offset` | number | No | 0 | Pagination offset |

**Success Response**:
```typescript
{
  "success": true,
  "data": {
    "logs": [
      {
        "syncId": "550e8400-e29b-41d4-a716-446655440000",
        "timestamp": "2026-02-23T14:30:00Z",
        "duration": 1234,
        "status": "success",
        "usersProcessed": 45,
        "usersAdded": 2,
        "usersUpdated": 42,
        "usersInactivated": 1,
        "usersReactivated": 0,
        "errors": [],
        "warnings": []
      },
      // ... more logs
    ],
    "total": 50,  // Total number of logs available
    "limit": 10,
    "offset": 0
  }
}
```

**Status**: 200 OK

**Error Response**:
```typescript
{
  "success": false,
  "error": "Failed to retrieve sync logs",
  "message": "Internal server error"
}
```

**Status**: 500 Internal Server Error

**Usage**: 
- Admin views sync history for troubleshooting
- Pagination for large log sets

**Implementation Priority**: Medium (useful for MVP but not critical)

---

### 4. GET /api/sync/health

**Purpose**: Check if sync service is healthy and Tidig API is reachable.

**Request**:
```http
GET /api/sync/health HTTP/1.1
Host: localhost:3001
Content-Type: application/json
```

**Success Response**:
```typescript
{
  "success": true,
  "data": {
    "status": "healthy",
    "tidigApiReachable": true,
    "lastSuccessfulSync": "2026-02-23T14:30:00Z",
    "configurationValid": true
  }
}
```

**Status**: 200 OK

**Degraded Response** (still 200 OK):
```typescript
{
  "success": true,
  "data": {
    "status": "degraded",
    "tidigApiReachable": false,
    "lastSuccessfulSync": "2026-02-23T10:00:00Z",
    "configurationValid": true,
    "issues": [
      "Tidig API not reachable - may be temporary network issue"
    ]
  }
}
```

**Error Response** (configuration issue):
```typescript
{
  "success": false,
  "data": {
    "status": "unhealthy",
    "tidigApiReachable": false,
    "lastSuccessfulSync": null,
    "configurationValid": false,
    "issues": [
      "TIDIG_API_KEY environment variable not set",
      "Cannot connect to Tidig API"
    ]
  }
}
```

**Status**: 503 Service Unavailable

**Usage**: 
- Health check endpoint for monitoring
- Admin dashboard to verify sync service status

**Implementation Priority**: Low (nice to have)

---

## Response Types (TypeScript)

### SyncStatus

```typescript
type SyncStatusType = 'idle' | 'syncing' | 'success' | 'failed';

interface SyncStatusResponse extends ApiResponse<SyncStatusData> {}

interface SyncStatusData {
  currentStatus: SyncStatusType;
  lastSync: SyncLog | null;
}
```

### SyncLog

```typescript
interface SyncLog {
  syncId: string;
  timestamp: string;  // ISO datetime
  duration: number;   // milliseconds
  status: 'success' | 'partial_success' | 'failed';
  usersProcessed: number;
  usersAdded: number;
  usersUpdated: number;
  usersInactivated: number;
  usersReactivated: number;
  errors: SyncError[];
  warnings: SyncWarning[];
}
```

### SyncError

```typescript
interface SyncError {
  code: ErrorCode;
  message: string;
  context?: Record<string, any>;
  timestamp: string;  // ISO datetime
}

type ErrorCode =
  | 'SYNC_TIMEOUT'
  | 'SYNC_AUTH_FAILED'
  | 'SYNC_API_ERROR'
  | 'SYNC_DATA_INVALID'
  | 'SYNC_WRITE_FAILED'
  | 'SYNC_NETWORK_ERROR';
```

### SyncWarning

```typescript
interface SyncWarning {
  code: WarningCode;
  message: string;
  context?: Record<string, any>;
}

type WarningCode =
  | 'MISSING_EMPLOYEE_ID'
  | 'DUPLICATE_EMPLOYEE_ID'
  | 'INCOMPLETE_USER_DATA'
  | 'INVALID_EMAIL_FORMAT'
  | 'USERS_INACTIVATED';
```

### ApiResponse (Generic)

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: string[];
}
```

---

## Frontend Integration

### Service Implementation

```typescript
// frontend/src/services/syncService.ts
import { api } from './api';

export const syncService = {
  async getStatus(): Promise<SyncStatusResponse> {
    const response = await api.get<SyncStatusResponse>('/api/sync/status');
    return response.data;
  },

  async triggerSync(): Promise<ApiResponse<{ syncId: string }>> {
    const response = await api.post('/api/sync/trigger');
    return response.data;
  },

  async getLogs(limit = 10, offset = 0): Promise<SyncLogsResponse> {
    const response = await api.get<SyncLogsResponse>(
      `/api/sync/logs?limit=${limit}&offset=${offset}`
    );
    return response.data;
  },

  async getHealth(): Promise<SyncHealthResponse> {
    const response = await api.get<SyncHealthResponse>('/api/sync/health');
    return response.data;
  }
};
```

### Component Usage

```tsx
// frontend/src/components/sync/SyncStatus.tsx
import { useEffect, useState } from 'react';
import { syncService } from '../../services/syncService';

export function SyncStatus() {
  const [status, setStatus] = useState<SyncStatusData | null>(null);

  useEffect(() => {
    // Initial load
    syncService.getStatus().then(response => {
      if (response.success) {
        setStatus(response.data);
      }
    });

    // Poll every 10 seconds if syncing
    const interval = setInterval(async () => {
      const response = await syncService.getStatus();
      if (response.success) {
        setStatus(response.data);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Display sync notification if failed
  if (status?.lastSync?.status === 'failed') {
    return (
      <div className="alert alert-error">
        Sync failed - using last known user data
      </div>
    );
  }

  return null;  // Or minimal success indicator
}
```

---

## Security Considerations

1. **Authorization**: Sync status should be accessible to authenticated users, sync trigger (if implemented) should be admin-only

2. **Rate Limiting**: Implement rate limiting on manual trigger endpoint to prevent abuse

3. **Error Messages**: Don't expose sensitive information (API keys, internal paths) in error messages

4. **Input Validation**: Validate query parameters (limit, offset) to prevent injection attacks

---

## Performance Considerations

1. **Caching**: Cache sync status for 1-2 seconds to reduce database/file reads during polling

2. **Async Operations**: Sync runs asynchronously, doesn't block API responses

3. **Lightweight Status**: Status endpoint should be very fast (<50ms)

4. **Log Pagination**: Implement pagination for sync logs to avoid large responses

---

## Testing Strategy

### Unit Tests

Test each endpoint handler:
```typescript
describe('GET /api/sync/status', () => {
  it('returns current sync status', async () => {
    const response = await request(app).get('/api/sync/status');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('currentStatus');
  });

  it('returns null lastSync if never synced', async () => {
    const response = await request(app).get('/api/sync/status');
    expect(response.body.data.lastSync).toBeNull();
  });
});
```

### Integration Tests

Test full sync flow:
```typescript
describe('Sync Integration', () => {
  it('updates status after successful sync', async () => {
    // Trigger sync (or wait for startup)
    await triggerSync();
    
    // Wait for completion
    await waitFor(() => {
      const status = await request(app).get('/api/sync/status');
      return status.body.data.currentStatus === 'success';
    });
    
    // Verify status
    const status = await request(app).get('/api/sync/status');
    expect(status.body.data.lastSync.status).toBe('success');
    expect(status.body.data.lastSync.usersProcessed).toBeGreaterThan(0);
  });
});
```

---

## Error Handling

### Network Errors

Handled by frontend axios interceptor:
```typescript
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.code === 'ECONNABORTED') {
      // Timeout
      showNotification('Request timed out. Please try again.');
    } else if (error.response?.status === 500) {
      // Server error
      showNotification('Server error. Please contact support.');
    }
    return Promise.reject(error);
  }
);
```

### Business Logic Errors

Returned in response body with appropriate status codes and error messages.

---

## Monitoring & Logging

### Backend Logging

```typescript
app.get('/api/sync/status', (req, res) => {
  logger.info('[Sync API] Status requested', { 
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });
  
  // ... handler logic
});
```

### Metrics

Track:
- API endpoint response times
- Error rates per endpoint
- Sync status check frequency (polling)

---

**Status**: Design - Ready for implementation

**Implementation Priority**:
1. **High (MVP)**: GET /api/sync/status
2. **Medium**: GET /api/sync/logs
3. **Low (Future)**: POST /api/sync/trigger, GET /api/sync/health
