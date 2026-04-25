import type { IUser } from "../types/IUser";
import type { Rol } from "../types/Rol";
import { getUser, removeUser } from "./localStorage";
import { navigate } from "./navigate";

export const checkAuthUser = (rolRequerido: Rol) => {
    const raw = getUser();

    // No hay sesión → al login
    if (!raw) {
        navigate("/src/pages/auth/login/login.html");
        return;
    }

    const user: IUser = JSON.parse(raw);

    // No está logueado → al login
    if (!user.loggedIn) {
        navigate("/src/pages/auth/login/login.html");
        return;
    }

    // Admin puede entrar a cualquier ruta (admin y store)
    if (user.role === "admin") return;

    // Cliente intentando entrar a ruta de admin → a su home
    if (user.role === "client" && rolRequerido === "admin") {
        navigate("/src/pages/store/home/home.html");
        return;
    }
};

export const logout = () => {
    removeUser();
    localStorage.removeItem("carrito");
    navigate("/src/pages/auth/login/login.html");
};
