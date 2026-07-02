// ============================================================
// Manejo de pedidos generados durante la sesión (en memoria).
// ============================================================

import type { Pedido, Estado } from "../types/order";
import { getPedidos } from "./api";

const LOCAL_KEY = "pedidosLocal";

export const getPedidosLocal = (): Pedido[] => {
    try {
        const raw = localStorage.getItem(LOCAL_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

export const savePedidoLocal = (pedido: Pedido): void => {
    const pedidos = getPedidosLocal();
    pedidos.push(pedido);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(pedidos));
};

export const updatePedidoLocalEstado = (id: number, estado: Estado): boolean => {
    const pedidos = getPedidosLocal();
    const pedido = pedidos.find((p) => p.id === id);
    if (!pedido) return false;
    pedido.estado = estado;
    localStorage.setItem(LOCAL_KEY, JSON.stringify(pedidos));
    return true;
};

// Combina los pedidos del JSON (semilla) con los generados en esta sesión.
const ordenarPorFechaDesc = (a: Pedido, b: Pedido): number => {
    const fechaA = new Date(`${a.fecha}T00:00:00`).getTime();
    const fechaB = new Date(`${b.fecha}T00:00:00`).getTime();
    return fechaB - fechaA;
};

export const getAllPedidos = async (): Promise<Pedido[]> => {
    const seed = await getPedidos();
    const local = getPedidosLocal();
    return [...seed, ...local].sort(ordenarPorFechaDesc);
};
