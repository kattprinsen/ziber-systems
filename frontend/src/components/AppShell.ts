export type AppPage = "dashboard" | "consultants";

export function renderAppShell(
  contentHtml: string,
  activePage: AppPage = "dashboard"
): string {
  const dashboardClasses = [
    "rounded",
    "px-3",
    "py-1.5",
    "text-xs",
    "font-medium",
    activePage === "dashboard"
      ? "bg-accent-amber text-slate-950 shadow"
      : "bg-slate-900/60 text-slate-200 border border-slate-700 hover:bg-slate-800"
  ].join(" ");

  const consultantsClasses = [
    "rounded",
    "px-3",
    "py-1.5",
    "text-xs",
    "font-medium",
    activePage === "consultants"
      ? "bg-accent-amber text-slate-950 shadow"
      : "bg-slate-900/60 text-slate-200 border border-slate-700 hover:bg-slate-800"
  ].join(" ");

  return `
    <div class="app-shell">
      <header class="app-header">
            <h1 class="app-title">Consultant Analysis</h1>
        <div class="mt-1 text-xs text-slate-400">MVP dashboard &amp; tools</div>
        <nav class="mt-4 flex gap-2">
          <button type="button" data-page="dashboard" class="${dashboardClasses}">
            Dashboard
          </button>
          <button type="button" data-page="consultants" class="${consultantsClasses}">
            Consultants
          </button>
        </nav>
      </header>
      <main class="app-main">
            <div class="max-w-5xl mx-auto">
              <div class="card">${contentHtml}</div>
            </div>
      </main>
    </div>
  `;
}
