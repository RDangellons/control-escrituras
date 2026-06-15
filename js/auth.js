document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", iniciarSesion);
    }
});

async function iniciarSesion(e) {
    e.preventDefault();

    const usuario = document.getElementById("usuario").value.trim();
    const password = document.getElementById("password").value.trim();
    const message = document.getElementById("loginMessage");

    message.textContent = "";
    message.className = "login-message";

    if (usuario === "" || password === "") {
        mostrarMensaje("Debe ingresar usuario y contraseña", "error");
        return;
    }

    try {
        const response = await fetch("../api/auth/login.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                usuario: usuario,
                password: password
            })
        });

        const result = await response.json();

        if (!result.success) {
            mostrarMensaje(result.message || "No se pudo iniciar sesión", "error");
            return;
        }

        mostrarMensaje("Acceso correcto. Redirigiendo...", "success");

        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 800);

    } catch (error) {
        console.error(error);
        mostrarMensaje("Error de conexión con el servidor", "error");
    }
}

function mostrarMensaje(texto, tipo) {
    const message = document.getElementById("loginMessage");

    message.textContent = texto;

    if (tipo === "error") {
        message.classList.add("message-error");
    }

    if (tipo === "success") {
        message.classList.add("message-success");
    }
}

async function verificarSesion() {
    try {
        const response = await fetch("../api/auth/me.php", {
            method: "GET",
            credentials: "include"
        });

        const result = await response.json();

        if (!result.success) {
            window.location.href = "login.html";
            return null;
        }

        return result.data;

    } catch (error) {
        console.error(error);
        window.location.href = "login.html";
        return null;
    }
}

async function cerrarSesion() {
    try {
        await fetch("../api/auth/logout.php", {
            method: "POST",
            credentials: "include"
        });

        window.location.href = "login.html";

    } catch (error) {
        console.error(error);
        window.location.href = "login.html";
    }
}