import api from './api';
import type {
  PerformanceConfig,
  MonthlySnapshot,
  SnapshotListData,
} from '../types/performance';

const BASE = '/performance';

/**
 * Fetches (or refreshes) the monthly billed-hours snapshot for a given month.
 * The backend will attempt a live Tidig pull and fall back to a cached file.
 */
export async function fetchSnapshot(year: number, month: number): Promise<MonthlySnapshot> {
  const mm = String(month).padStart(2, '0');
  const response = await api.get<MonthlySnapshot>(`${BASE}/snapshots/${year}/${mm}`);
  if (!response.success || !response.data) {
    throw new Error(response.error ?? 'Failed to fetch performance snapshot');
  }
  return response.data;
}

/**
 * Returns the list of months that have cached snapshots on the backend.
 * Useful for determining the available navigation range.
 */
export async function fetchSnapshotList(): Promise<SnapshotListData> {
  const response = await api.get<SnapshotListData>(`${BASE}/snapshots`);
  if (!response.success || !response.data) {
    throw new Error(response.error ?? 'Failed to fetch snapshot list');
  }
  return response.data;
}

/**
 * Fetches the current performance target configuration.
 */
export async function fetchConfig(): Promise<PerformanceConfig> {
  const response = await api.get<PerformanceConfig>(`${BASE}/config`);
  if (!response.success || !response.data) {
    throw new Error(response.error ?? 'Failed to fetch performance config');
  }
  return response.data;
}

/**
 * Updates the monthly billed-hours target.
 * Pass null to clear the target.
 */
export async function updateConfig(target: number | null): Promise<PerformanceConfig> {
  const response = await api.put<PerformanceConfig>(`${BASE}/config`, { target });
  if (!response.success || !response.data) {
    throw new Error(response.error ?? 'Failed to update performance config');
  }
  return response.data;
}
