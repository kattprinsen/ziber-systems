/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Sync Service Client (T067)
 * 
 * Frontend service for fetching sync status from backend API.
 */

import apiClient from './api';
import type { SyncLog, SyncStatusResponse } from '../types/sync';

const SYNC_ENDPOINTS = {
  STATUS: '/sync/status',
  LOGS: '/sync/logs',
};

/**
 * Fetch current synchronization status
 */
export async function fetchSyncStatus(): Promise<SyncStatusResponse> {
  const response = await apiClient.get<SyncStatusResponse>(SYNC_ENDPOINTS.STATUS);
  return response.data ?? {} as SyncStatusResponse;
}

/**
 * Fetch sync operation logs
 */
export async function fetchSyncLogs(): Promise<SyncLog[]> {
  const response = await apiClient.get<{ logs: SyncLog[]; count: number }>(SYNC_ENDPOINTS.LOGS);
  return response.data?.logs ?? [];
}

export default {
  fetchSyncStatus,
  fetchSyncLogs,
};
