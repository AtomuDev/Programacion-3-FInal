import { getProductos } from "../../../utils/api.ts";
import { addToCart, getCart, getCartCount } from "../../../utils/cart.ts";
import { getSessionUser } from "../../../utils/localStorage";
import { logout } from "../../../utils/auth";
import type { Product } from "../../../types/product";

const contenedor = document.getElementById("detail-content") as HTMLElement;

const actualizarBadgeCarrito = (): void => {
    const total = getCartCount();
    const linkCarrito = document.getElementById("linkCarrito") as HTMLAnchorElement;
    linkCarrito.innerHTML = total > 0 ? `Carrito <span class="carrito-badge">${total}</span>` : "Carrito";
};

const stockClassDetalle = (stockDisponible: number, cantidad: number): string => {
    if (stockDisponible <= 0) return "detail__stock--sin";
    const restante = stockDisponible - cantidad;
    if (cantidad === 1) {
        if (stockDisponible <= 3) return "detail__stock--low";
        return "";
    }
    if (restante <= 0) return "detail__stock--sin";
    if (restante <= 3) return "detail__stock--low";
    return "";
};

const stockTextoDetalle = (stockDisponible: number, cantidad: number): string => {
    if (stockDisponible <= 0) return "Sin stock disponible";
    if (cantidad === 1) {
        return stockDisponible === 1 ? "¡Último disponible!" : `Stock disponible: ${stockDisponible}`;
    }
    const restante = stockDisponible - cantidad;
    if (restante <= 0) return "Sin stock adicional disponible";
    if (restante === 1) return "¡Último disponible!";
    return `Stock disponible: ${restante}`;
};

const setupNavbar = (): void => {
    const user = getSessionUser();
    const linkAdmin = document.getElementById("linkAdmin") as HTMLAnchorElement;
    if (user && user.rol === "ADMIN") {
        linkAdmin.style.display = "";
    }
    actualizarBadgeCarrito();

    const buttonLogout = document.getElementById("logoutButton") as HTMLButtonElement;
    buttonLogout?.addEventListener("click", () => logout());
};

const renderDetalle = (producto: Product): void => {
    const carrito = getCart();
    const itemEnCarrito = carrito.find((item) => item.productId === producto.id);
    const cantidadEnCarrito = itemEnCarrito?.quantity ?? 0;
    const stockDisponible = Math.max(0, producto.stock - cantidadEnCarrito);
    const noDisponible = !producto.disponible || stockDisponible === 0;

    contenedor.innerHTML = `
        <div class="detail__image">
            <img src="${producto.imagen}" alt="${producto.nombre}">
        </div>
        <div class="detail__info">
            <span class="detail__badge ${noDisponible ? "detail__badge--no-disponible" : "detail__badge--disponible"}">
                ${noDisponible ? "No disponible" : "Disponible"}
            </span>
            <h2>${producto.nombre}</h2>
            <p class="detail__precio">$${producto.precio.toLocaleString("es-AR")}</p>
            <p class="detail__descripcion">${producto.descripcion}</p>
            <p id="detail-stock" class="detail__stock ${stockClassDetalle(stockDisponible, 1)}">
                ${stockTextoDetalle(stockDisponible, 1)}
            </p>

            ${
                noDisponible
                    ? `<button type="button" class="btn btn--disabled" disabled>No disponible</button>`
                    : `
                <div class="detail__quantity">
                    <span>Cantidad:</span>
                    <div class="quantity-control">
                        <button type="button" id="btn-restar">−</button>
                        <span id="cantidad-valor">1</span>
                        <button type="button" id="btn-sumar">+</button>
                    </div>
                </div>
                <button type="button" id="btn-agregar" class="btn btn--primary">Agregar al Carrito</button>
                `
            }

        </div>
    `;

    if (noDisponible) return;

    let cantidad = 1;
    const cantidadValor = document.getElementById("cantidad-valor") as HTMLElement;
    const btnSumar = document.getElementById("btn-sumar") as HTMLButtonElement;
    const btnRestar = document.getElementById("btn-restar") as HTMLButtonElement;
    const btnAgregar = document.getElementById("btn-agregar") as HTMLButtonElement;

    const actualizarControles = (): void => {
        cantidadValor.textContent = String(cantidad);
        btnRestar.disabled = cantidad <= 1;
        btnSumar.disabled = cantidad >= stockDisponible;

        const detailStock = document.getElementById("detail-stock") as HTMLElement;
        if (detailStock) {
            detailStock.textContent = stockTextoDetalle(stockDisponible, cantidad);
            detailStock.className = `detail__stock ${stockClassDetalle(stockDisponible, cantidad)}`;
        }
    };

    btnSumar.addEventListener("click", () => {
        if (cantidad < stockDisponible) {
            cantidad++;
            actualizarControles();
        }
    });

    btnRestar.addEventListener("click", () => {
        if (cantidad > 1) {
            cantidad--;
            actualizarControles();
        }
    });

    btnAgregar.addEventListener("click", async () => {
        await addToCart(producto.id, cantidad);
        actualizarBadgeCarrito();
        btnAgregar.textContent = "Agregado";
        btnAgregar.classList.remove("btn--primary");
        btnAgregar.classList.add("btn--success");
        setTimeout(() => {
            renderDetalle(producto);
        }, 600);
    });

    actualizarControles();
};

const init = async (): Promise<void> => {
    setupNavbar();

    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get("id"));

    if (!id) {
        contenedor.innerHTML = `<p>Producto no especificado.</p>`;
        return;
    }

    try {
        const productos: Product[] = await getProductos();
        const producto = productos.find((p: Product) => p.id === id && !p.eliminado);

        if (!producto) {
            contenedor.innerHTML = `<p>El producto no existe o no está disponible.</p>`;
            return;
        }

        renderDetalle(producto);
    } catch (error) {
        console.error("Error al cargar el producto:", error);
        contenedor.innerHTML = `<p>Ocurrió un error al cargar el producto.</p>`;
    }
};

init();
