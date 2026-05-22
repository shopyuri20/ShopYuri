(function () {
    const style = document.createElement("style");
    style.textContent = `
        .cart-item { display: flex; align-items: center; gap: 0.75rem; }
        .cart-item-img { width: 52px; height: 52px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }
        .cart-item-details { flex: 1; min-width: 0; }
    `;
    document.head.appendChild(style);
})();

let cart = [];

function renderProductCard(product) {
    const card = document.createElement("div");
    card.className = "product-card";

    const imgHtml = product.image
        ? `<img src="${product.image}" alt="${product.name}" loading="lazy">`
        : `<div class="placeholder-img"></div>`;

    const outOfStock = !product.inStock;

    card.innerHTML = `
    ${imgHtml}
    <div class="product-info">
      <div class="product-name">${product.name}</div>
      <div class="product-desc">${product.description}</div>
      <div class="product-price">$${product.price.toFixed(2)}</div>
    </div>
    <div class="product-actions">
      <button
        class="btn-add-cart"
        data-id="${product.id}"
        ${outOfStock ? "disabled style='opacity:0.5;cursor:not-allowed;'" : ""}
      >
        ${outOfStock ? "Out of Stock" : "Add to Cart "}
      </button>
    </div>
  `;

    if (!outOfStock) {
        card.querySelector(".btn-add-cart").addEventListener("click", () => {
            addToCart(product.id);
        });
    }

    return card;
}

function renderProducts(containerId, filterCategory = null) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";

    const productsToRender = filterCategory
        ? PRODUCTS.filter(p => p.category === filterCategory)
        : PRODUCTS;

    productsToRender.forEach((product) => {
        container.appendChild(renderProductCard(product));
    });
}

function initCart() {
    const savedCart = localStorage.getItem("shop_cart");
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
        } catch (e) {
            cart = [];
        }
    }
    updateCartUI();
}

function saveCart() {
    localStorage.setItem("shop_cart", JSON.stringify(cart));
}

function addToCart(productId) {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product || !product.inStock) return;

    const existingItem = cart.find((item) => item.id === productId);
    if (existingItem) {
        existingItem.qty += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            weight: product.weight || 0,
            image: product.image || null,
            qty: 1,
        });
    }

    saveCart();
    updateCartUI();
    showToast(`${product.name} added to cart!`);
}

function updateQuantity(productId, newQty) {
    const item = cart.find((i) => i.id === productId);
    if (!item) return;

    if (newQty <= 0) {
        cart = cart.filter((i) => i.id !== productId);
    } else {
        item.qty = newQty;
    }

    saveCart();
    updateCartUI();
}

function getCartTotal() {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function updateCartUI() {
    const cartCountElems = document.querySelectorAll(".cart-count");
    const totalQty = cart.reduce((sum, i) => sum + i.qty, 0);
    cartCountElems.forEach((el) => {
        el.textContent = totalQty > 0 ? totalQty : "";
        el.style.cssText = "";
        if (totalQty > 0) {
            el.classList.add("visible");
        } else {
            el.classList.remove("visible");
        }
    });

    const cartItemsContainer = document.getElementById("cart-items");
    if (!cartItemsContainer) return;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="cart-empty">Your cart is empty</p>';
        document.getElementById("cart-total").textContent = "$0.00";
        return;
    }

    cartItemsContainer.innerHTML = "";
    cart.forEach((item) => {
        const itemEl = document.createElement("div");
        itemEl.className = "cart-item";
        const imgHtml = item.image
            ? `<img src="${item.image}" alt="${item.name}" class="cart-item-img" onerror="this.style.display='none'">`
            : "";
        itemEl.innerHTML = `
      ${imgHtml}
      <div class="cart-item-details">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">$${item.price.toFixed(2)}</div>
      </div>
      <div class="cart-item-actions">
        <button class="qty-btn minus" data-id="${item.id}">-</button>
        <span class="cart-item-qty">${item.qty}</span>
        <button class="qty-btn plus" data-id="${item.id}">+</button>
      </div>
    `;

        itemEl.querySelector(".qty-btn.minus").addEventListener("click", () => {
            updateQuantity(item.id, item.qty - 1);
        });
        itemEl.querySelector(".qty-btn.plus").addEventListener("click", () => {
            updateQuantity(item.id, item.qty + 1);
        });

        cartItemsContainer.appendChild(itemEl);
    });

    document.getElementById("cart-total").textContent = `$${getCartTotal().toFixed(2)}`;
}

function openCart() {
    document.getElementById("cart-sidebar")?.classList.add("open");
    document.getElementById("cart-overlay")?.classList.add("open");
    document.body.style.overflow = "hidden";
}

function closeCart() {
    document.getElementById("cart-sidebar")?.classList.remove("open");
    document.getElementById("cart-overlay")?.classList.remove("open");
    document.body.style.overflow = "";
}

function showToast(message) {
    let toast = document.getElementById("toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        toast.className = "toast";
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2500);
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelector(".cart-btn")?.addEventListener("click", openCart);
    document.getElementById("cart-close")?.addEventListener("click", closeCart);
    document.getElementById("cart-overlay")?.addEventListener("click", closeCart);
    initCart();
});