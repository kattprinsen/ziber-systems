/**
 * Sync Types for Tidig API User Synchronization
 * 
 * This file defines TypeScript types for sync operations, logs, errors, and warnings.
 */

// ============================================================================
// Sync Status & Results
// ============================================================================

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'failed';

export type SyncResultStatus = 
  | 'success'           // Fully successful
  | 'partial_success'   // Completed with warnings
  | 'failed';           // Failed to complete

// ============================================================================
// Sync Log
// ============================================================================

export interface SyncLog {
  syncId: string;                    // Unique ID for this sync operation (UUID)
  timestamp: string;                 // ISO datetime when sync started
  duration: number;                  // Sync duration in milliseconds
  status: SyncResultStatus;          // Overall sync outcome
  usersProcessed: number;            // Total users from Tidig
  usersAdded: number;                // Count of new users added
  usersUpdated: number;              // Count of existing users updated
  usersInactivated: number;          // Count of users marked inactive
  usersReactivated: number;          // Count of inactive users reactivated
  errors: SyncError[];               // Errors encountered during sync
  warnings: SyncWarning[];           // Non-fatal warnings
}

// ============================================================================
// Error Handling
// ============================================================================

export type ErrorCode =
  | 'SYNC_TIMEOUT'          // Tidig API timeout (>5s)
  | 'SYNC_AUTH_FAILED'      // Invalid API key
  | 'SYNC_API_ERROR'        // Tidig returned error response
  | 'SYNC_DATA_INVALID'     // Response doesn't match schema
  | 'SYNC_WRITE_FAILED'     // Could not save users.json
  | 'SYNC_NETWORK_ERROR';   // Network connectivity issue

export interface SyncError {
  code: ErrorCode;
  message: string;
  context?: Record<string, any>;     // Additional context (endpoint, user ID, etc.)
  timestamp: string;                  // ISO datetime when error occurred
}

// ============================================================================
// Warning Handling
// ============================================================================

export type WarningCode =
  | 'USERS_INACTIVATED'     // Users marked inactive (not in Tidig)
  | 'MISSING_FIELD'         // Tidig user missing expected field
  | 'DUPLICATE_USER'        // Duplicate employeeID in Tidig response
  | 'VALIDATION_WARNING';   // Data validation warning (non-fatal)

export interface SyncWarning {
  code: WarningCode;
  message: string;
  context?: Record<string, any>;     // Additional context
}

// ============================================================================
// Sync Metadata for User Records
// ============================================================================

export interface SyncMetadata {
  lastSync: string;                   // ISO datetime when user was last synced
  source: 'tidig' | 'local';          // Where user originated
  wasInactive?: boolean;              // True if user was previously inactive and got reactivated
}

// ============================================================================
// Sync Service Interface
// ============================================================================

export interface SyncResult {
  success: boolean;
  syncLog: SyncLog;
}

export interface SyncServiceInterface {
  performSync(): Promise<SyncResult>;
  getLastSyncLog(): SyncLog | null;
  getCurrentStatus(): SyncStatus;
}

// ============================================================================
// Sync Status API Response (T066)
// ============================================================================

export interface SyncStatusResponse {
  currentStatus: SyncStatus;              // Current sync state
  lastSyncLog: SyncLog | null;            // Last sync operation details
  isInitialized: boolean;                 // Has sync run at least once?
  serverStartTime: string;                // ISO datetime when server started
}
