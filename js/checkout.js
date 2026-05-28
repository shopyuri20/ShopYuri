function estimateShipping(totalWeightOz) {
    const packed = totalWeightOz + 2;
    if (packed <= 4) return 5.99;
    if (packed <= 8) return 7.49;
    if (packed <= 16) return 9.49;
    if (packed <= 32) return 11.49;
    if (packed <= 48) return 13.49;
    return 15.99;
}

function getCartWeight() {
    return cart.reduce((sum, item) => sum + (item.weight || 3) * item.qty, 0);
}

function getShippingCost() {
    return estimateShipping(getCartWeight());
}

function initPayPalButton() {
    const container = document.getElementById("paypal-button-container");
    if (!container || typeof paypal === "undefined") return;

    container.innerHTML = "";

    paypal.Buttons({
        style: {
            layout: "vertical",
            color: "gold",
            shape: "pill",
            label: "paypal",
        },

        createOrder: function (data, actions) {
            const items = cart.map(item => ({
                name: item.name,
                quantity: String(item.qty),
                unit_amount: {
                    currency_code: "USD",
                    value: item.price.toFixed(2),
                },
                category: "PHYSICAL_GOODS",
            }));

            const subtotal = getCartTotal();
            const shipping = getShippingCost();
            const orderTotal = (subtotal + shipping).toFixed(2);

            return actions.order.create({
                purchase_units: [{
                    description: "ShopYuri order",
                    amount: {
                        currency_code: "USD",
                        value: orderTotal,
                        breakdown: {
                            item_total: {
                                currency_code: "USD",
                                value: subtotal.toFixed(2),
                            },
                            shipping: {
                                currency_code: "USD",
                                value: shipping.toFixed(2),
                            }
                        }
                    },
                    items: items,
                }],
                application_context: {
                    shipping_preference: "GET_FROM_FILE",
                    user_action: "PAY_NOW",
                }
            });
        },

        onShippingAddressChange: function (data, actions) {
            if (data.shipping_address && data.shipping_address.country_code !== "US") {
                return actions.reject();
            }
            return actions.resolve();
        },

        onApprove: function (data, actions) {
            return actions.order.capture().then(function (details) {
                cart = [];
                saveCart();
                updateCartUI();
                window.location.href = "success.html";
            });
        },

        onCancel: function (data) {
            window.location.href = "cancel.html";
        },

        onError: function (err) {
            console.error("PayPal error:", err);
            alert("Something went wrong with PayPal. Please try again.");
        }

    }).render("#paypal-button-container");
}

function loadPayPalSDK() {
    if (typeof PAYPAL_CLIENT_ID === "undefined" || PAYPAL_CLIENT_ID.includes("REPLACE")) return;

    if (document.getElementById("paypal-sdk")) {
        initPayPalButton();
        return;
    }

    const script = document.createElement("script");
    script.id = "paypal-sdk";
    script.src = "https://www.paypal.com/sdk/js?client-id=" + PAYPAL_CLIENT_ID + "&currency=USD";
    script.onload = initPayPalButton;
    document.head.appendChild(script);
}

function setupPayPalInCart() {
    const paypalBtn = document.getElementById("btn-paypal");
    if (!paypalBtn) return;

    const container = document.createElement("div");
    container.id = "paypal-button-container";
    container.style.marginTop = "0.5rem";
    paypalBtn.parentNode.replaceChild(container, paypalBtn);

    loadPayPalSDK();
}

document.addEventListener("DOMContentLoaded", () => {
    setupPayPalInCart();
});