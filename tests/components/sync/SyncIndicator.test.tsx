import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { SyncIndicator } from '../../../src/components/sync/SyncIndicator';
import * as syncService from '../../../src/services/syncService';

describe('SyncIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches sync status once on mount', async () => {
    const fetchMock = vi.spyOn(syncService, 'fetchSyncStatus')
      .mockResolvedValue({
        currentStatus: 'success',
        lastSyncLog: null,
        isInitialized: true,
        serverStartTime: "17:45"
      });
    
    render(<SyncIndicator />);
    
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
