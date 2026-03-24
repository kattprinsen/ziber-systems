import type { Consultant } from "../domain/consultant";
import type { MonthlyEntry } from "../domain/monthlyEntry";
import { buildTeamSummary } from "../domain/calculations";
import type { TeamSummary } from "../domain/teamSummary";
import type { ConsultantRepository } from "../storage/repositories/consultantRepository";
import type { MonthlyEntryRepository } from "../storage/repositories/monthlyEntryRepository";

export class SummaryService {
  constructor(
    private readonly consultants: ConsultantRepository,
    private readonly entries: MonthlyEntryRepository
  ) {}

  async getSummaryForMonth(month: string): Promise<TeamSummary> {
    const [consultants, entries] = await Promise.all([
      this.consultants.listAll(),
      this.entries.listByMonth(month)
    ]);

    return buildTeamSummary(month, consultants, entries);
  }
}
