import { setupAdminLayout } from "../../../utils/adminLayout.ts";
import { getCategoriasAdmin, getProductosAdmin } from "../../../utils/adminData.ts";
import { getAllPedidos } from "../../../utils/orders.ts";
import type { Estado } from "../../../types/order";

const statCategorias = document.getElementById("stat-categorias") as HTMLElement;
const statProductos = document.getElementById("stat-productos") as HTMLElement;
const statPedidos = document.getElementById("stat-pedidos") as HTMLElement;
const statDisponibles = document.getElementById("stat-disponibles") as HTMLElement;
const resumenRapido = document.getElementById("resumen-rapido") as HTMLElement;

const init = async (): Promise<void> => {
    setupAdminLayout("dashboard");

    try {
        const [categorias, productos, pedidos] = await Promise.all([
            getCategoriasAdmin(),
            getProductosAdmin(),
            getAllPedidos(),
        ]);

        const categoriasActivas = categorias.filter((c) => !c.eliminado);
        const productosActivos = productos.filter((p) => !p.eliminado);
        const productosInactivos = productos.length - productosActivos.length;
        const productosDisponibles = productosActivos.filter((p) => p.disponible && p.stock > 0);
        const pedidosActivos = pedidos.filter((p) => !p.eliminado);

        statCategorias.textContent = String(categoriasActivas.length);
        statProductos.textContent = String(productosActivos.length);
        statPedidos.textContent = String(pedidosActivos.length);
        statDisponibles.textContent = String(productosDisponibles.length);

        const conteoEstados: Record<Estado, number> = {
            PENDIENTE: 0,
            CONFIRMADO: 0,
            TERMINADO: 0,
            CANCELADO: 0,
        };
        pedidosActivos.forEach((p) => {
            conteoEstados[p.estado]++;
        });

        resumenRapido.innerHTML = `
            <div class="resumen-rapido__row"><span>Categorías activas</span><strong>${categoriasActivas.length}</strong></div>
            <div class="resumen-rapido__row"><span>Productos activos / inactivos</span><strong>${productosActivos.length} / ${productosInactivos}</strong></div>
            <div class="resumen-rapido__row"><span>Pedidos PENDIENTE</span><strong>${conteoEstados.PENDIENTE}</strong></div>
            <div class="resumen-rapido__row"><span>Pedidos CONFIRMADO</span><strong>${conteoEstados.CONFIRMADO}</strong></div>
            <div class="resumen-rapido__row"><span>Pedidos TERMINADO</span><strong>${conteoEstados.TERMINADO}</strong></div>
            <div class="resumen-rapido__row"><span>Pedidos CANCELADO</span><strong>${conteoEstados.CANCELADO}</strong></div>
        `;
    } catch (error) {
        console.error("Error al cargar el dashboard:", error);
        resumenRapido.innerHTML = `<p>Ocurrió un error al cargar las estadísticas.</p>`;
    }
};

init();
