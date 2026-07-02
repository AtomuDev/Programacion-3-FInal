import type { ICategory } from "../../../types/category";
import { setupAdminLayout } from "../../../utils/adminLayout.ts";
import { getCategoriasAdmin, upsertCategoria, eliminarCategoriaLogico, nextCategoriaId } from "../../../utils/adminData.ts";

const tabla = document.getElementById("tabla-categorias") as HTMLTableSectionElement;
const btnNueva = document.getElementById("btn-nueva-categoria") as HTMLButtonElement;
const modal = document.getElementById("modal-categoria") as HTMLElement;
const modalClose = document.getElementById("modal-close") as HTMLButtonElement;
const modalTitulo = document.getElementById("modal-titulo") as HTMLElement;
const form = document.getElementById("form-categoria") as HTMLFormElement;
const inputId = document.getElementById("categoria-id") as HTMLInputElement;
const inputNombre = document.getElementById("categoria-nombre") as HTMLInputElement;
const inputDescripcion = document.getElementById("categoria-descripcion") as HTMLInputElement;
const inputImagen = document.getElementById("categoria-imagen") as HTMLInputElement;
const errorMsg = document.getElementById("categoria-error") as HTMLElement;

let categorias: ICategory[] = [];

const renderTabla = (): void => {
    const activas = categorias.filter((c) => !c.eliminado);
    tabla.innerHTML = "";

    if (activas.length === 0) {
        tabla.innerHTML = `<tr><td colspan="5">No hay categorías registradas.</td></tr>`;
        return;
    }

    activas.forEach((cat) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <th scope="row">${cat.id}</th>
            <td><img src="${cat.imagen || "https://via.placeholder.com/100"}" alt="${cat.nombre}" class="admin-table__img"></td>
            <td>${cat.nombre}</td>
            <td>${cat.descripcion || "-"}</td>
            <td class="admin-table__actions">
                <button type="button" class="btn btn--secondary btn--sm" data-action="editar" data-id="${cat.id}">Editar</button>
                <button type="button" class="btn btn--danger btn--sm" data-action="eliminar" data-id="${cat.id}">Eliminar</button>
            </td>`;
        tabla.appendChild(tr);
    });

    tabla.querySelectorAll('[data-action="editar"]').forEach((btn) => {
        btn.addEventListener("click", () => abrirModal(Number((btn as HTMLElement).dataset.id)));
    });
    tabla.querySelectorAll('[data-action="eliminar"]').forEach((btn) => {
        btn.addEventListener("click", () => eliminarCategoria(Number((btn as HTMLElement).dataset.id)));
    });
};

const abrirModal = (id?: number): void => {
    errorMsg.style.display = "none";
    form.reset();

    if (id) {
        const cat = categorias.find((c) => c.id === id);
        if (!cat) return;
        modalTitulo.textContent = "Editar Categoría";
        inputId.value = String(cat.id);
        inputNombre.value = cat.nombre;
        inputDescripcion.value = cat.descripcion;
        inputImagen.value = cat.imagen || "";
    } else {
        modalTitulo.textContent = "Nueva Categoría";
        inputId.value = "";
    }

    modal.style.display = "flex";
};

const cerrarModal = (): void => {
    modal.style.display = "none";
};

btnNueva.addEventListener("click", () => abrirModal());
modalClose.addEventListener("click", cerrarModal);
modal.addEventListener("click", (e) => {
    if (e.target === modal) cerrarModal();
});

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = inputNombre.value.trim();
    if (!nombre) {
        errorMsg.textContent = "El nombre es obligatorio.";
        errorMsg.style.display = "block";
        return;
    }

    const idActual = inputId.value ? Number(inputId.value) : nextCategoriaId(categorias);
    const existente = categorias.find((c) => c.id === idActual);

    const categoria: ICategory = {
        id: idActual,
        nombre,
        descripcion: inputDescripcion.value.trim(),
        imagen: inputImagen.value.trim() || undefined,
        eliminado: existente?.eliminado ?? false,
    };

    await upsertCategoria(categoria);
    categorias = await getCategoriasAdmin();
    renderTabla();
    cerrarModal();
});

const eliminarCategoria = async (id: number): Promise<void> => {
    const cat = categorias.find((c) => c.id === id);
    if (!cat) return;

    if (!confirm(`¿Dar de baja la categoría "${cat.nombre}"?`)) return;

    const ok = await eliminarCategoriaLogico(id);
    if (!ok) {
        alert("No se pudo dar de baja la categoría (no existe o ya estaba eliminada).");
        return;
    }

    categorias = await getCategoriasAdmin();
    renderTabla();
    alert(`Categoría "${cat.nombre}" dada de baja correctamente.`);
};

const init = async (): Promise<void> => {
    setupAdminLayout("categorias");
    try {
        categorias = await getCategoriasAdmin();
        renderTabla();
    } catch (error) {
        console.error("Error al cargar categorías:", error);
        tabla.innerHTML = `<tr><td colspan="5">Ocurrió un error al cargar las categorías.</td></tr>`;
    }
};

init();
