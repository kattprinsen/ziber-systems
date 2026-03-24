import type { TeamSummary } from "../services/apiClient";

export function renderConsultantTable(summary: TeamSummary | null): string {
  if (!summary || summary.consultants.length === 0) {
    return `
      <div class="text-sm text-slate-400">
        No data for this month yet. Enter hours and save to see metrics.
      </div>
    `;
  }

  const rows = summary.consultants
    .map((row) => {
      const utilizationPercent = Math.round(row.utilization * 100);
      return `
        <tr class="border-b border-slate-800 last:border-0">
          <td class="px-3 py-2 text-sm text-slate-100">${row.consultant.name}</td>
          <td class="px-3 py-2 text-right text-sm text-slate-200">${row.billableHours.toFixed(
            1
          )}</td>
          <td class="px-3 py-2 text-right text-sm text-slate-400">${row.nonBillableHours.toFixed(
            1
          )}</td>
          <td class="px-3 py-2 text-right text-sm text-slate-200">${row.revenueApprox.toFixed(
            0
          )}</td>
          <td class="px-3 py-2 text-right text-sm text-slate-200">${row.costApprox.toFixed(
            0
          )}</td>
          <td class="px-3 py-2 text-right text-sm ${
            row.margin >= 0 ? "text-emerald-400" : "text-rose-400"
          }">${row.margin.toFixed(0)}</td>
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
            <th class="px-3 py-2 font-medium">Consultant</th>
            <th class="px-3 py-2 font-medium text-right">Billable h</th>
            <th class="px-3 py-2 font-medium text-right">Non-billable h</th>
            <th class="px-3 py-2 font-medium text-right">Revenue</th>
            <th class="px-3 py-2 font-medium text-right">Cost</th>
            <th class="px-3 py-2 font-medium text-right">Margin</th>
            <th class="px-3 py-2 font-medium text-right">Utilization</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}
