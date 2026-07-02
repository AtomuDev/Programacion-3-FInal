import type { ISessionUser, IUser } from "../types/IUser";

const SESSION_KEY = "userData";
const USERS_KEY = "localUsers";

// Guardar usuario logueado en localStorage (sin password)
export const saveUser = (user: ISessionUser): void => {
    try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } catch (error) {
        console.error("Error al guardar usuario:", error);
    }
};

// Obtener el usuario en sesión actual (ya parseado), o null si no hay sesión
export const getSessionUser = (): ISessionUser | null => {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
};

// Eliminar usuario del localStorage (logout)
export const removeUser = (): void => {
    localStorage.removeItem(SESSION_KEY);
};

export const getLocalUsers = (): IUser[] => {
    try {
        const raw = localStorage.getItem(USERS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (error) {
        console.error("Error al leer usuarios locales:", error);
        return [];
    }
};

export const saveLocalUsers = (users: IUser[]): void => {
    try {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (error) {
        console.error("Error al guardar usuarios locales:", error);
    }
};

export const addLocalUser = (user: IUser): void => {
    const usuarios = getLocalUsers();
    usuarios.push(user);
    saveLocalUsers(usuarios);
};
