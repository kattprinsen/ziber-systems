import "./styles/tailwind.css";
import { renderAppShell } from "./components/AppShell";
import { initDashboardPage, renderDashboardPage } from "./pages/DashboardPage";

const root = document.getElementById("app");

if (root) {
  const content = renderDashboardPage();
  root.innerHTML = renderAppShell(content);
  initDashboardPage();
}
