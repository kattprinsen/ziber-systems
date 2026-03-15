/**
 * Sync Types (T068)
 * 
 * Frontend types matching backend sync status responses.
 */

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'failed';

export type SyncResultStatus = 
  | 'success'           
  | 'partial_success'   
  | 'failed';

export type ErrorCode =
  | 'SYNC_TIMEOUT'
  | 'SYNC_AUTH_FAILED'
  | 'SYNC_API_ERROR'
  | 'SYNC_DATA_INVALID'
  | 'SYNC_WRITE_FAILED'
  | 'SYNC_NETWORK_ERROR';

export type WarningCode =
  | 'USERS_INACTIVATED'
  | 'MISSING_FIELD'
  | 'DUPLICATE_USER'
  | 'VALIDATION_WARNING';

export interface SyncError {
  details: unknown;
  code: ErrorCode;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

export interface SyncWarning {
  details: unknown;
  code: WarningCode;
  message: string;
  context?: Record<string, unknown>;
}

export interface SyncLog {
  syncId: string;
  timestamp: string;
  duration: number;
  status: SyncResultStatus;
  usersProcessed: number;
  usersAdded: number;
  usersUpdated: number;
  usersInactivated: number;
  usersReactivated: number;
  errors: SyncError[];
  warnings: SyncWarning[];
}

export interface SyncStatusResponse {
  currentStatus: SyncStatus;
  lastSyncLog: SyncLog | null;
  isInitialized: boolean;
  serverStartTime: string;
}

/**
 * Raw Tidig employee node as returned by the SubTree endpoint.
 * This mirrors the backend TidigEmployee schema fields we care about.
 */
export interface TidigEmployeeNodeRaw {
  empId: string;
  name: string;
  children?: TidigEmployeeNodeRaw[] | null;
  [key: string]: unknown;
}

/**
 * Normalized external employee node used by the dashboard.
 */
export interface ExternalEmployeeNode {
  id: string;
  parentId: string | null;
  name: string;
  hasChildren: boolean;
  children: ExternalEmployeeNode[];
}
