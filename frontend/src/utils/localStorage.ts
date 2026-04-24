import type { IUser } from "../types/IUser";

// Guardar usuario en localStorage
export const saveUser = (user: IUser) => {
    try {
        const parseUser = JSON.stringify(user);
        localStorage.setItem("userData", parseUser);
    } catch (error) {
        console.error("Error al guardar usuario:", error);
    }
};

// Obtener usuario actual desde localStorage
export const getUser = () => {
    return localStorage.getItem("userData");
};

// Eliminar usuario del localStorage (logout)
export const removeUser = () => {
    localStorage.removeItem("userData");
};

// Obtener todos los usuarios registrados desde localStorage
export const getUsers = (): IUser[] => {
    try {
        const usersRaw = localStorage.getItem("users");
        return usersRaw ? JSON.parse(usersRaw) : [];
    } catch (error) {
        console.error("Error al leer usuarios:", error);
        return [];
    }
};

// agregar un nuevo usuario al localStorage
export const saveUsers = (users: IUser[]) => {
    try {
        localStorage.setItem("users", JSON.stringify(users));
    } catch (error) {
        console.error("Error al guardar usuarios:", error);
    }
};
