import type { Rol } from "./Rol";

// Usuario tal como viene de /data/usuarios.json
export interface IUser {
    id: number;
    nombre: string;
    apellido: string;
    mail: string;
    celular: string;
    password: string;
    rol: Rol;
}

// Usuario logueado guardado en localStorage (sin password)
export interface ISessionUser {
    id: number;
    nombre: string;
    apellido: string;
    mail: string;
    celular: string;
    rol: Rol;
}
