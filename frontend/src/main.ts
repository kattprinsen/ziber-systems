import "./styles/tailwind.css";
import { renderAppShell, type AppPage } from "./components/AppShell";
import { initDashboardPage, renderDashboardPage } from "./pages/DashboardPage";
import {
  initConsultantsPage,
  renderConsultantsPage
} from "./pages/ConsultantsPage";

const root = document.getElementById("app");

function renderPage(page: AppPage): void {
  if (!root) return;

  const content =
    page === "dashboard" ? renderDashboardPage() : renderConsultantsPage();

  root.innerHTML = renderAppShell(content, page);

  if (page === "dashboard") {
    initDashboardPage();
  } else {
    initConsultantsPage();
  }

  root
    .querySelectorAll<HTMLButtonElement>("[data-page]")
    .forEach((button) => {
      const target = button.getAttribute("data-page") as AppPage | null;
      if (!target) return;
      button.addEventListener("click", () => {
        renderPage(target);
      });
    });
}

renderPage("dashboard");
