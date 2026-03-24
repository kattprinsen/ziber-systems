import type { MonthlyEntry } from "../domain/monthlyEntry";
import type { MonthlyEntryRepository } from "../storage/repositories/monthlyEntryRepository";

export class EntryService {
  constructor(private readonly repo: MonthlyEntryRepository) {}

  listByMonth(month: string): Promise<MonthlyEntry[]> {
    return this.repo.listByMonth(month);
  }

  listByConsultant(consultantId: string): Promise<MonthlyEntry[]> {
    return this.repo.listByConsultant(consultantId);
  }

  async upsert(entry: MonthlyEntry): Promise<void> {
    await this.repo.upsert(entry);
  }
}
