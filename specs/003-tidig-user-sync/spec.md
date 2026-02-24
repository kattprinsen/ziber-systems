# Feature Specification: Tidig API User Synchronization

**Feature Branch**: `003-tidig-user-sync`  
**Created**: February 23, 2026  
**Status**: Draft  

## Overview

The system currently maintains a hardcoded list of users in `users.json`. This feature integrates with the Tidig external API to automatically synchronize user information, using Tidig as the source of truth for user identities and time reporting data. This eliminates manual maintenance of the user list while preserving locally managed properties like salary information.

## Clarifications

### Session 2026-02-23

- Q: Which field from Tidig API uniquely identifies users for matching across systems? → A: employeeID (e.g., "SBQ" for Simon Bergqvist)
- Q: What default values should be used for locally-managed fields when adding new users from Tidig? → A: Null/empty values for all local fields to explicitly indicate missing data and prevent incorrect calculations
- Q: Should sync block application startup or run in background? → A: Fast-fail approach - attempt sync with short timeout (5 seconds), then start regardless. Display clear notification when sync fails so administrators are aware.
- Q: How should users existing locally but not in Tidig be handled? → A: Mark as inactive - preserve user data but mark as inactive/not-in-Tidig status, allowing them to be filtered from active views while keeping historical data intact
- Q: What happens when an inactive user reappears in Tidig (rehire/data correction)? → A: Auto-reactivate - mark user as active again and update with current Tidig data, preserving all local properties for data continuity

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automatic User List Sync on Startup (Priority: P1)

As a system administrator, when I start the application, the system automatically fetches the current user list from Tidig API and updates the local user data store, ensuring that all users from the Tidig system are available in the management system without manual data entry.

**Why this priority**: This is the core value proposition - eliminating manual user list maintenance. Without this, the feature provides no value.

**Independent Test**: Start the application with an empty or outdated user list. Verify that users.json is populated with all users from the Tidig API, including their basic information.

**Acceptance Scenarios**:

1. **Given** the application is starting up, **When** the Tidig API is accessible and returns user data within 5 seconds, **Then** the system fetches all users and updates users.json with current user information
2. **Given** users.json is empty, **When** the application starts and syncs with Tidig successfully, **Then** all users from Tidig are added to users.json with null/empty values for locally-managed fields
3. **Given** the application is starting, **When** the Tidig API connection fails or times out after 5 seconds, **Then** the system logs the error, displays a notification that sync failed, and continues with the existing local user data
4. **Given** sync fails during startup, **When** the application becomes available, **Then** administrators see a clear message indicating the sync did not complete

---

### User Story 2 - Detect and Add New Users (Priority: P2)

As a system administrator, when new employees are added to the Tidig system, I want them to automatically appear in my management system on the next startup, so I don't need to manually add them to maintain an accurate user list.

**Why this priority**: This provides ongoing value by keeping the user list current as the organization grows, but the system is still functional with just the initial sync.

**Independent Test**: Add a new user to the Tidig system, restart the application, and verify the new user appears in users.json with appropriate default values for local fields.

**Acceptance Scenarios**:

1. **Given** a new user exists in Tidig but not locally, **When** the application syncs on startup, **Then** the new user is added to users.json with Tidig-provided data and null/empty values for locally-managed fields (salary, job title, department, etc.)
2. **Given** multiple new users exist in Tidig, **When** sync occurs, **Then** all new users are added in a single operation
3. **Given** a new user is added during this sync, **When** the sync completes, **Then** the system logs which users were newly added

---

### User Story 3 - Preserve Local Properties During Sync (Priority: P3)

As a system administrator, when user information is synced from Tidig, I want locally-managed properties (like salary, performance ratings, and custom notes) to be preserved, so I don't lose important HR data that Tidig doesn't manage.

**Why this priority**: This prevents data loss and enables the hybrid approach (Tidig for identity, local for HR data), but the basic sync functionality works without it.

**Independent Test**: Set salary and other local properties for a user, then sync from Tidig with updated user information. Verify that local properties remain unchanged while Tidig-managed fields are updated.

**Acceptance Scenarios**:

1. **Given** a user exists locally with salary data, **When** that user's information is updated in Tidig and synced, **Then** the salary and other local properties remain unchanged
2. **Given** a user exists in both systems, **When** sync occurs, **Then** only Tidig-managed fields (name, email, time reporting data) are updated
3. **Given** local and Tidig data both exist for a user, **When** sync completes, **Then** the merged record contains current data from both sources

---

### User Story 4 - Handle User Synchronization Conflicts (Priority: P4)

As a system administrator, when there are discrepancies between local and Tidig user data (such as a user existing locally but not in Tidig), I want the system to handle this gracefully by preserving local data and logging the discrepancy for review.

**Why this priority**: This is a defensive feature for edge cases and doesn't block core functionality.

**Independent Test**: Have a user in users.json that doesn't exist in Tidig, then sync. Verify the local user remains and the discrepancy is logged.

**Acceptance Scenarios**:

1. **Given** a user exists locally but not in Tidig, **When** sync occurs, **Then** the local user is preserved and marked with an inactive status indicating they're not in Tidig
2. **Given** sync identifies users only in local system, **When** sync completes, **Then** a list of these users is logged for administrator review and their status is updated to inactive
3. **Given** a user's email changes in Tidig, **When** sync occurs, **Then** the system updates the email and maintains the link to the same local user record
4. **Given** users marked as inactive exist, **When** displaying user lists or performing operations, **Then** the system allows filtering to show only active (in-Tidig) users while preserving access to inactive users for historical reporting
5. **Given** a previously inactive user (not in Tidig) reappears in Tidig data, **When** sync occurs, **Then** the system automatically reactivates the user, updates their Tidig-managed fields, and preserves all locally-managed properties (salary, HR data)

---

### Edge Cases

- **Tidig API unavailable during startup**: System continues with existing local user data and logs the sync failure
- **Empty response from Tidig API**: System treats this as an error condition and preserves existing data
- **User exists in Tidig but with incomplete data**: System adds the user with whatever fields are available and logs missing fields
- **Duplicate users in Tidig response**: System uses the first occurrence and logs a warning about the duplicate
- **User ID format mismatch**: System validates user IDs from Tidig match expected format before processing
- **Network timeout during sync**: System implements 5-second timeout during startup sync, then proceeds with local data and notifies administrators
- **Rapid restarts during sync**: System ensures only one sync operation runs at a time, queuing or skipping redundant requests
- **Inactive user reappears in Tidig**: System automatically reactivates the user, treating it as an update rather than a new user, preserving all historical local data (salary, performance ratings)
- **Former employee rehired with same employeeID**: System reactivates the existing record with preserved historical data, allowing administrators to review and update local properties as needed

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST fetch user data from Tidig API using three endpoints: GET /Api/Time (time reporting data), GET /Api/Employee/TimePermission (employee permissions), and GET /Api/Employee/SubTree (employee hierarchy and details)
- **FR-002**: System MUST initiate user synchronization automatically during application startup
- **FR-003**: System MUST update users.json with current user information from Tidig API
- **FR-004**: System MUST detect and add new users that exist in Tidig but not in the local system
- **FR-005**: System MUST preserve locally-managed properties (salary, performance data, custom fields) during synchronization
- **FR-006**: System MUST handle API connection failures gracefully by continuing with existing local data
- **FR-006a**: System MUST attempt synchronization with a 5-second timeout during startup, then proceed regardless of sync status
- **FR-006b**: System MUST display a clear notification/message to administrators when synchronization fails or times out
- **FR-007**: System MUST log all synchronization activities including successes, failures, and data discrepancies
- **FR-008**: System MUST identify users who exist locally but are not found in Tidig API and preserve their data
- **FR-008a**: System MUST mark users not found in Tidig as inactive to distinguish them from current employees
- **FR-008b**: System MUST allow filtering user lists to show only active users while retaining inactive users for historical reporting and analysis
- **FR-008c**: System MUST automatically reactivate users when they reappear in Tidig data (rehires or data corrections), updating Tidig-managed fields while preserving locally-managed properties
- **FR-009**: System MUST complete synchronization within a reasonable time period (under 60 seconds for up to 1000 users) to avoid blocking application startup
- **FR-010**: System MUST validate user data received from Tidig API before updating local storage
- **FR-011**: System MUST merge Tidig-provided data with locally-managed properties rather than replacing entire user records
- **FR-012**: System MUST authenticate with Tidig API using API key passed in HTTP header as 'x-apikey'
- **FR-013**: System MUST handle partial API failures (some endpoints succeed, others fail) without corrupting existing data
- **FR-016**: System MUST perform all Tidig API calls from the backend server (not from client/browser)
- **FR-014**: System MUST prevent concurrent synchronization operations to avoid data race conditions
- **FR-015**: System MUST distinguish between Tidig-managed fields (name, email, time reporting data) and locally-managed fields (salary, HR data)

### Key Entities

- **User**: Represents an individual managed by the system. Contains both Tidig-sourced fields (identity, contact information, time reporting data) and locally-managed fields (salary, performance ratings, custom properties). Users are uniquely identified by their employeeID (e.g., "SBQ"), which remains consistent across synchronization operations and serves as the matching key between Tidig and local data. Users have an active/inactive status: active indicates they exist in Tidig, inactive indicates they exist only locally (e.g., former employees).

- **Sync Log Entry**: Represents a record of a synchronization operation, including timestamp, users added/updated, errors encountered, and discrepancies identified. Used for audit trail and troubleshooting.

- **Field Mapping**: Defines which user fields are managed by Tidig (source of truth) versus which are managed locally (preserved during sync). Examples: Tidig manages name, email, employee ID, time reporting data; Local system manages salary, job title, department, performance ratings.

### Assumptions

- **Tidig API structure**: The 3 endpoints are: GET /Api/Time (time reporting data), GET /Api/Employee/TimePermission (employee time permissions), GET /Api/Employee/SubTree (employee hierarchy providing user details). SubTree endpoint likely returns the complete employee list with organizational structure.
- **Authentication**: API key-based authentication via 'x-apikey' HTTP header, stored securely in backend environment configuration.
- **User identification**: Tidig provides a stable employeeID (e.g., "SBQ" for Simon Bergqvist) that is used as the unique matching key between Tidig and local user records.
- **Data format**: Assuming Tidig API returns JSON formatted data with standard field names
- **Network reliability**: Assuming synchronization occurs in environments with generally reliable internet connectivity, but handling temporary failures
- **User lifecycle**: Users are rarely deleted from Tidig; when they leave the organization, they're marked inactive rather than removed
- **Change frequency**: User changes (joins/departures) are infrequent, making the fast-fail approach viable - the local list should be correct 99% of the time
- **API reliability**: Tidig API is expected to have ~99% uptime; occasional sync failures are acceptable given the stable user base
- **Sync timing**: Initial implementation uses fast-fail startup sync (5-second timeout); future enhancements may add periodic background sync or manual retry
- **Conflict resolution**: When both systems have the same field (e.g., name), Tidig is always the source of truth for fields it manages

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Application startup completes within 10 seconds maximum (including 5-second sync timeout if API is unavailable) for environments with up to 100 users
- **SC-002**: Zero manual user additions required after initial deployment - all Tidig users automatically appear in the management system
- **SC-003**: 100% of locally-managed user properties (salary, custom fields) are preserved across synchronization operations
- **SC-004**: System maintains 99.9% data accuracy between Tidig and local system during normal operations (when API is accessible)
- **SC-005**: Application remains fully functional during Tidig API outages, continuing with last known good user data
- **SC-006**: Administrator can identify data synchronization status and discrepancies within 30 seconds by reviewing logs
- **SC-007**: New users added to Tidig appear in the management system within 5 minutes (time from Tidig update to next application restart)
- **SC-008**: Zero data loss incidents - no user records or locally-managed fields are inadvertently deleted or overwritten during synchronization
