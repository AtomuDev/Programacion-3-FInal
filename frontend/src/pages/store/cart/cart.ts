import type { CartItem, Product } from "../../../types/product";
import type { FormaPago, Pedido } from "../../../types/order";
import { getProductos } from "../../../utils/api.ts";
import { getCart, saveCart, clearCart, getCartCount } from "../../../utils/cart.ts";
import { getSessionUser } from "../../../utils/localStorage";
import { logout } from "../../../utils/auth";
import { savePedidoLocal } from "../../../utils/orders.ts";

// Referencias al DOM
const contenedorCarrito = document.getElementById("contenedor-carrito") as HTMLElement;
const carritoVacio = document.getElementById("carrito-vacio") as HTMLElement;
const btnVaciar = document.getElementById("btn-vaciar") as HTMLButtonElement;
const btnFinalizar = document.getElementById("btn-finalizar") as HTMLButtonElement;
const summarySubtotal = document.getElementById("summary-subtotal") as HTMLElement;
const summaryEnvio = document.getElementById("summary-envio") as HTMLElement;
const summaryTotal = document.getElementById("summary-total") as HTMLElement;
const orderSummary = document.getElementById("order-summary") as HTMLElement;
const mainBody = document.querySelector(".main__body") as HTMLElement;

const modalCheckout = document.getElementById("modal-checkout") as HTMLElement;
const modalClose = document.getElementById("modal-close") as HTMLButtonElement;
const modalBody = document.getElementById("modal-body") as HTMLElement;
const checkoutTotal = document.getElementById("checkout-total") as HTMLElement;
const checkoutError = document.getElementById("checkout-error") as HTMLElement;
const btnConfirmarPedido = document.getElementById("btn-confirmar-pedido") as HTMLButtonElement;

// Costo de envío fijo
const COSTO_ENVIO = 5000;

// Estado en memoria: productos cargados desde el JSON, para cruzar con el carrito
let productosCache: Product[] = [];


// Helpers de cálculo
// ---------------------------------------------------------------
const productoDe = (item: CartItem): Product | undefined => productosCache.find((p) => p.id === item.productId);

const calcularSubtotal = (carrito: CartItem[]): number => {
    return carrito.reduce((acc, item) => {
        const producto = productoDe(item);
        return acc + (producto ? producto.precio * item.quantity : 0);
    }, 0);
};

const stockClass = (stock: number, quantity: number): string => {
    const restante = stock - quantity;
    if (restante <= 0) return "cart-item__stock--out";
    if (restante <= 3) return "cart-item__stock--low";
    return "";
};

const stockTexto = (stock: number, quantity: number): string => {
    const restante = stock - quantity;
    if (restante <= 0) return "Sin stock adicional disponible";
    if (restante === 1) return "¡Último disponible!";
    if (restante <= 3) return `Solo quedan ${restante} en stock`;
    return `Stock disponible: ${restante}`;
};


// Navbar
// ---------------------------------------------------------------
const actualizarBadgeNavbar = (): void => {
    const total = getCartCount();
    const linkCarrito = document.getElementById("linkCarrito") as HTMLAnchorElement;
    linkCarrito.innerHTML = total > 0 ? `Carrito <span class="carrito-badge">${total}</span>` : "Carrito";
};

const setupNavbar = (): void => {
    const user = getSessionUser();
    const linkAdmin = document.getElementById("linkAdmin") as HTMLAnchorElement;
    if (user && user.rol === "ADMIN") {
        linkAdmin.style.display = "";
    }
};

const buttonLogout = document.getElementById("logoutButton") as HTMLButtonElement;
buttonLogout?.addEventListener("click", () => logout());


// Resumen del pedido
// ---------------------------------------------------------------
const actualizarResumen = (carrito: CartItem[]): void => {
    const subtotal = calcularSubtotal(carrito);
    const total = subtotal + (carrito.length > 0 ? COSTO_ENVIO : 0);

    summarySubtotal.textContent = `$${subtotal.toLocaleString("es-AR")}`;
    summaryEnvio.textContent = carrito.length === 0 ? "$0" : `$${COSTO_ENVIO.toLocaleString("es-AR")}`;
    summaryTotal.textContent = `$${total.toLocaleString("es-AR")}`;

    const vacio = carrito.length === 0;
    orderSummary.style.display = vacio ? "none" : "";
    btnFinalizar.disabled = vacio;
    btnVaciar.style.display = vacio ? "none" : "";
};


// Render del carrito
// ---------------------------------------------------------------
const renderCarrito = (): void => {
    const carrito = getCart();
    contenedorCarrito.innerHTML = "";

    if (carrito.length === 0) {
        contenedorCarrito.style.display = "none";
        carritoVacio.style.display = "block";
        carritoVacio.innerHTML = `
            <div class="orders__empty">
                <p>No tenés productos en el carrito todavía.</p>
                <p><a href="/src/pages/store/home/home.html">Ir al catálogo</a></p>
            </div>
        `;
        mainBody.classList.add("main__body--vacio");
        actualizarResumen([]);
        actualizarBadgeNavbar();
        return;
    }

    contenedorCarrito.style.display = "";
    carritoVacio.style.display = "none";
    carritoVacio.innerHTML = "";
    mainBody.classList.remove("main__body--vacio");

    carrito.forEach((item: CartItem) => {
        const producto = productoDe(item);
        if (!producto) return;

        const div = document.createElement("div");
        div.classList.add("cart-item");
        div.innerHTML = `
            <div class="cart-item__top">
                <img src="${producto.imagen}" alt="${producto.nombre}" class="cart-item__img">
                <div class="cart-item__info">
                    <h3>${producto.nombre}</h3>
                    <p>Precio: $${producto.precio.toLocaleString("es-AR")}</p>
                    <p>Subtotal: $${(producto.precio * item.quantity).toLocaleString("es-AR")}</p>
                    <p class="cart-item__stock ${stockClass(producto.stock, item.quantity)}">
                        ${stockTexto(producto.stock, item.quantity)}
                    </p>
                </div>
            </div>
            <div class="cart-item__actions">
                <div class="quantity-control">
                    <button type="button" data-id="${producto.id}" class="btn-restar" ${item.quantity <= 1 ? "disabled" : ""}>−</button>
                    <span class="quantity-control__value">${item.quantity}</span>
                    <button type="button" data-id="${producto.id}" class="btn-sumar" ${item.quantity >= producto.stock ? "disabled" : ""}>+</button>
                </div>
                <button type="button" data-id="${producto.id}" class="btn-eliminar">Eliminar</button>
            </div>`;
        contenedorCarrito.appendChild(div);
    });

    actualizarResumen(carrito);
    actualizarBadgeNavbar();

    contenedorCarrito.querySelectorAll(".btn-sumar").forEach((btn) => {
        btn.addEventListener("click", () => cambiarCantidad(Number((btn as HTMLElement).dataset.id), 1));
    });
    contenedorCarrito.querySelectorAll(".btn-restar").forEach((btn) => {
        btn.addEventListener("click", () => cambiarCantidad(Number((btn as HTMLElement).dataset.id), -1));
    });
    contenedorCarrito.querySelectorAll(".btn-eliminar").forEach((btn) => {
        btn.addEventListener("click", () => eliminarProducto(Number((btn as HTMLElement).dataset.id)));
    });
};

const cambiarCantidad = (productId: number, delta: number): void => {
    const carrito = getCart();
    const item = carrito.find((i) => i.productId === productId);
    const producto = productosCache.find((p) => p.id === productId);
    if (!item || !producto) return;

    if (delta > 0 && item.quantity >= producto.stock) return;

    item.quantity += delta;

    if (item.quantity <= 0) {
        eliminarProducto(productId);
        return;
    }

    saveCart(carrito);
    renderCarrito();
};

const eliminarProducto = (productId: number): void => {
    const carrito = getCart().filter((i) => i.productId !== productId);
    saveCart(carrito);
    renderCarrito();
};

btnVaciar.addEventListener("click", () => {
    if (confirm("¿Vaciar el carrito?")) {
        clearCart();
        renderCarrito();
    }
});


// Checkout: abrir modal, validar y confirmar pedido
// ---------------------------------------------------------------
const abrirModal = (): void => {
    const carrito = getCart();
    if (carrito.length === 0) return;

    const total = calcularSubtotal(carrito) + COSTO_ENVIO;
    checkoutTotal.textContent = `$${total.toLocaleString("es-AR")}`;
    checkoutError.style.display = "none";
    modalCheckout.style.display = "flex";
};

const cerrarModal = (): void => {
    modalCheckout.style.display = "none";
};

btnFinalizar.addEventListener("click", abrirModal);
modalClose.addEventListener("click", cerrarModal);
modalCheckout.addEventListener("click", (e) => {
    if (e.target === modalCheckout) cerrarModal();
});

btnConfirmarPedido.addEventListener("click", () => {
    const telefonoInput = document.getElementById("checkout-telefono") as HTMLInputElement;
    const direccionInput = document.getElementById("checkout-direccion") as HTMLInputElement;
    const pagoSelect = document.getElementById("checkout-pago") as HTMLSelectElement;
    const notasInput = document.getElementById("checkout-notas") as HTMLTextAreaElement;

    const telefono = telefonoInput.value.trim();
    const direccion = direccionInput.value.trim();
    const formaPago = pagoSelect.value as FormaPago | "";
    const notas = notasInput.value.trim();

    const MAX_TELEFONO = 20;
    const MAX_DIRECCION = 50;

    if (telefono.length > MAX_TELEFONO) {
        checkoutError.textContent = `El teléfono no puede tener más de ${MAX_TELEFONO} caracteres.`;
        checkoutError.style.display = "block";
        return;
    }

    if (direccion.length > MAX_DIRECCION) {
        checkoutError.textContent = `La dirección no puede tener más de ${MAX_DIRECCION} caracteres.`;
        checkoutError.style.display = "block";
        return;
    }

    if (!telefono || !direccion || !formaPago) {
        checkoutError.textContent = "Completá teléfono, dirección y método de pago.";
        checkoutError.style.display = "block";
        return;
    }

    const user = getSessionUser();
    if (!user) {
        checkoutError.textContent = "Tu sesión expiró. Iniciá sesión de nuevo.";
        checkoutError.style.display = "block";
        return;
    }

    const carrito = getCart();
    if (carrito.length === 0) {
        checkoutError.textContent = "El carrito está vacío.";
        checkoutError.style.display = "block";
        return;
    }

    // Validar stock una última vez antes de confirmar
    for (const item of carrito) {
        const producto = productoDe(item);
        if (!producto || item.quantity > producto.stock) {
            checkoutError.textContent = `No hay stock suficiente de "${producto?.nombre ?? "un producto"}".`;
            checkoutError.style.display = "block";
            return;
        }
    }

    const detalles = carrito.map((item) => {
        const producto = productoDe(item)!;
        return {
            idProducto: producto.id,
            cantidad: item.quantity,
            subtotal: producto.precio * item.quantity,
        };
    });

    const subtotal = calcularSubtotal(carrito);
    const total = subtotal + COSTO_ENVIO;

    const pedido: Pedido = {
        id: Date.now(),
        fecha: new Date().toISOString().slice(0, 10),
        estado: "PENDIENTE",
        total,
        formaPago,
        idUsuario: user.id,
        telefono,
        direccion,
        notas: notas || undefined,
        detalles,
    };

    // Se persiste solo en memoria (localStorage)
    savePedidoLocal(pedido);
    clearCart();

    modalBody.innerHTML = `
        <div class="modal__success">
            <h3>¡Pedido confirmado!</h3>
            <p>Tu pedido fue registrado y está PENDIENTE de confirmación.</p>
            <p style="margin: var(--espacio-sm) 0; font-weight: var(--font-weight-semibold);">
                Total: $${total.toLocaleString("es-AR")}
            </p>
            <button type="button" class="btn-finalizar" id="btn-ver-pedidos">Ver Mis Pedidos</button>
        </div>
    `;

    document.getElementById("btn-ver-pedidos")?.addEventListener("click", () => {
        window.location.href = "/src/pages/client/orders/orders.html";
    });

    renderCarrito();
});


// Init
// ---------------------------------------------------------------
const init = async (): Promise<void> => {
    setupNavbar();
    try {
        productosCache = await getProductos();
        renderCarrito();
    } catch (error) {
        console.error("Error al cargar productos del carrito:", error);
    }
};

init();
