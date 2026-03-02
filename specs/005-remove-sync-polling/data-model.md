# Data Model: Remove Sync Status Polling

**Feature**: 005-remove-sync-polling  
**Phase**: Phase 1 - Design & Contracts  
**Date**: March 2, 2026

## Overview

This document defines the data structures and state model for the modified SyncIndicator component after removing automatic polling. The component will manage loading states, error states, and timestamp tracking for manual refresh functionality.

## Component State Model

### SyncIndicator Component State

The SyncIndicator component maintains the following React state:

```typescript
interface SyncIndicatorState {
  // Current sync status from API
  syncStatus: SyncStatusResponse | null;
  
  // Error notification display state
  showError: boolean;
  errorMessage: string;
  
  // Manual refresh loading state (NEW)
  isRefreshing: boolean;
  
  // Last time status was fetched (NEW)
  lastChecked: Date | null;
}
```

#### State Field Descriptions

| Field | Type | Purpose | Initial Value |
|-------|------|---------|---------------|
| `syncStatus` | `SyncStatusResponse \| null` | Current sync status from backend API | `null` |
| `showError` | `boolean` | Whether to display error notification | `false` |
| `errorMessage` | `string` | Error message to display in notification | `""` |
| `isRefreshing` | `boolean` | Loading state during manual refresh (prevents duplicate calls) | `false` |
| `lastChecked` | `Date \| null` | Timestamp of last status check for display | `null` |

### Existing Type Definitions

These types are already defined in `src/types/sync.ts` and remain unchanged:

```typescript
// Sync status values
type SyncStatus = 'idle' | 'syncing' | 'success' | 'failed';

// Individual sync log entry
interface SyncLog {
  timestamp: string; // ISO 8601 date string
  status: SyncStatus;
  usersAdded: number;
  usersUpdated: number;
  usersDeactivated: number;
  errors: Array<{
    message: string;
    userId?: string;
  }>;
}

// API response from /api/sync/status
interface SyncStatusResponse {
  currentStatus: SyncStatus;
  lastSyncLog: SyncLog | null;
}
```

## State Transitions

### Component Lifecycle

```
[Component Mount]
     ↓
  loadSyncStatus() called once
     ↓
  [Status Loaded]
     ↓
  Display status + "Last checked" timestamp
     ↓
  [Wait for user action]
     ↓
  User clicks refresh → handleRefresh()
     ↓
  isRefreshing = true
     ↓
  loadSyncStatus() called again
     ↓
  isRefreshing = false
     ↓
  Update display with new status
     ↓
  [Back to waiting for user action]
```

### Error State Flow

```
loadSyncStatus()
     ↓
[API Call Fails]
     ↓
Log error to console
     ↓
syncStatus remains at previous value
     ↓
User can retry via manual refresh
```

```
loadSyncStatus() → success
     ↓
syncStatus.currentStatus === 'failed'
     ↓
syncStatus.lastSyncLog.errors.length > 0
     ↓
showError = true
errorMessage = errors[0].message
     ↓
Auto-hide after 10 seconds
     ↓
showError = false
```

## State Management Changes

### Removed Behavior

| Behavior | Reason for Removal |
|----------|-------------------|
| `setInterval(loadSyncStatus, 30000)` | Eliminates automatic polling |
| `clearInterval(interval)` in useEffect cleanup | No longer needed without interval |
| Automatic 30-second refresh | Replaced with manual refresh |

### Added Behavior

| Behavior | Purpose |
|----------|---------|
| `isRefreshing` state flag | Prevents duplicate API calls during manual refresh |
| `lastChecked` timestamp | Shows users when data was last fetched |
| `handleRefresh()` function | Provides manual refresh capability |
| Loading state management in handleRefresh | User feedback during refresh operation |

## Data Flow

### Initial Load Flow

```
User navigates to page with SyncIndicator
     ↓
Component mounts
     ↓
useEffect hook triggers
     ↓
loadSyncStatus() called
     ↓
syncService.fetchSyncStatus() → GET /api/sync/status
     ↓
Backend returns SyncStatusResponse
     ↓
setSyncStatus(response)
setLastChecked(new Date())
     ↓
Component re-renders with status
     ↓
Display sync status icon, text, and "Last checked" time
```

### Manual Refresh Flow

```
User clicks refresh button
     ↓
handleRefresh() called
     ↓
Check: isRefreshing === true? → Return early (no-op)
     ↓
isRefreshing === false → Continue
     ↓
setIsRefreshing(true)
     ↓
Button shows "Refreshing..." and is disabled
     ↓
await loadSyncStatus()
     ↓
syncService.fetchSyncStatus() → GET /api/sync/status
     ↓
Backend returns SyncStatusResponse
     ↓
setSyncStatus(response)
setLastChecked(new Date())
     ↓
setIsRefreshing(false) in finally block
     ↓
Component re-renders with updated status
     ↓
Button returns to normal "Refresh" state
```

## API Contract (Unchanged)

The component continues to use the existing sync status endpoint without modification:

**Endpoint**: `GET /api/sync/status`

**Response**: `SyncStatusResponse`
```json
{
  "currentStatus": "success",
  "lastSyncLog": {
    "timestamp": "2026-03-02T10:30:00Z",
    "status": "success",
    "usersAdded": 2,
    "usersUpdated": 5,
    "usersDeactivated": 0,
    "errors": []
  }
}
```

**No changes to backend API** - This feature only modifies how frequently the frontend calls this endpoint.

## Component Props (Unchanged)

```typescript
interface SyncIndicatorProps {
  className?: string; // Optional CSS classes for styling
}
```

No changes to component props - internal behavior only.

## Implementation Notes

### State Initialization

All state variables use `useState` hook with appropriate initial values:
- `syncStatus`: `null` (no data yet)
- `showError`: `false` (no error to display)
- `errorMessage`: `""` (empty string)
- `isRefreshing`: `false` (not loading)
- `lastChecked`: `null` (not yet checked)

### State Update Patterns

- **Synchronous updates**: `setIsRefreshing`, `setShowError`, `setErrorMessage`
- **Asynchronous updates**: `setSyncStatus` (after API response), `setLastChecked` (after API response)
- **Cleanup**: Auto-hide error uses `setTimeout`, which is cleared if component unmounts

### Memory Management

- Remove `clearInterval` from useEffect cleanup (no longer needed)
- Keep `setTimeout` cleanup for error auto-hide
- Optional: Add `AbortController` to cancel in-flight requests on unmount

## Validation Rules

| Rule | Check | Error Handling |
|------|-------|----------------|
| Prevent duplicate refresh calls | `if (isRefreshing) return;` at start of handleRefresh | Silently ignore |
| Handle API errors | try-catch in loadSyncStatus | Log to console, preserve previous status |
| Validate response structure | Type checking from TypeScript | Runtime errors logged |

## Testing Considerations

State to test:
- Initial state: All values at defaults
- After mount: syncStatus populated, lastChecked set, no polling occurs
- After manual refresh: isRefreshing toggles, new API call made, lastChecked updated
- During refresh: Button disabled, can't trigger duplicate calls
- On error: Error notification displays, auto-hides after 10s
- On unmount: No state updates attempted, no memory leaks

## Performance Considerations

### State Update Frequency

**Before (with polling)**:
- State updates every 30 seconds (automatic)
- Re-renders every 30 seconds (automatic)

**After (without polling)**:
- State updates only on mount and manual refresh (user-initiated)
- Re-renders only when user triggers refresh
- ~95% reduction in state updates and re-renders

### Memory Impact

- **Reduced**: No active timer in memory per component
- **Unchanged**: State objects remain same size
- **Minimal**: Added `isRefreshing` and `lastChecked` add negligible memory (~16 bytes)

## Related Entities

- **Backend Sync Service**: No changes (feature 003-tidig-user-sync remains unchanged)
- **Sync Status Endpoint**: No changes to API contract
- **Other Components**: No components consume SyncIndicator via props or context; change is isolated
