document.addEventListener("DOMContentLoaded", async () => {
    const usuario = await verificarSesion();

    if (!usuario) {
        return;
    }

    document.getElementById("userName").textContent = usuario.nombre;
    document.getElementById("userRole").textContent = usuario.rol;

    establecerFechaRecepcion();

    const form = document.getElementById("expedienteForm");

    if (form) {
        form.addEventListener("submit", guardarExpediente);
    }
});

function establecerFechaRecepcion() {
    const fechaInput = document.getElementById("fecha_recepcion");

    if (!fechaInput) {
        return;
    }

    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, "0");
    const dd = String(hoy.getDate()).padStart(2, "0");

    fechaInput.value = `${yyyy}-${mm}-${dd}`;
}

async function guardarExpediente(e) {
    e.preventDefault();

    const data = {
        numero_expediente: obtenerValor("numero_expediente"),
        numero_escritura: obtenerValor("numero_escritura"),
        fecha_escritura: obtenerValor("fecha_escritura"),

        cliente_nombre: obtenerValor("cliente_nombre"),
        cliente_telefono: obtenerValor("cliente_telefono"),
        cliente_correo: obtenerValor("cliente_correo"),
        cliente_direccion: obtenerValor("cliente_direccion"),

        tipo_acto: obtenerValor("tipo_acto"),
        notaria: obtenerValor("notaria"),
        municipio: obtenerValor("municipio"),
        estado: obtenerValor("estado"),
        registro_publico: obtenerValor("registro_publico"),

        estado_actual: obtenerValor("estado_actual"),
        responsable_actual: obtenerValor("responsable_actual"),
        observaciones: obtenerValor("observaciones"),
        fecha_recepcion: obtenerValor("fecha_recepcion")
    };

    if (data.numero_expediente === "") {
        mostrarMensajeFormulario("El número de expediente es obligatorio", "error");
        return;
    }

    if (data.cliente_nombre === "") {
        mostrarMensajeFormulario("El nombre del cliente es obligatorio", "error");
        return;
    }

    if (data.tipo_acto === "") {
        mostrarMensajeFormulario("El tipo de acto jurídico es obligatorio", "error");
        return;
    }

    try {
        mostrarMensajeFormulario("Guardando expediente...", "info");

        const response = await fetch("../api/expedientes/crear.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!result.success) {
            mostrarMensajeFormulario(result.message || "No se pudo guardar el expediente", "error");
            return;
        }

        mostrarMensajeFormulario("Expediente registrado correctamente", "success");

        document.getElementById("expedienteForm").reset();
        establecerFechaRecepcion();

        setTimeout(() => {
            window.location.href = "expedientes.html";
        }, 900);

    } catch (error) {
        console.error(error);
        mostrarMensajeFormulario("Error de conexión con el servidor", "error");
    }
}

function obtenerValor(id) {
    const elemento = document.getElementById(id);

    if (!elemento) {
        return "";
    }

    return elemento.value.trim();
}

function mostrarMensajeFormulario(texto, tipo) {
    const message = document.getElementById("formMessage");

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