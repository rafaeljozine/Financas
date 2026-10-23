import { createCategory, deleteCategory, getCategories, getProducts, updateCategory } from "../api.js";
import { confirmAction, escapeHtml, openModal, renderAdminShell, showToast } from "./common.js";

if (renderAdminShell("Categorias")) {
  const table = document.querySelector("[data-categories-table]");
  function render() {
    const products = getProducts();
    table.innerHTML = getCategories().map((category) => {
      const count = products.filter((product) => Number(product.categoriaId) === Number(category.id)).length;
      return `<tr><td><strong>${escapeHtml(category.nome)}</strong></td><td>${escapeHtml(category.descricao || "—")}</td><td>${count}</td><td>${category.ativo !== false ? '<span class="badge badge-success">Activa</span>' : '<span class="badge badge-muted">Inactiva</span>'}</td><td><div class="table-actions"><button class="action-button" data-action="edit" data-id="${category.id}">Editar</button><button class="action-button danger" data-action="delete" data-id="${category.id}">Eliminar</button></div></td></tr>`;
    }).join("");
  }
  function openCategoryModal(category = null) {
    openModal({ title: category ? "Editar categoria" : "Adicionar categoria", body: `<div class="form-grid"><div class="form-field form-span-2"><label for="category-name">Nome *</label><input id="category-name" name="nome" value="${escapeHtml(category?.nome || "")}" required></div><div class="form-field form-span-2"><label for="category-description">Descrição</label><textarea id="category-description" name="descricao">${escapeHtml(category?.descricao || "")}</textarea></div><label class="check-field form-span-2"><input name="ativo" type="checkbox" ${category?.ativo !== false ? "checked" : ""}> Categoria activa</label></div>`, submitLabel: category ? "Guardar alterações" : "Adicionar categoria", onSubmit: (form) => {
      const data = Object.fromEntries(new FormData(form)); data.ativo = form.elements.ativo.checked;
      if (category) updateCategory(category.id, data); else createCategory(data);
      showToast(category ? "Categoria actualizada." : "Categoria adicionada."); render();
    }});
  }
  document.querySelector("[data-add-category]").addEventListener("click", () => openCategoryModal());
  table.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]"); if (!button) return;
    const category = getCategories().find((item) => Number(item.id) === Number(button.dataset.id));
    if (button.dataset.action === "edit") openCategoryModal(category);
    if (button.dataset.action === "delete" && confirmAction(`Eliminar a categoria “${category.nome}”?`)) { try { deleteCategory(category.id); showToast("Categoria eliminada."); render(); } catch (error) { showToast(error.message, "error"); } }
  });
  render();
}
