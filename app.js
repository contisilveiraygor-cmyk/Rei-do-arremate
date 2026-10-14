const state = {
  products: [],
  categories: [],
  whatsappNumber: "",
  filters: {
    search: "",
    category: "",
    price: "",
    sort: "recent",
  },
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const productGrid = document.querySelector("#productGrid");
const emptyState = document.querySelector("#emptyState");
const categorySelect = document.querySelector("#categorySelect");
const searchInput = document.querySelector("#searchInput");
const priceSelect = document.querySelector("#priceSelect");
const sortSelect = document.querySelector("#sortSelect");
const totalProducts = document.querySelector("#totalProducts");
const limitedProducts = document.querySelector("#limitedProducts");
const lastUpdate = document.querySelector("#lastUpdate");
const productDialog = document.querySelector("#productDialog");
const dialogContent = document.querySelector("#dialogContent");
const closeDialogButton = document.querySelector("#closeDialogButton");
const copyListButton = document.querySelector("#copyListButton");
const whatsappHeaderButton = document.querySelector("#whatsappHeaderButton");
const toast = document.querySelector("#toast");

async function init() {
  const response = await fetch("data/produtos.json");
  const payload = await response.json();

  state.products = payload.products;
  state.categories = payload.categories;
  state.whatsappNumber = payload.whatsappNumber || "";

  renderCategories();
  renderStats(payload.generatedAt);
  bindEvents();
  renderProducts();
}

function bindEvents() {
  searchInput.addEventListener("input", (event) => {
    state.filters.search = event.target.value.trim().toLowerCase();
    renderProducts();
  });

  categorySelect.addEventListener("change", (event) => {
    state.filters.category = event.target.value;
    renderProducts();
  });

  priceSelect.addEventListener("change", (event) => {
    state.filters.price = event.target.value;
    renderProducts();
  });

  sortSelect.addEventListener("change", (event) => {
    state.filters.sort = event.target.value;
    renderProducts();
  });

  closeDialogButton.addEventListener("click", () => productDialog.close());

  productDialog.addEventListener("click", (event) => {
    if (event.target === productDialog) {
      productDialog.close();
    }
  });

  copyListButton.addEventListener("click", () => {
    const visible = getFilteredProducts();
    const text = visible
      .slice(0, 20)
      .map((product) => `${product.ref} - ${product.nome} - ${formatPrice(product.precoRevenda)}`)
      .join("\n");
    copyText(text, "Lista copiada");
  });

  whatsappHeaderButton.addEventListener("click", (event) => {
    event.preventDefault();
    openWhatsapp("Olá, quero consultar os produtos disponíveis do Rei do Arremate.");
  });
}

function renderCategories() {
  state.categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
}

function renderStats(generatedAt) {
  totalProducts.textContent = state.products.length;
  limitedProducts.textContent = state.products.filter((product) => Number(product.quantidade) <= 2).length;
  lastUpdate.textContent = formatDate(generatedAt);
}

function getFilteredProducts() {
  const { search, category, price, sort } = state.filters;
  const filtered = state.products.filter((product) => {
    const searchText = `${product.nome} ${product.ref} ${product.categoria}`.toLowerCase();
    const matchesSearch = !search || searchText.includes(search);
    const matchesCategory = !category || product.categoria === category;
    const matchesPrice = !price || isInPriceRange(product.precoRevendaNum, price);
    return matchesSearch && matchesCategory && matchesPrice;
  });

  return filtered.sort((a, b) => {
    if (sort === "priceAsc") return a.precoRevendaNum - b.precoRevendaNum;
    if (sort === "priceDesc") return b.precoRevendaNum - a.precoRevendaNum;
    if (sort === "quantityDesc") return Number(b.quantidade) - Number(a.quantidade);
    return new Date(b.dataCaptura) - new Date(a.dataCaptura);
  });
}

function renderProducts() {
  const products = getFilteredProducts();
  productGrid.innerHTML = "";
  emptyState.hidden = products.length > 0;

  const fragment = document.createDocumentFragment();
  products.forEach((product) => {
    fragment.appendChild(createProductCard(product));
  });
  productGrid.appendChild(fragment);
}

function createProductCard(product) {
  const card = document.createElement("article");
  card.className = "product-card";
  card.innerHTML = `
    <button class="product-image-button" type="button" aria-label="Ver ${escapeHtml(product.nome)}">
      <img src="${product.imagem}" alt="${escapeHtml(product.nome)}" loading="lazy" />
    </button>
    <div class="product-body">
      <div class="product-meta">
        <span class="pill">${escapeHtml(product.categoria)}</span>
        <span class="pill ${Number(product.quantidade) <= 2 ? "stock-low" : ""}">Qtd ${product.quantidade}</span>
        <span class="pill">${escapeHtml(product.ref)}</span>
      </div>
      <h2 class="product-title">${escapeHtml(product.nome)}</h2>
      <div class="price-row">
        <div>
          <span>Preço de revenda</span>
          <strong>${formatPrice(product.precoRevenda)}</strong>
        </div>
      </div>
      <div class="card-actions">
        <button class="primary-button" type="button" data-consult="${product.id}">Consultar</button>
        <button class="detail-button" type="button" data-detail="${product.id}" aria-label="Detalhes">+</button>
      </div>
    </div>
  `;

  card.querySelector(".product-image-button").addEventListener("click", () => openProductDialog(product));
  card.querySelector("[data-detail]").addEventListener("click", () => openProductDialog(product));
  card.querySelector("[data-consult]").addEventListener("click", () => {
    openWhatsapp(createProductMessage(product));
  });

  return card;
}

function openProductDialog(product) {
  dialogContent.innerHTML = `
    <article class="dialog-product">
      <figure>
        <img src="${product.imagem}" alt="${escapeHtml(product.nome)}" />
      </figure>
      <section class="dialog-info">
        <div class="product-meta">
          <span class="pill">${escapeHtml(product.categoria)}</span>
          <span class="pill ${Number(product.quantidade) <= 2 ? "stock-low" : ""}">Qtd ${product.quantidade}</span>
          <span class="pill">${escapeHtml(product.ref)}</span>
        </div>
        <h2>${escapeHtml(product.nome)}</h2>
        <p>${escapeHtml(product.descricao)}</p>
        <dl class="detail-list">
          <div>
            <dt>Revenda</dt>
            <dd>${formatPrice(product.precoRevenda)}</dd>
          </div>
          <div>
            <dt>Referencia</dt>
            <dd>${escapeHtml(product.ref)}</dd>
          </div>
          <div>
            <dt>Quantidade</dt>
            <dd>${product.quantidade}</dd>
          </div>
          <div>
            <dt>Fotos</dt>
            <dd>${product.imagensTotal}</dd>
          </div>
        </dl>
        <button class="primary-button" type="button" id="dialogConsultButton">Consultar disponibilidade</button>
      </section>
    </article>
  `;

  dialogContent.querySelector("#dialogConsultButton").addEventListener("click", () => {
    openWhatsapp(createProductMessage(product));
  });

  productDialog.showModal();
}

function createProductMessage(product) {
  return [
    "Olá, quero consultar a disponibilidade deste produto:",
    `${product.nome}`,
    `Referência: ${product.ref}`,
    `Preço: ${formatPrice(product.precoRevenda)}`,
    `Quantidade informada: ${product.quantidade}`,
  ].join("\n");
}

function openWhatsapp(message) {
  if (!state.whatsappNumber) {
    copyText(message, "Mensagem copiada. Configure o número do WhatsApp para abrir direto.");
    return;
  }

  const url = `https://wa.me/${state.whatsappNumber}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function copyText(text, successMessage) {
  navigator.clipboard
    .writeText(text)
    .then(() => showToast(successMessage))
    .catch(() => showToast(text));
}

function isInPriceRange(price, range) {
  const [min, max] = range.split("-").map(Number);
  return price >= min && price < max;
}

function formatPrice(value) {
  if (typeof value === "number") {
    return currency.format(value);
  }

  if (!value) return "Sob consulta";
  return `R$ ${value}`;
}

function formatDate(value) {
  if (!value) return "--";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    toast.classList.remove("visible");
  }, 3200);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

init().catch((error) => {
  console.error(error);
  showToast("Não foi possível carregar a vitrine.");
});
