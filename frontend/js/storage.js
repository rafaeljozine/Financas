import { createMockData, LEGACY_SEED_PRODUCT_IMAGES } from "./mock-data.js";

const PREFIX = "opticaExcelente.v4";

export const STORAGE_KEYS = Object.freeze({
  categories: `${PREFIX}.categories`,
  products: `${PREFIX}.products`,
  promotions: `${PREFIX}.promotions`,
  appointments: `${PREFIX}.appointments`,
  schedules: `${PREFIX}.schedules`,
  configuration: `${PREFIX}.configuration`,
  favorites: `${PREFIX}.favorites`,
  cart: `${PREFIX}.cart`,
  initialized: `${PREFIX}.initialized`,
  productAssetsMigrated: `${PREFIX}.migration.productAssets.v1`,
});

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function storage() {
  if (typeof window === "undefined" || !window.localStorage) {
    throw new Error("O armazenamento local não está disponível neste navegador.");
  }
  return window.localStorage;
}

export function readStore(name, fallback = null) {
  const key = STORAGE_KEYS[name];
  if (!key) throw new Error(`Colecção de armazenamento desconhecida: ${name}`);
  try {
    const raw = storage().getItem(key);
    return raw === null ? clone(fallback) : JSON.parse(raw);
  } catch (error) {
    console.error(`Não foi possível ler ${name}.`, error);
    return clone(fallback);
  }
}

export function writeStore(name, value) {
  const key = STORAGE_KEYS[name];
  if (!key) throw new Error(`Colecção de armazenamento desconhecida: ${name}`);
  try {
    storage().setItem(key, JSON.stringify(value));
    if (typeof window.dispatchEvent === "function" && typeof window.CustomEvent === "function") {
      window.dispatchEvent(new window.CustomEvent("opticaExcelente:storechange", {
        detail: {
          name,
          collection: name,
          key,
          value: clone(value),
        },
      }));
    }
    return clone(value);
  } catch (error) {
    if (error?.name === "QuotaExceededError") {
      throw new Error("Não existe espaço local suficiente. Utilize imagens de menor dimensão.");
    }
    throw error;
  }
}

function migrateSeedProductAssets(seedProducts) {
  if (storage().getItem(STORAGE_KEYS.productAssetsMigrated) !== null) return;

  const currentProducts = readStore("products", []);
  if (!Array.isArray(currentProducts)) {
    storage().setItem(STORAGE_KEYS.productAssetsMigrated, "true");
    return;
  }

  const seedsById = new Map(seedProducts.map((product) => [Number(product.id), product]));
  let changed = false;
  const migratedProducts = currentProducts.map((product) => {
    const seed = seedsById.get(Number(product?.id));
    const isKnownSeed = seed
      && product.criadoEm === seed.criadoEm;
    if (!isKnownSeed) return product;

    let migrated = product;
    if (!Object.hasOwn(product, "imagemModelo")) {
      migrated = { ...migrated, imagemModelo: seed.imagemModelo };
      changed = true;
    }

    const legacyImage = LEGACY_SEED_PRODUCT_IMAGES[seed.id];
    if (legacyImage && product.imagem === legacyImage && seed.imagem !== legacyImage) {
      migrated = { ...migrated, imagem: seed.imagem };
      changed = true;
    }
    return migrated;
  });

  if (changed) writeStore("products", migratedProducts);
  storage().setItem(STORAGE_KEYS.productAssetsMigrated, "true");
}

export function initializeStore() {
  const mock = createMockData();
  Object.entries(mock).forEach(([name, value]) => {
    if (storage().getItem(STORAGE_KEYS[name]) === null) writeStore(name, value);
  });
  migrateSeedProductAssets(mock.products);
  storage().setItem(STORAGE_KEYS.initialized, "true");
  return true;
}

export function resetStore() {
  Object.values(STORAGE_KEYS).forEach((key) => storage().removeItem(key));
  initializeStore();
}
