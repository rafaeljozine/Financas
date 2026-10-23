import { formatMoney, getConfiguration, getProductById, getProductPromotion, getProducts } from "./api.js";
import { escapeHtml, pageUrl, renderEmptyState, renderProductCard, whatsappUrl } from "./main.js";

const container = document.querySelector("[data-product-detail]");
const id = new URLSearchParams(window.location.search).get("id");
const product = getProductById(id);

if (!product || !product.disponivel) {
  container.className = "container section";
  container.innerHTML = renderEmptyState("Armação não encontrada", "Este produto não está disponível ou o endereço está incorrecto.", `<a class="btn btn-primary" href="${pageUrl("pages/principal/produtos.html")}">Voltar ao catálogo</a>`);
} else {
  const promotion = getProductPromotion(product.id);
  const configuration = getConfiguration();
  const contactLink = whatsappUrl(configuration.whatsapp, `Olá. Gostaria de saber mais sobre a armação ${product.nome}.`);
  const virtualLink = `${pageUrl("pages/principal/teste-virtual.html")}?id=${encodeURIComponent(product.id)}`;
  const productImage = product.imagem || pageUrl("assets/images/logo/logo-transparente.png");
  document.title = `${product.nome} | Óptica Excelente E.I.`;
  container.innerHTML = `
    <div class="detail-layout">
      <div class="detail-media"><img src="${escapeHtml(productImage)}" alt="${escapeHtml(product.nome)}"></div>
      <div class="detail-content">
        <a class="back-link" href="${pageUrl("pages/principal/produtos.html")}">Voltar ao catálogo</a>
        <span class="badge">${escapeHtml(product.categoria)}</span>
        <h1>${escapeHtml(product.nome)}</h1>
        <div class="detail-price">${promotion ? `<span class="old-price">${formatMoney(product.preco)}</span><span class="price sale-price">${formatMoney(promotion.precoPromocional)}</span>` : `<span class="price">${formatMoney(product.preco)}</span>`}</div>
        <p class="detail-description">${escapeHtml(product.descricao)}</p>
        <p class="detail-status">Disponível para conhecer na óptica</p>
        <div class="detail-actions">
          <a class="btn btn-primary" href="${contactLink}" target="_blank" rel="noreferrer">Falar no WhatsApp</a>
          ${product.testeVirtual ? `<a class="btn btn-secondary" href="${virtualLink}">Experimentar estes óculos</a>` : ""}
        </div>
      </div>
    </div>`;

  const related = getProducts({ publicOnly: true }).filter((item) => item.id !== product.id && item.categoriaId === product.categoriaId).slice(0, 4);
  if (related.length) {
    document.querySelector("[data-related-section]").hidden = false;
    document.querySelector("[data-related-products]").innerHTML = related.map(renderProductCard).join("");
  }
}
