import { initializeStore, readStore, writeStore } from "./storage.js";

const APPOINTMENT_STATES = ["Pendente", "Confirmada", "Concluída", "Cancelada"];

export function initializeData() {
  return initializeStore();
}

function nextId(records) {
  return records.reduce((highest, item) => Math.max(highest, Number(item.id) || 0), 0) + 1;
}

function todayIso() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

function required(value, label) {
  if (String(value ?? "").trim() === "") throw new Error(`${label} é obrigatório.`);
}

function normalizeId(value) {
  const id = Number(value);
  if (!Number.isFinite(id)) throw new Error("Identificador inválido.");
  return id;
}

export function formatMoney(value) {
  const amount = Number(value) || 0;
  const rounded = Math.round(amount);
  return `${String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} MT`;
}

export function isPromotionActive(promotion, referenceDate = todayIso()) {
  return Boolean(
    promotion?.ativo &&
    promotion.dataInicial <= referenceDate &&
    promotion.dataFinal >= referenceDate
  );
}

export function getCategories() {
  initializeData();
  return readStore("categories", []).sort((a, b) => a.nome.localeCompare(b.nome, "pt"));
}

export function getCategoryById(id) {
  return getCategories().find((category) => Number(category.id) === Number(id)) || null;
}

function enrichProduct(product) {
  const category = getCategoryById(product.categoriaId);
  const promotion = getProductPromotion(product.id);
  const promotionalPrice = promotion ? Number(promotion.precoPromocional) : null;
  return {
    ...product,
    imagemModelo: product.imagemModelo || "",
    imagemVirtual: product.imagemVirtual || "",
    testeVirtual: Boolean(product.testeVirtual && product.imagemVirtual),
    categoria: category?.nome || "Sem categoria",
    categoriaNome: category?.nome || "Sem categoria",
    promocao: promotion,
    precoPromocional: promotionalPrice,
    precoActual: promotionalPrice ?? Number(product.preco),
  };
}

export function getProducts(options = {}) {
  initializeData();
  let products = readStore("products", []).map(enrichProduct);
  if (options.publicOnly || options.availableOnly) products = products.filter((product) => product.disponivel);
  if (options.category || options.categoria) {
    const category = String(options.category || options.categoria).toLocaleLowerCase("pt");
    products = products.filter((product) => product.categoria.toLocaleLowerCase("pt") === category || String(product.categoriaId) === category);
  }
  if (options.search) {
    const term = String(options.search).trim().toLocaleLowerCase("pt");
    products = products.filter((product) => `${product.nome} ${product.descricao} ${product.categoria}`.toLocaleLowerCase("pt").includes(term));
  }
  if (options.promotionsOnly) products = products.filter((product) => getProductPromotion(product.id));
  if (options.sort === "price-asc") products.sort((a, b) => a.preco - b.preco);
  else if (options.sort === "price-desc") products.sort((a, b) => b.preco - a.preco);
  else if (options.sort === "name") products.sort((a, b) => a.nome.localeCompare(b.nome, "pt"));
  else products.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
  return products;
}

export function getProductById(id) {
  initializeData();
  const product = readStore("products", []).find((item) => Number(item.id) === Number(id));
  return product ? enrichProduct(product) : null;
}

function validateProduct(data) {
  required(data.nome, "O nome");
  required(data.descricao, "A descrição");
  const price = Number(data.preco);
  if (!Number.isFinite(price) || price <= 0) throw new Error("O preço deve ser superior a zero.");
  if (!getCategoryById(data.categoriaId)) throw new Error("Seleccione uma categoria válida.");
}

export function createProduct(data) {
  validateProduct(data);
  const products = readStore("products", []);
  const virtualImage = data.imagemVirtual || "";
  const product = {
    id: nextId(products),
    nome: String(data.nome).trim(),
    descricao: String(data.descricao).trim(),
    preco: Number(data.preco),
    categoriaId: Number(data.categoriaId),
    imagem: data.imagem || "",
    imagemModelo: data.imagemModelo || "",
    disponivel: data.disponivel !== false,
    destaque: Boolean(data.destaque),
    testeVirtual: Boolean(data.testeVirtual && virtualImage),
    imagemVirtual: virtualImage,
    criadoEm: new Date().toISOString(),
  };
  products.push(product);
  writeStore("products", products);
  return enrichProduct(product);
}

export function updateProduct(id, data) {
  const productId = normalizeId(id);
  const products = readStore("products", []);
  const index = products.findIndex((item) => Number(item.id) === productId);
  if (index < 0) throw new Error("Produto não encontrado.");
  const updated = {
    ...products[index],
    ...data,
    id: productId,
    preco: Number(data.preco ?? products[index].preco),
    categoriaId: Number(data.categoriaId ?? products[index].categoriaId),
  };
  updated.imagem = updated.imagem || "";
  updated.imagemModelo = updated.imagemModelo || "";
  updated.imagemVirtual = updated.imagemVirtual || "";
  updated.testeVirtual = Boolean(updated.testeVirtual && updated.imagemVirtual);
  validateProduct(updated);
  products[index] = updated;
  writeStore("products", products);
  return enrichProduct(updated);
}

export function deleteProduct(id) {
  const productId = normalizeId(id);
  const products = readStore("products", []);
  if (!products.some((item) => Number(item.id) === productId)) throw new Error("Produto não encontrado.");
  writeStore("products", products.filter((item) => Number(item.id) !== productId));
  writeStore("promotions", readStore("promotions", []).filter((promotion) => Number(promotion.produtoId) !== productId));
  writeStore("favorites", normalizeStoredProductIds(readStore("favorites", [])).filter((itemId) => itemId !== productId));
  writeStore("cart", normalizeStoredProductIds(readStore("cart", [])).filter((itemId) => itemId !== productId));
  return true;
}

export function toggleProductAvailability(id) {
  const product = getProductById(id);
  if (!product) throw new Error("Produto não encontrado.");
  return updateProduct(id, { disponivel: !product.disponivel });
}

function normalizeStoredProductIds(value) {
  if (!Array.isArray(value)) return [];
  const ids = value
    .map((item) => Number(typeof item === "object" && item !== null ? (item.produtoId ?? item.id) : item))
    .filter((id) => Number.isFinite(id));
  return [...new Set(ids)];
}

function getStoredPublicProducts(storeName) {
  const stored = readStore(storeName, []);
  const ids = normalizeStoredProductIds(stored);
  const products = ids
    .map((id) => getProductById(id))
    .filter((product) => product?.disponivel);
  const validIds = products.map((product) => Number(product.id));
  if (!Array.isArray(stored) || JSON.stringify(stored) !== JSON.stringify(validIds)) {
    writeStore(storeName, validIds);
  }
  return products;
}

function requireAvailableProduct(id) {
  const productId = normalizeId(id);
  const product = getProductById(productId);
  if (!product) throw new Error("Produto não encontrado.");
  if (!product.disponivel) throw new Error("Este produto não está disponível.");
  return product;
}

export function getFavorites() {
  initializeData();
  return getStoredPublicProducts("favorites");
}

export function toggleFavorite(id) {
  initializeData();
  const productId = normalizeId(id);
  const favorites = normalizeStoredProductIds(readStore("favorites", []));
  if (favorites.includes(productId)) {
    writeStore("favorites", favorites.filter((itemId) => itemId !== productId));
    return false;
  }
  requireAvailableProduct(productId);
  writeStore("favorites", [...favorites, productId]);
  return true;
}

export function getCart() {
  initializeData();
  return getStoredPublicProducts("cart");
}

export function addToCart(id) {
  initializeData();
  const product = requireAvailableProduct(id);
  const cart = normalizeStoredProductIds(readStore("cart", []));
  if (!cart.includes(Number(product.id))) writeStore("cart", [...cart, Number(product.id)]);
  return getCart();
}

export function removeFromCart(id) {
  initializeData();
  const productId = normalizeId(id);
  const cart = normalizeStoredProductIds(readStore("cart", []));
  writeStore("cart", cart.filter((itemId) => itemId !== productId));
  return getCart();
}

export function clearCart() {
  initializeData();
  writeStore("cart", []);
  return [];
}

export function createCategory(data) {
  required(data.nome, "O nome");
  const categories = readStore("categories", []);
  if (categories.some((item) => item.nome.toLocaleLowerCase("pt") === data.nome.trim().toLocaleLowerCase("pt"))) throw new Error("Já existe uma categoria com este nome.");
  const category = { id: nextId(categories), nome: data.nome.trim(), descricao: String(data.descricao || "").trim(), ativo: data.ativo !== false, criadoEm: new Date().toISOString() };
  categories.push(category);
  writeStore("categories", categories);
  return category;
}

export function updateCategory(id, data) {
  const categoryId = normalizeId(id);
  const categories = readStore("categories", []);
  const index = categories.findIndex((item) => Number(item.id) === categoryId);
  if (index < 0) throw new Error("Categoria não encontrada.");
  required(data.nome ?? categories[index].nome, "O nome");
  categories[index] = { ...categories[index], ...data, id: categoryId, nome: String(data.nome ?? categories[index].nome).trim() };
  writeStore("categories", categories);
  return categories[index];
}

export function deleteCategory(id) {
  const categoryId = normalizeId(id);
  if (readStore("products", []).some((product) => Number(product.categoriaId) === categoryId)) throw new Error("Esta categoria está associada a produtos. Altere esses produtos antes de a eliminar.");
  const categories = readStore("categories", []);
  if (!categories.some((item) => Number(item.id) === categoryId)) throw new Error("Categoria não encontrada.");
  writeStore("categories", categories.filter((item) => Number(item.id) !== categoryId));
  return true;
}

export function getPromotions(options = {}) {
  initializeData();
  let promotions = readStore("promotions", []);
  if (options.activeOnly) promotions = promotions.filter((promotion) => isPromotionActive(promotion));
  return promotions.sort((a, b) => new Date(b.dataInicial) - new Date(a.dataInicial));
}

export function getPromotionById(id) {
  return getPromotions().find((promotion) => Number(promotion.id) === Number(id)) || null;
}

export function getProductPromotion(productId) {
  return getPromotions({ activeOnly: true })
    .filter((promotion) => Number(promotion.produtoId) === Number(productId))
    .sort((a, b) => Number(a.precoPromocional) - Number(b.precoPromocional))[0] || null;
}

function validatePromotion(data) {
  const product = getProductById(data.produtoId);
  if (!product) throw new Error("Seleccione um produto válido.");
  const price = Number(data.precoPromocional);
  if (!Number.isFinite(price) || price <= 0 || price >= Number(product.preco)) throw new Error("O preço promocional deve ser inferior ao preço normal.");
  required(data.dataInicial, "A data inicial");
  required(data.dataFinal, "A data final");
  if (data.dataFinal < data.dataInicial) throw new Error("A data final não pode ser anterior à data inicial.");
}

export function createPromotion(data) {
  validatePromotion(data);
  const promotions = readStore("promotions", []);
  const promotion = { id: nextId(promotions), produtoId: Number(data.produtoId), precoPromocional: Number(data.precoPromocional), dataInicial: data.dataInicial, dataFinal: data.dataFinal, destaque: Boolean(data.destaque), ativo: data.ativo !== false, criadoEm: new Date().toISOString() };
  promotions.push(promotion);
  writeStore("promotions", promotions);
  return promotion;
}

export function updatePromotion(id, data) {
  const promotionId = normalizeId(id);
  const promotions = readStore("promotions", []);
  const index = promotions.findIndex((item) => Number(item.id) === promotionId);
  if (index < 0) throw new Error("Promoção não encontrada.");
  const updated = { ...promotions[index], ...data, id: promotionId, produtoId: Number(data.produtoId ?? promotions[index].produtoId), precoPromocional: Number(data.precoPromocional ?? promotions[index].precoPromocional) };
  validatePromotion(updated);
  promotions[index] = updated;
  writeStore("promotions", promotions);
  return updated;
}

export function deletePromotion(id) {
  const promotionId = normalizeId(id);
  const promotions = readStore("promotions", []);
  if (!promotions.some((item) => Number(item.id) === promotionId)) throw new Error("Promoção não encontrada.");
  writeStore("promotions", promotions.filter((item) => Number(item.id) !== promotionId));
  return true;
}

export function togglePromotion(id) {
  const promotion = getPromotionById(id);
  if (!promotion) throw new Error("Promoção não encontrada.");
  return updatePromotion(id, { ativo: !promotion.ativo });
}

export function getAppointments(options = {}) {
  initializeData();
  let appointments = readStore("appointments", []);
  if (options.status || options.estado) appointments = appointments.filter((item) => item.estado === (options.status || options.estado));
  return appointments.sort((a, b) => `${a.data}T${a.horario}`.localeCompare(`${b.data}T${b.horario}`));
}

export function getSchedules() {
  initializeData();
  return readStore("schedules", []).sort((a, b) => a.diaSemana - b.diaSemana);
}

function toMinutes(time) {
  const [hours, minutes] = String(time).split(":").map(Number);
  return (hours * 60) + minutes;
}

function fromMinutes(total) {
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function getAvailableSlots(dateString) {
  if (!dateString) return [];
  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime()) || dateString < todayIso()) return [];
  const schedule = getSchedules().find((item) => Number(item.diaSemana) === date.getDay());
  if (!schedule?.ativo) return [];
  const start = toMinutes(schedule.abertura);
  const end = toMinutes(schedule.encerramento);
  const duration = Math.max(15, Number(schedule.duracaoConsulta) || 60);
  const occupied = new Set(getAppointments().filter((item) => item.data === dateString && item.estado !== "Cancelada").map((item) => item.horario));
  const slots = [];
  for (let minute = start; minute + duration <= end + 1; minute += duration) {
    const slot = fromMinutes(minute);
    if (!occupied.has(slot)) slots.push(slot);
  }
  return slots;
}

export function createAppointment(data) {
  required(data.nomeCompleto, "O nome completo");
  required(data.contacto, "O contacto");
  required(data.tipoConsulta, "O tipo de consulta");
  required(data.data, "A data");
  required(data.horario, "O horário");
  if (data.data < todayIso()) throw new Error("Não é possível marcar uma data passada.");
  if (!getAvailableSlots(data.data).includes(data.horario)) throw new Error("Este horário já não está disponível.");
  const appointments = readStore("appointments", []);
  const appointment = { id: nextId(appointments), nomeCompleto: data.nomeCompleto.trim(), contacto: data.contacto.trim(), tipoConsulta: data.tipoConsulta, data: data.data, horario: data.horario, observacoes: String(data.observacoes || "").trim(), estado: "Pendente", criadoEm: new Date().toISOString() };
  appointments.push(appointment);
  writeStore("appointments", appointments);
  return appointment;
}

export function updateAppointmentStatus(id, status) {
  if (!APPOINTMENT_STATES.includes(status)) throw new Error("Estado de marcação inválido.");
  const appointmentId = normalizeId(id);
  const appointments = readStore("appointments", []);
  const index = appointments.findIndex((item) => Number(item.id) === appointmentId);
  if (index < 0) throw new Error("Marcação não encontrada.");
  appointments[index] = { ...appointments[index], estado: status };
  writeStore("appointments", appointments);
  return appointments[index];
}

export function updateSchedules(schedules) {
  if (!Array.isArray(schedules) || schedules.length !== 7) throw new Error("Configure os sete dias da semana.");
  schedules.forEach((schedule) => {
    if (schedule.ativo && (toMinutes(schedule.encerramento) <= toMinutes(schedule.abertura))) throw new Error("O encerramento deve ser posterior à abertura.");
    if (Number(schedule.duracaoConsulta) < 15) throw new Error("A duração mínima da consulta é de 15 minutos.");
  });
  return writeStore("schedules", schedules.map((item) => ({ ...item, diaSemana: Number(item.diaSemana), duracaoConsulta: Number(item.duracaoConsulta) })));
}

export function getConfiguration() {
  initializeData();
  return readStore("configuration", {});
}

export function updateConfiguration(data) {
  const current = getConfiguration();
  const allowed = ["nomeOptica", "slogan", "telefone", "whatsapp", "endereco", "latitude", "longitude", "horarioTextual", "facebook", "logo"];
  const updated = { ...current };
  allowed.forEach((key) => {
    if (Object.hasOwn(data, key)) updated[key] = data[key];
  });
  required(updated.nomeOptica, "O nome da óptica");
  required(updated.slogan, "O slogan");
  required(updated.telefone, "O telefone");
  required(updated.whatsapp, "O WhatsApp");
  required(updated.endereco, "O endereço");
  if (!Number.isFinite(Number(updated.latitude)) || !Number.isFinite(Number(updated.longitude))) throw new Error("As coordenadas são inválidas.");
  updated.latitude = Number(updated.latitude);
  updated.longitude = Number(updated.longitude);
  return writeStore("configuration", updated);
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve("");
    if (!file.type.startsWith("image/")) return reject(new Error("Seleccione um ficheiro de imagem válido."));
    if (file.size > 1_500_000) return reject(new Error("A imagem deve ter no máximo 1,5 MB nesta demonstração local."));
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(new Error("Não foi possível ler a imagem.")));
    reader.readAsDataURL(file);
  });
}

initializeData();
