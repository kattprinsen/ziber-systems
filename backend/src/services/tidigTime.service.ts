import { tidigClient, TidigApiError, getErrorCode, getErrorMessage } from '../utils/tidig-client.js';
import {
  TidigTimeResponseSchema,
  normalizeTimeEntries,
  TimeEntry,
  TimeFilter,
  isValidInterval,
} from '../models/tidigTime.js';
import type { SyncError, SyncWarning } from '../types/sync.types.js';

export interface FetchTimeEntriesParams extends Omit<TimeFilter, 'fromDate' | 'toDate'> {
  fromDate: string;
  toDate: string;
}

export interface FetchTimeEntriesResult {
  success: boolean;
  entries: TimeEntry[];
  errors: SyncError[];
  warnings: SyncWarning[];
}

export async function fetchTimeEntries(
  params: FetchTimeEntriesParams
): Promise<FetchTimeEntriesResult> {
  const errors: SyncError[] = [];
  const warnings: SyncWarning[] = [];

  // Validate date interval before calling Tidig (FR-006)
  if (!isValidInterval(params.fromDate, params.toDate)) {
    errors.push({
      code: 'SYNC_DATA_INVALID',
      message:
        'Invalid date interval: fromDate must be before toDate and both must be valid ISO date strings',
      context: {
        fromDate: params.fromDate,
        toDate: params.toDate,
      },
      timestamp: new Date().toISOString(),
    });

    return {
      success: false,
      entries: [],
      errors,
      warnings,
    };
  }

  try {
    console.log('[Tidig Time Service] Fetching time entries from /Api/Time...');

    const response = await tidigClient.get('/Api/Time', {
      params: {
        empId: params.empId,
        fromDate: params.fromDate,
        toDate: params.toDate,
        customerId: params.customerId,
        customerName: params.customerName,
        projectId: params.projectId,
        projectName: params.projectName,
      },
    });

    const parseResult = TidigTimeResponseSchema.safeParse(response.data);

    if (!parseResult.success) {
      console.error('[Tidig Time Service] Response validation failed:', parseResult.error);

      errors.push({
        code: 'SYNC_DATA_INVALID',
        message: 'Tidig time API response does not match expected structure',
        context: { error: String(parseResult.error) },
        timestamp: new Date().toISOString(),
      });

      return {
        success: false,
        entries: [],
        errors,
        warnings,
      };
    }

    const normalizedEntries = normalizeTimeEntries(parseResult.data);
    console.log(
      `[Tidig Time Service]  Retrieved ${normalizedEntries.length} time entries for ${params.empId}`
    );

    return {
      success: true,
      entries: normalizedEntries,
      errors,
      warnings,
    };
  } catch (error) {
    console.error('[Tidig Time Service]  Failed to fetch time entries:', error);

    const errorCode = getErrorCode(error);
    const errorMessage = getErrorMessage(error);

    errors.push({
      code: errorCode as any,
      message: errorMessage,
      context: error instanceof TidigApiError ? { originalError: error.originalError } : {},
      timestamp: new Date().toISOString(),
    });

    return {
      success: false,
      entries: [],
      errors,
      warnings,
    };
  }
}
