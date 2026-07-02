import type { CartItem } from "../types/product";
import { getProductos } from "./api.ts";
import { getSessionUser } from "./localStorage";

const CART_PREFIX = "carrito";

const getCartStorageKey = (userId?: number): string => {
    const activeUserId = userId ?? getSessionUser()?.id;
    return activeUserId != null ? `${CART_PREFIX}:${activeUserId}` : `${CART_PREFIX}:guest`;
};

export const getCart = (userId?: number): CartItem[] => {
    try {
        const raw = localStorage.getItem(getCartStorageKey(userId));
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

export const saveCart = (cart: CartItem[], userId?: number): void => {
    localStorage.setItem(getCartStorageKey(userId), JSON.stringify(cart));
};

export const clearCart = (userId?: number): void => {
    localStorage.removeItem(getCartStorageKey(userId));
};

export const addToCart = async (productId: number, quantity: number): Promise<CartItem[]> => {
    const productos = await getProductos();
    const producto = productos.find((p) => p.id === productId);

    if (!producto) return getCart();

    const cart = getCart();
    const existente = cart.find((item) => item.productId === productId);
    const cantidadActual = existente?.quantity ?? 0;
    const disponible = producto.stock - cantidadActual;

    if (disponible <= 0) {
        return cart;
    }

    const cantidadFinal = Math.min(quantity, disponible);

    if (existente) {
        existente.quantity += cantidadFinal;
    } else {
        cart.push({ productId, quantity: cantidadFinal });
    }

    saveCart(cart);
    return cart;
};

export const getCartCount = (): number => {
    return getCart().reduce((acc, item) => acc + item.quantity, 0);
};
