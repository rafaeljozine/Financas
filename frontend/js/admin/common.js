import { getConfiguration, initializeData } from "../api.js";
import { escapeHtml, pageUrl, showToast } from "../main.js";
import { logout, requireAuth } from "./auth.js";

export { escapeHtml, pageUrl, showToast };

export const adminRoot = new URL("../../pages/admin/", import.meta.url);
export const adminPageUrl = (file) => new URL(file, adminRoot).href;

function activePage() { return window.location.pathname.split("/").pop(); }

export function renderAdminShell(title) {
  initializeData();
  if (!requireAuth()) return false;
  const configuration = getConfiguration();
  const logo = configuration.logo || pageUrl("assets/images/logo/logo-transparente.png");
  const sidebar = document.querySelector("[data-admin-sidebar]");
  const topbar = document.querySelector("[data-admin-topbar]");
  const items = [
    ["dashboard.html", "Dashboard"], ["produtos.html", "Produtos"], ["categorias.html", "Categorias"],
    ["promocoes.html", "Promoções"], ["marcacoes.html", "Marcações"], ["horarios.html", "Horários"],
    ["configuracoes.html", "Configurações"],
  ];
  sidebar.className = "admin-sidebar";
  sidebar.innerHTML = `<a class="admin-brand" href="${adminPageUrl("dashboard.html")}"><img src="${escapeHtml(logo)}" alt="${escapeHtml(configuration.nomeOptica)}"></a><nav class="admin-nav" aria-label="Navegação administrativa">${items.map(([file, label]) => `<a href="${adminPageUrl(file)}"${activePage() === file ? ' aria-current="page"' : ""}>${label}</a>`).join("")}</nav><div class="admin-sidebar-footer"><button class="admin-logout" type="button" data-admin-logout>Terminar sessão</button></div>`;
  topbar.className = "admin-topbar";
  topbar.innerHTML = `<div style="display:flex;align-items:center;gap:12px"><button class="icon-button admin-menu-toggle" type="button" aria-label="Abrir menu" aria-expanded="false" data-admin-menu>Menu</button><h1>${escapeHtml(title)}</h1></div><div class="admin-topbar-actions"><a class="admin-view-site" href="${pageUrl("index.html")}" target="_blank">Abrir website</a><span class="admin-avatar" aria-label="Administrador">OE</span></div>`;
  topbar.querySelector("[data-admin-menu]").addEventListener("click", (event) => {
    const open = sidebar.classList.toggle("is-open");
    event.currentTarget.setAttribute("aria-expanded", String(open));
  });
  sidebar.querySelector("[data-admin-logout]").addEventListener("click", () => {
    logout();
    window.location.replace(adminPageUrl("login.html"));
  });
  return true;
}

export function openModal({ title, body, submitLabel = "Guardar", onSubmit, size = "" }) {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = `<section class="modal ${size}" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-header"><h2 id="modal-title">${escapeHtml(title)}</h2><button class="icon-button" type="button" aria-label="Fechar" data-modal-close>×</button></div><form data-modal-form><div class="modal-body">${body}</div><div class="modal-footer"><button class="btn btn-secondary" type="button" data-modal-close>Cancelar</button><button class="btn btn-primary" type="submit">${escapeHtml(submitLabel)}</button></div></form></section>`;
  const close = () => { backdrop.remove(); document.body.style.overflow = ""; };
  backdrop.querySelectorAll("[data-modal-close]").forEach((button) => button.addEventListener("click", close));
  backdrop.addEventListener("click", (event) => { if (event.target === backdrop) close(); });
  backdrop.addEventListener("keydown", (event) => { if (event.key === "Escape") close(); });
  backdrop.querySelector("[data-modal-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    try { const result = await onSubmit(event.currentTarget, close); if (result !== false) close(); }
    catch (error) { showToast(error.message, "error"); }
  });
  document.body.append(backdrop);
  document.body.style.overflow = "hidden";
  backdrop.querySelector("input, select, textarea, button")?.focus();
  return backdrop;
}

export function confirmAction(message) {
  return window.confirm(message);
}

export function statusBadge(status) {
  const type = status === "Confirmada" || status === "Concluída" ? "success" : status === "Pendente" ? "warning" : "muted";
  return `<span class="badge badge-${type}">${escapeHtml(status)}</span>`;
}
