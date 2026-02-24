export interface TimeEntry {
  date: string;
  hours: number;
  customerId?: string | null;
  customerName?: string | null;
  projectId?: string | null;
  projectName?: string | null;
}

export interface TimeFilter {
  fromDate: string;
  toDate: string;
  customerId?: string;
  customerName?: string;
  projectId?: string;
  projectName?: string;
}

export interface CustomerTimeSummary {
  customerId: string | null;
  customerName: string | null;
  totalHours: number;
}

export interface ProjectTimeSummary {
  projectId: string | null;
  projectName: string | null;
  totalHours: number;
}

export interface TimeSummary {
  customers: CustomerTimeSummary[];
  projects: ProjectTimeSummary[];
}
