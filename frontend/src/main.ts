import type { IUser } from "./types/IUser";
import type { Rol } from "./types/Rol";
import { checkAuthUser } from "./utils/auth";

// Crear usuario admin por defecto si no existe
const inicializarAdmin = () => {
    const usersRaw = localStorage.getItem("users");
    const users: IUser[] = usersRaw ? JSON.parse(usersRaw) : [];

    if (!users.find((u) => u.email === "admin@foodstore.com")) {
        users.push({
            email: "admin@foodstore.com",
            password: "admin123",
            loggedIn: false,
            role: "admin",
        });
        localStorage.setItem("users", JSON.stringify(users));
    }
};

// Guard centralizado
const routeGuard = () => {
    const path = window.location.pathname;

    const esRutaPublica =
        path.includes("/login/") ||
        path.includes("/registro/") ||
        path === "/" ||
        path.endsWith("index.html");

    if (esRutaPublica) return;

    const rolRequerido: Rol = path.includes("/admin/") ? "admin" : "client";

    checkAuthUser(rolRequerido);
};

// Inicializar admin y aplicar guardia de rutas
inicializarAdmin();
routeGuard(); 
