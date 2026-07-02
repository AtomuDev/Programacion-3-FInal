export interface Product {
    id: number;
    nombre: string;
    precio: number;
    descripcion: string;
    stock: number;
    imagen: string;
    disponible: boolean;
    eliminado: boolean;
    categoriaId?: number;
    categoria?: {
        id: number;
        nombre: string;
        descripcion: string;
    };
}

export interface CartItem {
    productId: number;
    quantity: number;
}
