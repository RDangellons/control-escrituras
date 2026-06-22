document.addEventListener("DOMContentLoaded", async () => {
    const usuario = await verificarSesion();

    if (!usuario) {
        return;
    }

    document.getElementById("userName").textContent = usuario.nombre;
    document.getElementById("userRole").textContent = usuario.rol;

    if (usuario.rol !== "ADMIN") {
        alert("No tiene permisos para administrar usuarios.");
        window.location.href = "dashboard.html";
        return;
    }

    document.getElementById("usuarioForm").addEventListener("submit", crearUsuario);

    cargarUsuarios();
});

async function cargarUsuarios() {
    const tbody = document.getElementById("usuariosTableBody");
    const message = document.getElementById("usuariosMessage");

    tbody.innerHTML = "";
    message.textContent = "Cargando usuarios...";

    try {
        const response = await fetch("../api/usuarios/listar.php", {
            method: "GET",
            credentials: "include"
        });

        const result = await response.json();

        if (!result.success) {
            message.textContent = result.message || "No se pudieron cargar los usuarios.";
            return;
        }

        const usuarios = result.data || [];

        message.textContent = "Total de usuarios: " + usuarios.length;

        if (usuarios.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center;">No hay usuarios registrados.</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = usuarios.map(user => crearFilaUsuario(user)).join("");

    } catch (error) {
        console.error(error);
        message.textContent = "Error de conexión con el servidor.";
    }
}

function crearFilaUsuario(user) {
    const activo = Number(user.activo) === 1;

    const estadoBadge = activo
        ? `<span class="status-badge status-green">Activo</span>`
        : `<span class="status-badge status-red">Inactivo</span>`;

    const botonEstado = activo
        ? `<button class="btn-danger-small" onclick="cambiarEstadoUsuario(${user.id}, 0)">Desactivar</button>`
        : `<button class="btn-table" onclick="cambiarEstadoUsuario(${user.id}, 1)">Activar</button>`;

    return `
        <tr>
            <td><strong>${escaparHTML(user.nombre || "")}</strong></td>
            <td>${escaparHTML(user.usuario || "")}</td>
            <td>${escaparHTML(formatoRol(user.rol))}</td>
            <td>${estadoBadge}</td>
            <td>${formatearFechaHora(user.created_at)}</td>
            <td>${botonEstado}</td>
        </tr>
    `;
}

async function crearUsuario(e) {
    e.preventDefault();

    const data = {
        nombre: document.getElementById("nombre").value.trim(),
        usuario: document.getElementById("usuario").value.trim(),
        password: document.getElementById("password").value.trim(),
        rol: document.getElementById("rol").value.trim()
    };

    if (data.nombre === "") {
        mostrarMensajeUsuario("El nombre es obligatorio.", "error");
        return;
    }

    if (data.usuario === "") {
        mostrarMensajeUsuario("El usuario es obligatorio.", "error");
        return;
    }

    if (data.password.length < 5) {
        mostrarMensajeUsuario("La contraseña debe tener mínimo 5 caracteres.", "error");
        return;
    }

    try {
        mostrarMensajeUsuario("Creando usuario...", "info");

        const response = await fetch("../api/usuarios/crear.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!result.success) {
            mostrarMensajeUsuario(result.message || "No se pudo crear el usuario.", "error");
            return;
        }

        mostrarMensajeUsuario("Usuario creado correctamente.", "success");

        document.getElementById("usuarioForm").reset();
        document.getElementById("rol").value = "CONSULTA";

        cargarUsuarios();

    } catch (error) {
        console.error(error);
        mostrarMensajeUsuario("Error de conexión con el servidor.", "error");
    }
}

async function cambiarEstadoUsuario(usuarioId, activo) {
    const texto = activo === 1 ? "activar" : "desactivar";

    if (!confirm("¿Desea " + texto + " este usuario?")) {
        return;
    }

    try {
        const response = await fetch("../api/usuarios/cambiar_estado.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                usuario_id: usuarioId,
                activo: activo
            })
        });

        const result = await response.json();

        if (!result.success) {
            alert(result.message || "No se pudo cambiar el estado del usuario.");
            return;
        }

        cargarUsuarios();

    } catch (error) {
        console.error(error);
        alert("Error de conexión con el servidor.");
    }
}

function mostrarMensajeUsuario(texto, tipo) {
    const message = document.getElementById("usuarioMessage");

    message.textContent = texto;
    message.className = "form-message";

    if (tipo === "error") {
        message.classList.add("message-error");
    }

    if (tipo === "success") {
        message.classList.add("message-success");
    }

    if (tipo === "info") {
        message.classList.add("message-info");
    }
}

function formatoRol(rol) {
    const roles = {
        ADMIN: "Administrador",
        CAPTURISTA: "Capturista",
        GESTOR: "Gestor",
        CONSULTA: "Consulta"
    };

    return roles[rol] || rol;
}

function formatearFechaHora(fechaHora) {
    if (!fechaHora) {
        return "Sin fecha";
    }

    const partes = fechaHora.split(" ");
    const fecha = formatearFecha(partes[0]);
    const hora = partes[1] ? partes[1].substring(0, 5) : "";

    return hora ? `${fecha} ${hora}` : fecha;
}

function formatearFecha(fecha) {
    if (!fecha) {
        return "Sin fecha";
    }

    const partes = fecha.split("-");

    if (partes.length !== 3) {
        return fecha;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function escaparHTML(texto) {
    return String(texto)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}