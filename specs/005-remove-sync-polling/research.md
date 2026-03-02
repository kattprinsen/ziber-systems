# Research: Remove Sync Status Polling

**Feature**: 005-remove-sync-polling  
**Phase**: Phase 0 - Research & Technical Decisions  
**Date**: March 2, 2026

## Research Overview

This document consolidates technical research for removing the automatic polling mechanism from the sync status indicator. Since all technical context is already known from the existing codebase (React 19, TypeScript 5.x, Vitest), this research focuses on implementation patterns and best practices.

## Research Tasks Completed

### 1. React useEffect Cleanup for Timers

**Research Question**: What is the correct pattern for removing `setInterval` from a React component's `useEffect` hook?

**Decision**: Remove interval-based polling entirely

**Rationale**: 
- Current implementation uses `setInterval(loadSyncStatus, 30000)` with cleanup via `clearInterval(interval)` in useEffect return
- To eliminate polling, we simply remove the setInterval call while keeping the initial load
- The existing cleanup pattern is already correct but will no longer be needed once interval is removed

**Pattern to Use**:
```typescript
// Current (with polling):
useEffect(() => {
  loadSyncStatus();
  const interval = setInterval(loadSyncStatus, 30000);
  return () => clearInterval(interval);
}, []);

// New (single call only):
useEffect(() => {
  loadSyncStatus();
}, []);
```

**Alternatives Considered**:
- Reducing poll frequency: Rejected because it still generates unnecessary traffic
- Using `setTimeout` recursively: Rejected because it's still automatic polling
- WebSocket/Server-Sent Events: Rejected as out of scope (spec explicitly states not to implement)

---

### 2. Manual Refresh Pattern in React

**Research Question**: What is the best pattern for implementing manual refresh functionality in React components?

**Decision**: Add a refresh button/action that calls the load function directly with loading state management

**Rationale**:
- Simple event handler that calls existing `loadSyncStatus()` function
- Add loading state to prevent duplicate calls during refresh
- Use standard React state management (useState) for loading indicator
- Maintain separation of concerns: UI component triggers, service handles API call

**Pattern to Use**:
```typescript
const [isRefreshing, setIsRefreshing] = useState(false);

const handleRefresh = async () => {
  if (isRefreshing) return; // Prevent duplicate calls
  
  setIsRefreshing(true);
  try {
    await loadSyncStatus();
  } finally {
    setIsRefreshing(false);
  }
};

// In JSX:
<button onClick={handleRefresh} disabled={isRefreshing}>
  {isRefreshing ? 'Refreshing...' : 'Refresh'}
</button>
```

**Alternatives Considered**:
- Debouncing with external library (lodash): Rejected to avoid new dependencies
- Manual debounce with setTimeout: Rejected as unnecessary complexity; simple loading flag is sufficient
- Automatic refresh on window focus: Rejected as that's still automatic behavior

---

### 3. Request Cancellation for Unmounted Components

**Research Question**: How should we handle in-flight API requests when the component unmounts?

**Decision**: Use AbortController with AbortSignal for proper request cancellation

**Rationale**:
- Modern browsers and Node.js fetch API support AbortController
- Prevents memory leaks from callbacks updating unmounted component state
- Existing `fetchSyncStatus()` uses axios, which supports signal-based cancellation
- Follows React best practices for async operations in effects

**Pattern to Use**:
```typescript
useEffect(() => {
  const abortController = new AbortController();
  
  const loadData = async () => {
    try {
      // Pass signal to API call (requires service modification)
      await loadSyncStatus(abortController.signal);
    } catch (error) {
      if (error.name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }
      // Handle other errors
      console.error('Failed to fetch sync status:', error);
    }
  };
  
  loadData();
  
  return () => {
    abortController.abort();
  };
}, []);
```

**Implementation Note**: This requires modifying `fetchSyncStatus` in `syncService.ts` to accept and pass through an optional `signal` parameter.

**Alternatives Considered**:
- Boolean flag `isMounted`: Rejected as outdated pattern, doesn't cancel network request
- Ignoring the issue: Rejected because it can cause "setState on unmounted component" warnings
- No-op: Accepted for MVP if service modification is complex; component-level guards can prevent state updates

---

### 4. Testing React Components with Async Behavior

**Research Question**: What testing patterns should be used for the modified SyncIndicator component?

**Decision**: Use Vitest + React Testing Library with user-event for interaction testing and MSW for API mocking

**Rationale**:
- Project already uses Vitest (configured in package.json)
- React Testing Library is already a dependency (`@testing-library/react`)
- User Event library (`@testing-library/user-event`) is available for simulating clicks
- Follow "test user behavior, not implementation" philosophy
- MSW (Mock Service Worker) is optional but recommended for API mocking

**Test Cases Required**:
1. Component renders and calls API once on mount
2. Manual refresh button triggers new API call
3. Multiple rapid clicks don't cause duplicate requests (loading state prevents)
4. Error states display correctly
5. Success states display correctly
6. Component unmounting doesn't cause errors

**Pattern to Use**:
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { SyncIndicator } from './SyncIndicator';
import * as syncService from '../../services/syncService';

describe('SyncIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches sync status once on mount', async () => {
    const fetchMock = vi.spyOn(syncService, 'fetchSyncStatus')
      .mockResolvedValue({ currentStatus: 'success', lastSyncLog: null });
    
    render(<SyncIndicator />);
    
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  it('allows manual refresh', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(syncService, 'fetchSyncStatus')
      .mockResolvedValue({ currentStatus: 'success', lastSyncLog: null });
    
    render(<SyncIndicator />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);
    
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });
});
```

**Alternatives Considered**:
- Enzyme: Rejected because React Testing Library is already in use and preferred
- Manual JSDOM manipulation: Rejected because RTL provides better abstractions
- E2E testing with Playwright: Rejected as overkill for component-level changes

---

### 5. UI/UX Pattern for Last Updated Timestamp

**Research Question**: How should the UI communicate that the status is not real-time?

**Decision**: Display "Last updated: [timestamp]" and make refresh action prominent

**Rationale**:
- Current implementation has `formatLastSyncTime()` function that shows relative time
- Extend this to show "Last checked: [time]" for the status query itself
- Make it clear the data is snapshots, not live
- Provide obvious refresh button/icon

**Pattern to Use**:
```typescript
const [lastChecked, setLastChecked] = useState<Date>(new Date());

const loadSyncStatus = async () => {
  // ... existing logic
  setLastChecked(new Date());
};

// In UI:
<div title={`Last checked: ${lastChecked.toLocaleTimeString()}`}>
  {/* status display */}
  <button onClick={handleRefresh}>🔄</button>
</div>
```

**Alternatives Considered**:
- No timestamp: Rejected because users need to know data freshness
- Auto-refresh after X minutes: Rejected because that's still polling
- Stale data indicator: Considered but rejected as adding complexity without clear value

---

## Technology Choices Summary

| Decision Area | Choice | Rationale |
|--------------|--------|-----------|
| **Polling Removal** | Remove setInterval entirely | Eliminates unnecessary resource usage |
| **Manual Refresh** | Button with loading state | Simple, user-controlled, no new dependencies |
| **Request Cancellation** | AbortController (optional) | Modern standard, prevents memory leaks |
| **Testing** | Vitest + React Testing Library | Already in use, industry standard |
| **UI Pattern** | Last updated timestamp + refresh button | Clear communication, user control |

## Implementation Dependencies

**No new dependencies required**. All patterns use:
- React 19 built-in features (useState, useEffect)
- TypeScript 5.x type safety
- Existing testing infrastructure (Vitest, React Testing Library)
- Existing service layer (syncService.ts)

## Performance Impact Analysis

### Before (with polling):
- API calls per hour per client: ~120 (1 every 30 seconds)
- Client-side timer count: 1 active setInterval per mounted component
- Network requests: Continuous, regardless of user activity

### After (without polling):
- API calls per hour per client: ~1-5 (mount + manual refreshes)
- Client-side timer count: 0
- Network requests: On-demand only

**Expected improvement**: 95%+ reduction in API calls, elimination of timer overhead, reduced server load.

## Open Questions & Clarifications

**All technical questions resolved.** No NEEDS CLARIFICATION items remain.

- ✅ Known: How to remove setInterval from React component
- ✅ Known: Pattern for manual refresh functionality
- ✅ Known: Request cancellation approach (AbortController)
- ✅ Known: Testing strategy and tools
- ✅ Known: UI/UX pattern for last updated display

## Next Steps

Proceed to **Phase 1**: Design & Contracts generation
- Generate data-model.md (component state model)
- Generate contracts/ (component API interface)
- Generate quickstart.md (developer guide)
