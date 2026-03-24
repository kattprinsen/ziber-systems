import type { Consultant } from "./consultant";
import type { MonthlyEntry } from "./monthlyEntry";
import type { ConsultantMonthlySummary, TeamSummary } from "./teamSummary";

const HOURS_PER_MONTH = 160;

export function computeRevenueApprox(consultant: Consultant, entry: MonthlyEntry): number {
  return entry.billableHours * consultant.hourlyRate;
}

export function computeCostApprox(consultant: Consultant, entry: MonthlyEntry): number {
  // Simple approximation: use fixed monthly salary; if missing, approximate from hourly rate
  if (consultant.salaryMonthly > 0) {
    return consultant.salaryMonthly;
  }
  return (entry.billableHours + entry.nonBillableHours) * consultant.hourlyRate * 0.5;
}

export function computeMargin(revenue: number, cost: number): number {
  return revenue - cost;
}

export function computeUtilization(entry: MonthlyEntry): number {
  const total = entry.billableHours + entry.nonBillableHours;
  if (total <= 0 || HOURS_PER_MONTH <= 0) {
    return 0;
  }
  return Math.min(1, total / HOURS_PER_MONTH);
}

export function buildConsultantMonthlySummary(
  consultant: Consultant,
  entry: MonthlyEntry
): ConsultantMonthlySummary {
  const revenueApprox = computeRevenueApprox(consultant, entry);
  const costApprox = computeCostApprox(consultant, entry);
  const margin = computeMargin(revenueApprox, costApprox);
  const utilization = computeUtilization(entry);

  return {
    consultant,
    month: entry.month,
    billableHours: entry.billableHours,
    nonBillableHours: entry.nonBillableHours,
    revenueApprox,
    costApprox,
    margin,
    utilization
  };
}

export function buildTeamSummary(
  month: string,
  consultants: Consultant[],
  entries: MonthlyEntry[]
): TeamSummary {
  const summaries: ConsultantMonthlySummary[] = [];

  for (const consultant of consultants) {
    const entry = entries.find(
      (e) => e.consultantId === consultant.id && e.month === month
    );
    if (!entry) continue;

    summaries.push(buildConsultantMonthlySummary(consultant, entry));
  }

  let totalRevenueApprox = 0;
  let totalCostApprox = 0;
  let totalMargin = 0;
  let utilizationSum = 0;

  for (const s of summaries) {
    totalRevenueApprox += s.revenueApprox;
    totalCostApprox += s.costApprox;
    totalMargin += s.margin;
    utilizationSum += s.utilization;
  }

  const averageUtilization = summaries.length
    ? utilizationSum / summaries.length
    : 0;

  return {
    month,
    consultants: summaries,
    totalRevenueApprox,
    totalCostApprox,
    totalMargin,
    averageUtilization
  };
}
