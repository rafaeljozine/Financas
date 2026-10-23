import {
  formatMoney,
  getCategories,
  getConfiguration,
  getProducts,
  getPromotions,
} from "./api.js";

import {
  directionsUrl,
  escapeHtml,
  pageUrl,
  renderEmptyState,
  renderProductCard,
  telephoneUrl,
} from "./main.js";


const categoryImages = {
  Graduados:
    "https://images.unsplash.com/photo-1608906709312-fe17f7c1a5a6?auto=format&fit=crop&w=1100&q=86",

  "Óculos de Sol":
    "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1100&q=86",

  Infantil:
    "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=1100&q=86",

  Feminino:
    "https://images.unsplash.com/photo-1705232497551-d0fbd6554801?auto=format&fit=crop&w=1100&q=86",

  Masculino:
    "https://images.unsplash.com/photo-1612720572242-fefde96650f6?auto=format&fit=crop&w=1100&q=86",
};


/* =========================================================
   UTILITÁRIOS
========================================================= */

function safeImageUrl(url, fallback = "") {
  if (typeof url !== "string") {
    return fallback;
  }

  try {
    const parsed = new URL(url, window.location.href);

    return parsed.protocol === "https:" ||
      parsed.protocol === "http:"
      ? parsed.href
      : fallback;
  } catch {
    return fallback;
  }
}


function runSection(label, fn) {
  try {
    fn();
  } catch (error) {
    console.error(
      `[home.js] Falha ao carregar secção "${label}":`,
      error
    );
  }
}


let publicProducts = [];


/* =========================================================
   CATEGORIAS
========================================================= */

runSection("categorias", () => {
  publicProducts =
    getProducts({
      publicOnly: true,
    }) || [];

  const categories = (getCategories() || [])
    .filter((category) => category.ativo !== false)
    .slice(0, 5);

  const categoryContainer =
    document.querySelector("[data-home-categories]");

  if (!categoryContainer) {
    return;
  }

  categoryContainer.innerHTML = categories
    .map((category) => {
      const count = publicProducts.filter(
        (product) =>
          Number(product.categoriaId) ===
          Number(category.id)
      ).length;

      const image = safeImageUrl(
        categoryImages[category.nome],
        categoryImages.Graduados
      );

      return `
        <a
          class="category-card"
          href="${pageUrl(
            "pages/principal/produtos.html"
          )}?categoria=${encodeURIComponent(category.nome)}"
        >

          <img
            src="${escapeHtml(image)}"
            alt="Pessoa ou armação representativa da categoria ${escapeHtml(
              category.nome
            )}"
            loading="lazy"
            data-safe-image
          >

          <div class="category-content">

            <span>
              Explorar colecção
            </span>

            <h3>
              ${escapeHtml(category.nome)}
            </h3>

            <span class="category-count">
              ${count}
              ${count === 1 ? "armação" : "armações"}
            </span>

          </div>

        </a>
      `;
    })
    .join("");
});


/* =========================================================
   VITRINE DE PRODUTOS
========================================================= */

const productRail =
  document.querySelector("[data-home-products]");

const productsStatus =
  document.querySelector("[data-products-status]");

const productsProgress =
  document.querySelector("[data-products-progress]");


let railStatusTimer;


/* =========================================================
   CARREGAR PRODUTOS
========================================================= */

runSection("vitrine de produtos", () => {
  if (!productRail) {
    return;
  }

  productRail.innerHTML =
    publicProducts.length > 0
      ? publicProducts
          .map((product) =>
            renderProductCard(product)
          )
          .join("")
      : renderEmptyState(
          "Sem armações disponíveis",
          "Volte em breve para conhecer a próxima selecção."
        );
});


/* =========================================================
   TAMANHO DE CADA PASSO DO CARROSSEL
========================================================= */

function railStep() {
  const card =
    productRail?.querySelector(".product-card");

  if (!card) {
    return 0;
  }

  const styles =
    window.getComputedStyle(productRail);

  const gap =
    Number.parseFloat(styles.columnGap) || 0;

  return (
    card.getBoundingClientRect().width +
    gap
  );
}


/* =========================================================
   ESTADO DO CARROSSEL
   Não depende de setas/botões.
========================================================= */

function updateRailState({
  announce = true,
} = {}) {
  if (
    !productRail ||
    !productsStatus
  ) {
    return;
  }

  const progress =
    productRail.scrollWidth
      ? Math.min(
          1,
          Math.max(
            0.06,
            (
              productRail.scrollLeft +
              productRail.clientWidth
            ) /
              productRail.scrollWidth
          )
        )
      : 1;

  productsProgress?.style.setProperty(
    "--rail-progress",
    String(progress)
  );


  if (!publicProducts.length) {
    if (announce) {
      productsStatus.textContent =
        "Nenhuma armação disponível neste momento.";
    }

    return;
  }


  const step =
    railStep() || 1;

  const first =
    Math.min(
      publicProducts.length,
      Math.round(
        productRail.scrollLeft / step
      ) + 1
    );


  const visible =
    Math.max(
      1,
      Math.floor(
        (
          productRail.clientWidth +
          4
        ) / step
      )
    );


  const last =
    Math.min(
      publicProducts.length,
      first + visible - 1
    );


  if (announce) {
    productsStatus.textContent =
      `A mostrar ${first}–${last} de ${publicProducts.length} armações disponíveis`;
  }
}


/* =========================================================
   ACTUALIZAÇÃO DURANTE SCROLL
========================================================= */

function scheduleRailStateUpdate() {
  updateRailState({
    announce: false,
  });

  window.clearTimeout(
    railStatusTimer
  );

  railStatusTimer =
    window.setTimeout(
      () => updateRailState(),
      160
    );
}


/* =========================================================
   MOVIMENTAÇÃO DO CARROSSEL
========================================================= */

function moveRail(direction) {
  if (!productRail) {
    return;
  }

  productRail.scrollBy({
    left:
      railStep() *
      direction,

    behavior:
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
        ? "auto"
        : "smooth",
  });
}


/* =========================================================
   AUTOPLAY
========================================================= */

let autoplayTimer;
let autoplayResumeTimer;


function stopProductAutoplay({
  resumeAfter = 0,
} = {}) {
  window.clearInterval(
    autoplayTimer
  );

  window.clearTimeout(
    autoplayResumeTimer
  );

  autoplayTimer =
    undefined;


  if (resumeAfter) {
    autoplayResumeTimer =
      window.setTimeout(
        startProductAutoplay,
        resumeAfter
      );
  }
}


function startProductAutoplay() {
  stopProductAutoplay();

  if (
    !productRail ||
    publicProducts.length < 2
  ) {
    return;
  }


  const reducedMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;


  autoplayTimer =
    window.setInterval(() => {
      if (
        document.hidden ||
        productRail.matches(":hover") ||
        productRail.contains(
          document.activeElement
        )
      ) {
        return;
      }


      const maxScroll =
        Math.max(
          0,
          productRail.scrollWidth -
            productRail.clientWidth
        );


      if (maxScroll <= 2) {
        return;
      }


      const reachedEnd =
        productRail.scrollLeft >=
        maxScroll - 3;


      productRail.scrollTo({
        left: reachedEnd
          ? 0
          : Math.min(
              maxScroll,
              productRail.scrollLeft +
                railStep()
            ),

        behavior:
          reducedMotion
            ? "auto"
            : "smooth",
      });
    }, 3800);
}


/* =========================================================
   EVENTOS DO CARROSSEL
========================================================= */

productRail?.addEventListener(
  "scroll",
  scheduleRailStateUpdate,
  {
    passive: true,
  }
);


productRail?.addEventListener(
  "pointerenter",
  () => {
    stopProductAutoplay();
  }
);


productRail?.addEventListener(
  "pointerleave",
  () => {
    startProductAutoplay();
  }
);


productRail?.addEventListener(
  "focusin",
  () => {
    stopProductAutoplay();
  }
);


productRail?.addEventListener(
  "focusout",
  (event) => {
    if (
      !productRail.contains(
        event.relatedTarget
      )
    ) {
      startProductAutoplay();
    }
  }
);


productRail?.addEventListener(
  "touchstart",
  () => {
    stopProductAutoplay({
      resumeAfter: 6500,
    });
  },
  {
    passive: true,
  }
);


/* =========================================================
   NAVEGAÇÃO PELO TECLADO

   As setas visuais foram removidas,
   mas as teclas ← e → continuam disponíveis.
========================================================= */

productRail?.addEventListener(
  "keydown",
  (event) => {
    if (
      event.key === "ArrowLeft"
    ) {
      event.preventDefault();

      stopProductAutoplay({
        resumeAfter: 6500,
      });

      moveRail(-1);
    }


    if (
      event.key === "ArrowRight"
    ) {
      event.preventDefault();

      stopProductAutoplay({
        resumeAfter: 6500,
      });

      moveRail(1);
    }
  }
);


/* =========================================================
   RESIZE
========================================================= */

if (
  productRail &&
  "ResizeObserver" in window
) {
  new ResizeObserver(
    () => {
      updateRailState({
        announce: false,
      });
    }
  ).observe(productRail);
}


window.addEventListener(
  "load",
  () => {
    updateRailState();

    startProductAutoplay();
  },
  {
    once: true,
  }
);


updateRailState();
startProductAutoplay();


/* =========================================================
   PROMOÇÃO EM DESTAQUE
========================================================= */

runSection(
  "promoção em destaque",
  () => {
    const activePromotions =
      (
        getPromotions({
          activeOnly: true,
        }) || []
      ).sort(
        (first, second) =>
          Number(
            Boolean(
              second.destaque
            )
          ) -
          Number(
            Boolean(
              first.destaque
            )
          )
      );


    const promotion =
      activePromotions[0];


    const promotionProduct =
      promotion
        ? publicProducts.find(
            (product) =>
              String(product.id) ===
              String(
                promotion.produtoId
              )
          )
        : null;


    const promotionFeature =
      document.querySelector(
        "[data-promotion-feature]"
      );


    if (!promotionFeature) {
      return;
    }


    if (!promotionProduct) {
      promotionFeature.hidden =
        true;

      return;
    }


    const titleNode =
      promotionFeature.querySelector(
        "[data-promotion-title]"
      );


    const descriptionNode =
      promotionFeature.querySelector(
        "[data-promotion-description]"
      );


    const imageNode =
      promotionFeature.querySelector(
        "[data-promotion-image]"
      );


    const pricesNode =
      promotionFeature.querySelector(
        "[data-promotion-prices]"
      );


    const linkNode =
      promotionFeature.querySelector(
        "[data-promotion-link]"
      );


    if (titleNode) {
      titleNode.textContent =
        promotionProduct.nome;
    }


    if (descriptionNode) {
      descriptionNode.textContent =
        promotionProduct.descricao;
    }


    if (imageNode) {
      const rawImage =
        promotionProduct.imagemModelo ||
        promotionProduct.imagem;


      const safeSrc =
        safeImageUrl(rawImage);


      if (safeSrc) {
        imageNode.src =
          safeSrc;


        imageNode.alt =
          promotionProduct.imagemModelo
            ? `Vista de estilo de ${promotionProduct.nome} numa pessoa com óculos`
            : promotionProduct.nome;
      } else {
        imageNode
          .closest(".promo-media")
          ?.setAttribute(
            "hidden",
            ""
          );
      }
    }


    if (pricesNode) {
      pricesNode.innerHTML = `
        <span class="old-price">
          ${escapeHtml(
            formatMoney(
              promotionProduct.preco
            )
          )}
        </span>

        <span class="price sale-price">
          ${escapeHtml(
            formatMoney(
              promotion.precoPromocional
            )
          )}
        </span>
      `;
    }


    if (linkNode) {
      linkNode.href =
        `${pageUrl(
          "pages/principal/produto-detalhe.html"
        )}?id=${encodeURIComponent(
          promotionProduct.id
        )}`;
    }
  }
);


/* =========================================================
   DADOS DA LOJA
========================================================= */

runSection(
  "dados da loja",
  () => {
    const configuration =
      getConfiguration() || {};


    const locality =
      String(
        configuration.endereco ||
          ""
      )
        .split(",")[0]
        .trim();


    const heroEyebrow =
      document.querySelector(
        ".hero-copy .eyebrow"
      );


    if (
      heroEyebrow &&
      configuration.nomeOptica
    ) {
      heroEyebrow.textContent =
        locality
          ? `${configuration.nomeOptica} · ${locality}`
          : configuration.nomeOptica;
    }


    const appointmentLocation =
      document.querySelector(
        ".appointment-band p"
      );


    if (
      appointmentLocation &&
      locality
    ) {
      appointmentLocation.textContent =
        `Atendimento em ${locality}`;
    }


    document
      .querySelectorAll(
        "[data-store-address]"
      )
      .forEach((node) => {
        if (
          configuration.endereco
        ) {
          node.textContent =
            configuration.endereco;
        }
      });


    document
      .querySelectorAll(
        "[data-store-phone]"
      )
      .forEach((node) => {
        if (
          !configuration.telefone
        ) {
          return;
        }


        node.textContent =
          configuration.telefone;


        node.href =
          telephoneUrl(
            configuration.telefone
          );
      });


    document
      .querySelectorAll(
        "[data-store-hours]"
      )
      .forEach((node) => {
        if (
          configuration.horarioTextual
        ) {
          node.textContent =
            configuration.horarioTextual;
        }
      });


    document
      .querySelectorAll(
        "[data-directions-link]"
      )
      .forEach((node) => {
        node.href =
          directionsUrl(
            configuration
          );
      });


    const map =
      document.querySelector(
        "[data-home-map]"
      );


    const lat =
      Number(
        configuration.latitude
      );


    const lng =
      Number(
        configuration.longitude
      );


    const hasValidCoordinates =
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      (
        lat !== 0 ||
        lng !== 0
      );


    if (map) {
      if (
        hasValidCoordinates
      ) {
        map.src =
          `https://www.google.com/maps?q=${encodeURIComponent(
            `${lat},${lng}`
          )}&z=15&output=embed`;
      } else {
        map
          .closest(
            ".home-location"
          )
          ?.querySelector(
            ".home-map"
          )
          ?.setAttribute(
            "hidden",
            ""
          );


        console.warn(
          "[home.js] Coordenadas da loja em falta ou inválidas — mapa ocultado."
        );
      }
    }
  }
);


/* =========================================================
   ANIMAÇÕES GSAP
========================================================= */

function setupGsapMotion() {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;

  if (!gsap || !ScrollTrigger) {
    console.warn(
      "[home.js] GSAP indisponível — a página continua funcional sem animações."
    );
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  document.body.classList.add("gsap-ready");

  const motion = gsap.matchMedia();

  motion.add("(prefers-reduced-motion: no-preference)", () => {
    const progressBar = document.querySelector(
      "[data-scroll-progress]"
    );

    if (progressBar) {
      gsap.to(progressBar, {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          start: 0,
          end: "max",
          scrub: 0.2,
        },
      });
    }

    const revealGroup = (
      trigger,
      targets,
      options = {}
    ) => {
      const elements = gsap.utils.toArray(targets);

      if (!elements.length) {
        return;
      }

      gsap.from(elements, {
        autoAlpha: 0,
        y: options.y ?? 54,
        x: options.x ?? 0,
        scale: options.scale ?? 1,
        duration: options.duration ?? 0.96,
        stagger: options.stagger ?? 0.12,
        ease: options.ease ?? "power4.out",
        clearProps: "opacity,visibility,transform",
        scrollTrigger: {
          trigger,
          start: options.start ?? "top 86%",
          once: true,
        },
      });
    };

    const heroTimeline = gsap.timeline({
      defaults: {
        ease: "power4.out",
      },
    });

    heroTimeline
      .from(".site-header", {
        autoAlpha: 0,
        y: -36,
        duration: 0.75,
        clearProps: "opacity,visibility,transform",
      })
      .from(".hero-copy > *", {
        autoAlpha: 0,
        y: 62,
        duration: 1.05,
        stagger: 0.14,
        clearProps: "opacity,visibility,transform",
      }, "-=0.28")
      .from(
        ".hero-media > img",
        {
          autoAlpha: 0,
          scale: 1.16,
          duration: 1.6,
          clearProps: "opacity,visibility",
        },
        0.16
      )
      .from(
        ".hero-product-note",
        {
          autoAlpha: 0,
          x: 34,
          y: 42,
          scale: 0.9,
          duration: 0.92,
          clearProps: "opacity,visibility,transform",
        },
        "-=0.62"
      );

    revealGroup(
      ".service-strip",
      ".service-item",
      { y: 42, stagger: 0.11 }
    );
    revealGroup(
      ".category-section",
      ".category-section .section-heading"
    );
    revealGroup(
      ".category-mosaic",
      ".category-card",
      { y: 82, scale: 0.92, stagger: 0.14, duration: 1.08 }
    );
    revealGroup(
      ".product-showcase",
      ".product-showcase .section-heading"
    );
    revealGroup(
      ".product-rail",
      ".product-card",
      { y: 72, scale: 0.94, stagger: 0.11, duration: 1.02 }
    );
    revealGroup(
      ".brand-story",
      ".brand-story-media",
      { x: -96, y: 0, duration: 1.2 }
    );
    revealGroup(
      ".brand-story-copy",
      ".brand-story-copy > *",
      { x: 72, y: 0, stagger: 0.13, duration: 1.02 }
    );
    revealGroup(
      ".promo-feature",
      ".promo-copy > *",
      { x: -72, y: 0, stagger: 0.12, duration: 1.02 }
    );
    revealGroup(
      ".promo-feature",
      ".promo-media",
      { x: 96, y: 0, duration: 1.2 }
    );
    revealGroup(
      ".virtual-grid",
      ".virtual-copy > *",
      { x: -72, y: 0, stagger: 0.12, duration: 1.02 }
    );
    revealGroup(
      ".virtual-grid",
      ".virtual-preview",
      { x: 88, y: 0, scale: 0.94, duration: 1.16 }
    );
    revealGroup(
      ".appointment-band",
      ".appointment-band .container > *",
      { y: 58, stagger: 0.16, duration: 1.02 }
    );
    revealGroup(
      ".home-location",
      ".home-location-copy > *",
      { x: -72, y: 0, stagger: 0.12, duration: 1.02 }
    );
    revealGroup(
      ".home-location",
      ".home-map",
      { x: 92, y: 0, scale: 0.95, duration: 1.18 }
    );
    revealGroup(
      "[data-site-footer]",
      ".footer-main > *",
      { y: 48, stagger: 0.1 }
    );

    gsap.to(".hero-media > img", {
      yPercent: 14,
      ease: "none",
      scrollTrigger: {
        trigger: ".home-hero",
        start: "top top",
        end: "bottom top",
        scrub: 0.55,
      },
    });

    [
      [".brand-story", ".brand-story-media img", -12],
      [".promotion-section", ".promo-media img", -11],
      [".virtual-section", ".virtual-preview img", -10],
    ].forEach(([trigger, target, yPercent]) => {
      if (!document.querySelector(target)) {
        return;
      }

      gsap.fromTo(
        target,
        { yPercent: 6 },
        {
          yPercent,
          ease: "none",
          scrollTrigger: {
            trigger,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.6,
          },
        }
      );
    });

    document.querySelectorAll(".btn").forEach((button) => {
      const hoverIn = () =>
        gsap.to(button, {
          y: -5,
          scale: 1.025,
          duration: 0.24,
          ease: "power2.out",
          overwrite: "auto",
        });
      const hoverOut = () =>
        gsap.to(button, {
          y: 0,
          scale: 1,
          duration: 0.3,
          ease: "power2.out",
          overwrite: "auto",
          clearProps: "transform",
        });

      button.addEventListener("pointerenter", hoverIn);
      button.addEventListener("pointerleave", hoverOut);
    });

    window.addEventListener(
      "load",
      () => ScrollTrigger.refresh(),
      { once: true }
    );
  });
}


setupGsapMotion();


/* =========================================================
   BOTÃO REGRESSAR AO TOPO
========================================================= */

const backToTopButton =
  document.querySelector(
    "[data-back-to-top]"
  );


function updateBackToTopButton() {
  if (!backToTopButton) {
    return;
  }


  backToTopButton.classList.toggle(
    "is-visible",

    window.scrollY >
      Math.max(
        520,
        window.innerHeight *
          0.7
      )
  );
}


backToTopButton?.addEventListener(
  "click",
  () => {
    window.scrollTo({
      top: 0,

      behavior:
        window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches
          ? "auto"
          : "smooth",
    });
  }
);


window.addEventListener(
  "scroll",
  updateBackToTopButton,
  {
    passive: true,
  }
);


updateBackToTopButton();
