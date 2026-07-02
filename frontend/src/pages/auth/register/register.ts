import type { ISessionUser, IUser } from "../../../types/IUser";
import { getUsuarios } from "../../../utils/api.ts";
import { addLocalUser, getLocalUsers, saveUser } from "../../../utils/localStorage";
import { navigate } from "../../../utils/navigate";

const form = document.getElementById("formRegistro") as HTMLFormElement;
const inputNombre = document.getElementById("nombre") as HTMLInputElement;
const inputApellido = document.getElementById("apellido") as HTMLInputElement;
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

const emailValido = (mail: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail);

form.addEventListener("submit", async (e: SubmitEvent) => {
    e.preventDefault();

    const nombre = inputNombre.value.trim();
    const apellido = inputApellido.value.trim();
    const mail = inputEmail.value.trim();
    const password = inputPassword.value.trim();

    if (!nombre || !apellido || !mail || !password) {
        mostrarError("Completá todos los campos.");
        return;
    }

    if (!emailValido(mail)) {
        mostrarError("Ingresá un email con formato válido.");
        return;
    }

    if (password.length < 6) {
        mostrarError("La contraseña debe tener al menos 6 caracteres.");
        return;
    }

    try {
        const usuariosBase = await getUsuarios();
        const usuariosLocales = getLocalUsers();
        const usuariosTotales = [...usuariosBase, ...usuariosLocales];
        const yaExiste = usuariosTotales.some((u: IUser) => u.mail.toLowerCase() === mail.toLowerCase());

        if (yaExiste) {
            mostrarError("Ya existe un usuario registrado con ese email.");
            return;
        }

        const nuevoUsuario: IUser = {
            id: Date.now(),
            nombre,
            apellido,
            mail,
            celular: "",
            password,
            rol: "USUARIO",
        };

        addLocalUser(nuevoUsuario);

        const sessionUser: ISessionUser = {
            id: nuevoUsuario.id,
            nombre: nuevoUsuario.nombre,
            apellido: nuevoUsuario.apellido,
            mail: nuevoUsuario.mail,
            celular: nuevoUsuario.celular,
            rol: nuevoUsuario.rol,
        };
        saveUser(sessionUser);

        navigate("/src/pages/store/home/home.html");
    } catch (error) {
        console.error("Error al registrar usuario:", error);
        mostrarError("Ocurrió un error al registrarte. Intentá nuevamente.");
    }
});
