// ============================================================
// Capa de acceso a datos. Toda la app llama a estas funciones,
// nunca hace fetch() directo desde una página.
// ============================================================

import type { ICategory } from "../types/category";
import type { Product } from "../types/product";
import type { IUser } from "../types/IUser";
import type { Pedido } from "../types/order";
import { getLocalUsers } from "./localStorage";

const PRODUCTOS_KEY = "productos";
const CATEGORIAS_KEY = "categorias";

export const getCategorias = async (): Promise<ICategory[]> => {
    const raw = localStorage.getItem(CATEGORIAS_KEY);
    if (raw) {
        try {
            return JSON.parse(raw);
        } catch {
            localStorage.removeItem(CATEGORIAS_KEY);
        }
    }

    const response = await fetch("/data/categorias.json");
    const seed = await response.json();
    localStorage.setItem(CATEGORIAS_KEY, JSON.stringify(seed));
    return seed;
};

export const saveCategorias = (categorias: ICategory[]): void => {
    localStorage.setItem(CATEGORIAS_KEY, JSON.stringify(categorias));
};

export const getProductos = async (): Promise<Product[]> => {
    const raw = localStorage.getItem(PRODUCTOS_KEY);
    if (raw) {
        try {
            return JSON.parse(raw);
        } catch {
            localStorage.removeItem(PRODUCTOS_KEY);
        }
    }

    const response = await fetch("/data/productos.json");
    const seed = await response.json();
    localStorage.setItem(PRODUCTOS_KEY, JSON.stringify(seed));
    return seed;
};

export const saveProductos = (productos: Product[]): void => {
    localStorage.setItem(PRODUCTOS_KEY, JSON.stringify(productos));
};

export const getUsuarios = async (): Promise<IUser[]> => {
    const response = await fetch("/data/usuarios.json");
    const usuariosBase = await response.json();
    return [...usuariosBase, ...getLocalUsers()];
};

export const getPedidos = async (): Promise<Pedido[]> => {
    const response = await fetch("/data/pedidos.json");
    return response.json();
};
