export interface User {
  id: string;
  employeeID?: string;  // Tidig employee ID — present in backend/users.json; added here for feature 006
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
  hourlyRate?: number;  // Sales price in SEK/hour charged to clients
  salaryHistory?: SalaryHistoryEntry[];
  /**
   * Manually maintained hours per calendar month (YYYY-MM → hours).
   * Mirrors backend/src/types/user.types.ts and backend/src/data/users.json.
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
