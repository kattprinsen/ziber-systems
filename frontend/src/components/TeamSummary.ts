import type { TeamSummary as TeamSummaryType } from "../services/apiClient";

export function renderTeamSummary(summary: TeamSummaryType | null): string {
  if (!summary) {
    return `
      <div class="text-sm text-slate-400">
        No summary available yet.
      </div>
    `;
  }

  const utilizationPercent = Math.round(summary.averageUtilization * 100);

  return `
    <div class="grid grid-cols-2 gap-4 text-sm">
      <div>
        <div class="text-xs uppercase tracking-wide text-slate-500">
          Total revenue
        </div>
        <div class="text-lg font-semibold text-accent-amber">${summary.totalRevenueApprox.toFixed(
          0
        )}</div>
      </div>
      <div>
        <div class="text-xs uppercase tracking-wide text-slate-500">
          Total cost
        </div>
        <div class="text-lg font-semibold text-slate-100">${summary.totalCostApprox.toFixed(
          0
        )}</div>
      </div>
      <div>
        <div class="text-xs uppercase tracking-wide text-slate-500">
          Total margin
        </div>
        <div class="text-lg font-semibold ${
          summary.totalMargin >= 0 ? "text-emerald-400" : "text-rose-400"
        }">${summary.totalMargin.toFixed(0)}</div>
      </div>
      <div>
        <div class="text-xs uppercase tracking-wide text-slate-500">
          Avg utilization
        </div>
        <div class="text-lg font-semibold text-slate-100">${utilizationPercent}%</div>
      </div>
    </div>
  `;
}
