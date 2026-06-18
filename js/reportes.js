document.addEventListener("DOMContentLoaded", async () => {
    const usuario = await verificarSesion();

    if (!usuario) {
        return;
    }

    document.getElementById("userName").textContent = usuario.nombre;
    document.getElementById("userRole").textContent = usuario.rol;

    document.getElementById("btnGenerarReporte").addEventListener("click", cargarReporte);
    document.getElementById("btnLimpiarReporte").addEventListener("click", limpiarReporte);

    cargarReporte();
});

async function cargarReporte() {
    const estado = document.getElementById("reporte_estado").value.trim();
    const responsable = document.getElementById("reporte_responsable").value.trim();
    const fechaInicio = document.getElementById("fecha_inicio").value.trim();
    const fechaFin = document.getElementById("fecha_fin").value.trim();

    const params = new URLSearchParams();

    if (estado !== "") {
        params.append("estado", estado);
    }

    if (responsable !== "") {
        params.append("responsable", responsable);
    }

    if (fechaInicio !== "") {
        params.append("fecha_inicio", fechaInicio);
    }

    if (fechaFin !== "") {
        params.append("fecha_fin", fechaFin);
    }

    const message = document.getElementById("reporteMessage");
    const tbody = document.getElementById("reporteTableBody");

    message.textContent = "Cargando reporte...";
    tbody.innerHTML = "";

    try {
        const response = await fetch("../api/reportes/expedientes.php?" + params.toString(), {
            method: "GET",
            credentials: "include"
        });

        const result = await response.json();

        if (!result.success) {
            message.textContent = result.message || "No se pudo generar el reporte.";
            return;
        }

        const resumen = result.data.resumen;
        const expedientes = result.data.expedientes || [];

        pintarResumen(resumen);
        pintarTabla(expedientes);

        message.textContent = "Total encontrados: " + expedientes.length;

    } catch (error) {
        console.error(error);
        message.textContent = "Error de conexión con el servidor.";
    }
}

function limpiarReporte() {
    document.getElementById("reporte_estado").value = "";
    document.getElementById("reporte_responsable").value = "";
    document.getElementById("fecha_inicio").value = "";
    document.getElementById("fecha_fin").value = "";

    cargarReporte();
}

function pintarResumen(resumen) {
    document.getElementById("repTotal").textContent = resumen.total || 0;
    document.getElementById("repTraslado").textContent = resumen.en_traslado || 0;
    document.getElementById("repInscripcion").textContent = resumen.en_inscripcion || 0;
    document.getElementById("repObservados").textContent = resumen.observados || 0;
    document.getElementById("repInscritos").textContent = resumen.inscritos || 0;
    document.getElementById("repCerrados").textContent = resumen.cerrados || 0;
}

function pintarTabla(expedientes) {
    const tbody = document.getElementById("reporteTableBody");

    if (!expedientes || expedientes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;">
                    No hay expedientes con los filtros seleccionados.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = expedientes.map(exp => {
        return `
            <tr>
                <td>
                    <strong>${escaparHTML(exp.numero_expediente || "")}</strong>
                </td>
                <td>${escaparHTML(exp.numero_escritura || "Sin dato")}</td>
                <td>${escaparHTML(exp.cliente_nombre || "")}</td>
                <td>${escaparHTML(exp.tipo_acto || "")}</td>
                <td>
                    <span class="status-badge ${claseEstado(exp.estado_actual)}">
                        ${formatoEstado(exp.estado_actual)}
                    </span>
                </td>
                <td>${escaparHTML(exp.responsable_actual || "Sin responsable")}</td>
                <td>${formatearFecha(exp.fecha_recepcion)}</td>
                <td>${formatearFecha(exp.fecha_cierre)}</td>
            </tr>
        `;
    }).join("");
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

function escaparHTML(texto) {
    return String(texto)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}