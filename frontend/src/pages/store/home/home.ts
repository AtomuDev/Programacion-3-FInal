import { getCategorias, getProductos } from "../../../utils/api.ts";
import { addToCart, getCart, getCartCount } from "../../../utils/cart.ts";
import { getSessionUser } from "../../../utils/localStorage";
import { logout } from "../../../utils/auth";
import type { Product } from "../../../types/product";
import type { ICategory } from "../../../types/category";

// Referencias al DOM
const listaCategorias = document.getElementById("lista-categorias") as HTMLUListElement;
const contenedorProductos = document.getElementById("contenedor-productos") as HTMLElement;
const buscador = document.getElementById("buscador") as HTMLInputElement;
const ordenSelect = document.getElementById("orden") as HTMLSelectElement;
const modalProducto = document.getElementById("modal-producto") as HTMLElement;
const modalProductoClose = document.getElementById("modal-producto-close") as HTMLButtonElement;
const modalProductoContent = document.getElementById("modal-producto-content") as HTMLElement;

// Estado en memoria (cargado una vez desde los JSON)
let productos: Product[] = [];
let categoriaActiva: number | "todas" = "todas";


// Navbar: muestra/oculta el link de admin y el badge del carrito
// ---------------------------------------------------------------
const setupNavbar = (): void => {
    const user = getSessionUser();

    const linkAdmin = document.getElementById("linkAdmin") as HTMLAnchorElement;
    if (user && user.rol === "ADMIN") {
        linkAdmin.style.display = "";
    }

    actualizarBadgeCarrito();
};

const actualizarBadgeCarrito = (): void => {
    const total = getCartCount();
    const linkCarrito = document.getElementById("linkCarrito") as HTMLAnchorElement;
    linkCarrito.innerHTML = total > 0 ? `Carrito <span class="carrito-badge">${total}</span>` : "Carrito";
};


// Render de categorías (sidebar)
// ---------------------------------------------------------------
const renderCategorias = (categorias: ICategory[]): void => {
    listaCategorias.innerHTML = "";

    const liTodas = document.createElement("li");
    liTodas.innerHTML = `<a href="#" class="categoria-link activa" data-cat="todas">Todas</a>`;
    listaCategorias.appendChild(liTodas);

    categorias
        .filter((c) => !c.eliminado)
        .forEach((cat) => {
            const li = document.createElement("li");
            li.innerHTML = `<a href="#" class="categoria-link" data-cat="${cat.id}">${cat.nombre}</a>`;
            listaCategorias.appendChild(li);
        });

    listaCategorias.addEventListener("click", (e: Event) => {
        e.preventDefault();
        const target = e.target as HTMLAnchorElement;
        if (!target.classList.contains("categoria-link")) return;

        document.querySelectorAll(".categoria-link").forEach((el) => el.classList.remove("activa"));
        target.classList.add("activa");

        const cat = target.dataset.cat ?? "todas";
        categoriaActiva = cat === "todas" ? "todas" : Number(cat);
        renderProductos();
    });
};


// Filtro + búsqueda + orden + render de productos
// ---------------------------------------------------------------
const normalizarProductos = (productosData: Product[]): Product[] =>
    productosData.map((producto) => ({
        ...producto,
        categoriaId: producto.categoriaId ?? producto.categoria?.id,
    }));

const ordenarProductos = (lista: Product[]): Product[] => {
    const criterio = ordenSelect.value;
    const copia = [...lista];

    switch (criterio) {
        case "nombre-asc":
            return copia.sort((a, b) => a.nombre.localeCompare(b.nombre));
        case "nombre-desc":
            return copia.sort((a, b) => b.nombre.localeCompare(a.nombre));
        case "precio-asc":
            return copia.sort((a, b) => a.precio - b.precio);
        case "precio-desc":
            return copia.sort((a, b) => b.precio - a.precio);
        default:
            return copia;
    }
};

const renderProductos = (): void => {
    const textoBusqueda = buscador.value.toLowerCase().trim();

    let filtrados = productos.filter((p) => {
        if (p.eliminado || !p.disponible) return false;
        const categoriaIdProducto = p.categoriaId ?? p.categoria?.id;
        const coincideCategoria = categoriaActiva === "todas" || categoriaIdProducto === categoriaActiva;
        const coincideBusqueda = p.nombre.toLowerCase().includes(textoBusqueda);
        return coincideCategoria && coincideBusqueda;
    });

    filtrados = ordenarProductos(filtrados);

    contenedorProductos.innerHTML = "";

    if (filtrados.length === 0) {
        contenedorProductos.innerHTML = `<p>No se encontraron productos.</p>`;
        return;
    }

    filtrados.forEach((producto) => {
        const stockClass = producto.stock === 0 ? "sin" : producto.stock <= 5 ? "bajo" : "";
        const stockText =
            producto.stock === 0 ? "Sin stock" : producto.stock <= 5 ? `¡Quedan ${producto.stock}!` : `Stock: ${producto.stock}`;

        const article = document.createElement("article");
        article.classList.add("product-card");
        article.innerHTML = `
            <a href="#" class="product-card__link" data-id="${producto.id}">
                <img src="${producto.imagen}" alt="${producto.nombre}" loading="lazy" width="400">
                <div class="product-card__info">
                    <h3>${producto.nombre}</h3>
                    <p class="product-card__descripcion">${producto.descripcion}</p>
                    <p class="product-card__stock ${stockClass}">${stockText}</p>
                </div>
            </a>
            <footer class="product-card__actions">
                <p class="product-card__precio">$${producto.precio.toLocaleString("es-AR")}</p>
                <button type="button" class="btn ${producto.stock === 0 ? "btn--danger sin-stock" : "btn--primary"} " data-id="${producto.id}" ${producto.stock === 0 ? "disabled" : ""}>
                    ${producto.stock === 0 ? "Sin stock" : "Agregar al Carrito"}
                </button>
            </footer>`;
        contenedorProductos.appendChild(article);

        const linkDetalle = article.querySelector(".product-card__link") as HTMLAnchorElement;
        linkDetalle?.addEventListener("click", (e) => {
            e.preventDefault();
            openProductModal(producto);
        });
    });

    contenedorProductos.querySelectorAll("button[data-id]:not([disabled])").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
            e.preventDefault();
            const id = Number((btn as HTMLElement).dataset.id);
            await agregarAlCarrito(id, btn as HTMLButtonElement);
        });
    });
};

const stockClassModal = (stockDisponible: number, cantidad: number): string => {
    const restante = stockDisponible - cantidad;
    if (restante <= 0) return "detail__stock--out";
    if (restante <= 3) return "detail__stock--low";
    return "";
};

const stockTextoModal = (stockDisponible: number, cantidad: number): string => {
    const restante = stockDisponible - cantidad;
    if (restante <= 0) return "Sin stock adicional disponible";
    if (restante === 1) return "¡Último disponible!";
    if (restante <= 3) return `Solo quedan ${restante} en stock`;
    return `Stock disponible: ${restante}`;
};

const openProductModal = (producto: Product): void => {
    const carrito = getCart();
    const itemEnCarrito = carrito.find((item) => item.productId === producto.id);
    const cantidadEnCarrito = itemEnCarrito?.quantity ?? 0;
    const stockDisponible = Math.max(0, producto.stock - cantidadEnCarrito);

    modalProductoContent.innerHTML = `
        <div class="detail__image">
            <img src="${producto.imagen}" alt="${producto.nombre}">
        </div>
        <div class="detail__info">
            <span class="detail__badge ${stockDisponible === 0 ? "detail__badge--no-disponible" : "detail__badge--disponible"}">
                ${stockDisponible === 0 ? "No disponible" : "Disponible"}
            </span>
            <h2 id="modal-producto-title">${producto.nombre}</h2>
            <p class="detail__precio">$${producto.precio.toLocaleString("es-AR")}</p>
            <p class="detail__descripcion">${producto.descripcion}</p>
            <p id="modal-stock" class="detail__stock ${stockClassModal(stockDisponible, 1)}">
                ${stockTextoModal(stockDisponible, 1)}
            </p>
            <div class="detail__quantity">
                <span>Cantidad:</span>
                <div class="quantity-control">
                    <button type="button" id="modal-btn-restar">−</button>
                    <span id="modal-cantidad-valor">1</span>
                    <button type="button" id="modal-btn-sumar">+</button>
                </div>
            </div>
            <button type="button" id="modal-agregar" class="btn ${stockDisponible === 0 ? "btn--danger" : "btn--primary"}" ${stockDisponible === 0 ? "disabled" : ""}>
                ${stockDisponible === 0 ? "Sin stock" : "Agregar al Carrito"}
            </button>
            <p id="modal-confirmacion" class="detail__confirmacion"></p>
        </div>
    `;

    modalProducto.style.display = "flex";
    document.body.style.overflow = "hidden";

    let cantidad = 1;
    const cantidadValor = document.getElementById("modal-cantidad-valor") as HTMLElement;
    const btnSumar = document.getElementById("modal-btn-sumar") as HTMLButtonElement;
    const btnRestar = document.getElementById("modal-btn-restar") as HTMLButtonElement;
    const btnAgregar = document.getElementById("modal-agregar") as HTMLButtonElement;
    const modalStock = document.getElementById("modal-stock") as HTMLElement;

    const actualizarControles = (): void => {
        cantidadValor.textContent = String(cantidad);
        btnRestar.disabled = cantidad <= 1;
        btnSumar.disabled = cantidad >= stockDisponible;

        if (modalStock) {
            modalStock.textContent = stockTextoModal(stockDisponible, cantidad);
            modalStock.className = `detail__stock ${stockClassModal(stockDisponible, cantidad)}`;
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
        if (stockDisponible <= 0) return;
        await addToCart(producto.id, cantidad);
        actualizarBadgeCarrito();
        btnAgregar.textContent = "Agregado";
        btnAgregar.classList.remove("btn--primary");
        btnAgregar.classList.add("btn--success");
        setTimeout(() => {
            btnAgregar.textContent = "Agregar al Carrito";
            btnAgregar.classList.remove("btn--success");
            btnAgregar.classList.add("btn--primary");
        }, 1200);
        actualizarControles();
    });

    actualizarControles();
};

const closeProductModal = (): void => {
    modalProducto.style.display = "none";
    document.body.style.overflow = "";
};

modalProductoClose?.addEventListener("click", closeProductModal);
modalProducto?.addEventListener("click", (event) => {
    if (event.target === modalProducto) closeProductModal();
});
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeProductModal();
});


// Agregar al carrito
// ---------------------------------------------------------------
const agregarAlCarrito = async (id: number, btn: HTMLButtonElement): Promise<void> => {
    const producto = productos.find((p) => p.id === id);
    if (!producto) return;

    const carrito = await addToCart(id, 1);
    const item = carrito.find((i) => i.productId === id);
    const cantidadEnCarrito = item?.quantity ?? 0;

    const textoOriginal = btn.textContent;
    btn.textContent = cantidadEnCarrito >= producto.stock ? "Límite alcanzado" : "Agregado";
    btn.disabled = cantidadEnCarrito >= producto.stock;
    btn.classList.remove("btn--primary");
    btn.classList.add("btn--success");
    setTimeout(() => {
        btn.textContent = textoOriginal;
        btn.disabled = cantidadEnCarrito >= producto.stock;
        btn.classList.remove("btn--success");
        btn.classList.add("btn--primary");
    }, 1200);

    actualizarBadgeCarrito();
};


// Eventos
// ---------------------------------------------------------------
buscador.addEventListener("input", renderProductos);
ordenSelect.addEventListener("change", renderProductos);

const buttonLogout = document.getElementById("logoutButton") as HTMLButtonElement;
buttonLogout?.addEventListener("click", () => logout());


// Init: carga inicial desde los JSON
// ---------------------------------------------------------------
const init = async (): Promise<void> => {
    setupNavbar();
    try {
        const [categorias, productosData] = await Promise.all([getCategorias(), getProductos()]);
        productos = normalizarProductos(productosData);
        renderCategorias(categorias);
        renderProductos();
    } catch (error) {
        console.error("Error al cargar el catálogo:", error);
        contenedorProductos.innerHTML = `<p>Ocurrió un error al cargar los productos.</p>`;
    }
};

init();
