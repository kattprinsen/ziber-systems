export type ConsultantStatus = "active" | "inactive";

export interface Consultant {
  id: string;
  name: string;
  salaryMonthly: number; // in base currency per month
  hourlyRate: number; // billable hourly rate
  status: ConsultantStatus;
  notes?: string;
}
