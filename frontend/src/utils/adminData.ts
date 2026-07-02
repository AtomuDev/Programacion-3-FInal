// ============================================================
// Estado en memoria para las operaciones de escritura del panel
// de administración (alta, edición, baja lógica).
// ============================================================

import type { ICategory } from "../types/category";
import type { Product } from "../types/product";
import { getCategorias, getProductos, saveCategorias, saveProductos } from "./api.ts";

// --- Categorías ---
export const getCategoriasAdmin = async (): Promise<ICategory[]> => {
    return getCategorias();
};

const saveCategoriasAdmin = (categorias: ICategory[]): void => {
    saveCategorias(categorias);
};

export const nextCategoriaId = (categorias: ICategory[]): number => {
    return categorias.length ? Math.max(...categorias.map((c) => c.id)) + 1 : 1;
};

export const upsertCategoria = async (categoria: ICategory): Promise<void> => {
    const categorias = await getCategoriasAdmin();
    const idx = categorias.findIndex((c) => c.id === categoria.id);
    if (idx >= 0) {
        categorias[idx] = categoria;
    } else {
        categorias.push(categoria);
    }
    saveCategoriasAdmin(categorias);
};

export const eliminarCategoriaLogico = async (id: number): Promise<boolean> => {
    const categorias = await getCategoriasAdmin();
    const categoria = categorias.find((c) => c.id === id && !c.eliminado);
    if (!categoria) return false;
    categoria.eliminado = true;
    saveCategoriasAdmin(categorias);
    return true;
};


// --- Productos ---
export const getProductosAdmin = async (): Promise<Product[]> => {
    return getProductos();
};

const saveProductosAdmin = (productos: Product[]): void => {
    saveProductos(productos);
};

export const nextProductoId = (productos: Product[]): number => {
    return productos.length ? Math.max(...productos.map((p) => p.id)) + 1 : 1;
};

export const upsertProducto = async (producto: Product): Promise<void> => {
    const productos = await getProductosAdmin();
    const idx = productos.findIndex((p) => p.id === producto.id);
    if (idx >= 0) {
        productos[idx] = producto;
    } else {
        productos.push(producto);
    }
    saveProductosAdmin(productos);
};

export const eliminarProductoLogico = async (id: number): Promise<boolean> => {
    const productos = await getProductosAdmin();
    const producto = productos.find((p) => p.id === id && !p.eliminado);
    if (!producto) return false;
    producto.eliminado = true;
    saveProductosAdmin(productos);
    return true;
};

export const actualizarStockProducto = async (id: number, nuevoStock: number): Promise<void> => {
    const productos = await getProductosAdmin();
    const producto = productos.find((p) => p.id === id);
    if (producto) {
        producto.stock = nuevoStock;
        saveProductosAdmin(productos);
    }
};
