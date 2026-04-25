import { PRODUCTS, getCategories } from "../../../data/data";
import type { CartItem, Product } from "../../../types/product";
import type { ICategory } from "../../../types/category";
import type { IUser } from "../../../types/IUser";
import { logout } from "../../../utils/auth";
import { getUser } from "../../../utils/localStorage";

// Referencias al DOM
const listaCategorias = document.getElementById("lista-categorias") as HTMLUListElement;
const contenedorProductos = document.getElementById("contenedor-productos") as HTMLElement;
const buscador = document.getElementById("buscador") as HTMLInputElement;

// Estado
let categoriaActiva: number | "todas" = "todas";

// Setup navbar
const setupNavbar = (): void => {
    const raw = getUser();
    const user: IUser | null = raw ? JSON.parse(raw) : null;

    const linkAdmin = document.getElementById("linkAdmin") as HTMLAnchorElement;
    if (user && user.role === "admin") {
        linkAdmin.style.display = "";
    }

    const carrito = JSON.parse(localStorage.getItem("carrito") ?? "[]");
    const total = carrito.reduce((acc: number, item: CartItem) => acc + item.quantity, 0);
    const linkCarrito = document.getElementById("linkCarrito") as HTMLAnchorElement;
    if (total > 0) {
        linkCarrito.innerHTML = `Carrito <span class="carrito-badge">${total}</span>`;
    }
};

// Render categorías
const renderCategorias = (): void => {
    const liTodas = document.createElement("li");
    liTodas.innerHTML = `<a href="#" class="categoria-link activa" data-cat="todas">Todas</a>`;
    listaCategorias.appendChild(liTodas);

    getCategories().forEach(cat => {
        const li = document.createElement("li");
        li.innerHTML = `<a href="#" class="categoria-link" data-cat="${cat.id}">${cat.nombre}</a>`;
        listaCategorias.appendChild(li);
    });

    listaCategorias.addEventListener("click", (e: Event) => {
        e.preventDefault();
        const target = e.target as HTMLAnchorElement;
        if (!target.classList.contains("categoria-link")) return;

        document.querySelectorAll(".categoria-link").forEach(el => el.classList.remove("activa"));
        target.classList.add("activa");

        const cat = target.dataset.cat ?? "todas";
        categoriaActiva = cat === "todas" ? "todas" : Number(cat);
        renderProductos();
    });
};

// Render productos
const renderProductos = (): void => {
    const textoBusqueda = buscador.value.toLowerCase().trim();

    const filtrados = PRODUCTS.filter((p: Product) => {
        const coincideCategoria = categoriaActiva === "todas" ||
            p.categorias.some((c: ICategory) => c.id === categoriaActiva);
        const coincideBusqueda = p.nombre.toLowerCase().includes(textoBusqueda);
        return coincideCategoria && coincideBusqueda;
    });

    contenedorProductos.innerHTML = "";

    if (filtrados.length === 0) {
        contenedorProductos.innerHTML = `<p>No se encontraron productos.</p>`;
        return;
    }

    filtrados.forEach((producto: Product) => {
        const stockClass = producto.stock === 0 ? "sin" : producto.stock <= 5 ? "bajo" : "";
        const stockText = producto.stock === 0 ? "Sin stock" : producto.stock <= 5 ? `¡Quedan ${producto.stock}!` : `Stock: ${producto.stock}`;

        const article = document.createElement("article");
        article.classList.add("product-card");
        article.innerHTML = `
            <img src="../../../assets/images/${producto.imagen}" alt="${producto.nombre}" loading="lazy" width="400">
            <div class="product-card__info">
                <h3>${producto.nombre}</h3>
                <p class="product-card__descripcion">${producto.descripcion}</p>
                <p class="product-card__stock ${stockClass}">${stockText}</p>
            </div>
            <footer class="product-card__actions">
                <p class="product-card__precio">$${producto.precio.toLocaleString("es-AR")}</p>
                <button type="button" class="btn btn--primary ${!producto.disponible ? "sin-stock" : ""}" data-id="${producto.id}" ${!producto.disponible ? "disabled" : ""}>
                    ${producto.disponible ? "Agregar al Carrito" : "Sin stock"}
                </button>
            </footer>`;
        contenedorProductos.appendChild(article);
    });

    contenedorProductos.querySelectorAll("[data-id]:not([disabled])").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = Number((btn as HTMLElement).dataset.id);
            agregarAlCarrito(id, btn as HTMLButtonElement);
        });
    });
};

// Agregar al carrito
const agregarAlCarrito = (id: number, btn: HTMLButtonElement): void => {
    const producto = PRODUCTS.find(p => p.id === id);
    if (!producto) return;

    const carrito = JSON.parse(localStorage.getItem("carrito") ?? "[]");
    const existente = carrito.find((item: CartItem) => item.product.id === id);

    if (existente) {
        existente.quantity += 1;
    } else {
        carrito.push({ product: producto, quantity: 1 });
    }

    localStorage.setItem("carrito", JSON.stringify(carrito));

    btn.textContent = "Agregado al Carrito";
    btn.disabled = true;
    setTimeout(() => {
        btn.textContent = "Agregar al Carrito";
        btn.disabled = false;
    }, 1500);

    // Actualizar badge
    const nuevoTotal = JSON.parse(localStorage.getItem("carrito") ?? "[]").reduce((acc: number, item: CartItem) => acc + item.quantity, 0);
    const linkCarrito = document.getElementById("linkCarrito") as HTMLAnchorElement;
    linkCarrito.innerHTML = `Carrito <span class="carrito-badge">${nuevoTotal}</span>`;
};

// Buscador
buscador.addEventListener("input", renderProductos);

// Cerrar sesión
const buttonLogout = document.getElementById("logoutButton") as HTMLButtonElement;
buttonLogout?.addEventListener("click", () => logout());

// Init
setupNavbar();
renderCategorias();
renderProductos();
