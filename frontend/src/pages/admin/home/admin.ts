import { logout } from "../../../utils/auth";
import { PRODUCTS } from "../../../data/data";
import type { Product } from "../../../types/product";

// Logout
const buttonLogout = document.getElementById("logoutButton") as HTMLButtonElement;
buttonLogout?.addEventListener("click", () => logout());

// Referencias
const tbody = document.querySelector(".admin-table tbody") as HTMLTableSectionElement;

// Render tabla
const renderTabla = (): void => {
    tbody.innerHTML = "";

    PRODUCTS.forEach((producto: Product) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <th scope="row">${producto.id}</th>
            <td><img src="../../../assets/images/${producto.imagen}" alt="${producto.nombre}" class="admin-table__img"></td>
            <td>${producto.nombre}</td>
            <td>${producto.categorias.map(c => c.nombre).join(", ")}</td>
            <td>$${producto.precio.toLocaleString("es-AR")}</td>
            <td class="${producto.stock === 0 ? "admin-table__stock--agotado" : ""}">${producto.stock}</td>
            <td class="admin-table__actions">
                <button type="button" class="btn btn--secondary btn--sm" data-id="${producto.id}">Editar</button>
                <button type="button" class="btn btn--danger btn--sm" data-id="${producto.id}">Eliminar</button>
            </td>`;
        tbody.appendChild(tr);
    });
};

// Init
renderTabla();
