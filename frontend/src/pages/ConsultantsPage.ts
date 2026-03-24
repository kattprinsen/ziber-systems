import {
  getConsultants,
  upsertConsultant,
  updateConsultantStatus,
  type ConsultantDto
} from "../services/apiClient";

function renderTableRows(consultants: ConsultantDto[]): string {
  if (consultants.length === 0) {
    return `
      <tr>
        <td colspan="5" class="px-3 py-3 text-center text-sm text-slate-400">
          No consultants defined yet.
        </td>
      </tr>
    `;
  }

  return consultants
    .map((c) => {
      return `
        <tr class="border-b border-slate-800 last:border-0">
          <td class="px-3 py-2 text-sm text-slate-100">${c.name}</td>
          <td class="px-3 py-2 text-right text-sm text-slate-200">${c.salaryMonthly.toFixed(
            0
          )}</td>
          <td class="px-3 py-2 text-right text-sm text-slate-200">${c.hourlyRate.toFixed(
            0
          )}</td>
          <td class="px-3 py-2 text-sm ${
            c.status === "active" ? "text-emerald-400" : "text-slate-500"
          }">${c.status}</td>
          <td class="px-3 py-2 text-right text-xs">
            <button
              type="button"
              data-id="${c.id}"
              data-status-toggle
              class="rounded border border-slate-700 px-2 py-1 text-xs text-slate-100 hover:bg-slate-800"
            >
              ${c.status === "active" ? "Inactivate" : "Activate"}
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
}

export function renderConsultantsPage(): string {
  return `
    <div class="space-y-6">
      <div>
        <div class="text-sm font-medium text-slate-100">Consultants</div>
        <div class="text-xs text-slate-400">
          Manage consultants and their salary/hourly rate. Inactivated consultants stay in history but will not appear in new months.
        </div>
      </div>

      <div class="grid gap-6 md:grid-cols-2">
        <div class="space-y-3">
          <div class="text-xs uppercase tracking-wide text-slate-500">
            List
          </div>
          <div class="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/60">
            <table class="min-w-full text-left text-xs">
              <thead class="bg-slate-900/80 text-slate-400">
                <tr>
                  <th class="px-3 py-2 font-medium">Name</th>
                  <th class="px-3 py-2 font-medium text-right">Salary (month)</th>
                  <th class="px-3 py-2 font-medium text-right">Hourly rate</th>
                  <th class="px-3 py-2 font-medium">Status</th>
                  <th class="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody id="consultants-table-body">
                <!-- filled by initConsultantsPage -->
              </tbody>
            </table>
          </div>
        </div>

        <div class="space-y-3">
          <div class="text-xs uppercase tracking-wide text-slate-500">
            Add / update
          </div>
          <form id="consultant-form" class="space-y-3">
            <input type="hidden" name="id" />
            <div class="space-y-1">
              <label class="block text-xs text-slate-400" for="consultant-name">
                Name
              </label>
              <input
                id="consultant-name"
                name="name"
                type="text"
                class="w-full rounded bg-slate-900/70 px-2 py-1 text-sm text-slate-100 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-accent-amber"
                required
              />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="block text-xs text-slate-400" for="consultant-salary">
                  Salary / month
                </label>
                <input
                  id="consultant-salary"
                  name="salaryMonthly"
                  type="number"
                  min="0"
                  step="1000"
                  class="w-full rounded bg-slate-900/70 px-2 py-1 text-sm text-slate-100 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-accent-amber"
                />
              </div>
              <div class="space-y-1">
                <label class="block text-xs text-slate-400" for="consultant-hourly">
                  Hourly rate
                </label>
                <input
                  id="consultant-hourly"
                  name="hourlyRate"
                  type="number"
                  min="0"
                  step="50"
                  class="w-full rounded bg-slate-900/70 px-2 py-1 text-sm text-slate-100 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-accent-amber"
                />
              </div>
            </div>
            <div class="space-y-1">
              <label class="block text-xs text-slate-400" for="consultant-status">
                Status
              </label>
              <select
                id="consultant-status"
                name="status"
                class="w-full rounded bg-slate-900/70 px-2 py-1 text-sm text-slate-100 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-accent-amber"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="block text-xs text-slate-400" for="consultant-notes">
                Notes
              </label>
              <textarea
                id="consultant-notes"
                name="notes"
                rows="2"
                class="w-full rounded bg-slate-900/70 px-2 py-1 text-sm text-slate-100 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-accent-amber"
              ></textarea>
            </div>
            <div class="flex justify-end gap-2">
              <button
                type="submit"
                class="rounded bg-accent-amber px-4 py-1.5 text-sm font-medium text-slate-950 shadow hover:bg-accent-yellow focus:outline-none focus:ring-2 focus:ring-accent-amber/70"
              >
                Save consultant
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

export function initConsultantsPage(): void {
  const tableBody = document.getElementById(
    "consultants-table-body"
  ) as HTMLTableSectionElement | null;
  const form = document.getElementById("consultant-form") as
    | HTMLFormElement
    | null;

  if (!tableBody || !form) return;

  async function loadAndRender(): Promise<void> {
    const body = tableBody;
    if (!body) return;

    try {
      const consultants = await getConsultants();
      body.innerHTML = renderTableRows(consultants);

      body.querySelectorAll<HTMLButtonElement>("[data-status-toggle]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          if (!id) return;
          const row = consultants.find((c) => c.id === id);
          if (!row) return;
          const nextStatus = row.status === "active" ? "inactive" : "active";
          await updateConsultantStatus(id, nextStatus as "active" | "inactive");
          await loadAndRender();
        });
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to load consultants", err);
      body.innerHTML = `
        <tr>
          <td colspan="5" class="px-3 py-3 text-center text-sm text-rose-400">
            Failed to load consultants.
          </td>
        </tr>
      `;
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const payload = {
      id: (formData.get("id") as string | null) || undefined,
      name: (formData.get("name") as string | null) ?? "",
      salaryMonthly: Number(formData.get("salaryMonthly") ?? 0) || 0,
      hourlyRate: Number(formData.get("hourlyRate") ?? 0) || 0,
      status:
        ((formData.get("status") as string | null) ?? "active") ===
        "inactive"
          ? ("inactive" as const)
          : ("active" as const),
      notes: (formData.get("notes") as string | null) ?? undefined
    };

    try {
      await upsertConsultant(payload);
      form.reset();
      await loadAndRender();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to save consultant", err);
    }
  });

  void loadAndRender();
}
