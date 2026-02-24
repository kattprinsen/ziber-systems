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
    const response = await tidigClient.get('/Api/Time');
    console.log('[Tidig Service] ✓ Connection test successful');
    return true;
  } catch (error) {
    console.error('[Tidig Service] ✗ Connection test failed:', getErrorMessage(error));
    return false;
  }
}
