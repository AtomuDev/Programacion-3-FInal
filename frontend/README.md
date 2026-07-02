# Food Store - Frontend

Aplicación web del sistema Food Store desarrollada con Vite y TypeScript.

## Funcionalidades principales
- Inicio de sesión y registro con roles USUARIO y ADMIN.
- Catálogo de productos con búsqueda, filtros por categoría y ordenamiento.
- Detalle de producto con validación de stock.
- Carrito persistente en localStorage y checkout con método de pago.
- Historial de pedidos por usuario.
- Panel de administración para gestionar categorías, productos y pedidos.

## Requisitos
- Node.js 18 o superior
- pnpm (recomendado) o npm

## Instalación y ejecución
Con pnpm:
```bash
pnpm install
pnpm dev
```

Con npm:
```bash
npm install
npm run dev
```

## Credenciales de prueba
- Administrador: `admin@admin.com` / `123456`
- Cliente: `cliente@food.com` / `cliente123`

## Datos de prueba
Los datos iniciales se cargan desde los archivos JSON ubicados en `public/data/`.

## Configuración del carrito
- El envío se calcula como un valor fijo en el frontend: `$5.000`.
- El total del pedido se calcula como subtotal + envío.
