import type { ISessionUser, IUser } from "../../../types/IUser";
import { getUsuarios } from "../../../utils/api.ts";
import { getLocalUsers, saveUser } from "../../../utils/localStorage";
import { navigate } from "../../../utils/navigate";

const form = document.getElementById("form") as HTMLFormElement;
const inputEmail = document.getElementById("email") as HTMLInputElement;
const inputPassword = document.getElementById("password") as HTMLInputElement;
const errorMsg = document.getElementById("errorMsg") as HTMLElement | null;

const mostrarError = (mensaje: string): void => {
    if (errorMsg) {
        errorMsg.textContent = mensaje;
        errorMsg.style.display = "block";
    } else {
        alert(mensaje);
    }
};

form.addEventListener("submit", async (e: SubmitEvent) => {
    e.preventDefault();

    const mail = inputEmail.value.trim();
    const password = inputPassword.value.trim();

    if (!mail || !password) {
        mostrarError("Completá email y contraseña.");
        return;
    }

    try {
        const usuariosBase = await getUsuarios();
        const usuariosLocales = getLocalUsers();
        const usuarios = [...usuariosBase, ...usuariosLocales];
        const encontrado = usuarios.find((u: IUser) => u.mail === mail && u.password === password);

        if (!encontrado) {
            mostrarError("Email o contraseña incorrectos.");
            return;
        }

        // Guardamos la sesión sin el password
        const sessionUser: ISessionUser = {
            id: encontrado.id,
            nombre: encontrado.nombre,
            apellido: encontrado.apellido,
            mail: encontrado.mail,
            celular: encontrado.celular,
            rol: encontrado.rol,
        };
        saveUser(sessionUser);

        if (sessionUser.rol === "ADMIN") {
            navigate("/src/pages/admin/adminHome/adminHome.html");
        } else {
            navigate("/src/pages/store/home/home.html");
        }
    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        mostrarError("Ocurrió un error al iniciar sesión. Intentá nuevamente.");
    }
});
