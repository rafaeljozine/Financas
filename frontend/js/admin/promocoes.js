import { createPromotion, deletePromotion, formatMoney, getProductById, getProducts, getPromotions, isPromotionActive, togglePromotion, updatePromotion } from "../api.js";
import { confirmAction, escapeHtml, openModal, renderAdminShell, showToast } from "./common.js";

if (renderAdminShell("Promoções")) {
  const table = document.querySelector("[data-promotions-table]");
  const empty = document.querySelector("[data-promotions-empty]");
  const statusFilter = document.querySelector("#admin-promotion-status");

  function render() {
    let promotions = getPromotions();
    if (statusFilter.value === "active") promotions = promotions.filter(isPromotionActive);
    if (statusFilter.value === "inactive") promotions = promotions.filter((item) => !isPromotionActive(item));
    empty.hidden = promotions.length > 0;
    table.innerHTML = promotions.map((promotion) => {
      const product = getProductById(promotion.produtoId);
      const active = isPromotionActive(promotion);
      return `<tr><td><strong>${escapeHtml(product?.nome || "Produto removido")}</strong></td><td>${product ? formatMoney(product.preco) : "—"}</td><td>${formatMoney(promotion.precoPromocional)}</td><td>${promotion.dataInicial}<br><span style="color:var(--cinza-medio)">até ${promotion.dataFinal}</span></td><td>${active ? '<span class="badge badge-success">Activa</span>' : promotion.ativo ? '<span class="badge badge-warning">Fora do período</span>' : '<span class="badge badge-muted">Inactiva</span>'}</td><td><div class="table-actions"><button class="action-button" data-action="edit" data-id="${promotion.id}">Editar</button><button class="action-button" data-action="toggle" data-id="${promotion.id}">${promotion.ativo ? "Desactivar" : "Activar"}</button><button class="action-button danger" data-action="delete" data-id="${promotion.id}">Eliminar</button></div></td></tr>`;
    }).join("");
  }

  function openPromotionModal(promotion = null) {
    const products = getProducts().filter((product) => product.disponivel || Number(product.id) === Number(promotion?.produtoId));
    const options = products.map((product) => `<option value="${product.id}" ${Number(product.id) === Number(promotion?.produtoId) ? "selected" : ""}>${escapeHtml(product.nome)} — ${formatMoney(product.preco)}</option>`).join("");
    openModal({ title: promotion ? "Editar promoção" : "Criar promoção", body: `<div class="form-grid"><div class="form-field form-span-2"><label for="promotion-product">Produto *</label><select id="promotion-product" name="produtoId" required><option value="">Seleccione</option>${options}</select></div><div class="form-field"><label for="promotion-price">Preço promocional (MT) *</label><input id="promotion-price" name="precoPromocional" type="number" min="1" step="1" value="${promotion?.precoPromocional || ""}" required></div><div></div><div class="form-field"><label for="promotion-start">Data inicial *</label><input id="promotion-start" name="dataInicial" type="date" value="${promotion?.dataInicial || ""}" required></div><div class="form-field"><label for="promotion-end">Data final *</label><input id="promotion-end" name="dataFinal" type="date" value="${promotion?.dataFinal || ""}" required></div><label class="check-field"><input name="ativo" type="checkbox" ${promotion?.ativo !== false ? "checked" : ""}> Promoção activa</label><label class="check-field"><input name="destaque" type="checkbox" ${promotion?.destaque ? "checked" : ""}> Destacar promoção</label></div>`, submitLabel: promotion ? "Guardar alterações" : "Criar promoção", onSubmit: (form) => {
      const data = Object.fromEntries(new FormData(form)); data.ativo = form.elements.ativo.checked; data.destaque = form.elements.destaque.checked;
      if (promotion) updatePromotion(promotion.id, data); else createPromotion(data);
      showToast(promotion ? "Promoção actualizada." : "Promoção criada."); render();
    }});
  }

  document.querySelector("[data-add-promotion]").addEventListener("click", () => openPromotionModal());
  statusFilter.addEventListener("change", render);
  table.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]"); if (!button) return;
    const promotion = getPromotions().find((item) => Number(item.id) === Number(button.dataset.id));
    if (button.dataset.action === "edit") openPromotionModal(promotion);
    if (button.dataset.action === "toggle") { try { togglePromotion(promotion.id); showToast(promotion.ativo ? "Promoção desactivada." : "Promoção activada."); render(); } catch (error) { showToast(error.message, "error"); } }
    if (button.dataset.action === "delete" && confirmAction("Eliminar esta promoção?")) { deletePromotion(promotion.id); showToast("Promoção eliminada."); render(); }
  });
  render();
}
