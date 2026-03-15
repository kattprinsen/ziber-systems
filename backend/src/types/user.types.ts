export interface SyncStatus {
  lastSyncedAt?: string;  // ISO timestamp of last successful sync
  source?: 'tidig' | 'manual';  // Origin of the user data
  wasInactive?: boolean;  // Flag indicating if user was previously inactive
  inactivatedAt?: string;  // ISO timestamp when user was marked inactive
  reactivatedAt?: string;  // ISO timestamp when user was reactivated
}

export interface User {
  id: string;
  employeeID?: string;  // Tidig employee ID (e.g., "SBQ") - used for sync matching
  externalId?: string;  // Optional explicit external employee identifier (mirrors Tidig empId when present)
  name: string;
  email: string;
  role: string;
  department: string;
  avatar?: string;
  phone?: string;
  joinedDate: string;
  status: 'active' | 'inactive' | 'on-leave';
  bio?: string;
  skills?: string[];
  location?: string;
  currentSalary?: number;
  salaryHistory?: SalaryHistoryEntry[];
  syncStatus?: SyncStatus;  // Synchronization metadata
  hourlyRate?: number;  // Sales price in SEK/hour charged to clients
  /**
   * Manually maintained hours per calendar month (YYYY-MM → hours).
   * Used for SBQ group performance calculations on the home page.
   */
  monthlyHours?: Record<string, number>;
}

export interface SalaryHistoryEntry {
  salary: number;
  effectiveDate: string;
  updatedBy?: string;
  notes?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: string[];
}
