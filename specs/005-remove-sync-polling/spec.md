# Feature Specification: Remove Sync Status Polling

**Feature Branch**: `005-remove-sync-polling`  
**Created**: March 2, 2026  
**Status**: Draft  
**Input**: User description: "Remove the timer that polls the syncing endpoint every time. Make one API call to Tidig instead of continuously polling."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Single Sync Call on Demand (Priority: P1)

As a user, when I interact with the system or it starts up, I want the sync to execute once and show me the immediate result, rather than continuously polling for status updates, so the application is more responsive and uses fewer resources.

**Why this priority**: This is the core change - eliminating unnecessary polling reduces server load, network traffic, and client-side resource usage while providing the same essential information.

**Independent Test**: Start the application or trigger a sync action. Verify that only one API call is made to Tidig, the result is displayed, and no additional polling requests occur.

**Acceptance Scenarios**:

1. **Given** the application starts up, **When** the sync indicator loads, **Then** exactly one API call is made to fetch sync status
2. **Given** the sync call completes successfully, **When** the response is received, **Then** the sync status is displayed without any follow-up polling requests
3. **Given** the sync call fails, **When** the error occurs, **Then** the error is displayed once without continuous retry attempts
4. **Given** 30 seconds have elapsed since the sync call, **When** no user action occurs, **Then** no additional API calls are made to check sync status

---

### User Story 2 - Manual Sync Refresh (Priority: P2)

As a user, when I want to check if sync status has changed, I want to manually trigger a refresh rather than waiting for an automatic poll, giving me control over when to check for updates.

**Why this priority**: Users may want to verify sync status after making changes or when troubleshooting, but this should be their choice rather than automatic.

**Independent Test**: Complete the initial sync call, wait for it to finish, then manually trigger a refresh. Verify that a new single API call is made and the status updates.

**Acceptance Scenarios**:

1. **Given** the initial sync status is displayed, **When** the user clicks a refresh button or action, **Then** a new single API call is made to fetch current sync status
2. **Given** multiple refresh requests are made in quick succession, **When** the first call is still in progress, **Then** subsequent requests wait for the current call to complete or are debounced
3. **Given** the user manually refreshes sync status, **When** the new status is received, **Then** the display updates to reflect the current state

---

### User Story 3 - Status Display Without Polling (Priority: P3)

As a user, I want to see the last known sync status clearly displayed in the interface, so I understand the current state without the system constantly checking for updates.

**Why this priority**: Clear status display provides transparency about sync state, but the basic functionality works without enhanced UI elements.

**Independent Test**: Complete a sync operation and verify the status indicator shows the last known state clearly without any loading or polling indicators.

**Acceptance Scenarios**:

1. **Given** a sync call has completed, **When** the status is displayed, **Then** the UI shows the timestamp of when that status was last updated
2. **Given** the sync status shows "success", **When** displayed to the user, **Then** it's clear this is the last known status, not real-time polling data
3. **Given** the sync status shows "failed", **When** the error is displayed, **Then** users can see the error details without the system continuously rechecking

---

### Edge Cases

- **Sync in progress when component loads**: Display "syncing" status without polling; require manual refresh to check completion
- **API call times out**: Show timeout error and allow manual retry rather than automatic polling
- **Network disconnects during sync call**: Display appropriate error message and wait for manual refresh
- **Very slow sync operation**: Show initial status and allow users to manually check progress rather than automatic polling
- **User navigates away during sync call**: Cancel the in-flight request to prevent unnecessary processing
- **Multiple components request sync status**: Implement request deduplication or caching to prevent duplicate simultaneous calls

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST make exactly one call to Tidig sync endpoint when the sync indicator displays
- **FR-002**: System MUST NOT automatically poll or repeatedly check sync status after the initial call
- **FR-003**: System MUST display the sync status from the single call without waiting for subsequent updates
- **FR-004**: Users MUST be able to manually refresh sync status through an explicit user action
- **FR-005**: System MUST eliminate all automatic periodic status checking mechanisms
- **FR-006**: System MUST cancel any in-flight sync status requests when the user navigates away
- **FR-007**: System MUST display the timestamp of when the sync status was last fetched
- **FR-008**: System MUST handle sync call failures gracefully without automatically retrying
- **FR-009**: System MUST prevent duplicate sync status calls if triggered rapidly in succession
- **FR-010**: Manual refresh action MUST be clearly available and discoverable in the user interface

### Key Entities

- **Sync Status Request**: A single, one-time API call to fetch current sync state without automatic repetition
- **Sync Status Response**: The result of a sync status check, including status (idle/syncing/success/failed), timestamp, and any error information
- **Manual Refresh Trigger**: User-initiated action to fetch fresh sync status on demand

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Number of API calls to sync status endpoint reduces from continuous (every 30 seconds) to single call per page load, reducing unnecessary network traffic by at least 95%
- **SC-002**: Users can see sync status immediately upon component load within 2 seconds (time for single API call)
- **SC-003**: Manual refresh functionality allows users to check updated sync status within 2 seconds of clicking refresh
- **SC-004**: No automatic polling requests occur after the initial sync status fetch, measurable by network request monitoring showing zero repeated sync status calls without user action
- **SC-005**: Client application resource usage (memory, processor) decreases measurably due to elimination of continuous background status checking
- **SC-006**: Server load decreases by eliminating redundant status check requests, reducing sync endpoint calls by approximately 95% per active session

## Scope & Boundaries

### In Scope

- Removing automatic periodic polling of sync status
- Implementing single status check on initial display
- Adding manual refresh capability for sync status
- Updating display to show last-known status rather than continuously updated status
- Removing any mechanisms that repeatedly check sync status automatically

### Out of Scope

- Changes to the actual sync operation or Tidig integration
- Modifying how sync errors are reported or handled (beyond removing polling)
- Implementing real-time push-based status updates
- Changes to when or how the actual Tidig user sync runs
- Adding automated background sync scheduling or retry logic

## Assumptions & Constraints

### Assumptions

- The current 30-second polling interval is unnecessary because sync status rarely changes
- Users are comfortable manually checking sync status if they need updates
- A single status check per page load provides sufficient visibility into sync state
- The sync operation itself (calling Tidig API to sync users) is already a one-time operation on startup
- Error states from sync operations are sufficiently informative without continuous monitoring

### Constraints

- Must maintain backward compatibility with existing sync status endpoints
- Must preserve all current sync error reporting and display functionality
- Cannot introduce new infrastructure for real-time communication
- Must work within the existing application architecture

## Dependencies

- **External**: Tidig API sync status endpoint must remain available and responsive
- **Internal**: Sync status display functionality, sync service interfaces, sync status data structures
- **Related Features**: 003-tidig-user-sync (the actual sync operation being monitored)

## Technical Considerations *(Optional)*

### Performance Impact

- **Positive**: Reduced background processing overhead, fewer network requests, lower server load
- **Negative**: Slightly less real-time visibility into sync status changes (requires manual refresh)

### User Experience Impact

- Users will need to manually refresh if they want to check if sync status has changed
- This is a reasonable trade-off for most use cases where sync status is stable most of the time
- More predictable behavior with no automatic background updates
