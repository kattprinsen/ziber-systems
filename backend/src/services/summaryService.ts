import type { Consultant } from "../domain/consultant";
import type { MonthlyEntry } from "../domain/monthlyEntry";
import { buildTeamSummary } from "../domain/calculations";
import type { TeamSummary, TeamTrend } from "../domain/teamSummary";
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

  async getThreeMonthTrend(endMonth: string): Promise<TeamTrend> {
    const months = buildThreeMonthWindow(endMonth);

    const summaries = await Promise.all(
      months.map((month) => this.getSummaryForMonth(month))
    );

    const points = summaries
      .map((summary, index) => ({ month: months[index], summary }))
      .filter((point) => point.summary.consultants.length > 0);

    return { points };
  }
}

function buildThreeMonthWindow(endMonth: string): string[] {
  if (!/^\d{4}-\d{2}$/.test(endMonth)) {
    throw new Error("endMonth must be in format YYYY-MM");
  }

  const [yearStr, monthStr] = endMonth.split("-");
  let year = Number(yearStr);
  let month = Number(monthStr); // 1-12

  const result: string[] = [];

  for (let offset = 2; offset >= 0; offset--) {
    let y = year;
    let m = month - offset;

    while (m <= 0) {
      m += 12;
      y -= 1;
    }

    const monthLabel = `${y}-${String(m).padStart(2, "0")}`;
    result.push(monthLabel);
  }

  return result;
}
