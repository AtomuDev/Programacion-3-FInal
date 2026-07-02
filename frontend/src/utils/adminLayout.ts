import { logout } from "./auth";

export type AdminPage = "dashboard" | "categorias" | "productos" | "pedidos";

const links: { page: AdminPage; href: string; label: string }[] = [
    { page: "dashboard", href: "/src/pages/admin/adminHome/adminHome.html", label: "Dashboard" },
    { page: "categorias", href: "/src/pages/admin/categories/categories.html", label: "Categorías" },
    { page: "productos", href: "/src/pages/admin/products/products.html", label: "Productos" },
    { page: "pedidos", href: "/src/pages/admin/orders/orders.html", label: "Pedidos" },
];

// Pinta el sidebar de admin marcando como activa la página actual,
// y conecta el botón de logout. Se llama una vez al cargar cada página.
export const setupAdminLayout = (active: AdminPage): void => {
    const nav = document.querySelector(".admin-sidebar__list") as HTMLUListElement | null;
    if (nav) {
        nav.innerHTML = links
            .map(
                (l) =>
                    `<li><a href="${l.href}" class="admin-sidebar__link${l.page === active ? " admin-sidebar__link--active" : ""}">${l.label}</a></li>`
            )
            .join("");
    }

    const buttonLogout = document.getElementById("logoutButton") as HTMLButtonElement | null;
    buttonLogout?.addEventListener("click", () => logout());
};
