import { describe, it, expect } from "vitest";
import { EntryService } from "../../src/services/entryService";
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

describe("Entries and summary integration", () => {
  const consultants: Consultant[] = [
    {
      id: "c1",
      name: "Alice",
      salaryMonthly: 50000,
      hourlyRate: 100,
      status: "active"
    }
  ];

  const consultantRepo = new InMemoryConsultantRepository([...consultants]);
  const entryRepo = new InMemoryMonthlyEntryRepository([]);

  const entryService = new EntryService(entryRepo);
  const summaryService = new SummaryService(consultantRepo, entryRepo);

  it("allows creating entries and retrieving a monthly summary", async () => {
    await entryService.upsert({
      consultantId: "c1",
      month: "2026-03",
      billableHours: 80,
      nonBillableHours: 20
    });

    const summary = await summaryService.getSummaryForMonth("2026-03");

    expect(summary.consultants).toHaveLength(1);
    const row = summary.consultants[0];
    expect(row.consultant.id).toBe("c1");
    expect(row.billableHours).toBe(80);
    expect(row.nonBillableHours).toBe(20);
  });
});
