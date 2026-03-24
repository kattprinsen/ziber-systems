import {
  getMonthlySummary,
  upsertEntry,
  type TeamSummary,
  type UpsertEntryPayload
} from "../services/apiClient";
import { renderConsultantTable } from "../components/ConsultantTable";
import { renderTeamSummary } from "../components/TeamSummary";

interface SimpleConsultant {
  id: string;
  name: string;
}

const DEMO_CONSULTANTS: SimpleConsultant[] = [
  { id: "c1", name: "Alice" },
  { id: "c2", name: "Bob" },
  { id: "c3", name: "Charlie" }
];

function getCurrentMonthValue(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function renderDashboardPage(): string {
  const month = getCurrentMonthValue();

  const rows = DEMO_CONSULTANTS.map((c) => {
    return `
      <tr class="border-b border-slate-800 last:border-0">
        <td class="px-3 py-2 text-sm text-slate-100">${c.name}</td>
        <td class="px-3 py-2 text-right">
          <input
            type="number"
            min="0"
            step="0.5"
            class="w-24 rounded bg-slate-900/70 px-2 py-1 text-right text-sm text-slate-100 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-accent-amber"
            name="billable-${c.id}"
          />
        </td>
        <td class="px-3 py-2 text-right">
          <input
            type="number"
            min="0"
            step="0.5"
            class="w-24 rounded bg-slate-900/70 px-2 py-1 text-right text-sm text-slate-100 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-accent-amber"
            name="nonbillable-${c.id}"
          />
        </td>
      </tr>
    `;
  }).join("");

  return `
    <div class="space-y-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="text-sm font-medium text-slate-100">
            Monthly hours and summary
          </div>
          <div class="text-xs text-slate-400">
            Select a month, enter hours per consultant, then save to see metrics.
          </div>
        </div>
        <div class="flex items-center gap-2">
          <label class="text-xs uppercase tracking-wide text-slate-400" for="month-input">
            Month
          </label>
          <input
            id="month-input"
            type="month"
            value="${month}"
            class="rounded bg-slate-900/70 px-2 py-1 text-sm text-slate-100 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-accent-amber"
          />
        </div>
      </div>

      <form id="monthly-hours-form" class="space-y-4">
        <div class="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/60">
          <table class="min-w-full text-left text-xs">
            <thead class="bg-slate-900/80 text-slate-400">
              <tr>
                <th class="px-3 py-2 font-medium">Consultant</th>
                <th class="px-3 py-2 font-medium text-right">Billable h</th>
                <th class="px-3 py-2 font-medium text-right">Non-billable h</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
        <div class="flex justify-end">
          <button
            type="submit"
            class="inline-flex items-center gap-2 rounded bg-accent-amber px-4 py-1.5 text-sm font-medium text-slate-950 shadow hover:bg-accent-yellow focus:outline-none focus:ring-2 focus:ring-accent-amber/70"
          >
            Save hours
          </button>
        </div>
      </form>

      <div class="grid gap-4 md:grid-cols-3" id="summary-section">
        <div class="md:col-span-2 space-y-2">
          <div class="text-xs uppercase tracking-wide text-slate-500">
            Per-consultant metrics
          </div>
          <div id="consultant-table-root">
            ${renderConsultantTable(null)}
          </div>
        </div>
        <div class="space-y-2">
          <div class="text-xs uppercase tracking-wide text-slate-500">
            Team summary
          </div>
          <div class="rounded-lg border border-slate-800 bg-slate-900/60 p-3" id="team-summary-root">
            ${renderTeamSummary(null)}
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initDashboardPage(): void {
  const monthInput = document.getElementById("month-input") as
    | HTMLInputElement
    | null;
  const form = document.getElementById("monthly-hours-form") as
    | HTMLFormElement
    | null;

  async function refreshSummary(month: string): Promise<void> {
    const tableRoot = document.getElementById("consultant-table-root");
    const teamRoot = document.getElementById("team-summary-root");
    if (!tableRoot || !teamRoot) return;

    const tableEl: HTMLElement = tableRoot;
    const teamEl: HTMLElement = teamRoot;

    try {
      const summary = await getMonthlySummary(month);
      renderSummaryInto(summary);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to load monthly summary", err);
      renderSummaryInto(null);
    }

    function renderSummaryInto(summary: TeamSummary | null) {
      tableEl.innerHTML = renderConsultantTable(summary);
      teamEl.innerHTML = renderTeamSummary(summary);
    }
  }

  if (form && monthInput) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const month = monthInput.value || getCurrentMonthValue();

      const payloads: UpsertEntryPayload[] = [];

      for (const c of DEMO_CONSULTANTS) {
        const billableInput = form.elements.namedItem(
          `billable-${c.id}`
        ) as HTMLInputElement | null;
        const nonBillableInput = form.elements.namedItem(
          `nonbillable-${c.id}`
        ) as HTMLInputElement | null;

        const billable = billableInput?.value ? Number(billableInput.value) : 0;
        const nonBillable = nonBillableInput?.value
          ? Number(nonBillableInput.value)
          : 0;

        if (billable < 0 || nonBillable < 0) {
          continue;
        }

        if (billable === 0 && nonBillable === 0) {
          continue;
        }

        payloads.push({
          consultantId: c.id,
          month,
          billableHours: billable,
          nonBillableHours: nonBillable
        });
      }

      try {
        await Promise.all(payloads.map((p) => upsertEntry(p)));
        await refreshSummary(month);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to save monthly entries", err);
      }
    });

    monthInput.addEventListener("change", () => {
      const month = monthInput.value || getCurrentMonthValue();
      void refreshSummary(month);
    });

    const initialMonth = monthInput.value || getCurrentMonthValue();
    void refreshSummary(initialMonth);
  }
}
