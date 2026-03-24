import type { TeamTrend } from "../services/apiClient";

export function renderTrendView(trend: TeamTrend | null): string {
  if (!trend || !trend.points.length) {
    return `
      <div class="text-sm text-slate-400">
        No trend data available yet. Enter hours for at least three months to see a trend.
      </div>
    `;
  }

  const rows = trend.points
    .map((point) => {
      const summary = point.summary;
      const utilizationPercent = Math.round(summary.averageUtilization * 100);
      return `
        <tr class="border-b border-slate-800 last:border-0">
          <td class="px-3 py-2 text-sm text-slate-100">${point.month}</td>
          <td class="px-3 py-2 text-right text-sm text-slate-200">${summary.totalRevenueApprox.toFixed(
            0
          )}</td>
          <td class="px-3 py-2 text-right text-sm text-slate-200">${summary.totalCostApprox.toFixed(
            0
          )}</td>
          <td class="px-3 py-2 text-right text-sm ${
            summary.totalMargin >= 0 ? "text-emerald-400" : "text-rose-400"
          }">${summary.totalMargin.toFixed(0)}</td>
          <td class="px-3 py-2 text-right text-sm text-slate-200">${utilizationPercent}%</td>
        </tr>
      `;
    })
    .join("");

  return `
    <div class="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/60">
      <table class="min-w-full text-left text-xs">
        <thead class="bg-slate-900/80 text-slate-400">
          <tr>
            <th class="px-3 py-2 font-medium">Month</th>
            <th class="px-3 py-2 font-medium text-right">Revenue</th>
            <th class="px-3 py-2 font-medium text-right">Cost</th>
            <th class="px-3 py-2 font-medium text-right">Margin</th>
            <th class="px-3 py-2 font-medium text-right">Avg utilization</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}
