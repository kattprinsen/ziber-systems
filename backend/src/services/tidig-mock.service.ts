/**
 * Mock Tidig Service for local development/testing
 * 
 * Use this when the real Tidig API is unavailable.
 * Set TIDIG_MOCK_MODE=true in .env to enable.
 */

import type { FetchEmployeesResult } from './tidig.service.js';
import type { NormalizedEmployee } from '../models/tidig.model.js';

/**
 * Mock employee data for testing
 */
const MOCK_EMPLOYEES: NormalizedEmployee[] = [
  {
    employeeID: 'C001',
    name: 'Test User Alpha',
    email: 'c001@consultant.local',
  },
  {
    employeeID: 'JDO',
    name: 'John Doe',
    email: 'jdo@company.local',
  },
  {
    employeeID: 'JSM',
    name: 'Jane Smith',
    email: 'jsm@company.local',
  },
  {
    employeeID: 'MJO',
    name: 'Mary Johnson',
    email: 'mjo@company.local',
  },
];

/**
 * Fetch mock employees (simulates Tidig API call)
 */
export async function fetchMockEmployees(): Promise<FetchEmployeesResult> {
  console.log('[Mock Tidig] Simulating API call to /Api/Employee/SubTree...');
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log(`[Mock Tidig] ✓ Returning ${MOCK_EMPLOYEES.length} mock employees`);

  return {
    success: true,
    employees: MOCK_EMPLOYEES,
    errors: [],
    warnings: [],
  };
}
