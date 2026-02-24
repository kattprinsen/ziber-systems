/**
 * Tidig Data Model with Zod Schemas
 * 
 * This file defines the data structures and validation schemas for Tidig API responses.
 * The actual structure from Tidig API will be discovered during implementation.
 */

import { z } from 'zod';

// ============================================================================
// Tidig Employee Schema
// ============================================================================

/**
 * TidigEmployee represents a user record from the Tidig API.
 * 
 * The Tidig API returns a hierarchical tree with:
 * - empId: Employee ID (like "SBQ")
 * - name: Employee name
 * - children: Array of subordinate employees (or null)
 * 
 * Email is NOT provided by the API - we'll generate it or set to a default.
 */
export const TidigEmployeeSchema: z.ZodType<any, any, any> = z.object({
  empId: z.string().min(1, 'empId cannot be empty'),
  name: z.string().min(1, 'name cannot be empty'),
  children: z.array(z.lazy(() => TidigEmployeeSchema)).nullable().optional(),
  // Additional fields allowed but not validated (passthrough)
}).passthrough();

export type TidigEmployee = z.infer<typeof TidigEmployeeSchema>;

/**
 * Normalized employee format for internal use
 */
export interface NormalizedEmployee {
  employeeID: string;
  name: string;
  email: string;
}

// ============================================================================
// Tidig API Response Schemas
// ============================================================================

/**
 * SubTree endpoint response schema.
 * Returns a hierarchical tree structure starting from the authenticated user.
 */
export const SubTreeResponseSchema = TidigEmployeeSchema;

export type SubTreeResponse = z.infer<typeof SubTreeResponseSchema>;

// ============================================================================
// Helper Functions for Response Extraction
// ============================================================================

/**
 * Flatten a hierarchical employee tree into a flat array.
 * Recursively extracts all employees from the tree structure.
 */
export function flattenEmployeeTree(employee: TidigEmployee): TidigEmployee[] {
  const employees: TidigEmployee[] = [employee];
  
  if (employee.children && Array.isArray(employee.children)) {
    for (const child of employee.children) {
      employees.push(...flattenEmployeeTree(child));
    }
  }
  
  return employees;
}

/**
 * Normalize a Tidig employee to our internal format.
 * Generates email if not provided by API.
 */
export function normalizeEmployee(employee: TidigEmployee): NormalizedEmployee {
  // Generate email from empId if not provided
  // Format: empid@tidig.local (placeholder domain)
  const email = `${employee.empId.toLowerCase()}@company.local`;
  
  return {
    employeeID: employee.empId,
    name: employee.name,
    email: email,
  };
}

/**
 * Extract and normalize employee array from SubTree response.
 * Handles the hierarchical tree structure and flattens it.
 */
export function extractEmployees(response: SubTreeResponse): NormalizedEmployee[] {
  // Flatten the tree structure
  const flatEmployees = flattenEmployeeTree(response);
  
  // Normalize to internal format
  return flatEmployees.map(normalizeEmployee);
}

/**
 * Validate a single employee record.
 * Returns a result object with validation status and potential error.
 */
export function validateEmployee(employee: unknown): {
  success: boolean;
  data?: TidigEmployee;
  error?: string;
} {
  try {
    const validated = TidigEmployeeSchema.parse(employee);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(e => `${e.path.join('.')}: ${e.message}`);
      return { success: false, error: errorMessages.join('; ') };
    }
    return { success: false, error: 'Unknown validation error' };
  }
}

/**
 * Validate and filter an array of employees.
 * Invalid employees are skipped with a warning logged.
 * 
 * @returns Object with valid employees and array of validation errors
 */
export function validateEmployees(employees: unknown[]): {
  valid: TidigEmployee[];
  errors: Array<{ index: number; employee: unknown; error: string }>;
} {
  const valid: TidigEmployee[] = [];
  const errors: Array<{ index: number; employee: unknown; error: string }> = [];

  employees.forEach((employee, index) => {
    const result = validateEmployee(employee);
    if (result.success && result.data) {
      valid.push(result.data);
    } else {
      errors.push({
        index,
        employee,
        error: result.error || 'Validation failed',
      });
      console.warn(`[Tidig Model] Invalid employee at index ${index}:`, employee, result.error);
    }
  });

  return { valid, errors };
}
