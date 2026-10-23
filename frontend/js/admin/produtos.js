import { createProduct, deleteProduct, fileToDataUrl, formatMoney, getCategories, getProducts, toggleProductAvailability, updateProduct } from "../api.js";
import { adminPageUrl, confirmAction, escapeHtml, openModal, pageUrl, renderAdminShell, showToast } from "./common.js";

if (renderAdminShell("Produtos")) {
  const table = document.querySelector("[data-products-table]");
  const empty = document.querySelector("[data-products-empty]");
  const search = document.querySelector("#admin-product-search");
  const categoryFilter = document.querySelector("#admin-product-category");
  let categories = getCategories();

  function refreshCategoryOptions() {
    categories = getCategories();
    categoryFilter.innerHTML = '<option value="">Todas</option>' + categories.map((category) => `<option value="${category.id}">${escapeHtml(category.nome)}</option>`).join("");
  }

  function render() {
    const term = search.value.trim().toLocaleLowerCase("pt");
    const categoryId = categoryFilter.value;
    const products = getProducts().filter((product) => (!term || `${product.nome} ${product.categoria}`.toLocaleLowerCase("pt").includes(term)) && (!categoryId || String(product.categoriaId) === categoryId));
    empty.hidden = products.length > 0;
    table.innerHTML = products.map((product) => `<tr><td><div class="table-product"><img src="${escapeHtml(product.imagem || pageUrl("assets/images/logo/logo-transparente.png"))}" alt=""><strong>${escapeHtml(product.nome)}</strong></div></td><td>${escapeHtml(product.categoria)}</td><td>${formatMoney(product.preco)}</td><td>${product.disponivel ? '<span class="badge badge-success">Disponível</span>' : '<span class="badge badge-muted">Inactivo</span>'}</td><td>${product.destaque ? "Sim" : "Não"}</td><td><div class="table-actions"><a class="action-button" href="${pageUrl("pages/principal/produto-detalhe.html")}?id=${product.id}" target="_blank">Ver</a><button class="action-button" data-action="edit" data-id="${product.id}">Editar</button><button class="action-button" data-action="toggle" data-id="${product.id}">${product.disponivel ? "Desactivar" : "Activar"}</button><button class="action-button danger" data-action="delete" data-id="${product.id}">Remover</button></div></td></tr>`).join("");
  }

  function imageField(key, label, value = "") {
    return `<div class="image-upload"><span class="field-label">${label}</span><div class="image-preview" data-preview="${key}">${value ? `<img src="${escapeHtml(value)}" alt="Pré-visualização">` : "Sem imagem"}</div><input class="file-input" id="file-${key}" type="file" accept="image/*" data-file="${key}"><div class="upload-actions"><label class="btn btn-secondary btn-small" for="file-${key}">Seleccionar</label><button class="btn btn-secondary btn-small" type="button" data-remove-image="${key}">Remover</button></div><input type="hidden" name="${key}" value="${escapeHtml(value)}"></div>`;
  }

  function openProductModal(product = null) {
    const categoryOptions = categories.map((category) => `<option value="${category.id}" ${Number(product?.categoriaId) === Number(category.id) ? "selected" : ""}>${escapeHtml(category.nome)}</option>`).join("");
    const body = `<div class="form-grid"><div class="form-field form-span-2"><label for="product-name">Nome *</label><input id="product-name" name="nome" value="${escapeHtml(product?.nome || "")}" required></div><div class="form-field form-span-2"><label for="product-description">Descrição *</label><textarea id="product-description" name="descricao" required>${escapeHtml(product?.descricao || "")}</textarea></div><div class="form-field"><label for="product-price">Preço normal (MT) *</label><input id="product-price" name="preco" type="number" min="1" step="1" value="${product?.preco || ""}" required></div><div class="form-field"><label for="product-category">Categoria *</label><select id="product-category" name="categoriaId" required><option value="">Seleccione</option>${categoryOptions}</select></div><div class="form-span-2 image-upload-grid">${imageField("imagem", "Fotografia comercial", product?.imagem)}${imageField("imagemModelo", "Fotografia com modelo", product?.imagemModelo)}${imageField("imagemVirtual", "Imagem para teste virtual", product?.imagemVirtual)}</div><label class="check-field"><input name="disponivel" type="checkbox" ${product?.disponivel !== false ? "checked" : ""}> Disponível no site</label><label class="check-field"><input name="destaque" type="checkbox" ${product?.destaque ? "checked" : ""}> Produto em destaque</label><label class="check-field form-span-2"><input name="testeVirtual" type="checkbox" ${product?.testeVirtual ? "checked" : ""}> Teste virtual disponível</label></div>`;
    const modal = openModal({ title: product ? "Editar produto" : "Adicionar produto", body, submitLabel: product ? "Guardar alterações" : "Adicionar produto", onSubmit: (form) => {
      const data = Object.fromEntries(new FormData(form));
      data.disponivel = form.elements.disponivel.checked;
      data.destaque = form.elements.destaque.checked;
      data.testeVirtual = form.elements.testeVirtual.checked;
      if (data.testeVirtual && !data.imagemVirtual) throw new Error("Adicione a imagem própria do teste virtual ou desactive esta opção.");
      if (product) updateProduct(product.id, data); else createProduct(data);
      showToast(product ? "Produto actualizado." : "Produto adicionado.");
      render();
    }});
    modal.querySelectorAll("[data-file]").forEach((input) => input.addEventListener("change", async () => {
      try {
        const dataUrl = await fileToDataUrl(input.files[0]);
        const key = input.dataset.file;
        modal.querySelector(`[name="${key}"]`).value = dataUrl;
        modal.querySelector(`[data-preview="${key}"]`).innerHTML = `<img src="${dataUrl}" alt="Pré-visualização">`;
      } catch (error) { showToast(error.message, "error"); input.value = ""; }
    }));
    modal.querySelectorAll("[data-remove-image]").forEach((button) => button.addEventListener("click", () => {
      const key = button.dataset.removeImage;
      modal.querySelector(`[name="${key}"]`).value = "";
      modal.querySelector(`[data-preview="${key}"]`).textContent = "Sem imagem";
      modal.querySelector(`[data-file="${key}"]`).value = "";
      if (key === "imagemVirtual") modal.querySelector('[name="testeVirtual"]').checked = false;
    }));
  }

  document.querySelector("[data-add-product]").addEventListener("click", () => openProductModal());
  search.addEventListener("input", render);
  categoryFilter.addEventListener("change", render);
  table.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const product = getProducts().find((item) => Number(item.id) === Number(button.dataset.id));
    if (button.dataset.action === "edit") openProductModal(product);
    if (button.dataset.action === "toggle") { toggleProductAvailability(product.id); showToast(product.disponivel ? "Produto desactivado." : "Produto activado."); render(); }
    if (button.dataset.action === "delete" && confirmAction(`Remover “${product.nome}”? Esta acção também remove as promoções associadas.`)) { deleteProduct(product.id); showToast("Produto removido."); render(); }
  });
  refreshCategoryOptions();
  render();
}
