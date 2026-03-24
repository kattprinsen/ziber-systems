export interface MonthlyEntry {
  consultantId: string;
  month: string; // YYYY-MM
  billableHours: number;
  nonBillableHours: number;
  notes?: string;
}
