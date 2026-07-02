import type { Rol } from "../types/Rol";
import { getSessionUser, removeUser } from "./localStorage";
import { navigate } from "./navigate";

export const checkAuthUser = (rolRequerido: Rol): void => {
    const user = getSessionUser();

    // No hay sesión → al login
    if (!user) {
        navigate("/src/pages/auth/login/login.html");
        return;
    }

    // ADMIN puede entrar a cualquier ruta (admin y store)
    if (user.rol === "ADMIN") return;

    // USUARIO intentando entrar a una ruta de admin → a su home
    if (user.rol === "USUARIO" && rolRequerido === "ADMIN") {
        navigate("/src/pages/store/home/home.html");
        return;
    }
};

export const logout = (): void => {
    removeUser();
    navigate("/src/pages/auth/login/login.html");
};
