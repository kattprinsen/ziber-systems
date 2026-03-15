/**
 * Sync Service
 * 
 * Orchestrates user synchronization from Tidig API.
 * Handles sync flow, operation locking, logging, and state management.
 */

import { promises as fs } from 'fs';
import { randomUUID } from 'crypto';
import { fetchEmployees } from './tidig.service.js';
import { mergeUserData, hasUserChanged, getChangedFields } from './user-merge.service.js';
import type { NormalizedEmployee } from '../models/tidig.model.js';
import type { User } from '../types/user.types.js';
import type {
  SyncLog,
  SyncResult,
  SyncStatus,
  SyncError,
  SyncWarning,
} from '../types/sync.types.js';
import userService from './user.service.js';
import { USERS_FILE_PATH, loadUsersFromFile } from '../utils/users-data.js';

class SyncService {
  private currentStatus: SyncStatus = 'idle';
  private isSyncing: boolean = false;
  private lastSyncLog: SyncLog | null = null;

  constructor() {
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Get the current sync status
   */
  getCurrentStatus(): SyncStatus {
    return this.currentStatus;
  }

  /**
   * Get the last sync log
   */
  getLastSyncLog(): SyncLog | null {
    return this.lastSyncLog;
  }

  /**
   * Perform user synchronization from Tidig API.
   * 
   * This is the main entry point for sync operations.
   * Handles locking, error collection, and atomic file writes.
   * 
   * @returns SyncResult with success status and detailed log
   */
  async performSync(): Promise<SyncResult> {
    // Check for concurrent sync operations (locking)
    if (this.isSyncing) {
      console.warn('[Sync Service] ⚠ Sync already in progress, skipping...');
      return {
        success: false,
        syncLog: {
          syncId: randomUUID(),
          timestamp: new Date().toISOString(),
          duration: 0,
          status: 'failed',
          usersProcessed: 0,
          usersAdded: 0,
          usersUpdated: 0,
          usersInactivated: 0,
          usersReactivated: 0,
          errors: [
            {
              code: 'SYNC_API_ERROR',
              message: 'Sync operation already in progress',
              timestamp: new Date().toISOString(),
            },
          ],
          warnings: [],
        },
      };
    }

    // Acquire lock
    this.isSyncing = true;
    this.currentStatus = 'syncing';
    const startTime = Date.now();
    const syncId = randomUUID();

    console.log(`[Sync Service] Starting sync operation ${syncId}...`);

    const errors: SyncError[] = [];
    const warnings: SyncWarning[] = [];

    try {
      // Step 1: Fetch employees from Tidig
      const fetchResult = await fetchEmployees();
      
      if (!fetchResult.success) {
        errors.push(...fetchResult.errors);
        warnings.push(...fetchResult.warnings);
        
        const duration = Date.now() - startTime;
        const syncLog = this.createSyncLog(
          syncId,
          startTime,
          duration,
          'failed',
          0, 0, 0, 0, 0,
          errors,
          warnings
        );
        
        this.lastSyncLog = syncLog;
        this.currentStatus = 'failed';
        
        console.error(`[Sync Service] ✗ Sync failed after ${duration}ms`);
        return { success: false, syncLog };
      }

      const tidigEmployees = fetchResult.employees;
      warnings.push(...fetchResult.warnings);

      console.log(`[Sync Service] Fetched ${tidigEmployees.length} employees from Tidig`);

      // Step 2: Load current local users
      const localUsers = await this.loadUsers();
      console.log(`[Sync Service] Loaded ${localUsers.length} local users`);

      // Step 3: Detect and add new users
      const newEmployees = this.compareUsers(tidigEmployees, localUsers);
      const newUsers = newEmployees.map((emp) => this.addNewUser(emp));
      
      // Log newly added users (T031)
      if (newUsers.length > 0) {
        console.log(`[Sync Service] ═══ New Users Added ═══`);
        newUsers.forEach((user) => {
          console.log(`[Sync Service]   • ${user.employeeID} - ${user.name}`);
        });
        console.log(`[Sync Service] ═══════════════════════`);
      } else {
        console.log(`[Sync Service] No new users to add`);
      }

      // Step 4: Update existing users with merge logic (Phase 5)
      const updatedUsers: User[] = [];
      const unchangedUsers: User[] = [];
      
      // Create a map of Tidig employees by employeeID for O(1) lookup
      const tidigEmployeeMap = new Map<string, NormalizedEmployee>(
        tidigEmployees.map((emp) => [emp.employeeID.toLowerCase(), emp])
      );

      // Process each local user
      for (const localUser of localUsers) {
        const employeeID = localUser.employeeID?.toLowerCase();
        
        // Skip if user doesn't have employeeID (shouldn't happen, but defensive)
        if (!employeeID) {
          unchangedUsers.push(localUser);
          continue;
        }

        const tidigEmployee = tidigEmployeeMap.get(employeeID);
        const isInTidig = !!tidigEmployee;
        const isCurrentlyActive = localUser.status === 'active';
        const isCurrentlyInactive = localUser.status === 'inactive';

        // Case 1: User exists in Tidig and is active - check for updates
        if (isInTidig && isCurrentlyActive) {
          const hasChanged = hasUserChanged(tidigEmployee, localUser);
          
          if (hasChanged) {
            const mergedUser = mergeUserData(tidigEmployee, localUser);
            updatedUsers.push(mergedUser);
            
            const changedFields = getChangedFields(tidigEmployee, localUser);
            console.log(`[Sync Service] ✓ Updated user: ${localUser.employeeID} (${changedFields.join(', ')})`);
          } else {
            unchangedUsers.push(localUser);
          }
        }
        // Case 2: User exists in Tidig and is inactive - will be reactivated in Step 5
        else if (isInTidig && isCurrentlyInactive) {
          // Will be handled by processInactiveAndReactivated in Step 5
          continue;
        }
        // Case 3: User not in Tidig - will be marked inactive in Step 5
        else if (!isInTidig) {
          // Will be handled by processInactiveAndReactivated in Step 5
          continue;
        }
        // Case 4: Other status (on-leave) - keep unchanged
        else {
          unchangedUsers.push(localUser);
        }
      }

      // Log updated users (T039)
      if (updatedUsers.length > 0) {
        console.log(`[Sync Service] ═══ Users Updated ═══`);
        updatedUsers.forEach((user) => {
          console.log(`[Sync Service]   • ${user.employeeID} - ${user.name}`);
        });
        console.log(`[Sync Service] ════════════════════════`);
      } else {
        console.log(`[Sync Service] No existing users updated`);
      }

      // Step 5: Detect and mark inactive users (Phase 6 - T046-T050)
      const { inactivatedUsers, reactivatedUsers } = this.processInactiveAndReactivated(
        tidigEmployees,
        localUsers
      );

      // Log inactivated users (T050)
      if (inactivatedUsers.length > 0) {
        console.warn(`[Sync Service] ⚠️  Users Marked Inactive ⚠️`);
        inactivatedUsers.forEach((user) => {
          console.warn(`[Sync Service]   ⚠ ${user.employeeID} - ${user.name} (not in Tidig)`);
        });
        console.warn(`[Sync Service] ══════════════════════════════`);
      } else {
        console.log(`[Sync Service] No users marked inactive`);
      }

      // Log reactivated users (T054)
      if (reactivatedUsers.length > 0) {
        console.log(`[Sync Service] ♻️  Users Reactivated ♻️`);
        reactivatedUsers.forEach((user) => {
          console.log(`[Sync Service]   ♻ ${user.employeeID} - ${user.name}`);
        });
        console.log(`[Sync Service] ══════════════════════════`);
      } else {
        console.log(`[Sync Service] No users reactivated`);
      }

      // Step 6: Combine all users (new + updated + unchanged + inactive + reactivated)
      const syncedUsers = [
        ...updatedUsers,
        ...unchangedUsers,
        ...newUsers,
        ...inactivatedUsers,
        ...reactivatedUsers,
      ];

      // Step 6: Write to users.json (atomic write)
      await this.writeUsersAtomic(syncedUsers);

      // Step 7: Clear user service cache
      userService.clearCache();

      // Step 8: Calculate sync metrics
      const duration = Date.now() - startTime;
      const usersProcessed = tidigEmployees.length;
      const usersAdded = newUsers.length;  // T030: Accurate count of newly added users
      const usersUpdated = updatedUsers.length;  // T039: Count of updated users
      const usersInactivated = inactivatedUsers.length;  // T049: Count of inactivated users
      const usersReactivated = reactivatedUsers.length;  // T054: Count of reactivated users

      const syncLog = this.createSyncLog(
        syncId,
        startTime,
        duration,
        warnings.length > 0 ? 'partial_success' : 'success',
        usersProcessed,
        usersAdded,
        usersUpdated,
        usersInactivated,
        usersReactivated,
        errors,
        warnings
      );

      this.lastSyncLog = syncLog;
      this.currentStatus = 'success';

      console.log(`[Sync Service] ✓ Sync completed successfully in ${duration}ms`);
      console.log(`[Sync Service]   - Processed: ${usersProcessed} users`);
      console.log(`[Sync Service]   - Added: ${usersAdded} users`);
      console.log(`[Sync Service]   - Updated: ${usersUpdated} users`);
      console.log(`[Sync Service]   - Inactivated: ${usersInactivated} users`);
      console.log(`[Sync Service]   - Reactivated: ${usersReactivated} users`);
      if (warnings.length > 0) {
        console.warn(`[Sync Service]   - Warnings: ${warnings.length}`);
      }

      return { success: true, syncLog };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('[Sync Service] ✗ Unexpected error during sync:', error);

      const syncError: SyncError = {
        code: 'SYNC_API_ERROR',
        message: error instanceof Error ? error.message : String(error),
        context: { error },
        timestamp: new Date().toISOString(),
      };
      errors.push(syncError);

      const syncLog = this.createSyncLog(
        syncId,
        startTime,
        duration,
        'failed',
        0, 0, 0, 0, 0,
        errors,
        warnings
      );

      this.lastSyncLog = syncLog;
      this.currentStatus = 'failed';

      return { success: false, syncLog };
    } finally {
      // Release lock
      this.isSyncing = false;
    }
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Load users from users.json
   */
  private async loadUsers(): Promise<User[]> {
    return loadUsersFromFile({ allowMissing: true });
  }

  /**
   * Write users to users.json using atomic write-and-rename pattern.
   * This prevents corruption if the process crashes during write.
   */
  private async writeUsersAtomic(users: User[]): Promise<void> {
    const tempFilePath = `${USERS_FILE_PATH}.tmp`;

    try {
      // Write to temporary file
      await fs.writeFile(tempFilePath, JSON.stringify(users, null, 2), 'utf-8');

      // Atomic rename
      await fs.rename(tempFilePath, USERS_FILE_PATH);

      console.log(`[Sync Service] ✓ Wrote ${users.length} users to ${USERS_FILE_PATH}`);
    } catch (error) {
      console.error('[Sync Service] ✗ Failed to write users.json:', error);

      // Clean up temp file if it exists
      try {
        await fs.unlink(tempFilePath);
      } catch {
        // Ignore cleanup errors
      }

      throw new Error(`Failed to write users.json: ${error}`);
    }
  }

  // Note: legacy conversion helper kept for reference; currently unused.
  // private convertTidigEmployeesToUsers(tidigEmployees: NormalizedEmployee[]): User[] {
  //   return tidigEmployees.map((emp) => ({
  //     id: randomUUID(),
  //     employeeID: emp.employeeID,
  //     name: emp.name || 'Unknown',
  //     email: emp.email,
  //     role: '',
  //     department: '',
  //     avatar: undefined,
  //     phone: undefined,
  //     joinedDate: new Date().toISOString(),
  //     status: 'active',
  //     bio: undefined,
  //     skills: undefined,
  //     location: undefined,
  //     currentSalary: undefined,
  //     salaryHistory: undefined,
  //   }));
  // }

  /**
   * Compare Tidig employees against local users to identify new ones.
   * 
   * @param tidigEmployees - Employees from Tidig API
   * @param localUsers - Existing users from users.json
   * @returns Array of new Tidig employees not found in local system
   */
  private compareUsers(
    tidigEmployees: NormalizedEmployee[],
    localUsers: User[]
  ): NormalizedEmployee[] {
    // Build a Set of existing employeeIDs for O(1) lookup
    // Use case-insensitive comparison
    const existingEmployeeIDs = new Set(
      localUsers
        .map((user) => user.employeeID?.toLowerCase())
        .filter((id): id is string => id !== undefined && id !== null)
    );

    console.log(`[Sync Service] Comparing ${tidigEmployees.length} Tidig employees against ${localUsers.length} local users`);
    console.log(`[Sync Service] Existing employee IDs: ${Array.from(existingEmployeeIDs).join(', ')}`);

    // Filter out Tidig employees that already exist locally
    const newEmployees = tidigEmployees.filter((emp) => {
      const employeeID = emp.employeeID.toLowerCase();
      const isNew = !existingEmployeeIDs.has(employeeID);
      
      if (isNew) {
        console.log(`[Sync Service] ✓ New employee detected: ${emp.employeeID} (${emp.name})`);
      }
      
      return isNew;
    });

    console.log(`[Sync Service] Found ${newEmployees.length} new employee(s) to add`);
    return newEmployees;
  }

  /**
   * Create a new User from a Tidig employee with default local field values.
   * 
   * @param employee - Normalized employee from Tidig
   * @returns New User object with Tidig data + empty local fields
   */
  private addNewUser(employee: NormalizedEmployee): User {
    const user: User = {
      id: randomUUID(),
      employeeID: employee.employeeID,
      name: employee.name || 'Unknown',
      email: employee.email,
      role: '',  // Local field, initially empty
      department: '',  // Local field, initially empty
      avatar: undefined,
      phone: undefined,
      joinedDate: new Date().toISOString(),
      status: 'active',
      bio: undefined,
      skills: undefined,
      location: undefined,
      currentSalary: undefined,
      salaryHistory: undefined,
      syncStatus: {
        lastSyncedAt: new Date().toISOString(),
        source: 'tidig',
      },
    };

    return user;
  }

  /**
   * Process inactive and reactivated users during sync (Phase 6 - T046-T054).
   * 
   * Logic:
   * 1. Find local users not in Tidig → mark as inactive (unless already inactive)
   * 2. Find inactive users that returned to Tidig → reactivate and merge data
   * 
   * @param tidigEmployees - Employees from Tidig API
   * @param localUsers - Existing users from local database
   * @returns Object with inactivatedUsers and reactivatedUsers arrays
   */
  private processInactiveAndReactivated(
    tidigEmployees: NormalizedEmployee[],
    localUsers: User[]
  ): { inactivatedUsers: User[]; reactivatedUsers: User[] } {
    const inactivatedUsers: User[] = [];
    const reactivatedUsers: User[] = [];

    // Build map of Tidig employees for O(1) lookup
    const tidigEmployeeMap = new Map<string, NormalizedEmployee>(
      tidigEmployees.map((emp) => [emp.employeeID.toLowerCase(), emp])
    );

    // Process each local user
    for (const localUser of localUsers) {
      const employeeID = localUser.employeeID?.toLowerCase();
      
      if (!employeeID) {
        // User without employeeID (manual entry) - skip inactive processing
        continue;
      }

      const tidigEmployee = tidigEmployeeMap.get(employeeID);
      const isInTidig = !!tidigEmployee;
      const isCurrentlyActive = localUser.status === 'active';
      const isCurrentlyInactive = localUser.status === 'inactive';

      // Case 1: User returned to Tidig after being inactive (T051-T052)
      if (isCurrentlyInactive && isInTidig) {
        const reactivatedUser = this.reactivateUser(localUser, tidigEmployee);
        reactivatedUsers.push(reactivatedUser);
      }
      // Case 2: User disappeared from Tidig (T046-T047)
      else if (isCurrentlyActive && !isInTidig) {
        const inactivatedUser = this.markUserInactive(localUser);
        inactivatedUsers.push(inactivatedUser);
      }
    }

    return { inactivatedUsers, reactivatedUsers };
  }

  /**
   * Mark a user as inactive (T047).
   * Preserves all user data, only changes status and updates syncStatus.
   * 
   * @param user - User to mark as inactive
   * @returns Updated user with status='inactive'
   */
  private markUserInactive(user: User): User {
    const now = new Date().toISOString();
    
    return {
      ...user,
      status: 'inactive',
      syncStatus: {
        ...user.syncStatus,
        lastSyncedAt: now,
        inactivatedAt: now,
      },
    };
  }

  /**
   * Reactivate a user that returned to Tidig (T052).
   * Updates Tidig fields, preserves local fields, sets status='active'.
   * 
   * @param localUser - Inactive user from local database
   * @param tidigEmployee - Employee data from Tidig API
   * @returns Reactivated user with merged data
   */
  private reactivateUser(localUser: User, tidigEmployee: NormalizedEmployee): User {
    const now = new Date().toISOString();
    
    // Merge Tidig data with local data (preserves local fields)
    const mergedUser = mergeUserData(tidigEmployee, localUser);
    
    return {
      ...mergedUser,
      status: 'active',
      syncStatus: {
        ...mergedUser.syncStatus,
        lastSyncedAt: now,
        wasInactive: true,  // Flag indicating user was previously inactive
        reactivatedAt: now,
      },
    };
  }

  /**
   * Create a sync log entry
   */
  private createSyncLog(
    syncId: string,
    startTime: number,
    duration: number,
    status: SyncLog['status'],
    usersProcessed: number,
    usersAdded: number,
    usersUpdated: number,
    usersInactivated: number,
    usersReactivated: number,
    errors: SyncError[],
    warnings: SyncWarning[]
  ): SyncLog {
    return {
      syncId,
      timestamp: new Date(startTime).toISOString(),
      duration,
      status,
      usersProcessed,
      usersAdded,
      usersUpdated,
      usersInactivated,
      usersReactivated,
      errors,
      warnings,
    };
  }
}

// Export singleton instance
export default new SyncService();
