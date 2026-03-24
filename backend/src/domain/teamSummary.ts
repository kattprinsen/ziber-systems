import type { MonthlyEntry } from "./monthlyEntry";
import type { Consultant } from "./consultant";

export interface ConsultantMonthlySummary {
  consultant: Consultant;
  month: string;
  billableHours: number;
  nonBillableHours: number;
  revenueApprox: number;
  costApprox: number;
  margin: number;
  utilization: number; // 0-1
}

export interface TeamSummary {
  month: string;
  consultants: ConsultantMonthlySummary[];
  totalRevenueApprox: number;
  totalCostApprox: number;
  totalMargin: number;
  averageUtilization: number; // 0-1
}

export interface TeamTrendPoint {
  month: string;
  summary: TeamSummary;
}

export interface TeamTrend {
  points: TeamTrendPoint[];
}
