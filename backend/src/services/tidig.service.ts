/**
 * Tidig Service
 * 
 * Service for interacting with the Tidig API to fetch employee data.
 * 
 * Set TIDIG_MOCK_MODE=true in .env to use mock data for testing.
 */

import { tidigClient, TidigApiError, getErrorCode, getErrorMessage } from '../utils/tidig-client.js';
import {
  SubTreeResponseSchema,
  NormalizedEmployee,
  extractEmployees,
} from '../models/tidig.model.js';
import type { SyncError, SyncWarning } from '../types/sync.types.js';
import { fetchMockEmployees } from './tidig-mock.service.js';
import { loadUsersFromFile } from '../utils/users-data.js';
import type { User } from '../types/user.types.js';

// Check if mock mode is enabled
const MOCK_MODE = process.env.TIDIG_MOCK_MODE === 'true';

// ============================================================================
// Tidig Service Interface
// ============================================================================

export interface FetchEmployeesResult {
  success: boolean;
  employees: NormalizedEmployee[];
  errors: SyncError[];
  warnings: SyncWarning[];
}

/**
 * Result shape when fetching the raw Tidig employee subtree.
 * Used by the frontend to derive SBQ employees without flattening.
 */
export interface FetchEmployeeSubtreeResult {
  success: boolean;
  subtree: unknown | null;
  errors: SyncError[];
}

/**
 * Joined view of Tidig employees with internal user records for the
 * current calendar month. Used by higher-level services to reason about
 * monthly hours without changing existing endpoints.
 */
export interface JoinedEmployeeMonthlyHours {
  employeeID: string;
  name: string;
  internalUserId: string | null;
  currentMonthHours: number;
  hourlyRate: number | null;
}

// ============================================================================
// Main API Methods
// ============================================================================

/**
 * Fetch employees from Tidig API using the SubTree endpoint.
 * 
 * This is the primary method for synchronizing user data from Tidig.
 * It handles API calls, validation, and error collection.
 * 
 * Set TIDIG_MOCK_MODE=true to use mock data for testing.
 * 
 * @returns FetchEmployeesResult with employees array and any errors/warnings
 */
export async function fetchEmployees(): Promise<FetchEmployeesResult> {
  // Use mock service if enabled
  if (MOCK_MODE) {
    console.log('[Tidig Service] 🎭 MOCK MODE ENABLED - Using mock data');
    return fetchMockEmployees();
  }

  const errors: SyncError[] = [];
  const warnings: SyncWarning[] = [];

  try {
    console.log('[Tidig Service] Fetching employees from /Api/Employee/SubTree...');

    // Make API request
    const response = await tidigClient.get('/Api/Employee/SubTree');

    // Validate response structure with zod schema
    let validatedResponse;
    try {
      validatedResponse = SubTreeResponseSchema.parse(response.data);
    } catch (validationError) {
      console.error('[Tidig Service] Response validation failed:', validationError);
      errors.push({
        code: 'SYNC_DATA_INVALID',
        message: 'Tidig API response does not match expected structure',
        context: { error: String(validationError) },
        timestamp: new Date().toISOString(),
      });
      return { success: false, employees: [], errors, warnings };
    }

    // Extract and normalize employees from hierarchical tree
    const normalizedEmployees = extractEmployees(validatedResponse);
    console.log(`[Tidig Service] Extracted ${normalizedEmployees.length} employees from tree structure`);

    // Check for duplicate employeeIDs
    const employeeIds = new Set<string>();
    const duplicates: string[] = [];
    normalizedEmployees.forEach((emp) => {
      if (employeeIds.has(emp.employeeID)) {
        duplicates.push(emp.employeeID);
      } else {
        employeeIds.add(emp.employeeID);
      }
    });

    if (duplicates.length > 0) {
      warnings.push({
        code: 'DUPLICATE_USER',
        message: `Duplicate employeeIDs found: ${duplicates.join(', ')}`,
        context: { duplicates },
      });
    }

    console.log(`[Tidig Service] ✓ Successfully processed ${normalizedEmployees.length} employees`);
    if (warnings.length > 0) {
      console.warn(`[Tidig Service] ⚠ ${warnings.length} warnings during processing`);
    }

    return {
      success: true,
      employees: normalizedEmployees,
      errors,
      warnings,
    };
  } catch (error) {
    // Handle Tidig API errors
    console.error('[Tidig Service] ✗ Failed to fetch employees:', error);

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
      employees: [],
      errors,
      warnings,
    };
  }
}

/**
 * Fetch the raw employee subtree from Tidig without flattening.
 *
 * The tree structure is validated against SubTreeResponseSchema but otherwise
 * returned as-is so the frontend can derive SBQ-specific employees.
 */
export async function fetchEmployeeSubtree(): Promise<FetchEmployeeSubtreeResult> {
  const errors: SyncError[] = [];

  try {
    console.log('[Tidig Service] Fetching employee subtree from /Api/Employee/SubTree...');

    const response = await tidigClient.get('/Api/Employee/SubTree');

    let validatedResponse: unknown;
    try {
      validatedResponse = SubTreeResponseSchema.parse(response.data);
    } catch (validationError) {
      console.error('[Tidig Service] Subtree response validation failed:', validationError);
      errors.push({
        code: 'SYNC_DATA_INVALID',
        message: 'Tidig employee subtree does not match expected structure',
        context: { error: String(validationError) },
        timestamp: new Date().toISOString(),
      });
      return { success: false, subtree: null, errors };
    }

    console.log('[Tidig Service] ✓ Successfully fetched and validated employee subtree');
    return { success: true, subtree: validatedResponse, errors };
  } catch (error) {
    console.error('[Tidig Service] ✗ Failed to fetch employee subtree:', error);

    const errorCode = getErrorCode(error);
    const errorMessage = getErrorMessage(error);

    errors.push({
      code: errorCode as any,
      message: errorMessage,
      context: error instanceof TidigApiError ? { originalError: error.originalError } : {},
      timestamp: new Date().toISOString(),
    });

    return { success: false, subtree: null, errors };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Test connection to Tidig API by fetching the Time endpoint.
 * This is a lightweight health check.
 * 
 * @returns true if connection successful, false otherwise
 */
export async function testConnection(): Promise<boolean> {
  try {
    console.log('[Tidig Service] Testing connection to /Api/Time...');
    await tidigClient.get('/Api/Time');
    console.log('[Tidig Service] ✓ Connection test successful');
    return true;
  } catch (error) {
    console.error('[Tidig Service] ✗ Connection test failed:', getErrorMessage(error));
    return false;
  }
}

// ============================================================================
// Joined Tidig + Internal Users View (Monthly Hours)
// ============================================================================

/**
 * Join Tidig employees with internal user records for the current calendar
 * month using employeeID/externalId, so higher-level services can reason about
 * monthly hours without introducing new public endpoints.
 */
export async function getJoinedEmployeeMonthlyHoursForCurrentMonth(): Promise<{
  monthKey: string;
  employees: JoinedEmployeeMonthlyHours[];
}> {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [tidigResult, internalUsers] = await Promise.all([
    fetchEmployees(),
    loadUsersFromFile({ allowMissing: true }),
  ]);

  const usersByExternalId = new Map<string, User>();
  const usersByEmployeeId = new Map<string, User>();

  internalUsers.forEach((user) => {
    if (user.externalId) {
      usersByExternalId.set(user.externalId, user);
    }
    if (user.employeeID) {
      usersByEmployeeId.set(user.employeeID, user);
    }
  });

  const employees: JoinedEmployeeMonthlyHours[] = [];

  for (const emp of tidigResult.employees) {
    const key = emp.employeeID;
    let user: User | undefined;

    if (usersByExternalId.has(key)) {
      user = usersByExternalId.get(key);
    } else if (usersByEmployeeId.has(key)) {
      user = usersByEmployeeId.get(key);
    }

    const currentMonthHours = user?.monthlyHours?.[monthKey] ?? 0;
    const hourlyRate = typeof user?.hourlyRate === 'number' ? user!.hourlyRate! : null;

    employees.push({
      employeeID: emp.employeeID,
      name: emp.name,
      internalUserId: user?.id ?? null,
      currentMonthHours: currentMonthHours > 0 ? currentMonthHours : 0,
      hourlyRate,
    });
  }

  return { monthKey, employees };
}
