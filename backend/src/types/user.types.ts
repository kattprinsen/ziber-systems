export interface User {
  id: string;
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
