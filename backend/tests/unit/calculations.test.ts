import { describe, it, expect } from "vitest";
import {
  computeRevenueApprox,
  computeCostApprox,
  computeMargin,
  computeUtilization,
  buildConsultantMonthlySummary,
  buildTeamSummary
} from "../../src/domain/calculations";
import type { Consultant } from "../../src/domain/consultant";
import type { MonthlyEntry } from "../../src/domain/monthlyEntry";

const baseConsultant: Consultant = {
  id: "c1",
  name: "Alice",
  salaryMonthly: 50000,
  hourlyRate: 100,
  status: "active"
};

const baseEntry: MonthlyEntry = {
  consultantId: "c1",
  month: "2026-03",
  billableHours: 80,
  nonBillableHours: 40
};

describe("calculations", () => {
  it("computes revenue approximation from hourly rate and billable hours", () => {
    const revenue = computeRevenueApprox(baseConsultant, baseEntry);
    expect(revenue).toBe(8000);
  });

  it("computes cost approximation from salary when available", () => {
    const cost = computeCostApprox(baseConsultant, baseEntry);
    expect(cost).toBe(50000);
  });

  it("falls back to hourly-based cost approximation when salary is zero", () => {
    const contractor: Consultant = { ...baseConsultant, salaryMonthly: 0 };
    const entry: MonthlyEntry = { ...baseEntry, billableHours: 10, nonBillableHours: 10 };

    const cost = computeCostApprox(contractor, entry);
    // (billable + non-billable) * hourlyRate * 0.5
    expect(cost).toBe(20 * contractor.hourlyRate * 0.5);
  });

  it("computes margin as revenue minus cost", () => {
    const revenue = 2000;
    const cost = 1500;
    expect(computeMargin(revenue, cost)).toBe(500);
  });

  it("computes utilization with clamping and handles zero hours", () => {
    const zeroHours: MonthlyEntry = { ...baseEntry, billableHours: 0, nonBillableHours: 0 };
    expect(computeUtilization(zeroHours)).toBe(0);

    const normal: MonthlyEntry = { ...baseEntry, billableHours: 80, nonBillableHours: 80 };
    expect(computeUtilization(normal)).toBeCloseTo(1, 5);

    const overFull: MonthlyEntry = { ...baseEntry, billableHours: 200, nonBillableHours: 0 };
    expect(computeUtilization(overFull)).toBe(1);
  });

  it("builds consultant monthly summary with derived metrics", () => {
    const summary = buildConsultantMonthlySummary(baseConsultant, baseEntry);
    expect(summary.consultant.id).toBe("c1");
    expect(summary.month).toBe("2026-03");
    expect(summary.billableHours).toBe(baseEntry.billableHours);
    expect(summary.nonBillableHours).toBe(baseEntry.nonBillableHours);
    expect(summary.revenueApprox).toBeGreaterThan(0);
    expect(summary.costApprox).toBeGreaterThan(0);
  });

  it("builds team summary aggregating consultant summaries", () => {
    const consultantB: Consultant = { ...baseConsultant, id: "c2", name: "Bob" };
    const entryA: MonthlyEntry = { ...baseEntry };
    const entryB: MonthlyEntry = {
      consultantId: "c2",
      month: "2026-03",
      billableHours: 40,
      nonBillableHours: 20
    };

    const summary = buildTeamSummary("2026-03", [baseConsultant, consultantB], [
      entryA,
      entryB
    ]);

    expect(summary.month).toBe("2026-03");
    expect(summary.consultants).toHaveLength(2);
    expect(summary.totalRevenueApprox).toBeGreaterThan(0);
    expect(summary.totalCostApprox).toBeGreaterThan(0);
    expect(summary.totalMargin).toBeCloseTo(
      summary.totalRevenueApprox - summary.totalCostApprox,
      5
    );
  });
});
