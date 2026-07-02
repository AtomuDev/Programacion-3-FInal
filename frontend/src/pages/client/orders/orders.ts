import type { Pedido, Estado } from "../../../types/order";
import type { Product } from "../../../types/product";
import { getProductos } from "../../../utils/api.ts";
import { getAllPedidos } from "../../../utils/orders.ts";
import { getSessionUser } from "../../../utils/localStorage";
import { logout } from "../../../utils/auth";
import { getCartCount } from "../../../utils/cart.ts";

const listaPedidos = document.getElementById("orders-list") as HTMLElement;
const filtroEstado = document.getElementById("filtro-estado") as HTMLSelectElement;
const modal = document.getElementById("modal-detalle") as HTMLElement;
const modalClose = document.getElementById("modal-close") as HTMLButtonElement;
const modalBody = document.getElementById("modal-detalle-body") as HTMLElement;

let pedidosUsuario: Pedido[] = [];
let productosCache: Product[] = [];

const badgeClass = (estado: Estado): string => {
    switch (estado) {
        case "PENDIENTE": return "badge--pendiente";
        case "CONFIRMADO": return "badge--confirmado";
        case "TERMINADO": return "badge--terminado";
        case "CANCELADO": return "badge--cancelado";
    }
};

const nombreEstado = (estado: Estado): string => {
    const map: Record<Estado, string> = {
        PENDIENTE: "Pendiente",
        CONFIRMADO: "Confirmado",
        TERMINADO: "Terminado",
        CANCELADO: "Cancelado",
    };
    return map[estado];
};

const nombreProducto = (idProducto: number): string => {
    return productosCache.find((p) => p.id === idProducto)?.nombre ?? `Producto #${idProducto}`;
};

const formatFecha = (fecha: string): string => {
    const d = new Date(fecha + "T00:00:00");
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
};

const calcularSubtotalPedido = (pedido: Pedido): number =>
    pedido.detalles.reduce((acc, detalle) => acc + detalle.subtotal, 0);

const costoEnvioPedido = (pedido: Pedido): number =>
    Math.max(0, pedido.total - calcularSubtotalPedido(pedido));


// Render
// ---------------------------------------------------------------
const renderPedidos = (): void => {
    const filtro = filtroEstado.value;
    const filtrados = pedidosUsuario
        .filter((p) => filtro === "todos" || p.estado === filtro)
        .sort((a, b) => b.fecha.localeCompare(a.fecha));

    listaPedidos.innerHTML = "";

    if (filtrados.length === 0) {
        listaPedidos.innerHTML = `
            <div class="orders__empty">
                <p>No tenés pedidos${filtro !== "todos" ? " con ese estado" : " todavía"}.</p>
                <p><a href="/src/pages/store/home/home.html">Ir al catálogo</a></p>
            </div>`;
        return;
    }

    filtrados.forEach((pedido) => {
        const primerosProductos = pedido.detalles
            .slice(0, 3)
            .map((d) => nombreProducto(d.idProducto))
            .join(", ");
        const masProductos = pedido.detalles.length > 3 ? ` y ${pedido.detalles.length - 3} más` : "";

        const card = document.createElement("div");
        card.classList.add("order-card");
        card.innerHTML = `
            <div class="order-card__top">
                <span class="order-card__id">Pedido #ORD-${pedido.id}</span>
                <span class="badge ${badgeClass(pedido.estado)}">${nombreEstado(pedido.estado)}</span>
            </div>
            <p class="order-card__fecha">${formatFecha(pedido.fecha)}</p>
            <p class="order-card__resumen">${primerosProductos}${masProductos} · ${pedido.detalles.length} producto(s)</p>
            <div class="order-card__bottom">
                <span class="order-card__total">$${pedido.total.toLocaleString("es-AR")}</span>
            </div>
        `;
        card.addEventListener("click", () => abrirDetalle(pedido));
        listaPedidos.appendChild(card);
    });
};

const abrirDetalle = (pedido: Pedido): void => {
    const itemsHtml = pedido.detalles
        .map((d) => {
            const producto = productosCache.find((p) => p.id === d.idProducto);
            const nombre = producto?.nombre ?? `Producto #${d.idProducto}`;
            return `
                <div class="modal__item-row">
                    <span>${nombre} x${d.cantidad}</span>
                    <span>$${d.subtotal.toLocaleString("es-AR")}</span>
                </div>`;
        })
        .join("");

    modalBody.innerHTML = `
        <h3 class="modal__title">Detalle del pedido #ORD-${pedido.id}</h3>
        <div class="modal__section">
            <h4>Información de entrega</h4>
            <p><strong>Fecha:</strong> ${formatFecha(pedido.fecha)}</p>
            <p><strong>Estado:</strong> <span class="badge ${badgeClass(pedido.estado)}">${nombreEstado(pedido.estado)}</span></p>
            <p><strong>Teléfono:</strong> ${pedido.telefono || "-"}</p>
            <p><strong>Dirección:</strong> ${pedido.direccion || "-"}</p>
            <p><strong>Método de pago:</strong> ${pedido.formaPago}</p>
            ${pedido.notas ? `<p><strong>Notas:</strong> ${pedido.notas}</p>` : ""}
        </div>
        <div class="modal__section">
            <h4>Productos</h4>
            ${itemsHtml}
        </div>
        <div class="modal__total-row">
            <span>Subtotal</span>
            <span>$${calcularSubtotalPedido(pedido).toLocaleString("es-AR")}</span>
        </div>
        <div class="modal__total-row">
            <span>Envío</span>
            <span>$${costoEnvioPedido(pedido).toLocaleString("es-AR")}</span>
        </div>
        <div class="modal__total-row modal__total-row--total">
            <span>Total</span>
            <span>$${pedido.total.toLocaleString("es-AR")}</span>
        </div>
    `;

    modal.style.display = "flex";
};

modalClose.addEventListener("click", () => (modal.style.display = "none"));
modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
});

filtroEstado.addEventListener("change", renderPedidos);


// Navbar
// ---------------------------------------------------------------
const setupNavbar = (): void => {
    const user = getSessionUser();
    const linkAdmin = document.getElementById("linkAdmin") as HTMLAnchorElement;
    if (user && user.rol === "ADMIN") {
        linkAdmin.style.display = "";
    }

    const total = getCartCount();
    const linkCarrito = document.getElementById("linkCarrito") as HTMLAnchorElement;
    linkCarrito.innerHTML = total > 0 ? `Carrito <span class="carrito-badge">${total}</span>` : "Carrito";

    const buttonLogout = document.getElementById("logoutButton") as HTMLButtonElement;
    buttonLogout?.addEventListener("click", () => logout());
};


// Init
// ---------------------------------------------------------------
const init = async (): Promise<void> => {
    setupNavbar();

    const user = getSessionUser();
    if (!user) return;

    try {
        const [pedidos, productos] = await Promise.all([getAllPedidos(), getProductos()]);
        productosCache = productos;
        pedidosUsuario = pedidos.filter((p) => p.idUsuario === user.id && !p.eliminado);
        renderPedidos();
    } catch (error) {
        console.error("Error al cargar los pedidos:", error);
        listaPedidos.innerHTML = `<p>Ocurrió un error al cargar tus pedidos.</p>`;
    }
};

init();
