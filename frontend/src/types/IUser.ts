import type { Rol } from "./Rol.ts";

export interface IUser {
    email: string;
    password: string;
    loggedIn: boolean;
    role: Rol;
}
