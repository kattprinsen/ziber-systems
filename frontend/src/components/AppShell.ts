export function renderAppShell(contentHtml: string): string {
  return `
    <div class="app-shell">
      <header class="app-header">
        <h1 class="app-title">Consultant Bookkeeping</h1>
        <div class="text-xs text-slate-400">MVP Dashboard</div>
      </header>
      <main class="app-main">
        <div class="card">${contentHtml}</div>
      </main>
    </div>
  `;
}
