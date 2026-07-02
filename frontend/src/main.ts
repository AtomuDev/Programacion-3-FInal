import type { Rol } from "./types/Rol";
import { checkAuthUser } from "./utils/auth";

// Guard centralizado: se ejecuta en cada página antes que su script propio.
const routeGuard = (): void => {
    const path = window.location.pathname;

    const esRutaPublica =
        path.includes("/login/") ||
        path.includes("/register/") ||
        path === "/" ||
        path.endsWith("index.html");

    if (esRutaPublica) return;

    const rolRequerido: Rol = path.includes("/admin/") ? "ADMIN" : "USUARIO";

    checkAuthUser(rolRequerido);
};

routeGuard();
