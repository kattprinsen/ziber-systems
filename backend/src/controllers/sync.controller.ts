/**
 * Sync Controller (T061)
 * 
 * Handles HTTP requests for sync status monitoring and management.
 */

import { Request, Response } from 'express';
import syncService from '../services/sync.service.js';
import { ApiResponse } from '../types/user.types.js';
import { SyncStatusResponse } from '../types/sync.types.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// Define a type for sync log entries (replace fields as appropriate)
type SyncLogEntry = {
  timestamp: string;
  status: string;
  details?: string;
};

// Server start time (set in server.ts)
let serverStartTime = new Date().toISOString();

/**
 * Set the server start time (called from server.ts)
 */
export function setServerStartTime(time: string): void {
  serverStartTime = time;
}

/**
 * GET /api/sync/status
 * Get current synchronization status and last sync log
 */
export const getSyncStatus = asyncHandler(
  async (_req: Request, res: Response<ApiResponse<SyncStatusResponse>>) => {
    const currentStatus = syncService.getCurrentStatus();
    const lastSyncLog = syncService.getLastSyncLog();
    const isInitialized = lastSyncLog !== null;

    const statusData: SyncStatusResponse = {
      currentStatus,
      lastSyncLog,
      isInitialized,
      serverStartTime,
    };

    res.json({
      success: true,
      data: statusData,
      message: `Sync status: ${currentStatus}`,
    });
  }
);

/**
 * GET /api/sync/logs (T074 - optional enhancement)
 * Get sync operation logs (currently returns last log only)
 * Future enhancement: Could store history of sync operations
 */
export const getSyncLogs = asyncHandler(
  async (_req: Request, res: Response<ApiResponse<{ logs: SyncLogEntry[]; count: number }>>) => {
    const lastSyncLog = syncService.getLastSyncLog();
    
    // For now, return last log as an array
    // Future: Store sync history and return multiple logs
    const logs: SyncLogEntry[] = lastSyncLog ? [lastSyncLog] : [];

    res.json({
      success: true,
      data: {
        logs,
        count: logs.length,
      },
      message: `Retrieved ${logs.length} sync log(s)`,
    });
  }
);
