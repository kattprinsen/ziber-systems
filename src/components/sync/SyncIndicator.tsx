/**
 * SyncIndicator Component (T069, T072, T073)
 * 
 * Small status indicator showing sync status in the navbar.
 * Polls sync status every 30 seconds and displays error notifications.
 */

import React, { useEffect, useState } from 'react';
import { fetchSyncStatus } from '../../services/syncService';
import type { SyncStatus, SyncStatusResponse } from '../../types/sync';

interface SyncIndicatorProps {
  className?: string;
}

export const SyncIndicator: React.FC<SyncIndicatorProps> = ({ className = '' }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatusResponse | null>(null);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch sync status
  const loadSyncStatus = async () => {
    try {
      const status = await fetchSyncStatus();
      setSyncStatus(status);

      // Show error notification if sync failed (T073)
      if (status.currentStatus === 'failed' && status.lastSyncLog) {
        const errors = status.lastSyncLog.errors;
        if (errors.length > 0) {
          setErrorMessage(errors[0].message);
          setShowError(true);
          // Auto-hide error after 10 seconds
          setTimeout(() => setShowError(false), 10000);
        }
      } else {
        setShowError(false);
      }
    } catch (error) {
      console.error('Failed to fetch sync status:', error);
    }
  };

  // Initial load and polling (T072: every 30 seconds)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSyncStatus();
    const interval = setInterval(loadSyncStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!syncStatus) {
    return null;
  }

  const getStatusIcon = (status: SyncStatus): string => {
    switch (status) {
      case 'idle':
        return '⏸️';
      case 'syncing':
        return '🔄';
      case 'success':
        return '✅';
      case 'failed':
        return '❌';
    }
  };

  const getStatusColor = (status: SyncStatus): string => {
    switch (status) {
      case 'idle':
        return 'text-gray-400';
      case 'syncing':
        return 'text-blue-500 animate-spin';
      case 'success':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
    }
  };

  const getStatusText = (status: SyncStatus): string => {
    switch (status) {
      case 'idle':
        return 'Idle';
      case 'syncing':
        return 'Syncing...';
      case 'success':
        return 'Synced';
      case 'failed':
        return 'Failed';
    }
  };

  const formatLastSyncTime = (): string => {
    if (!syncStatus.lastSyncLog) {
      return 'Never';
    }
    const time = new Date(syncStatus.lastSyncLog.timestamp);
    const now = new Date();
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Sync Status Indicator */}
      <div 
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 transition-colors cursor-pointer"
        title={`Last sync: ${formatLastSyncTime()}`}
      >
        <span className={getStatusColor(syncStatus.currentStatus)}>
          {getStatusIcon(syncStatus.currentStatus)}
        </span>
        <span className="text-sm text-gray-300">
          {getStatusText(syncStatus.currentStatus)}
        </span>
      </div>

      {/* Error Notification (T073) */}
      {showError && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-red-900 border border-red-700 rounded-lg p-4 shadow-lg z-50 animate-slide-down">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-1">Sync Failed</h3>
              <p className="text-sm text-red-200">{errorMessage}</p>
              <button
                onClick={() => setShowError(false)}
                className="mt-2 text-xs text-red-300 hover:text-white underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncIndicator;
