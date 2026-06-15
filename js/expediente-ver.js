let expedienteId = null;
let expedienteActual = null;

document.addEventListener("DOMContentLoaded", async () => {
    const usuario = await verificarSesion();

    if (!usuario) {
        return;
    }

    document.getElementById("userName").textContent = usuario.nombre;
    document.getElementById("userRole").textContent = usuario.rol;

    expedienteId = obtenerParametroURL("id");

    if (!expedienteId) {
        mostrarError("No se recibió el ID del expediente.");
        return;
    }

    cargarDetalleExpediente(expedienteId);
    const estadoForm = document.getElementById("estadoForm");

if (estadoForm) {
    estadoForm.addEventListener("submit", guardarCambioEstado);
}
});

async function cargarDetalleExpediente(id) {
    const message = document.getElementById("detailMessage");
    const contenido = document.getElementById("detalleContenido");

    message.textContent = "Cargando expediente...";
    message.className = "table-message";
    contenido.style.display = "none";

    try {
        const response = await fetch("../api/expedientes/ver.php?id=" + encodeURIComponent(id), {
            method: "GET",
            credentials: "include"
        });

        const result = await response.json();

        if (!result.success) {
            mostrarError(result.message || "No se pudo cargar el expediente.");
            return;
        }

        const expediente = result.data.expediente;
        expedienteActual = expediente;
        const seguimiento = result.data.seguimiento || [];

        pintarExpediente(expediente);
        pintarHistorial(seguimiento);

        message.textContent = "";
        contenido.style.display = "block";

    } catch (error) {
        console.error(error);
        mostrarError("Error de conexión con el servidor.");
    }
}

function pintarExpediente(exp) {
    const estadoTexto = formatoEstado(exp.estado_actual);
    const estadoClase = claseEstado(exp.estado_actual);

    document.getElementById("tituloExpediente").textContent = "Expediente " + valor(exp.numero_expediente);
    document.getElementById("numeroExpediente").textContent = valor(exp.numero_expediente);
    document.getElementById("clientePrincipal").textContent = valor(exp.cliente_nombre);

    const badge = document.getElementById("estadoActualBadge");
    badge.textContent = estadoTexto;
    badge.className = "status-badge " + estadoClase;

    document.getElementById("responsableActual").textContent =
        "Responsable: " + valor(exp.responsable_actual, "Sin responsable");

    document.getElementById("infoNumeroExpediente").textContent = valor(exp.numero_expediente);
    document.getElementById("infoFechaRecepcion").textContent = formatearFecha(exp.fecha_recepcion);
    document.getElementById("infoFechaCierre").textContent = formatearFecha(exp.fecha_cierre);
    document.getElementById("infoCreadoPor").textContent = valor(exp.creado_por_nombre, "Sin dato");

    document.getElementById("infoClienteNombre").textContent = valor(exp.cliente_nombre);
    document.getElementById("infoClienteTelefono").textContent = valor(exp.cliente_telefono, "Sin teléfono");
    document.getElementById("infoClienteCorreo").textContent = valor(exp.cliente_correo, "Sin correo");
    document.getElementById("infoClienteDireccion").textContent = valor(exp.cliente_direccion, "Sin dirección");

    document.getElementById("infoNumeroEscritura").textContent = valor(exp.numero_escritura, "Sin dato");
    document.getElementById("infoFechaEscritura").textContent = formatearFecha(exp.fecha_escritura);
    document.getElementById("infoTipoActo").textContent = valor(exp.tipo_acto);
    document.getElementById("infoNotaria").textContent = valor(exp.notaria, "Sin dato");
    document.getElementById("infoMunicipio").textContent = valor(exp.municipio, "Sin dato");
    document.getElementById("infoEstado").textContent = valor(exp.estado, "Sin dato");
    document.getElementById("infoRegistroPublico").textContent = valor(exp.registro_publico, "Sin dato");

    document.getElementById("infoObservaciones").textContent =
        valor(exp.observaciones, "Sin observaciones");
}

function pintarHistorial(seguimiento) {
    const container = document.getElementById("historialContainer");

    if (!seguimiento || seguimiento.length === 0) {
        container.innerHTML = `
            <div class="empty-timeline">
                No hay movimientos registrados.
            </div>
        `;
        return;
    }

    container.innerHTML = seguimiento.map(item => {
        const estadoAnterior = item.estado_anterior
            ? formatoEstado(item.estado_anterior)
            : "Inicio";

        const estadoNuevo = formatoEstado(item.estado_nuevo);

        return `
            <div class="timeline-item">
                <div class="timeline-point"></div>

                <div class="timeline-content">
                    <div class="timeline-header">
                        <strong>${escaparHTML(estadoAnterior)} → ${escaparHTML(estadoNuevo)}</strong>
                        <span>${formatearFechaHora(item.fecha_movimiento)}</span>
                    </div>

                    <p>${escaparHTML(item.comentario || "Sin comentario")}</p>

                    <small>
                        Responsable anterior: ${escaparHTML(item.responsable_anterior || "Sin dato")}
                        |
                        Responsable nuevo: ${escaparHTML(item.responsable_nuevo || "Sin dato")}
                        |
                        Usuario: ${escaparHTML(item.usuario_nombre || "Sistema")}
                    </small>
                </div>
            </div>
        `;
    }).join("");
}

function obtenerParametroURL(nombre) {
    const params = new URLSearchParams(window.location.search);
    return params.get(nombre);
}

function mostrarError(texto) {
    const message = document.getElementById("detailMessage");
    const contenido = document.getElementById("detalleContenido");

    message.textContent = texto;
    message.className = "table-message message-error";
    contenido.style.display = "none";
}

function valor(texto, defecto = "---") {
    if (texto === null || texto === undefined || texto === "") {
        return defecto;
    }

    return texto;
}

function formatoEstado(estado) {
    const estados = {
        RECIBIDO: "Recibido",
        EN_REVISION: "En revisión",
        EN_TRASLADO: "En traslado",
        PRESENTADO_INSCRIPCION: "En inscripción",
        OBSERVADO: "Observado",
        EN_CORRECCION: "En corrección",
        REINGRESADO: "Reingresado",
        INSCRITO: "Inscrito",
        ENTREGADO: "Entregado",
        CERRADO: "Cerrado",
        DETENIDO: "Detenido",
        CANCELADO: "Cancelado"
    };

    return estados[estado] || estado || "---";
}

function claseEstado(estado) {
    const clases = {
        RECIBIDO: "status-blue",
        EN_REVISION: "status-purple",
        EN_TRASLADO: "status-orange",
        PRESENTADO_INSCRIPCION: "status-indigo",
        OBSERVADO: "status-red",
        EN_CORRECCION: "status-yellow",
        REINGRESADO: "status-yellow",
        INSCRITO: "status-green",
        ENTREGADO: "status-green",
        CERRADO: "status-dark",
        DETENIDO: "status-gray",
        CANCELADO: "status-red"
    };

    return clases[estado] || "status-gray";
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

function formatearFechaHora(fechaHora) {
    if (!fechaHora) {
        return "Sin fecha";
    }

    const partes = fechaHora.split(" ");
    const fecha = formatearFecha(partes[0]);
    const hora = partes[1] ? partes[1].substring(0, 5) : "";

    return hora ? `${fecha} ${hora}` : fecha;
}

function escaparHTML(texto) {
    return String(texto)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
function abrirModalEstado() {
    if (!expedienteActual) {
        alert("Primero debe cargarse el expediente.");
        return;
    }

    if (expedienteActual.estado_actual === "CERRADO") {
        alert("El expediente está cerrado y no puede modificarse.");
        return;
    }

    const modal = document.getElementById("modalEstado");
    const estadoNuevo = document.getElementById("estado_nuevo");
    const responsableNuevo = document.getElementById("responsable_nuevo");
    const comentario = document.getElementById("comentario_estado");
    const mensaje = document.getElementById("estadoMessage");

    estadoNuevo.value = expedienteActual.estado_actual || "";
    responsableNuevo.value = expedienteActual.responsable_actual || "";
    comentario.value = "";
    mensaje.textContent = "";
    mensaje.className = "form-message";

    modal.style.display = "flex";
}

function cerrarModalEstado() {
    const modal = document.getElementById("modalEstado");
    modal.style.display = "none";
}

async function guardarCambioEstado(e) {
    e.preventDefault();

    const estadoNuevo = document.getElementById("estado_nuevo").value.trim();
    const responsableNuevo = document.getElementById("responsable_nuevo").value.trim();
    const comentario = document.getElementById("comentario_estado").value.trim();

    if (!expedienteId) {
        mostrarMensajeEstado("No se encontró el expediente.", "error");
        return;
    }

    if (estadoNuevo === "") {
        mostrarMensajeEstado("Seleccione el nuevo estado.", "error");
        return;
    }

    if (comentario === "") {
        mostrarMensajeEstado("El comentario del movimiento es obligatorio.", "error");
        return;
    }

    try {
        mostrarMensajeEstado("Guardando cambio...", "info");

        const response = await fetch("../api/expedientes/cambiar_estado.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                expediente_id: expedienteId,
                estado_nuevo: estadoNuevo,
                responsable_nuevo: responsableNuevo,
                comentario: comentario
            })
        });

        const result = await response.json();

        if (!result.success) {
            mostrarMensajeEstado(result.message || "No se pudo cambiar el estado.", "error");
            return;
        }

        mostrarMensajeEstado("Estado actualizado correctamente.", "success");

        setTimeout(() => {
            cerrarModalEstado();
            cargarDetalleExpediente(expedienteId);
        }, 700);

    } catch (error) {
        console.error(error);
        mostrarMensajeEstado("Error de conexión con el servidor.", "error");
    }
}

function mostrarMensajeEstado(texto, tipo) {
    const message = document.getElementById("estadoMessage");

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