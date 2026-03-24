import type { MonthlyEntry } from "../../domain/monthlyEntry";

export interface MonthlyEntryRepository {
  listByMonth(month: string): Promise<MonthlyEntry[]>;
  listByConsultant(consultantId: string): Promise<MonthlyEntry[]>;
  upsert(entry: MonthlyEntry): Promise<void>;
}
