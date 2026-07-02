export type Estado = "PENDIENTE" | "CONFIRMADO" | "TERMINADO" | "CANCELADO";

export type FormaPago = "TARJETA" | "TRANSFERENCIA" | "EFECTIVO";

export interface DetallePedido {
    idProducto: number;
    cantidad: number;
    subtotal: number;
}

// Pedido tal como viene de /data/pedidos.json (relaciones por ID plano)
export interface Pedido {
    id: number;
    fecha: string;
    estado: Estado;
    total: number;
    formaPago: FormaPago;
    idUsuario: number;
    telefono?: string;
    direccion?: string;
    notas?: string;
    detalles: DetallePedido[];
    eliminado?: boolean;
}
