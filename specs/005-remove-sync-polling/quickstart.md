# Quickstart: Remove Sync Status Polling

**Feature**: 005-remove-sync-polling  
**Branch**: `005-remove-sync-polling`  
**Estimated Time**: 2-3 hours (implementation + testing)

## Overview

This guide walks through removing the automatic 30-second polling from the SyncIndicator component and adding manual refresh functionality. The change reduces API calls by 95% while maintaining full sync status visibility.

## Prerequisites

- Node.js 20+ installed
- Git repository cloned
- Existing feature branch checked out: `005-remove-sync-polling`
- Familiarity with React hooks (useState, useEffect)
- Basic TypeScript knowledge

## Quick Summary

**What's changing**:
- ❌ Remove: `setInterval(loadSyncStatus, 30000)` and its cleanup
- ✅ Add: Manual refresh button with loading state
- ✅ Add: "Last checked" timestamp display
- ✅ Add: Tests for new behavior

**What's staying the same**:
- Component props interface (no breaking changes)
- Error notification behavior
- Backend API (no changes needed)
- Overall visual design

## Implementation Steps

### Step 1: Understand Current Implementation

**File**: `src/components/sync/SyncIndicator.tsx`

Current polling mechanism (lines 44-50):
```typescript
// Initial load and polling (T072: every 30 seconds)
useEffect(() => {
  loadSyncStatus();
  const interval = setInterval(loadSyncStatus, 30000);
  return () => clearInterval(interval);
}, []);
```

This creates an interval that calls `loadSyncStatus()` every 30 seconds.

### Step 2: Add New State Variables

Add two new state variables after the existing state declarations:

```typescript
const [syncStatus, setSyncStatus] = useState<SyncStatusResponse | null>(null);
const [showError, setShowError] = useState(false);
const [errorMessage, setErrorMessage] = useState('');

// ADD THESE TWO NEW LINES:
const [isRefreshing, setIsRefreshing] = useState(false);
const [lastChecked, setLastChecked] = useState<Date | null>(null);
```

**Purpose**:
- `isRefreshing`: Tracks loading state during manual refresh, prevents duplicate calls
- `lastChecked`: Stores timestamp of last status fetch for display

### Step 3: Update loadSyncStatus Function

Modify the `loadSyncStatus` function to update the `lastChecked` timestamp:

```typescript
const loadSyncStatus = async () => {
  try {
    const status = await fetchSyncStatus();
    setSyncStatus(status);
    setLastChecked(new Date()); // ADD THIS LINE

    // Show error notification if sync failed (T073)
    if (status.currentStatus === 'failed' && status.lastSyncLog) {
      // ... existing error handling code ...
    } else {
      setShowError(false);
    }
  } catch (error) {
    console.error('Failed to fetch sync status:', error);
  }
};
```

### Step 4: Remove Polling from useEffect

Replace the polling useEffect with a single-call version:

**Before**:
```typescript
useEffect(() => {
  loadSyncStatus();
  const interval = setInterval(loadSyncStatus, 30000);
  return () => clearInterval(interval);
}, []);
```

**After**:
```typescript
useEffect(() => {
  loadSyncStatus();
  // Removed: setInterval and clearInterval
  // Component now only fetches status once on mount
}, []);
```

**Important**: Keep the `loadSyncStatus()` call - we still want initial load on mount!

### Step 5: Add Manual Refresh Handler

Add a new function to handle manual refresh button clicks:

```typescript
// Add this function after loadSyncStatus
const handleRefresh = async () => {
  // Prevent duplicate calls if already refreshing
  if (isRefreshing) return;
  
  setIsRefreshing(true);
  try {
    await loadSyncStatus();
  } finally {
    // Always reset refreshing state, even if error occurs
    setIsRefreshing(false);
  }
};
```

**Key points**:
- Early return prevents duplicate calls
- `finally` ensures loading state resets even on errors
- Calls existing `loadSyncStatus()` - no duplication of logic

### Step 6: Update UI - Add Refresh Button

Add a refresh button to the component's return JSX. Modify the status indicator section:

```tsx
return (
  <div className={`relative ${className}`}>
    {/* Sync Status Indicator */}
    <div className="flex items-center gap-2">
      <div 
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 transition-colors cursor-pointer"
        title={`Last checked: ${lastChecked ? new Date(lastChecked).toLocaleTimeString() : 'Never'}`}
      >
        <span className={getStatusColor(syncStatus.currentStatus)}>
          {getStatusIcon(syncStatus.currentStatus)}
        </span>
        <span className="text-sm text-gray-300">
          {getStatusText(syncStatus.currentStatus)}
        </span>
      </div>
      
      {/* ADD THIS REFRESH BUTTON: */}
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="px-2 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Refresh sync status"
        aria-label="Refresh sync status"
      >
        <span className={isRefreshing ? 'animate-spin' : ''}>
          🔄
        </span>
      </button>
    </div>

    {/* Error Notification (T073) - NO CHANGES */}
    {showError && (
      // ... existing error notification code ...
    )}
  </div>
);
```

**UI changes**:
- Wrapped status indicator in flex container with refresh button
- Added refresh button with loading state (spin animation)
- Updated tooltip to show "Last checked" timestamp
- Button disables during refresh

### Step 7: Update Component Documentation

Update the component's JSDoc comment at the top of the file:

**Before**:
```typescript
/**
 * SyncIndicator Component (T069, T072, T073)
 * 
 * Small status indicator showing sync status in the navbar.
 * Polls sync status every 30 seconds and displays error notifications.
 */
```

**After**:
```typescript
/**
 * SyncIndicator Component (T069, T073)
 * 
 * Small status indicator showing sync status in the navbar.
 * Displays current sync status with manual refresh capability.
 * Shows error notifications when sync fails.
 */
```

## Testing

### Step 8: Create Component Tests

**File**: Create `tests/components/sync/SyncIndicator.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SyncIndicator } from '../../../src/components/sync/SyncIndicator';
import * as syncService from '../../../src/services/syncService';

describe('SyncIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches sync status once on mount', async () => {
    const fetchMock = vi.spyOn(syncService, 'fetchSyncStatus')
      .mockResolvedValue({
        currentStatus: 'success',
        lastSyncLog: null,
      });
    
    render(<SyncIndicator />);
    
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  it('does not automatically poll after initial load', async () => {
    vi.useFakeTimers();
    
    const fetchMock = vi.spyOn(syncService, 'fetchSyncStatus')
      .mockResolvedValue({
        currentStatus: 'success',
        lastSyncLog: null,
      });
    
    render(<SyncIndicator />);
    
    // Wait for initial load
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    
    // Advance time by 60 seconds
    vi.advanceTimersByTime(60000);
    
    // Should still only have 1 call (no polling)
    expect(fetchMock).toHaveBeenCalledTimes(1);
    
    vi.useRealTimers();
  });

  it('allows manual refresh via button', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(syncService, 'fetchSyncStatus')
      .mockResolvedValue({
        currentStatus: 'success',
        lastSyncLog: null,
      });
    
    render(<SyncIndicator />);
    
    // Wait for initial load
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    
    // Click refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);
    
    // Should have made second call
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  it('prevents duplicate refresh calls', async () => {
    const user = userEvent.setup();
    
    // Make API call slow
    const fetchMock = vi.spyOn(syncService, 'fetchSyncStatus')
      .mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve({
          currentStatus: 'success',
          lastSyncLog: null,
        }), 100)
      ));
    
    render(<SyncIndicator />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    
    // Click button twice rapidly
    await user.click(refreshButton);
    await user.click(refreshButton);
    
    // Should only make one additional call (second click ignored)
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  it('displays error notification on failed sync', async () => {
    const fetchMock = vi.spyOn(syncService, 'fetchSyncStatus')
      .mockResolvedValue({
        currentStatus: 'failed',
        lastSyncLog: {
          timestamp: new Date().toISOString(),
          status: 'failed',
          usersAdded: 0,
          usersUpdated: 0,
          usersDeactivated: 0,
          errors: [{ message: 'API timeout' }],
        },
      });
    
    render(<SyncIndicator />);
    
    await waitFor(() => {
      expect(screen.getByText(/API timeout/i)).toBeInTheDocument();
    });
  });
});
```

### Step 9: Run Tests

```bash
# Frontend tests
npm test

# With coverage
npm run test:coverage

# Watch mode during development
npm run test:ui
```

**Expected results**:
- All tests pass
- No console warnings about timers or memory leaks
- Coverage for new manual refresh functionality

## Verification

### Manual Testing Checklist

1. **Initial Load**:
   - [ ] Open application in browser
   - [ ] Verify sync status displays
   - [ ] Open browser DevTools Network tab
   - [ ] Verify only ONE call to `/api/sync/status` on page load
   - [ ] Wait 60 seconds
   - [ ] Verify NO additional API calls occurred

2. **Manual Refresh**:
   - [ ] Click the refresh button (🔄)
   - [ ] Verify button shows spinning animation briefly
   - [ ] Verify button is disabled during refresh
   - [ ] Verify new API call appears in Network tab
   - [ ] Verify status updates (if changed)
   - [ ] Verify "Last checked" timestamp updates in tooltip

3. **Duplicate Call Prevention**:
   - [ ] Click refresh button rapidly 5 times
   - [ ] Verify only 1 additional API call (not 5)
   - [ ] Verify button remains disabled until first call completes

4. **Error Handling**:
   - [ ] Simulate failed sync (modify backend temporarily or use mock)
   - [ ] Verify error notification displays
   - [ ] Verify error auto-dismisses after 10 seconds
   - [ ] Verify "Dismiss" button works

5. **Performance**:
   - [ ] Open browser DevTools Performance tab
   - [ ] Start recording
   - [ ] Let page run for 2 minutes
   - [ ] Verify no periodic function calls or timers
   - [ ] Verify no unnecessary re-renders

### Verification Script

Use this script to verify the polling is truly removed:

```typescript
// Run in browser console after loading the page

// Check for active intervals
console.log('Active intervals:', window.setInterval.toString());

// Monitor API calls
let apiCallCount = 0;
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.name.includes('/api/sync/status')) {
      apiCallCount++;
      console.log(`API call #${apiCallCount} at ${new Date().toLocaleTimeString()}`);
    }
  }
});
observer.observe({ entryTypes: ['resource'] });

// Wait 2 minutes and check
setTimeout(() => {
  console.log(`Total API calls in 2 minutes: ${apiCallCount}`);
  console.log('Expected: 1 (on initial load)');
}, 120000);
```

## Troubleshooting

### Issue: Tests Fail with "setInterval is not defined"

**Solution**: Ensure test file imports `vi` from vitest and uses fake timers properly:
```typescript
import { vi } from 'vitest';
vi.useFakeTimers(); // before test
vi.useRealTimers(); // after test
```

### Issue: Button Doesn't Disable During Refresh

**Cause**: Missing `disabled={isRefreshing}` prop on button

**Solution**: Verify button has both:
```tsx
<button
  onClick={handleRefresh}
  disabled={isRefreshing}  // ← This line
  // ...
>
```

### Issue: Multiple API Calls Still Happening

**Cause**: Old polling code not fully removed

**Solution**: Search file for `setInterval` and ensure all instances are removed:
```bash
grep -n "setInterval" src/components/sync/SyncIndicator.tsx
# Should return: no matches
```

### Issue: "Last Checked" Shows "Invalid Date"

**Cause**: `lastChecked` state not initialized properly

**Solution**: Check that:
1. `lastChecked` is initialized to `null`
2. `setLastChecked(new Date())` called in `loadSyncStatus`
3. Tooltip handles `null` case: `lastChecked ? ... : 'Never'`

## Performance Validation

### Before (with polling):
```
API calls per hour: ~120
Active timers: 1
Re-renders per hour: ~120
```

### After (without polling):
```
API calls per hour: ~1-5 (mount + manual refreshes)
Active timers: 0
Re-renders per hour: ~1-5 (user-initiated)
```

**Validation command**:
```bash
# Count sync status API calls in browser DevTools Network tab
# Filter: "sync/status"
# Timeline: 5 minutes
# Expected: 1 call (initial load) + any manual refreshes
```

## Rollback Plan

If issues arise, revert changes:

```bash
git diff HEAD src/components/sync/SyncIndicator.tsx
git checkout HEAD -- src/components/sync/SyncIndicator.tsx
```

Or cherry-pick specific parts:
```bash
# Keep manual refresh, restore polling
git show HEAD:src/components/sync/SyncIndicator.tsx > SyncIndicator.backup.tsx
# Manual merge of desired features
```

## Next Steps

After completing implementation:

1. **Open Pull Request**:
   - Title: "feat: Remove sync status polling, add manual refresh"
   - Description: Link to spec.md and test results
   - Include before/after API call metrics

2. **Code Review**:
   - Request review focusing on:
     - Verify no `setInterval` remains
     - Verify tests cover no-polling behavior
     - Verify UI clearly shows "last checked" time

3. **Deployment**:
   - Deploy to staging environment
   - Monitor API call rates (should drop ~95%)
   - Verify no user complaints about missing updates
   - Deploy to production

4. **Monitoring**:
   - Track `/api/sync/status` endpoint call rate
   - Should see significant reduction in requests
   - Monitor for any error rate changes

## Resources

- **Spec**: [spec.md](./spec.md)
- **Implementation Plan**: [plan.md](./plan.md)
- **Research**: [research.md](./research.md)
- **Data Model**: [data-model.md](./data-model.md)
- **Component API**: [contracts/component-api.md](./contracts/component-api.md)
- **React Testing Library**: https://testing-library.com/docs/react-testing-library/intro/
- **Vitest Docs**: https://vitest.dev/guide/
