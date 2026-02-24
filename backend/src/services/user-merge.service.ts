/**
 * User Merge Service
 * 
 * Handles intelligent merging of user data from multiple sources.
 * Updates Tidig-managed fields while preserving locally-managed fields.
 */

import type { User } from '../types/user.types.js';
import type { NormalizedEmployee } from '../models/tidig.model.js';

// ============================================================================
// Field Definitions
// ============================================================================

/**
 * Fields sourced from Tidig API (always updated during sync)
 */
export const TIDIG_MANAGED_FIELDS = [
  'employeeID',
  'name',
  'email',
] as const;

/**
 * Fields managed locally in the management system (preserved during sync)
 */
export const LOCALLY_MANAGED_FIELDS = [
  'role',
  'department',
  'avatar',
  'phone',
  'bio',
  'skills',
  'location',
  'currentSalary',
  'salaryHistory',
] as const;

// ============================================================================
// Merge Logic
// ============================================================================

/**
 * Merge user data from Tidig with local user data.
 * 
 * Strategy:
 * - Tidig-managed fields (name, email, employeeID): Take from Tidig
 * - Locally-managed fields (salary, department, etc.): Keep from local
 * - System fields (id, joinedDate, status): Keep from local
 * 
 * @param tidigEmployee - Employee data from Tidig API
 * @param localUser - Existing user from local database
 * @returns Merged User object with Tidig updates + preserved local fields
 */
export function mergeUserData(
  tidigEmployee: NormalizedEmployee,
  localUser: User
): User {
  // Start with local user (preserves all local fields and system fields)
  const mergedUser: User = { ...localUser };

  // Update Tidig-managed fields from API
  mergedUser.employeeID = tidigEmployee.employeeID;
  mergedUser.name = tidigEmployee.name || localUser.name;  // Fallback to local if Tidig name is empty
  mergedUser.email = tidigEmployee.email;

  // Note: Locally-managed fields are already in mergedUser from spread operator
  // System fields (id, joinedDate, status) are also preserved

  return mergedUser;
}

/**
 * Check if a user has been updated by comparing Tidig fields.
 * 
 * @param tidigEmployee - Employee data from Tidig API
 * @param localUser - Existing user from local database
 * @returns true if any Tidig-managed field has changed
 */
export function hasUserChanged(
  tidigEmployee: NormalizedEmployee,
  localUser: User
): boolean {
  // Compare Tidig-managed fields (case-insensitive for employeeID, exact for others)
  const employeeIDChanged = 
    tidigEmployee.employeeID.toLowerCase() !== localUser.employeeID?.toLowerCase();
  
  const nameChanged = tidigEmployee.name !== localUser.name;
  const emailChanged = tidigEmployee.email !== localUser.email;

  return employeeIDChanged || nameChanged || emailChanged;
}

/**
 * Get a list of fields that changed during merge.
 * Useful for logging and debugging.
 * 
 * @param tidigEmployee - Employee data from Tidig API
 * @param localUser - Existing user from local database
 * @returns Array of field names that changed
 */
export function getChangedFields(
  tidigEmployee: NormalizedEmployee,
  localUser: User
): string[] {
  const changes: string[] = [];

  if (tidigEmployee.employeeID.toLowerCase() !== localUser.employeeID?.toLowerCase()) {
    changes.push('employeeID');
  }
  if (tidigEmployee.name !== localUser.name) {
    changes.push('name');
  }
  if (tidigEmployee.email !== localUser.email) {
    changes.push('email');
  }

  return changes;
}

export default {
  mergeUserData,
  hasUserChanged,
  getChangedFields,
  TIDIG_MANAGED_FIELDS,
  LOCALLY_MANAGED_FIELDS,
};
