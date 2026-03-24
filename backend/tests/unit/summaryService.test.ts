import { describe, it, expect } from "vitest";
import { SummaryService } from "../../src/services/summaryService";
import type { Consultant } from "../../src/domain/consultant";
import type { MonthlyEntry } from "../../src/domain/monthlyEntry";
import type { ConsultantRepository } from "../../src/storage/repositories/consultantRepository";
import type { MonthlyEntryRepository } from "../../src/storage/repositories/monthlyEntryRepository";

class InMemoryConsultantRepository implements ConsultantRepository {
  constructor(private items: Consultant[]) {}

  async listAll(): Promise<Consultant[]> {
    return [...this.items];
  }

  async findById(id: string): Promise<Consultant | null> {
    return this.items.find((c) => c.id === id) ?? null;
  }

  async save(consultant: Consultant): Promise<void> {
    const index = this.items.findIndex((c) => c.id === consultant.id);
    if (index >= 0) {
      this.items[index] = consultant;
    } else {
      this.items.push(consultant);
    }
  }
}

class InMemoryMonthlyEntryRepository implements MonthlyEntryRepository {
  constructor(private items: MonthlyEntry[]) {}

  async listByMonth(month: string): Promise<MonthlyEntry[]> {
    return this.items.filter((e) => e.month === month);
  }

  async listByConsultant(consultantId: string): Promise<MonthlyEntry[]> {
    return this.items.filter((e) => e.consultantId === consultantId);
  }

  async upsert(entry: MonthlyEntry): Promise<void> {
    const index = this.items.findIndex(
      (e) => e.consultantId === entry.consultantId && e.month === entry.month
    );
    if (index >= 0) {
      this.items[index] = entry;
    } else {
      this.items.push(entry);
    }
  }
}

describe("SummaryService", () => {
  const consultants: Consultant[] = [
    {
      id: "c1",
      name: "Alice",
      salaryMonthly: 50000,
      hourlyRate: 100,
      status: "active"
    }
  ];

  const entries: MonthlyEntry[] = [
    {
      consultantId: "c1",
      month: "2026-01",
      billableHours: 80,
      nonBillableHours: 20
    },
    {
      consultantId: "c1",
      month: "2026-02",
      billableHours: 60,
      nonBillableHours: 40
    },
    {
      consultantId: "c1",
      month: "2026-03",
      billableHours: 70,
      nonBillableHours: 30
    }
  ];

  const consultantRepo = new InMemoryConsultantRepository([...consultants]);
  const entryRepo = new InMemoryMonthlyEntryRepository([...entries]);
  const service = new SummaryService(consultantRepo, entryRepo);

  it("returns a team summary for a specific month", async () => {
    const summary = await service.getSummaryForMonth("2026-02");
    expect(summary.month).toBe("2026-02");
    expect(summary.consultants).toHaveLength(1);
  });

  it("builds a three-month trend with consecutive months", async () => {
    const trend = await service.getThreeMonthTrend("2026-03");

    expect(trend.points.length).toBeGreaterThanOrEqual(3);
    const months = trend.points.map((p) => p.month);
    expect(months).toContain("2026-01");
    expect(months).toContain("2026-02");
    expect(months).toContain("2026-03");
  });
});
