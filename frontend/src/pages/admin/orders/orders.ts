import type { Pedido, Estado } from "../../../types/order";
import type { IUser } from "../../../types/IUser";
import type { Product } from "../../../types/product";
import { getUsuarios, getProductos } from "../../../utils/api.ts";
import { getAllPedidos, updatePedidoLocalEstado } from "../../../utils/orders.ts";
import { setupAdminLayout } from "../../../utils/adminLayout.ts";

const listaPedidos = document.getElementById("lista-pedidos") as HTMLElement;
const filtroEstado = document.getElementById("filtro-estado") as HTMLSelectElement;
const modal = document.getElementById("modal-detalle") as HTMLElement;
const modalClose = document.getElementById("modal-close") as HTMLButtonElement;
const modalBody = document.getElementById("modal-detalle-body") as HTMLElement;

let pedidos: Pedido[] = [];
let usuarios: IUser[] = [];
let productos: Product[] = [];

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

const nombreCliente = (idUsuario: number): string => {
    const u = usuarios.find((us) => us.id === idUsuario);
    return u ? `${u.nombre} ${u.apellido}` : `Usuario #${idUsuario}`;
};

const nombreProducto = (idProducto: number): string =>
    productos.find((p) => p.id === idProducto)?.nombre ?? `Producto #${idProducto}`;

const formatFecha = (fecha: string): string => {
    const d = new Date(fecha + "T00:00:00");
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
};

const calcularSubtotalPedido = (pedido: Pedido): number =>
    pedido.detalles.reduce((acc, detalle) => acc + detalle.subtotal, 0);

const costoEnvioPedido = (pedido: Pedido): number =>
    Math.max(0, pedido.total - calcularSubtotalPedido(pedido));

const ordenarPorFechaDesc = (a: Pedido, b: Pedido): number => {
    const fechaA = new Date(`${a.fecha}T00:00:00`).getTime();
    const fechaB = new Date(`${b.fecha}T00:00:00`).getTime();
    return fechaB - fechaA;
};

// Render del listado
// ---------------------------------------------------------------
const renderLista = (): void => {
    const filtro = filtroEstado.value;
    const activos = pedidos.filter((p) => !p.eliminado);
    const filtrados = activos
        .filter((p) => filtro === "todos" || p.estado === filtro)
        .sort(ordenarPorFechaDesc);

    listaPedidos.innerHTML = "";

    if (filtrados.length === 0) {
        listaPedidos.innerHTML = `<p>No hay pedidos${filtro !== "todos" ? " con ese estado" : ""}.</p>`;
        return;
    }

    filtrados.forEach((pedido) => {
        const card = document.createElement("div");
        card.classList.add("order-card");
        card.innerHTML = `
            <div class="order-card__top">
                <span class="order-card__id">Pedido #ORD-${pedido.id}</span>
                <span class="badge ${badgeClass(pedido.estado)}">${nombreEstado(pedido.estado)}</span>
            </div>
            <p class="order-card__cliente">Cliente: ${nombreCliente(pedido.idUsuario)}</p>
            <p class="order-card__fecha">${formatFecha(pedido.fecha)} · ${pedido.detalles.length} producto(s)</p>
            <div class="order-card__bottom">
                <span class="order-card__total">$${pedido.total.toLocaleString("es-AR")}</span>
            </div>`;
        card.addEventListener("click", () => abrirDetalle(pedido));
        listaPedidos.appendChild(card);
    });
};


// Modal de detalle + cambio de estado
// ---------------------------------------------------------------
const abrirDetalle = (pedido: Pedido): void => {
    const itemsHtml = pedido.detalles
        .map(
            (d) => `
                <div class="modal__item-row">
                    <span>${nombreProducto(d.idProducto)} x${d.cantidad}</span>
                    <span>$${d.subtotal.toLocaleString("es-AR")}</span>
                </div>`
        )
        .join("");

    const estados: Estado[] = ["PENDIENTE", "CONFIRMADO", "TERMINADO", "CANCELADO"];

    modalBody.innerHTML = `
        <h3 class="modal__title">Detalle del Pedido #ORD-${pedido.id}</h3>
        <div class="modal__section">
            <h4>Información de entrega</h4>
            <p><strong>Cliente:</strong> ${nombreCliente(pedido.idUsuario)}</p>
            <p><strong>Fecha:</strong> ${formatFecha(pedido.fecha)}</p>
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

        <label class="admin-form__label" for="select-nuevo-estado">Cambiar estado</label>
        <select class="modal__select-estado" id="select-nuevo-estado">
            ${estados.map((e) => `<option value="${e}" ${e === pedido.estado ? "selected" : ""}>${nombreEstado(e)}</option>`).join("")}
        </select>

        <div class="modal__actions">
            <button type="button" class="btn btn--primary" id="btn-actualizar-estado">Actualizar Estado</button>
        </div>
    `;

    document.getElementById("btn-actualizar-estado")?.addEventListener("click", () => {
        const select = document.getElementById("select-nuevo-estado") as HTMLSelectElement;
        actualizarEstado(pedido.id, select.value as Estado);
    });

    modal.style.display = "flex";
};

const actualizarEstado = (id: number, estado: Estado): void => {
    // Si el pedido viene del JSON semilla (no de localStorage), igual lo
    // actualizamos en memoria sobre el array local para reflejarlo en el listado.
    const pedido = pedidos.find((p) => p.id === id);
    if (pedido) pedido.estado = estado;

    updatePedidoLocalEstado(id, estado);

    modal.style.display = "none";
    renderLista();
    alert(`Pedido #ORD-${id} actualizado a estado: ${nombreEstado(estado)}.`);
};

modalClose.addEventListener("click", () => (modal.style.display = "none"));
modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
});

filtroEstado.addEventListener("change", renderLista);


// Init
// ---------------------------------------------------------------
const init = async (): Promise<void> => {
    setupAdminLayout("pedidos");
    try {
        [pedidos, usuarios, productos] = await Promise.all([getAllPedidos(), getUsuarios(), getProductos()]);
        renderLista();
    } catch (error) {
        console.error("Error al cargar pedidos:", error);
        listaPedidos.innerHTML = `<p>Ocurrió un error al cargar los pedidos.</p>`;
    }
};

init();
