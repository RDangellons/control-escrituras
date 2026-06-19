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
const editarForm = document.getElementById("editarForm");

if (editarForm) {
    editarForm.addEventListener("submit", guardarEdicionExpediente);
}
/*const documentoForm = document.getElementById("documentoForm");

if (documentoForm) {
     documentoForm.addEventListener("submit", window.subirDocumento);
}
     */
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
        window.cargarDocumentos(id);

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
        SALE_FOLIO_NOTARIA: "Sale folio notaría",
        FOLIO_FIRMA: "Folio firma",
        INGRESA_FOLIO_NOTARIA: "Ingresa folio para notaría",
        TRASLADO_ENTREGADO: "Traslado entregado",
        TRASLADO_RECIBIDO: "Traslado recibido",
        CIERRE_NOTARIA: "Cierre en notaría",
        CIERRE_GESTOR: "Cierre con gestor",
        ENTREGA_ESCRITURA: "Entrega de escritura",
        ENTREGA_EXPEDIENTE: "Entrega de expediente",
        Cancelado:"Cancelado"
    };

    return estados[estado] || estado || "---";
}

function claseEstado(estado) {
    const clases = {
       SALE_FOLIO_NOTARIA: "status-blue",
        FOLIO_FIRMA: "status-purple",
        INGRESA_FOLIO_NOTARIA: "status-indigo",
        TRASLADO_ENTREGADO: "status-orange",
        TRASLADO_RECIBIDO: "status-yellow",
        CIERRE_NOTARIA: "status-green",
        CIERRE_GESTOR: "status-green",
        ENTREGA_ESCRITURA: "status-dark",
        ENTREGA_EXPEDIENTE: "status-dark",
        Cancelado:"status-dark"
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
function abrirModalEditar() {
    if (!expedienteActual) {
        alert("Primero debe cargarse el expediente.");
        return;
    }

    document.getElementById("edit_numero_expediente").value = expedienteActual.numero_expediente || "";
    document.getElementById("edit_numero_escritura").value = expedienteActual.numero_escritura || "";
    document.getElementById("edit_fecha_escritura").value = expedienteActual.fecha_escritura || "";
    document.getElementById("edit_tipo_acto").value = expedienteActual.tipo_acto || "";

    document.getElementById("edit_cliente_nombre").value = expedienteActual.cliente_nombre || "";
    document.getElementById("edit_cliente_telefono").value = expedienteActual.cliente_telefono || "";
    document.getElementById("edit_cliente_correo").value = expedienteActual.cliente_correo || "";
    document.getElementById("edit_cliente_direccion").value = expedienteActual.cliente_direccion || "";

    document.getElementById("edit_notaria").value = expedienteActual.notaria || "";
    document.getElementById("edit_municipio").value = expedienteActual.municipio || "";
    document.getElementById("edit_estado").value = expedienteActual.estado || "";
    document.getElementById("edit_registro_publico").value = expedienteActual.registro_publico || "";

    document.getElementById("edit_estado_actual").value = expedienteActual.estado_actual || "RECIBIDO";
    document.getElementById("edit_responsable_actual").value = expedienteActual.responsable_actual || "";
    document.getElementById("edit_observaciones").value = expedienteActual.observaciones || "";
    document.getElementById("edit_comentario_correccion").value = "";

    const message = document.getElementById("editarMessage");
    message.textContent = "";
    message.className = "form-message";

    document.getElementById("modalEditar").style.display = "flex";
}

function cerrarModalEditar() {
    document.getElementById("modalEditar").style.display = "none";
}

async function guardarEdicionExpediente(e) {
    e.preventDefault();

    if (!expedienteId) {
        mostrarMensajeEditar("No se encontró el expediente.", "error");
        return;
    }

    const data = {
        expediente_id: expedienteId,

        numero_expediente: obtenerValorEdit("edit_numero_expediente"),
        numero_escritura: obtenerValorEdit("edit_numero_escritura"),
        fecha_escritura: obtenerValorEdit("edit_fecha_escritura"),

        cliente_nombre: obtenerValorEdit("edit_cliente_nombre"),
        cliente_telefono: obtenerValorEdit("edit_cliente_telefono"),
        cliente_correo: obtenerValorEdit("edit_cliente_correo"),
        cliente_direccion: obtenerValorEdit("edit_cliente_direccion"),

        tipo_acto: obtenerValorEdit("edit_tipo_acto"),
        notaria: obtenerValorEdit("edit_notaria"),
        municipio: obtenerValorEdit("edit_municipio"),
        estado: obtenerValorEdit("edit_estado"),
        registro_publico: obtenerValorEdit("edit_registro_publico"),

        estado_actual: obtenerValorEdit("edit_estado_actual"),
        responsable_actual: obtenerValorEdit("edit_responsable_actual"),
        observaciones: obtenerValorEdit("edit_observaciones"),
        comentario_correccion: obtenerValorEdit("edit_comentario_correccion")
    };

    if (data.numero_expediente === "") {
        mostrarMensajeEditar("El número de expediente es obligatorio.", "error");
        return;
    }

    if (data.cliente_nombre === "") {
        mostrarMensajeEditar("El nombre del cliente es obligatorio.", "error");
        return;
    }

    if (data.tipo_acto === "") {
        mostrarMensajeEditar("El tipo de acto jurídico es obligatorio.", "error");
        return;
    }

    if (data.estado_actual === "") {
        mostrarMensajeEditar("El estado actual es obligatorio.", "error");
        return;
    }

    if (data.comentario_correccion === "") {
        mostrarMensajeEditar("Debe indicar el motivo de la corrección.", "error");
        return;
    }

    try {
        mostrarMensajeEditar("Guardando corrección...", "info");

        const response = await fetch("../api/expedientes/actualizar.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!result.success) {
            mostrarMensajeEditar(result.message || "No se pudo actualizar el expediente.", "error");
            return;
        }

        mostrarMensajeEditar("Expediente actualizado correctamente.", "success");

        setTimeout(() => {
            cerrarModalEditar();
            cargarDetalleExpediente(expedienteId);
        }, 800);

    } catch (error) {
        console.error(error);
        mostrarMensajeEditar("Error de conexión con el servidor.", "error");
    }
}

function obtenerValorEdit(id) {
    const elemento = document.getElementById(id);

    if (!elemento) {
        return "";
    }

    return elemento.value.trim();
}

function mostrarMensajeEditar(texto, tipo) {
    const message = document.getElementById("editarMessage");

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

window.abrirModalDocumento = function () {
    if (!expedienteId) {
        alert("No se encontró el expediente.");
        return;
    }

    document.getElementById("tipo_documento").value = "";
    document.getElementById("archivo_documento").value = "";

    const message = document.getElementById("documentoUploadMessage");
    message.textContent = "";
    message.className = "form-message";

    document.getElementById("modalDocumento").style.display = "flex";
};

window.cerrarModalDocumento = function () {
    document.getElementById("modalDocumento").style.display = "none";
};


window.cargarDocumentos = async function (id) {
    const container = document.getElementById("documentosContainer");
    const message = document.getElementById("documentosMessage");

    if (!container || !message) {
        return;
    }

    container.innerHTML = "";
    message.textContent = "Cargando documentos...";
    message.className = "table-message";

    try {
        const response = await fetch("../api/documentos/listar.php?expediente_id=" + encodeURIComponent(id), {
            method: "GET",
            credentials: "include"
        });

        const result = await response.json();

        if (!result.success) {
            message.textContent = result.message || "No se pudieron cargar los documentos.";
            message.classList.add("message-error");
            return;
        }

        const documentos = result.data || [];

        if (documentos.length === 0) {
            message.textContent = "No hay documentos subidos para este expediente.";
            container.innerHTML = "";
            return;
        }

        message.textContent = `Total de documentos: ${documentos.length}`;

        container.innerHTML = documentos.map(doc => crearCardDocumento(doc)).join("");

    } catch (error) {
        console.error(error);
        message.textContent = "Error de conexión con el servidor.";
        message.classList.add("message-error");
    }
};

function crearCardDocumento(doc) {
    const ruta = "../" + doc.ruta_archivo;
    const extension = (doc.extension || "").toUpperCase();

    return `
        <article class="document-card">
            <div class="document-icon">
                ${extension || "DOC"}
            </div>

            <div class="document-info">
                <strong>${escaparHTML(doc.tipo_documento || "Documento")}</strong>
                <span>${escaparHTML(doc.nombre_original || "Sin nombre")}</span>
                <small>
                    Subido por: ${escaparHTML(doc.subido_por_nombre || "Sistema")}
                    <br>
                    Fecha: ${formatearFechaHora(doc.created_at)}
                    <br>
                    Peso: ${formatearPeso(doc.peso)}
                </small>
            </div>

            <a href="${ruta}" target="_blank" class="btn-table">
                Abrir
            </a>
        </article>
    `;
}

function formatearPeso(bytes) {
    const peso = Number(bytes || 0);

    if (peso <= 0) {
        return "Sin dato";
    }

    if (peso < 1024) {
        return peso + " B";
    }

    if (peso < 1024 * 1024) {
        return (peso / 1024).toFixed(1) + " KB";
    }

    return (peso / (1024 * 1024)).toFixed(1) + " MB";
}

window.subirDocumento = async function (e) {
    e.preventDefault();
    console.log("Intentando subir documento...");

    let idActual = expedienteId || obtenerParametroURL("id");

    if (!idActual && expedienteActual && expedienteActual.id) {
        idActual = expedienteActual.id;
    }

    if (!idActual) {
        mostrarMensajeDocumento(
            "No se encontró el expediente. Abra el expediente desde la lista con el botón Ver.",
            "error"
        );
        return;
    }

    expedienteId = idActual;

    const tipoDocumento = document.getElementById("tipo_documento").value.trim();
    const archivoInput = document.getElementById("archivo_documento");

    if (tipoDocumento === "") {
        mostrarMensajeDocumento("Seleccione el tipo de documento.", "error");
        return;
    }

    if (!archivoInput.files || archivoInput.files.length === 0) {
        mostrarMensajeDocumento("Seleccione un archivo.", "error");
        return;
    }

    const archivo = archivoInput.files[0];
    const maximo = 10 * 1024 * 1024;

    if (archivo.size > maximo) {
        mostrarMensajeDocumento("El archivo no debe pesar más de 10 MB.", "error");
        return;
    }

    const formData = new FormData();
    formData.append("expediente_id", idActual);
    formData.append("tipo_documento", tipoDocumento);
    formData.append("archivo", archivo);

    try {
        mostrarMensajeDocumento("Subiendo documento...", "info");

        const response = await fetch("../api/documentos/subir.php", {
            method: "POST",
            credentials: "include",
            body: formData
        });

        const result = await response.json();

        if (!result.success) {
            mostrarMensajeDocumento(
                result.message || "No se pudo subir el documento.",
                "error"
            );
            return;
        }

        mostrarMensajeDocumento("Documento subido correctamente.", "success");

        setTimeout(() => {
            cerrarModalDocumento();
            cargarDetalleExpediente(idActual);
        }, 800);

    } catch (error) {
        console.error(error);
        mostrarMensajeDocumento("Error de conexión con el servidor.", "error");
    }
};

function mostrarMensajeDocumento(texto, tipo) {
    const message = document.getElementById("documentoUploadMessage");

    if (!message) {
        alert(texto);
        return;
    }

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