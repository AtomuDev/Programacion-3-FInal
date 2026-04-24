import type { CartItem } from "../../../types/product.ts";

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

// Costo de envío fijo (ajustar según lógica real)
const COSTO_ENVIO: number = 5000;

// Obtener carrito desde localStorage
const obtenerCarrito = (): CartItem[] => {
    return JSON.parse(localStorage.getItem("carrito") ?? "[]");
};

// Guardar carrito en localStorage
const guardarCarrito = (carrito: CartItem[]): void => {
    localStorage.setItem("carrito", JSON.stringify(carrito));
};

// Calcular subtotal
const calcularSubtotal = (carrito: CartItem[]): number => {
    return carrito.reduce((acc, item) => acc + item.product.precio * item.quantity, 0);
};

// Clase CSS del stock según disponibilidad
const stockClass = (stock: number, quantity: number): string => {
    const restante = stock - quantity;
    if (restante <= 0) return "cart-item__stock--out";
    if (restante <= 3) return "cart-item__stock--low";
    return "";
};

// Texto del stock
const stockTexto = (stock: number, quantity: number): string => {
    const restante = stock - quantity;
    if (restante <= 0) return "Sin stock adicional disponible";
    if (restante === 1) return "¡Último disponible!";
    if (restante <= 3) return `Solo quedan ${restante} en stock`;
    return `Stock disponible: ${restante}`;
};

// Actualizar panel de resumen
const actualizarResumen = (carrito: CartItem[]): void => {
    const subtotal = calcularSubtotal(carrito);
    const total = subtotal + COSTO_ENVIO;

    summarySubtotal.textContent = `$${subtotal.toLocaleString("es-AR")}`;
    summaryEnvio.textContent = COSTO_ENVIO === 0 ? "Gratis" : `$${COSTO_ENVIO.toLocaleString("es-AR")}`;
    summaryTotal.textContent = `$${total.toLocaleString("es-AR")}`;

    const vacio = carrito.length === 0;
    orderSummary.style.display = vacio ? "none" : "";
    btnFinalizar.disabled = vacio;
    btnVaciar.style.display = vacio ? "none" : "";
};

// Render carrito
const renderCarrito = (): void => {
    const carrito = obtenerCarrito();
    contenedorCarrito.innerHTML = "";

    if (carrito.length === 0) {
        contenedorCarrito.style.display = "none";
        carritoVacio.style.display = "block";
        mainBody.classList.add("main__body--vacio");
        actualizarResumen([]);
        return;
    }

    contenedorCarrito.style.display = "";
    carritoVacio.style.display = "none";
    mainBody.classList.remove("main__body--vacio");

    carrito.forEach((item: CartItem) => {
        const restante = item.product.stock - item.quantity;
        const div = document.createElement("div");
        div.classList.add("cart-item");
        div.innerHTML = `
            <div class="cart-item__info">
                <h3>${item.product.nombre}</h3>
                <p>Precio: $${item.product.precio.toLocaleString("es-AR")}</p>
                <p>Subtotal: $${(item.product.precio * item.quantity).toLocaleString("es-AR")}</p>
                <p class="cart-item__stock ${stockClass(item.product.stock, item.quantity)}">
                    ${stockTexto(item.product.stock, item.quantity)}
                </p>
            </div>
            <div class="cart-item__actions">
                <div class="quantity-control">
                    <button type="button" data-id="${item.product.id}" class="btn-restar">−</button>
                    <span class="quantity-control__value">${item.quantity}</span>
                    <button type="button" data-id="${item.product.id}" class="btn-sumar" ${restante <= 0 ? "disabled" : ""}>+</button>
                </div>
                <button type="button" data-id="${item.product.id}" class="btn-eliminar">Eliminar</button>
            </div>`;
        contenedorCarrito.appendChild(div);
    });

    actualizarResumen(carrito);

    contenedorCarrito.querySelectorAll(".btn-sumar").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = Number((btn as HTMLElement).dataset.id);
            cambiarCantidad(id, 1);
        });
    });

    contenedorCarrito.querySelectorAll(".btn-restar").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = Number((btn as HTMLElement).dataset.id);
            cambiarCantidad(id, -1);
        });
    });

    contenedorCarrito.querySelectorAll(".btn-eliminar").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = Number((btn as HTMLElement).dataset.id);
            eliminarProducto(id);
        });
    });
};

// Cambiar cantidad
const cambiarCantidad = (id: number, delta: number): void => {
    const carrito = obtenerCarrito();
    const item = carrito.find(i => i.product.id === id);
    if (!item) return;

    if (delta > 0 && item.quantity >= item.product.stock) {
        return;
    }

    item.quantity += delta;

    if (item.quantity <= 0) {
        eliminarProducto(id);
        return;
    }

    guardarCarrito(carrito);
    renderCarrito();
};

// Eliminar producto
const eliminarProducto = (id: number): void => {
    const carrito = obtenerCarrito().filter(i => i.product.id !== id);
    guardarCarrito(carrito);
    renderCarrito();
};

// Vaciar carrito
btnVaciar.addEventListener("click", () => {
    if (confirm("¿Vaciar el carrito?")) {
        guardarCarrito([]);
        renderCarrito();
    }
});

// Finalizar compra (preparado para lógica futura)
btnFinalizar.addEventListener("click", () => {
    console.log("Finalizar compra");
});

// Init
renderCarrito();
