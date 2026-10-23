import { getCategories, getProducts } from "./api.js";
import { escapeHtml, renderEmptyState, renderProductCard } from "./main.js";

const grid = document.querySelector("[data-catalog-grid]");
const count = document.querySelector("[data-result-count]");
const categoryFilters = document.querySelector("[data-category-filters]");
const search = document.querySelector("#catalog-search");
const sort = document.querySelector("#catalog-sort");
const available = document.querySelector("#filter-available");
const promotion = document.querySelector("#filter-promotion");

const requestedCategory = new URLSearchParams(window.location.search).get("categoria") || "";
categoryFilters.innerHTML = [
  `<label class="filter-option category-option"><input type="radio" name="categoria" value="" ${requestedCategory ? "" : "checked"}><span>Todas</span></label>`,
  ...getCategories().filter((category) => category.ativo !== false).map((category) => `<label class="filter-option category-option"><input type="radio" name="categoria" value="${escapeHtml(category.nome)}" ${category.nome === requestedCategory ? "checked" : ""}><span>${escapeHtml(category.nome)}</span></label>`),
].join("");

function selectedCategory() {
  return document.querySelector('input[name="categoria"]:checked')?.value || "";
}

function renderCatalog() {
  const products = getProducts({
    publicOnly: Boolean(available.checked),
    category: selectedCategory(),
    search: search.value,
    promotionsOnly: promotion.checked,
    sort: sort.value,
  });
  count.textContent = `${products.length} ${products.length === 1 ? "armação encontrada" : "armações encontradas"}`;
  grid.innerHTML = products.length
    ? products.map(renderProductCard).join("")
    : renderEmptyState("Nenhuma armação encontrada", "Experimente alterar a pesquisa ou limpar os filtros.", '<button class="btn btn-primary" type="button" data-empty-clear>Limpar filtros</button>');
  grid.querySelectorAll(".product-card").forEach((card, index) => {
    card.classList.add("catalog-card-in");
    card.style.setProperty("--catalog-delay", `${Math.min(index * 45, 270)}ms`);
  });
  grid.querySelector("[data-empty-clear]")?.addEventListener("click", clearFilters);
}

function clearFilters() {
  search.value = "";
  sort.value = "recent";
  available.checked = true;
  promotion.checked = false;
  document.querySelector('input[name="categoria"][value=""]').checked = true;
  window.history.replaceState({}, "", window.location.pathname);
  renderCatalog();
}

search.addEventListener("input", renderCatalog);
sort.addEventListener("change", renderCatalog);
available.addEventListener("change", renderCatalog);
promotion.addEventListener("change", renderCatalog);
categoryFilters.addEventListener("change", renderCatalog);
document.querySelector("[data-clear-filters]").addEventListener("click", clearFilters);

const filterToggle = document.querySelector("[data-toggle-filters]");
filterToggle?.addEventListener("click", () => {
  const filters = document.querySelector("#catalog-filters");
  const open = filters.classList.toggle("is-open");
  filterToggle.setAttribute("aria-expanded", String(open));
});

renderCatalog();
