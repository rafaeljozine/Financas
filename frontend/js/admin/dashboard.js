import { formatMoney, getAppointments, getProductById, getProducts, getPromotions } from "../api.js";
import { escapeHtml, renderAdminShell, statusBadge } from "./common.js";

if (renderAdminShell("Dashboard")) {
  const products = getProducts();
  const promotions = getPromotions({ activeOnly: true });
  const appointments = getAppointments();
  const pending = appointments.filter((item) => item.estado === "Pendente");
  const stats = [
    ["Total de produtos", products.length, ""],
    ["Produtos disponíveis", products.filter((item) => item.disponivel).length, ""],
    ["Promoções activas", promotions.length, "accent"],
    ["Marcações pendentes", pending.length, "accent"],
  ];
  document.querySelector("[data-dashboard-stats]").innerHTML = stats.map(([label, value, accent]) => `<article class="stat-card ${accent}"><span>${label}</span><strong>${value}</strong></article>`).join("");

  const recentAppointments = appointments.slice(0, 5);
  document.querySelector("[data-recent-appointments]").innerHTML = recentAppointments.length ? recentAppointments.map((item) => `<div class="activity-item"><div><strong>${escapeHtml(item.nomeCompleto)}</strong><span>${item.data} · ${item.horario}</span></div>${statusBadge(item.estado)}</div>`).join("") : '<p class="admin-empty">Sem marcações.</p>';

  document.querySelector("[data-recent-products]").innerHTML = products.slice(0, 5).map((item) => `<div class="activity-item"><div><strong>${escapeHtml(item.nome)}</strong><span>${escapeHtml(item.categoria)}</span></div><span>${formatMoney(item.preco)}</span></div>`).join("");

  document.querySelector("[data-active-promotions]").innerHTML = promotions.length ? promotions.map((promotion) => {
    const product = getProductById(promotion.produtoId);
    return `<div class="activity-item"><div><strong>${escapeHtml(product?.nome || "Produto removido")}</strong><span>Até ${promotion.dataFinal}</span></div><span>${formatMoney(promotion.precoPromocional)}</span></div>`;
  }).join("") : '<p class="admin-empty">Sem promoções activas.</p>';
}
