/**
 * SyncStatus Component (T070)
 * 
 * Detailed sync information panel showing last sync log with metrics,
 * errors, warnings, and sync history.
 */

import React, { useEffect, useState } from 'react';
import { fetchSyncStatus, fetchSyncLogs } from '../../services/syncService';
import type { SyncStatusResponse, SyncLog } from '../../types/sync';

interface SyncStatusProps {
  className?: string;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({ className = '' }) => {
  const [statusData, setStatusData] = useState<SyncStatusResponse | null>(null);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /*const safeStringify = (value: unknown): string => {
    if (typeof value === 'string') return value;
    try {
      return JSON.stringify(value) || String(value);
    } catch {
      return String(value);
    }
  };*/

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [status, syncLogs] = await Promise.all([
        fetchSyncStatus(),
        fetchSyncLogs()
      ]);
      setStatusData(status);
      setLogs(syncLogs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sync data');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'medium'
    });
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getStatusBadgeColor = (status: string): string => {
    switch (status) {
      case 'success':
        return 'bg-green-900 text-green-200 border-green-700';
      case 'failed':
        return 'bg-red-900 text-red-200 border-red-700';
      case 'syncing':
        return 'bg-blue-900 text-blue-200 border-blue-700';
      default:
        return 'bg-gray-800 text-gray-300 border-gray-700';
    }
  };

  if (loading) {
    return (
      <div className={`p-6 bg-gray-900 rounded-lg ${className}`}>
        <div className="flex items-center justify-center">
          <span className="text-gray-400">Loading sync status...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 bg-gray-900 rounded-lg ${className}`}>
        <div className="flex items-center gap-2 text-red-400">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!statusData) {
    return null;
  }

  return (
    <div className={`p-6 bg-gray-900 rounded-lg space-y-6 ${className}`}>
      {/* Current Status Section */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Sync Status</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-800 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Current Status</div>
            <span className={`inline-block px-3 py-1 rounded-full text-sm border ${getStatusBadgeColor(statusData.currentStatus)}`}>
              {statusData.currentStatus.toUpperCase()}
            </span>
          </div>
          <div className="p-4 bg-gray-800 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Server Uptime</div>
            <div className="text-white font-medium">
              {statusData.serverStartTime ? formatTimestamp(statusData.serverStartTime) : 'Unknown'}
            </div>
          </div>
        </div>
      </div>

      {/* Last Sync Log Section */}
      {statusData.lastSyncLog && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Last Sync</h3>
          <div className="bg-gray-800 rounded-lg p-4 space-y-4">
            {/* Timestamp and Duration */}
            <div className="flex justify-between items-center pb-3 border-b border-gray-700">
              <div>
                <div className="text-sm text-gray-400">Timestamp</div>
                <div className="text-white">{formatTimestamp(statusData.lastSyncLog.timestamp)}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Duration</div>
                <div className="text-white">{formatDuration(statusData.lastSyncLog.duration)}</div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-gray-900 rounded text-center">
                <div className="text-2xl font-bold text-blue-400">{statusData.lastSyncLog.usersProcessed}</div>
                <div className="text-xs text-gray-400">Processed</div>
              </div>
              <div className="p-3 bg-gray-900 rounded text-center">
                <div className="text-2xl font-bold text-green-400">{statusData.lastSyncLog.usersAdded}</div>
                <div className="text-xs text-gray-400">Added</div>
              </div>
              <div className="p-3 bg-gray-900 rounded text-center">
                <div className="text-2xl font-bold text-yellow-400">{statusData.lastSyncLog.usersUpdated}</div>
                <div className="text-xs text-gray-400">Updated</div>
              </div>
              <div className="p-3 bg-gray-900 rounded text-center">
                <div className="text-2xl font-bold text-orange-400">{statusData.lastSyncLog.usersInactivated}</div>
                <div className="text-xs text-gray-400">Inactivated</div>
              </div>
              <div className="p-3 bg-gray-900 rounded text-center">
                <div className="text-2xl font-bold text-purple-400">{statusData.lastSyncLog.usersReactivated}</div>
                <div className="text-xs text-gray-400">Reactivated</div>
              </div>
              <div className="p-3 bg-gray-900 rounded text-center">
                <div className="text-2xl font-bold text-gray-400">{statusData.lastSyncLog.usersProcessed - statusData.lastSyncLog.usersAdded - statusData.lastSyncLog.usersUpdated - statusData.lastSyncLog.usersInactivated - statusData.lastSyncLog.usersReactivated}</div>
                <div className="text-xs text-gray-400">Unchanged</div>
              </div>
            </div>

            {/* Errors */}
            {statusData.lastSyncLog.errors.length > 0 && (
              <div className="pt-3 border-t border-gray-700">
                <div className="text-sm font-semibold text-red-400 mb-2">Errors ({statusData.lastSyncLog.errors.length})</div>
                <div className="space-y-2">
                  {/*statusData.lastSyncLog.errors.map((err, idx) => (
                    <div key={idx} className="p-2 bg-red-900/20 border border-red-800 rounded text-sm">
                      <div className="text-red-300">{err.message}</div>
                      {err.details && <div className="text-red-400 text-xs mt-1">{safeStringify(err.details)}</div>}
                    </div>
                  ))*/}
                </div>
              </div>
            )}

            {/* Warnings */}
            {statusData.lastSyncLog.warnings.length > 0 && (
              <div className="pt-3 border-t border-gray-700">
                <div className="text-sm font-semibold text-yellow-400 mb-2">Warnings ({statusData.lastSyncLog.warnings.length})</div>
                <div className="space-y-2">
                  {/*statusData.lastSyncLog.warnings.map((warn, idx) => (
                    <div key={idx} className="p-2 bg-yellow-900/20 border border-yellow-800 rounded text-sm">
                      <div className="text-yellow-300">{warn.message}</div>
                      {warn.details && <div className="text-yellow-400 text-xs mt-1">{safeStringify(warn.details)}</div>}
                    </div>
                  ))*/}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sync History Section */}
      {logs.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Sync History</h3>
          <div className="space-y-2">
            {logs.slice(0, 10).map((log, idx) => (
              <div key={idx} className="p-3 bg-gray-800 rounded-lg flex justify-between items-center">
                <div>
                  <div className="text-white text-sm">{formatTimestamp(log.timestamp)}</div>
                  <div className="text-gray-400 text-xs">
                    {log.usersProcessed} processed, {log.usersAdded} added, {log.usersUpdated} updated
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">{formatDuration(log.duration)}</span>
                  <span className={`px-2 py-1 rounded text-xs border ${getStatusBadgeColor(log.status)}`}>
                    {log.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="pt-4 border-t border-gray-700">
        <button
          onClick={loadData}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Refresh Status
        </button>
      </div>
    </div>
  );
};

export default SyncStatus;
