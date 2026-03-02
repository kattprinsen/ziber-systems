# Component API Contract: SyncIndicator

**Feature**: 005-remove-sync-polling  
**Phase**: Phase 1 - Design & Contracts  
**Date**: March 2, 2026  
**Component**: `SyncIndicator.tsx`

## Overview

This document defines the public interface contract for the SyncIndicator component after removing automatic polling. The component provides sync status visibility with manual refresh capability.

## Component Signature

```typescript
export const SyncIndicator: React.FC<SyncIndicatorProps>
```

### Props Interface

```typescript
interface SyncIndicatorProps {
  /**
   * Optional CSS class names to apply to the root element
   * for custom styling and positioning
   */
  className?: string;
}
```

### Return Type

```typescript
React.ReactElement | null
```

**Returns**:
- React element containing the sync status indicator and controls
- `null` if sync status has not yet loaded (initial loading state)

## Public API

### Component Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `className` | `string` | No | `""` | Additional CSS classes for the root div element |

**No other props** - Component is self-contained and manages its own state.

### Events

The component does not emit any custom events. It is a leaf component in the tree.

### Exposed Imperative Handle

**None** - Component does not use `forwardRef` or `useImperativeHandle`. All interactions are through the rendered UI.

## Behavior Contract

### Initial Render

**On first mount**:
1. Component renders `null` (loading state)
2. Initiates single API call to `/api/sync/status`
3. Once data loads, renders status indicator
4. Does NOT initiate any automatic polling or timers

**Guarantee**: Exactly one API call on mount, no automatic subsequent calls.

### Display States

The component displays different UI based on sync status:

| Status | Icon | Text | Color | Behavior |
|--------|------|------|-------|----------|
| `idle` | ⏸️ | "Idle" | Gray | Static display |
| `syncing` | 🔄 | "Syncing..." | Blue, animated | Static display (no polling) |
| `success` | ✅ | "Synced" | Green | Static display |
| `failed` | ❌ | "Failed" | Red | Shows error notification |

**Change from previous version**: Status no longer updates automatically. User must click refresh to see changes.

### Manual Refresh

**Trigger**: User clicks the refresh button/icon in the component

**Behavior**:
1. Button shows loading state ("Refreshing...")
2. Button becomes disabled
3. Makes new API call to `/api/sync/status`
4. Updates display with new status
5. Updates "Last checked" timestamp
6. Re-enables button

**Duplicate Call Prevention**: If refresh is already in progress, additional clicks are ignored (button is disabled).

**Error Handling**: If API call fails, previous status remains displayed, error is logged to console, button returns to normal state.

### Error Notification

**Trigger**: Sync status response indicates `currentStatus: 'failed'` with errors in `lastSyncLog`

**Behavior**:
1. Displays error notification overlay below the status indicator
2. Shows first error message from errors array
3. Auto-dismisses after 10 seconds
4. User can manually dismiss by clicking "Dismiss" button

**No change from previous version** - Error notification behavior is preserved.

### Last Checked Timestamp

**Display**: Shows when the sync status was last fetched from the API

**Format**: Relative time format (e.g., "Just now", "2 mins ago", "1 hour ago")

**Location**: Shown in hover tooltip over the status indicator

**Updates**: Timestamp updates each time the component loads status (mount + manual refreshes)

## Interaction Contract

### User Actions

| Action | Element | Result |
|--------|---------|--------|
| Hover over status | Status indicator box | Tooltip shows "Last checked: [timestamp]" |
| Click refresh button | Refresh button | Triggers manual refresh, fetches new status |
| Click dismiss on error | Error notification dismiss button | Hides error notification |

### Keyboard Accessibility

- Refresh button is keyboard accessible (can be focused and activated with Enter/Space)
- Error dismiss button is keyboard accessible
- Status indicator itself is not interactive (no keyboard action)

### Screen Reader Support

- Status indicator has appropriate ARIA labels
- Refresh button has descriptive label ("Refresh sync status")
- Loading state announced when refreshing
- Error notifications are announced via ARIA live region (inherited from existing implementation)

## Performance Contract

### API Call Frequency

**Guarantee**: No automatic API calls after initial mount

**Maximum frequency**: Limited only by user's ability to click refresh button
- Protected by disabled state during active refresh
- No additional throttling or debouncing applied (single flag sufficient)

**Expected frequency**: 1-5 API calls per hour per user (mount + occasional manual refreshes)

**Improvement from previous**: 95%+ reduction in API calls (was 120 per hour with 30s polling)

### Render Performance

**Initial render**: <50ms (lightweight component, no complex computation)

**Re-renders**: Only triggered by:
1. Status data changes (after API call completes)
2. Refresh button state changes (isRefreshing toggle)
3. Error notification state changes (show/hide)
4. Parent component re-renders (standard React behavior)

**No automatic re-renders** - Removed 30-second periodic re-renders

### Memory Usage

**Before (with polling)**: ~1 active timer + component state (~500 bytes)

**After (without polling)**: Component state only (~550 bytes)
- Added fields: `isRefreshing` (boolean), `lastChecked` (Date)
- Removed: active setInterval timer

**Net impact**: Negligible increase in state size, significant reduction in active resources

## Dependencies

### Service Layer

**Required**: `syncService.fetchSyncStatus()`

```typescript
function fetchSyncStatus(): Promise<SyncStatusResponse>
```

**Contract**: Returns promise resolving to sync status data from backend API

**Error handling**: If service throws, component logs error and preserves previous status

### Type Dependencies

**Required types from `src/types/sync.ts`**:
- `SyncStatus`: Union type for status values
- `SyncStatusResponse`: API response structure
- `SyncLog`: Log entry structure

**No changes to type contracts** - All existing types remain valid

### External Dependencies

- `react`: useState, useEffect hooks (React 19)
- No new external dependencies introduced

## Compatibility

### Backward Compatibility

**Breaking changes**: None to public API

**Behavioral changes**:
- Status no longer updates automatically (user must refresh)
- This is the intended feature change, not a compatibility break

**Migration**: None required - component interface unchanged

### Browser Compatibility

- Requires ES2015+ (for arrow functions, const/let)
- Requires browser support for React 19
- No use of experimental browser APIs

### Accessibility

- Maintains WCAG 2.1 AA compliance (inherited from existing implementation)
- Keyboard accessible
- Screen reader compatible
- Color contrast ratios maintained

## Testing Contract

### Unit Test Coverage

**Required test cases**:

1. **Initial load**
   - Component renders null initially
   - Makes exactly one API call on mount
   - Renders status after data loads

2. **Manual refresh**
   - Clicking refresh button triggers new API call
   - Button disables during refresh
   - Multiple clicks don't cause duplicate calls
   - Status updates after refresh completes

3. **Error handling**
   - API failures are logged but don't crash component
   - Failed sync status shows error notification
   - Error notification auto-dismisses after 10 seconds
   - User can manually dismiss error notification

4. **No automatic polling**
   - After mount, no additional API calls occur automatically
   - No timers remain active after mount completes

5. **Timestamp display**
   - "Last checked" timestamp updates on mount and refresh
   - Timestamp displays in correct relative format

### Integration Test Coverage

**Required scenarios**:
- Component works correctly when embedded in Navbar
- Component state persists during parent re-renders
- Component cleanup occurs correctly on unmount

### Performance Test Criteria

- API call count: Verify ≤1 automatic call per component lifetime
- No memory leaks: Verify no lingering timers after unmount
- Render count: Verify no renders without state changes

## Versioning

**Component version**: 2.0 (major version bump due to polling removal)

**Previous version**: 1.0 (with 30-second automatic polling)

**Current version**: 2.0 (manual refresh only)

**Change summary**:
- Removed: Automatic 30-second polling
- Added: Manual refresh button
- Added: Last checked timestamp display
- Preserved: Error notification behavior
- Preserved: Status display and formatting
- Preserved: Component props interface

## Examples

### Basic Usage

```tsx
import { SyncIndicator } from './components/sync/SyncIndicator';

function Navbar() {
  return (
    <nav>
      <div className="nav-left">
        {/* ... other nav items ... */}
      </div>
      <div className="nav-right">
        <SyncIndicator className="mr-4" />
      </div>
    </nav>
  );
}
```

### Custom Styling

```tsx
<SyncIndicator className="absolute top-4 right-4 z-50" />
```

### No Props Usage

```tsx
<SyncIndicator />
```

## Related Contracts

- **Backend API**: `GET /api/sync/status` (see backend sync.controller.ts)
- **Service Layer**: `syncService.fetchSyncStatus()` (see services/syncService.ts)
- **Types**: SyncStatus, SyncStatusResponse, SyncLog (see types/sync.ts)

## Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Feb 2026 | Initial implementation with 30s polling |
| 2.0 | Mar 2026 | Removed polling, added manual refresh |
