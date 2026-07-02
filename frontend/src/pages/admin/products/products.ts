import type { Product } from "../../../types/product";
import type { ICategory } from "../../../types/category";
import { setupAdminLayout } from "../../../utils/adminLayout";
import {
    getCategoriasAdmin,
    getProductosAdmin,
    upsertProducto,
    eliminarProductoLogico,
    nextProductoId,
} from "../../../utils/adminData";

const tabla = document.getElementById("tabla-productos") as HTMLTableSectionElement;
const btnNuevo = document.getElementById("btn-nuevo-producto") as HTMLButtonElement;
const modal = document.getElementById("modal-producto") as HTMLElement;
const modalClose = document.getElementById("modal-close") as HTMLButtonElement;
const modalTitulo = document.getElementById("modal-titulo") as HTMLElement;
const form = document.getElementById("form-producto") as HTMLFormElement;

const inputId = document.getElementById("producto-id") as HTMLInputElement;
const inputNombre = document.getElementById("producto-nombre") as HTMLInputElement;
const inputPrecio = document.getElementById("producto-precio") as HTMLInputElement;
const inputStock = document.getElementById("producto-stock") as HTMLInputElement;
const selectCategoria = document.getElementById("producto-categoria") as HTMLSelectElement;
const inputDescripcion = document.getElementById("producto-descripcion") as HTMLTextAreaElement;
const inputImagen = document.getElementById("producto-imagen") as HTMLInputElement;
const inputDisponible = document.getElementById("producto-disponible") as HTMLInputElement;
const errorMsg = document.getElementById("producto-error") as HTMLElement;

let productos: Product[] = [];
let categorias: ICategory[] = [];

const nombreCategoria = (id: number | undefined): string => categorias.find((c) => c.id === id)?.nombre ?? "Sin categoría";

const renderTabla = (): void => {
    const activos = productos.filter((p) => !p.eliminado);
    tabla.innerHTML = "";

    if (activos.length === 0) {
        tabla.innerHTML = `<tr><td colspan="9">No hay productos registrados.</td></tr>`;
        return;
    }

    activos.forEach((p) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <th scope="row">${p.id}</th>
            <td><img src="${p.imagen}" alt="${p.nombre}" class="admin-table__img"></td>
            <td>${p.nombre}</td>
            <td class="admin-table__description">${p.descripcion || "-"}</td>
            <td>${nombreCategoria(p.categoriaId)}</td>
            <td>$${p.precio.toLocaleString("es-AR")}</td>
            <td class="${p.stock === 0 ? "admin-table__stock--agotado" : ""}">${p.stock}</td>
            <td><span class="badge ${p.disponible ? "badge--activo" : "badge--inactivo"}">${p.disponible ? "Disponible" : "No disponible"}</span></td>
            <td class="admin-table__actions">
                <button type="button" class="btn btn--secondary btn--sm" data-action="editar" data-id="${p.id}">Editar</button>
                <button type="button" class="btn btn--danger btn--sm" data-action="eliminar" data-id="${p.id}">Eliminar</button>
            </td>`;
        tabla.appendChild(tr);
    });

    tabla.querySelectorAll('[data-action="editar"]').forEach((btn) => {
        btn.addEventListener("click", () => abrirModal(Number((btn as HTMLElement).dataset.id)));
    });
    tabla.querySelectorAll('[data-action="eliminar"]').forEach((btn) => {
        btn.addEventListener("click", () => eliminarProducto(Number((btn as HTMLElement).dataset.id)));
    });
};

const cargarSelectCategorias = (): void => {
    const activas = categorias.filter((c) => !c.eliminado);
    selectCategoria.innerHTML = activas.map((c) => `<option value="${c.id}">${c.nombre}</option>`).join("");
};

const abrirModal = (id?: number): void => {
    const categoriasActivas = categorias.filter((c) => !c.eliminado);

    if (categoriasActivas.length === 0) {
        alert("No hay categorías activas. Creá al menos una categoría antes de agregar productos.");
        return;
    }

    errorMsg.style.display = "none";
    form.reset();
    cargarSelectCategorias();

    if (id) {
        const p = productos.find((pr) => pr.id === id);
        if (!p) return;
        modalTitulo.textContent = "Editar Producto";
        inputId.value = String(p.id);
        inputNombre.value = p.nombre;
        inputPrecio.value = String(p.precio);
        inputStock.value = String(p.stock);
        selectCategoria.value = String(p.categoriaId);
        inputDescripcion.value = p.descripcion;
        inputImagen.value = p.imagen;
        inputDisponible.checked = p.disponible;
    } else {
        modalTitulo.textContent = "Nuevo Producto";
        inputId.value = "";
        inputDisponible.checked = true;
    }

    modal.style.display = "flex";
};

const cerrarModal = (): void => {
    modal.style.display = "none";
};

btnNuevo.addEventListener("click", () => abrirModal());
modalClose.addEventListener("click", cerrarModal);
modal.addEventListener("click", (e) => {
    if (e.target === modal) cerrarModal();
});

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = inputNombre.value.trim();
    const precio = Number(inputPrecio.value);
    const stock = Number(inputStock.value);
    const categoriaId = Number(selectCategoria.value);
    const descripcion = inputDescripcion.value.trim();
    const imagen = inputImagen.value.trim();

    if (!nombre) {
        errorMsg.textContent = "El nombre es obligatorio.";
        errorMsg.style.display = "block";
        return;
    }
    if (nombre.length > 60) {
        errorMsg.textContent = "El nombre no puede tener más de 60 caracteres.";
        errorMsg.style.display = "block";
        return;
    }
    if (Number.isNaN(precio) || precio <= 0 || precio > 999999) {
        errorMsg.textContent = "El precio debe ser un número entre 1 y 999999.";
        errorMsg.style.display = "block";
        return;
    }
    if (Number.isNaN(stock) || stock < 0 || stock > 999) {
        errorMsg.textContent = "El stock debe ser un número entre 0 y 999.";
        errorMsg.style.display = "block";
        return;
    }
    if (!categoriaId) {
        errorMsg.textContent = "Seleccioná una categoría.";
        errorMsg.style.display = "block";
        return;
    }
    if (descripcion.length > 200) {
        errorMsg.textContent = "La descripción no puede tener más de 200 caracteres.";
        errorMsg.style.display = "block";
        return;
    }
    if (imagen.length > 500) {
        errorMsg.textContent = "La URL de imagen no puede tener más de 500 caracteres.";
        errorMsg.style.display = "block";
        return;
    }

    const idActual = inputId.value ? Number(inputId.value) : nextProductoId(productos);
    const existente = productos.find((p) => p.id === idActual);

    const producto: Product = {
        id: idActual,
        nombre,
        precio,
        stock,
        categoriaId,
        descripcion: inputDescripcion.value.trim(),
        imagen: inputImagen.value.trim() || "https://via.placeholder.com/400x300",
        disponible: inputDisponible.checked,
        eliminado: existente?.eliminado ?? false,
    };

    await upsertProducto(producto);
    productos = await getProductosAdmin();
    renderTabla();
    cerrarModal();
});

const eliminarProducto = async (id: number): Promise<void> => {
    const p = productos.find((pr) => pr.id === id);
    if (!p) return;

    if (!confirm(`¿Dar de baja el producto "${p.nombre}"?`)) return;

    const ok = await eliminarProductoLogico(id);
    if (!ok) {
        alert("No se pudo dar de baja el producto.");
        return;
    }

    productos = await getProductosAdmin();
    renderTabla();
    alert(`Producto "${p.nombre}" dado de baja correctamente.`);
};

const init = async (): Promise<void> => {
    setupAdminLayout("productos");
    try {
        [categorias, productos] = await Promise.all([getCategoriasAdmin(), getProductosAdmin()]);
        renderTabla();
    } catch (error) {
        console.error("Error al cargar productos:", error);
        tabla.innerHTML = `<tr><td colspan="9">Ocurrió un error al cargar los productos.</td></tr>`;
    }
};

init();
