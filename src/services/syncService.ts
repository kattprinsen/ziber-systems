/**
 * Sync Service Client (T067)
 * 
 * Frontend service for fetching sync status from backend API.
 */

import apiClient from './api';
import type {
  SyncLog,
  SyncStatusResponse,
  TidigEmployeeNodeRaw,
  ExternalEmployeeNode,
} from '../types/sync';

const SYNC_ENDPOINTS = {
  STATUS: '/sync/status',
  LOGS: '/sync/logs',
  SUBTREE: '/sync/subtree',
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

function normalizeTidigNode(raw: TidigEmployeeNodeRaw, parentId: string | null = null): ExternalEmployeeNode {
  const rawChildren = Array.isArray(raw.children) ? raw.children : [];
  const children = rawChildren.map((child) => normalizeTidigNode(child, raw.empId));

  return {
    id: raw.empId,
    parentId,
    name: raw.name,
    hasChildren: children.length > 0,
    children,
  };
}

function findNodeById(node: ExternalEmployeeNode, id: string): ExternalEmployeeNode | null {
  if (node.id === id) {
    return node;
  }
  for (const child of node.children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}

/**
 * Derive SBQ employees as direct child leaf nodes from a Tidig subtree.
 *
 * If sbqId is provided, the selector searches for that node in the
 * normalized tree. Otherwise, it assumes the root node is SBQ.
 */
export function selectSbqLeafEmployeesFromSubtree(
  rawRoot: TidigEmployeeNodeRaw,
  sbqId?: string,
): ExternalEmployeeNode[] {
  const root = normalizeTidigNode(rawRoot, null);

  let sbqNode: ExternalEmployeeNode = root;
  if (sbqId) {
    const found = findNodeById(root, sbqId);
    if (found) {
      sbqNode = found;
    }
  }

  const leafChildren = sbqNode.children.filter((child) => !child.hasChildren);

  // Include SBQ itself as part of the team, even if it has children,
  // then add direct child leaf employees.
  return [sbqNode, ...leafChildren];
}

/**
 * Fetch the Tidig employee subtree and derive SBQ leaf employees.
 */
export async function fetchSbqLeafEmployees(sbqId?: string): Promise<ExternalEmployeeNode[]> {
  const response = await apiClient.get<TidigEmployeeNodeRaw>(SYNC_ENDPOINTS.SUBTREE);
  if (!response.success || !response.data) {
    throw new Error(response.error ?? 'Failed to fetch Tidig employee subtree');
  }

  return selectSbqLeafEmployeesFromSubtree(response.data, sbqId);
}

export default {
  fetchSyncStatus,
  fetchSyncLogs,
};
