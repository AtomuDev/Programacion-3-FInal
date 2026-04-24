import type { IUser } from "../../../types/IUser";
import { getUsers, saveUsers } from "../../../utils/localStorage";

const form = document.getElementById("formRegistro") as HTMLFormElement;
const inputEmail = document.getElementById("email") as HTMLInputElement;
const inputPassword = document.getElementById("password") as HTMLInputElement;

form.addEventListener("submit", (e: SubmitEvent) => {
    e.preventDefault();

    const email = inputEmail.value.trim();
    const password = inputPassword.value.trim();

    if (!email || !password) {
        alert("Completá todos los campos");
        return;
    }

    const users = getUsers();

    const yaExiste = users.find((u) => u.email === email);
    if (yaExiste) {
        alert("Ya existe un usuario con ese email");
        return;
    }

    const nuevoUsuario: IUser = {
        email,
        password,
        loggedIn: false,
        role: "client",
    };

    users.push(nuevoUsuario);
    saveUsers(users);

    alert("Registro exitoso. Ahora podés iniciar sesión.");
    window.location.href = "/src/pages/auth/login/login.html";
});
