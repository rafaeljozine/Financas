import {
  addToCart,
  clearCart,
  formatMoney,
  getCart,
  getConfiguration,
  getFavorites,
  getProductPromotion,
  initializeData,
  removeFromCart,
  toggleFavorite,
} from "./api.js";

export const frontendRoot = new URL("../", import.meta.url);

let activeDrawer = null;
let drawerReturnFocus = null;

// Ícones inline, completos e sem dependências externas. Os ícones de marca
// usam preenchimento; os ícones de interface mantêm o mesmo traço visual.
const icon = (content, className = "ui-icon") => `<svg class="${className}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${content}</svg>`;

const ICON_WHATSAPP = `<svg class="ui-icon social-icon whatsapp-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>`;
const ICON_FACEBOOK = `<svg class="ui-icon social-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.673 3.667h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/></svg>`;
const ICON_INSTAGRAM = `<svg class="ui-icon social-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M7.03.084C5.753.144 4.881.348 4.119.647c-.789.308-1.458.72-2.123 1.388C1.331 2.703.921 3.372.616 4.162.321 4.926.12 5.799.064 7.076.008 8.354-.005 8.764.001 12.023c.006 3.259.021 3.667.083 4.947.061 1.277.264 2.148.563 2.911.308.789.72 1.457 1.388 2.123.668.665 1.336 1.074 2.128 1.38.763.295 1.636.496 2.913.552 1.278.056 1.689.069 4.947.063 3.258-.006 3.668-.021 4.948-.081 1.28-.061 2.147-.266 2.91-.563.789-.309 1.458-.72 2.123-1.388.665-.668 1.074-1.338 1.38-2.129.295-.763.496-1.636.552-2.912.056-1.281.069-1.69.063-4.948-.006-3.258-.021-3.667-.082-4.947-.061-1.28-.264-2.149-.563-2.912-.309-.789-.72-1.457-1.388-2.123C21.298 1.33 20.628.921 19.838.617 19.074.321 18.202.12 16.924.065 15.647.009 15.236-.005 11.977.001 8.718.008 8.31.022 7.03.084ZM12 5.838A6.162 6.162 0 1 0 12 18.162 6.162 6.162 0 0 0 12 5.838Zm0 10.162a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.39-10.414a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0Z"/></svg>`;
const ICON_HEART = icon('<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"/>');
const ICON_BAG = icon('<path d="M6 8h12l1 13H5L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>');
const ICON_LOCATION = icon('<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>');
const ICON_PHONE = icon('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.68 2.8a2 2 0 0 1-.45 2.11L8.07 9.9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.32 1.84.55 2.8.68A2 2 0 0 1 22 16.92Z"/>');
const ICON_DIRECTIONS = icon('<path d="m12 2 9 9-9 9-9-9 9-9Z"/><path d="M9 14v-2a2 2 0 0 1 2-2h4"/><path d="m13 8 2 2-2 2"/>');
const ICON_CLOCK = icon('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>');
const ICON_LOCK = icon('<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>');

/**
 * Registo de redes sociais opcionais. Cada entrada só aparece se o campo
 * correspondente existir em getConfiguration(). Para adicionar outra rede
 * (ex: TikTok), acrescenta aqui um ícone e uma linha nesta lista — o resto
 * do footer já itera sobre isto automaticamente.
 */
function socialLinks(configuration) {
  return [
    { key: "facebook", label: "Facebook", icon: ICON_FACEBOOK, url: configuration.facebook },
    { key: "instagram", label: "Instagram", icon: ICON_INSTAGRAM, url: configuration.instagram },
  ].filter((item) => item.url);
}

export function pageUrl(path = "") {
  return new URL(path, frontendRoot).href;
}

export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function whatsappUrl(number, message = "Olá. Gostaria de obter mais informações.") {
  const cleanNumber = String(number || "").replace(/\D/g, "");
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

export function telephoneUrl(number) {
  return `tel:${String(number || "").replace(/[^\d+]/g, "")}`;
}

export function directionsUrl(configuration) {
  const destination = `${configuration.latitude},${configuration.longitude}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

function currentPage() {
  return window.location.pathname.split("/").pop() || "index.html";
}

function navItem(href, label, matches = []) {
  const active = matches.includes(currentPage());
  return `<a href="${pageUrl(href)}"${active ? ' aria-current="page"' : ""}>${label}</a>`;
}

function setHeaderHeight(header) {
  document.documentElement.style.setProperty("--site-header-height", `${Math.ceil(header.getBoundingClientRect().height)}px`);
}

function closeMobileMenu({ restoreFocus = false } = {}) {
  const header = document.querySelector("[data-site-header]");
  const toggle = header?.querySelector(".menu-toggle");
  const panel = header?.querySelector(".mobile-panel");
  if (!toggle || !panel || !panel.classList.contains("is-open")) return;
  panel.classList.remove("is-open");
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-label", "Abrir menu");
  document.body.classList.remove("menu-aberto");
  if (restoreFocus) toggle.focus();
}

function collectionShell() {
  let backdrop = document.querySelector("[data-collection-backdrop]");
  if (backdrop) return backdrop;

  backdrop = document.createElement("div");
  backdrop.className = "collection-backdrop";
  backdrop.hidden = true;
  backdrop.dataset.collectionBackdrop = "";
  backdrop.innerHTML = `
    <aside class="collection-drawer" role="dialog" aria-modal="true" aria-labelledby="collection-drawer-title" tabindex="-1">
      <header class="collection-drawer-header">
        <div><p data-collection-kicker>A sua selecção</p><h2 id="collection-drawer-title" data-collection-title></h2></div>
        <button class="drawer-close" type="button" data-close-collection aria-label="Fechar painel"><span aria-hidden="true">×</span></button>
      </header>
      <div class="collection-drawer-body" data-collection-body></div>
      <footer class="collection-drawer-footer" data-collection-footer></footer>
    </aside>`;
  document.body.append(backdrop);
  return backdrop;
}

function productCurrentPrice(product) {
  if (Number.isFinite(Number(product.precoActual))) return Number(product.precoActual);
  const promotion = product.promocao || getProductPromotion(product.id);
  return promotion ? Number(promotion.precoPromocional) : Number(product.preco);
}

function renderCollectionItem(product, type) {
  const detailUrl = `${pageUrl("pages/principal/produto-detalhe.html")}?id=${encodeURIComponent(product.id)}`;
  const image = product.imagem || pageUrl("assets/images/logo/logo-transparente.png");
  const actionLabel = type === "favorites" ? "Retirar dos favoritos" : "Retirar do carrinho";
  return `
    <article class="collection-item">
      <a class="collection-item-image" href="${detailUrl}" aria-label="Ver ${escapeHtml(product.nome)}">
        <img src="${escapeHtml(image)}" alt="" loading="lazy" data-safe-image>
      </a>
      <div class="collection-item-info">
        <a href="${detailUrl}">${escapeHtml(product.nome)}</a>
        <span>${escapeHtml(product.categoria || "Armações")} · ${formatMoney(productCurrentPrice(product))}</span>
      </div>
      <button class="collection-remove" type="button" data-remove-collection-item="${product.id}" aria-label="${actionLabel}: ${escapeHtml(product.nome)}">Remover</button>
    </article>`;
}

function renderCollectionDrawer(type) {
  const configuration = getConfiguration();
  const backdrop = collectionShell();
  const isFavorites = type === "favorites";
  const products = isFavorites ? getFavorites() : getCart();
  backdrop.querySelector("[data-collection-kicker]").textContent = isFavorites ? "Inspiração guardada" : "A sua selecção";
  backdrop.querySelector("[data-collection-title]").textContent = isFavorites ? "Favoritos" : "Carrinho";

  const body = backdrop.querySelector("[data-collection-body]");
  const footer = backdrop.querySelector("[data-collection-footer]");
  if (!products.length) {
    body.innerHTML = `
      <div class="drawer-empty">
        <h3>${isFavorites ? "Ainda não guardou armações." : "O carrinho está vazio."}</h3>
        <p>${isFavorites ? "Use o botão Guardar nos cartões para reunir os modelos de que mais gosta." : "Adicione as armações que quer comparar ou conhecer na óptica."}</p>
        <a class="btn btn-primary" href="${pageUrl("pages/principal/produtos.html")}">Explorar armações</a>
      </div>`;
    footer.hidden = true;
    footer.innerHTML = "";
    return;
  }

  body.innerHTML = `<div class="collection-list">${products.map((product) => renderCollectionItem(product, type)).join("")}</div>`;
  footer.hidden = false;
  if (isFavorites) {
    footer.innerHTML = `<a class="btn btn-primary" href="${pageUrl("pages/principal/produtos.html")}">Continuar a explorar</a>`;
    return;
  }

  const total = products.reduce((sum, product) => sum + productCurrentPrice(product), 0);
  const lines = products.map((product) => `- ${product.nome} — ${formatMoney(productCurrentPrice(product))}`).join("\n");
  const message = `Olá. Gostaria de obter informações sobre esta selecção:\n${lines}\nTotal indicativo: ${formatMoney(total)}.`;
  footer.innerHTML = `
    <div class="drawer-total"><span>Total indicativo</span><strong>${formatMoney(total)}</strong></div>
    <a class="btn btn-whatsapp" href="${whatsappUrl(configuration.whatsapp, message)}" target="_blank" rel="noreferrer">${ICON_WHATSAPP}<span>Enviar selecção pelo WhatsApp</span></a>
    <p>A compra não é concluída online. A equipa confirmará preços e disponibilidade.</p>
    <button class="drawer-secondary-action" type="button" data-clear-cart>Esvaziar carrinho</button>`;
}

function openCollectionDrawer(type, trigger = document.activeElement) {
  closeMobileMenu();
  const backdrop = collectionShell();
  drawerReturnFocus = trigger instanceof HTMLElement ? trigger : null;
  activeDrawer = type;
  renderCollectionDrawer(type);
  backdrop.hidden = false;
  document.body.classList.add("drawer-open");
  window.requestAnimationFrame(() => {
    backdrop.classList.add("is-open");
    backdrop.querySelector("[data-close-collection]")?.focus();
  });
}

function closeCollectionDrawer() {
  const backdrop = document.querySelector("[data-collection-backdrop]");
  if (!backdrop || backdrop.hidden) return;
  backdrop.classList.remove("is-open");
  document.body.classList.remove("drawer-open");
  activeDrawer = null;
  window.setTimeout(() => { backdrop.hidden = true; }, 270);
  drawerReturnFocus?.focus();
  drawerReturnFocus = null;
}

function updateCollectionState() {
  const favoriteIds = new Set(getFavorites().map((product) => Number(product.id)));
  const cartIds = new Set(getCart().map((product) => Number(product.id)));
  document.querySelectorAll("[data-favorite-count]").forEach((node) => { node.textContent = String(favoriteIds.size); });
  document.querySelectorAll("[data-cart-count]").forEach((node) => { node.textContent = String(cartIds.size); });
  document.querySelectorAll("[data-favorite-product]").forEach((button) => {
    const selected = favoriteIds.has(Number(button.dataset.favoriteProduct));
    button.setAttribute("aria-pressed", String(selected));
    const label = selected ? "Guardado" : "Guardar";
    button.setAttribute("aria-label", `${label}: ${button.dataset.productName || "armação"}`);
    const text = button.querySelector("[data-favorite-label]");
    if (text) text.textContent = label;
  });
  document.querySelectorAll("[data-add-cart]").forEach((button) => {
    if (button.disabled) return;
    const selected = cartIds.has(Number(button.dataset.addCart));
    button.dataset.inCart = String(selected);
    const label = button.querySelector("[data-add-cart-label]");
    if (label) label.textContent = selected ? "No carrinho" : "Adicionar ao carrinho";
    else button.textContent = selected ? "No carrinho" : "Adicionar ao carrinho";
  });
  if (activeDrawer) renderCollectionDrawer(activeDrawer);
}

function focusableInDrawer() {
  const drawer = document.querySelector(".collection-drawer");
  if (!drawer) return [];
  return [...drawer.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter((element) => !element.hidden && element.getClientRects().length > 0);
}

function bindPublicInteractions() {
  document.addEventListener("click", (event) => {
    const collectionTrigger = event.target.closest("[data-open-collection]");
    if (collectionTrigger) {
      openCollectionDrawer(collectionTrigger.dataset.openCollection, collectionTrigger);
      return;
    }

    const favoriteButton = event.target.closest("[data-favorite-product]");
    if (favoriteButton) {
      try {
        const isFavorite = toggleFavorite(favoriteButton.dataset.favoriteProduct);
        updateCollectionState();
        showToast(isFavorite ? "Armação guardada nos favoritos." : "Armação retirada dos favoritos.");
      } catch (error) {
        showToast(error.message, "error");
      }
      return;
    }

    const cartButton = event.target.closest("[data-add-cart]");
    if (cartButton) {
      try {
        addToCart(cartButton.dataset.addCart);
        updateCollectionState();
        showToast("Armação adicionada ao carrinho.");
      } catch (error) {
        showToast(error.message, "error");
      }
      return;
    }

    const previewButton = event.target.closest("[data-model-preview]");
    if (previewButton) {
      const card = previewButton.closest(".product-card");
      const open = card?.classList.toggle("is-model-view") || false;
      previewButton.setAttribute("aria-pressed", String(open));
      previewButton.textContent = open ? "Ver armação" : "Ver no rosto";
      return;
    }

    const removeButton = event.target.closest("[data-remove-collection-item]");
    if (removeButton && activeDrawer) {
      const id = removeButton.dataset.removeCollectionItem;
      if (activeDrawer === "favorites") toggleFavorite(id);
      else removeFromCart(id);
      updateCollectionState();
      return;
    }

    if (event.target.closest("[data-close-collection]") || event.target.matches("[data-collection-backdrop]")) {
      closeCollectionDrawer();
      return;
    }

    if (event.target.closest("[data-clear-cart]")) {
      if (window.confirm("Esvaziar todas as armações do carrinho?")) {
        clearCart();
        updateCollectionState();
        showToast("Carrinho esvaziado.");
      }
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (activeDrawer) closeCollectionDrawer();
      else closeMobileMenu({ restoreFocus: true });
      return;
    }
    if (event.key !== "Tab" || !activeDrawer) return;
    const focusable = focusableInDrawer();
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  document.addEventListener("error", (event) => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || image.dataset.fallbackApplied === "true") return;
    if (image.classList.contains("product-model-image")) {
      image.hidden = true;
      image.closest(".product-card")?.classList.remove("has-model", "is-model-view");
      return;
    }
    image.dataset.fallbackApplied = "true";
    image.src = pageUrl("assets/images/logo/logo-transparente.png");
    image.classList.add("image-fallback");
  }, true);
}

export function renderPublicShell() {
  initializeData();
  const configuration = getConfiguration();
  const header = document.querySelector("[data-site-header]");
  const footer = document.querySelector("[data-site-footer]");
  const logo = configuration.logo || pageUrl("assets/images/logo/logo-transparente.png");
  const whatsapp = whatsappUrl(configuration.whatsapp);
  const telephone = telephoneUrl(configuration.telefone);
  const directions = directionsUrl(configuration);

  if (header) {
    header.className = "site-header";
    header.innerHTML = `
      <div class="announcement">${escapeHtml(configuration.slogan)} · Atendimento em Xipamanine · ${escapeHtml(configuration.horarioTextual)}</div>
      <div class="container navbar">
        <a href="${pageUrl("index.html")}" aria-label="${escapeHtml(configuration.nomeOptica)} — página inicial">
          <img class="brand-logo" src="${escapeHtml(logo)}" alt="${escapeHtml(configuration.nomeOptica)}">
        </a>
        <nav class="nav-links" aria-label="Navegação principal">
          ${navItem("index.html", "Início", ["", "index.html"])}
          ${navItem("pages/principal/produtos.html", "Produtos", ["produtos.html", "produto-detalhe.html"])}
          ${navItem("pages/principal/promocoes.html", "Promoções", ["promocoes.html"])}
          ${navItem("pages/principal/teste-virtual.html", "Teste virtual", ["teste-virtual.html"])}
          ${navItem("pages/principal/marcar-consulta.html", "Consulta", ["marcar-consulta.html"])}
          ${navItem("pages/principal/localizacao.html", "Localização", ["localizacao.html"])}
        </nav>
        <div class="nav-utilities">
          <button class="nav-utility" type="button" data-open-collection="favorites" aria-label="Abrir favoritos">${ICON_HEART}<span class="nav-utility-label">Favoritos</span><span class="nav-count" data-favorite-count>0</span></button>
          <button class="nav-utility" type="button" data-open-collection="cart" aria-label="Abrir carrinho">${ICON_BAG}<span class="nav-utility-label">Carrinho</span><span class="nav-count" data-cart-count>0</span></button>
          <a class="btn btn-small btn-whatsapp nav-whatsapp" href="${whatsapp}" target="_blank" rel="noreferrer" aria-label="Falar no WhatsApp">${ICON_WHATSAPP}<span>WhatsApp</span></a>
        </div>
        <button class="menu-toggle" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="mobile-menu"></button>
      </div>
      <div class="mobile-panel" id="mobile-menu">
        <nav class="mobile-nav" aria-label="Navegação móvel">
          <a href="${pageUrl("index.html")}">Início</a>
          <a href="${pageUrl("pages/principal/produtos.html")}">Produtos</a>
          <a href="${pageUrl("pages/principal/promocoes.html")}">Promoções</a>
          <a href="${pageUrl("pages/principal/teste-virtual.html")}">Teste virtual</a>
          <a href="${pageUrl("pages/principal/marcar-consulta.html")}">Marcar consulta</a>
          <a href="${pageUrl("pages/principal/localizacao.html")}">Localização</a>
          <div class="mobile-utility-row">
            <button type="button" data-open-collection="favorites">${ICON_HEART}<span>Favoritos</span><strong data-favorite-count>0</strong></button>
            <button type="button" data-open-collection="cart">${ICON_BAG}<span>Carrinho</span><strong data-cart-count>0</strong></button>
          </div>
          <a class="btn btn-whatsapp" href="${whatsapp}" target="_blank" rel="noreferrer">${ICON_WHATSAPP}<span>Falar no WhatsApp</span></a>
        </nav>
      </div>`;

    const toggle = header.querySelector(".menu-toggle");
    const panel = header.querySelector(".mobile-panel");
    toggle.addEventListener("click", () => {
      const open = !panel.classList.contains("is-open");
      panel.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
      document.body.classList.toggle("menu-aberto", open);
      setHeaderHeight(header);
    });
    panel.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => closeMobileMenu()));
    setHeaderHeight(header);
  }

  if (footer) {
    footer.className = "site-footer";
    const socials = socialLinks(configuration);
    footer.innerHTML = `
      <div class="container footer-main">
        <div class="footer-brand">
          <img src="${escapeHtml(logo)}" alt="${escapeHtml(configuration.nomeOptica)}">
          <p>${escapeHtml(configuration.slogan)}. Uma selecção cuidada de armações e um atendimento atento em Xipamanine, Maputo.</p>
        </div>
        <div class="footer-column">
          <h2>Links rápidos</h2>
          <div class="footer-links">
            <a href="${pageUrl("pages/principal/produtos.html")}">Todas as armações</a>
            <a href="${pageUrl("pages/principal/promocoes.html")}">Promoções</a>
            <a href="${pageUrl("pages/principal/teste-virtual.html")}">Teste virtual</a>
            <a href="${pageUrl("pages/principal/marcar-consulta.html")}">Marcar consulta</a>
          </div>
        </div>
        <div class="footer-column">
          <h2>Contactos</h2>
          <div class="footer-links footer-contact-links">
            <a class="footer-contact-item footer-location" href="${directions}" target="_blank" rel="noreferrer">${ICON_LOCATION}<span><small>Localização</small>${escapeHtml(configuration.endereco)}</span></a>
            <a class="footer-contact-item" href="${telephone}">${ICON_PHONE}<span><small>Telefone</small>${escapeHtml(configuration.telefone)}</span></a>
            <a class="footer-contact-item footer-whatsapp" href="${whatsapp}" target="_blank" rel="noreferrer">${ICON_WHATSAPP}<span><small>WhatsApp</small>${escapeHtml(configuration.whatsapp)}</span></a>
            <a class="footer-contact-item" href="${directions}" target="_blank" rel="noreferrer">${ICON_DIRECTIONS}<span>Como chegar</span></a>
          </div>
        </div>
        <div class="footer-column">
          <h2>Horário e redes</h2>
          <div class="footer-links">
            <span class="footer-meta-item">${ICON_CLOCK}<span><small>Atendimento</small>${escapeHtml(configuration.horarioTextual)}</span></span>
            ${socials.map((social) => `<a class="footer-social-link" href="${escapeHtml(social.url)}" target="_blank" rel="noreferrer">${social.icon}<span>${social.label}</span></a>`).join("")}
            <a class="footer-admin-link" href="${pageUrl("pages/admin/login.html")}">${ICON_LOCK}<span>Área administrativa</span></a>
          </div>
        </div>
      </div>
      <div class="container footer-bottom">
        <span>© 2026 ${escapeHtml(configuration.nomeOptica)} Todos os direitos reservados.</span>
        <span class="footer-credit">Desenvolvido por <strong>Rafael Jozine</strong></span>
        <span>${escapeHtml(configuration.slogan)}</span>
      </div>`;
  }

  document.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });

  let toastRegion = document.querySelector(".toast-region");
  if (!toastRegion) {
    toastRegion = document.createElement("div");
    toastRegion.className = "toast-region";
    toastRegion.setAttribute("aria-live", "polite");
    toastRegion.setAttribute("aria-atomic", "true");
    document.body.append(toastRegion);
  }

  collectionShell();
  bindPublicInteractions();
  updateCollectionState();

  window.addEventListener("resize", () => {
    if (header) setHeaderHeight(header);
    if (window.innerWidth > 960) closeMobileMenu();
  });

  window.addEventListener("storage", (event) => {
    if (!event.key?.startsWith("opticaExcelente")) return;
    if (event.key.endsWith(".favorites") || event.key.endsWith(".cart")) updateCollectionState();
    else window.location.reload();
  });

  window.addEventListener("opticaExcelente:storechange", (event) => {
    if (["favorites", "cart"].includes(event.detail?.name)) updateCollectionState();
  });
}

export function renderProductCard(product) {
  const promotion = product.promocao || getProductPromotion(product.id);
  const detailUrl = `${pageUrl("pages/principal/produto-detalhe.html")}?id=${encodeURIComponent(product.id)}`;
  const categoryName = product.categoria || product.categoriaNome || "Armações";
  const productImage = product.imagem || pageUrl("assets/images/logo/logo-transparente.png");
  const modelImage = product.imagemModelo || "";
  const virtualAvailable = Boolean(product.disponivel && product.testeVirtual && product.imagemVirtual);
  const favorite = getFavorites().some((item) => Number(item.id) === Number(product.id));
  const inCart = getCart().some((item) => Number(item.id) === Number(product.id));
  return `
    <article class="product-card${modelImage ? " has-model" : ""}" data-product-card data-product-id="${product.id}">
      <div class="product-card-surface">
        ${modelImage ? `<img class="product-model-image" src="${escapeHtml(modelImage)}" alt="" aria-hidden="true" loading="lazy" data-safe-image>` : ""}
        <div class="product-card-top-actions">
          <button class="card-action favorite-action" type="button" data-favorite-product="${product.id}" data-product-name="${escapeHtml(product.nome)}" aria-pressed="${favorite}" aria-label="${favorite ? "Guardado" : "Guardar"}: ${escapeHtml(product.nome)}"${product.disponivel ? "" : " disabled"}>${ICON_HEART}<span data-favorite-label>${favorite ? "Guardado" : "Guardar"}</span></button>
          <div class="card-top-group">
            ${modelImage ? `<button class="model-preview-action" type="button" data-model-preview aria-pressed="false">Ver no rosto</button>` : ""}
            ${virtualAvailable ? `<a class="try-action" href="${pageUrl("pages/principal/teste-virtual.html")}?id=${encodeURIComponent(product.id)}">Experimentar</a>` : ""}
          </div>
        </div>
        <div class="product-image-wrap">
          <a class="product-image-link" href="${detailUrl}" aria-label="Ver detalhes de ${escapeHtml(product.nome)}">
            <img class="product-primary-image" src="${escapeHtml(productImage)}" alt="${escapeHtml(product.nome)}" loading="lazy" data-safe-image>
          </a>
          ${promotion ? '<span class="badge badge-sale">Promoção</span>' : ""}
        </div>
        <div class="product-info">
          <div class="product-meta"><span>${escapeHtml(categoryName)}</span><span>${product.disponivel ? "Disponível" : "Indisponível"}</span></div>
          <h3 class="product-name"><a href="${detailUrl}">${escapeHtml(product.nome)}</a></h3>
          <p class="product-description">${escapeHtml(product.descricao || "Conheça esta armação na Óptica Excelente.")}</p>
          <div class="price-row">
            ${promotion ? `<span class="old-price">${formatMoney(product.preco)}</span><span class="price sale-price">${formatMoney(promotion.precoPromocional)}</span>` : `<span class="price">${formatMoney(product.preco)}</span>`}
          </div>
          <div class="product-card-actions">
            <button class="add-cart-button" type="button" data-add-cart="${product.id}"${product.disponivel ? "" : " disabled"}>${ICON_BAG}<span data-add-cart-label>${product.disponivel ? (inCart ? "No carrinho" : "Adicionar ao carrinho") : "Indisponível"}</span></button>
            <a class="product-detail-button" href="${detailUrl}">Detalhes</a>
          </div>
        </div>
      </div>
    </article>`;
}

export function showToast(message, type = "success") {
  const region = document.querySelector(".toast-region") || document.body;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.setAttribute("role", type === "error" ? "alert" : "status");
  toast.textContent = message;
  region.append(toast);
  window.setTimeout(() => toast.remove(), 4200);
}

export function renderEmptyState(title, message, action = "") {
  return `<div class="empty-state"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p>${action}</div>`;
}

renderPublicShell();
