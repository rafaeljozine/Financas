import { formatMoney, getProductById, getPromotions } from "./api.js";
import { escapeHtml, pageUrl, renderEmptyState } from "./main.js";

const grid = document.querySelector("[data-promotions-grid]");
const promotions = getPromotions({ activeOnly: true })
  .map((promotion) => ({ promotion, product: getProductById(promotion.produtoId) }))
  .filter(({ product }) => product?.disponivel);

const formatDate = (value) => new Intl.DateTimeFormat("pt-MZ", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(`${value}T12:00:00`));

grid.innerHTML = promotions.length ? promotions.map(({ promotion, product }) => `
  <article class="promotion-card">
    <img src="${escapeHtml(product.imagem)}" alt="${escapeHtml(product.nome)}" loading="lazy">
    <div class="promotion-card-content">
      <span class="badge badge-sale">Promoção activa</span>
      <h2>${escapeHtml(product.nome)}</h2>
      <div class="price-row"><span class="old-price">${formatMoney(product.preco)}</span><span class="price sale-price">${formatMoney(promotion.precoPromocional)}</span></div>
      <a class="btn btn-primary btn-small" href="${pageUrl("pages/principal/produto-detalhe.html")}?id=${encodeURIComponent(product.id)}">Ver armação</a>
      <span class="promotion-period">Válida até ${formatDate(promotion.dataFinal)}</span>
    </div>
  </article>`).join("") : renderEmptyState("Sem promoções activas", "Neste momento não existem campanhas em vigor. Volte a consultar esta página em breve.", `<a class="btn btn-primary" href="${pageUrl("pages/principal/produtos.html")}">Ver catálogo</a>`);
