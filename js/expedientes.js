document.addEventListener("DOMContentLoaded", async () => {
    const usuario = await verificarSesion();

    if (!usuario) {
        return;
    }

    const userName = document.getElementById("userName");
    const userRole = document.getElementById("userRole");

    if (userName) {
        userName.textContent = usuario.nombre;
    }

    if (userRole) {
        userRole.textContent = usuario.rol;
    }

    configurarEventos();
    cargarExpedientes();
});

function configurarEventos() {
    const buscarInput = document.getElementById("buscarExpediente");
    const filtroEstado = document.getElementById("filtroEstado");
    const btnLimpiarFiltros = document.getElementById("btnLimpiarFiltros");

    if (buscarInput) {
        buscarInput.addEventListener("input", () => {
            cargarExpedientes();
        });
    }

    if (filtroEstado) {
        filtroEstado.addEventListener("change", () => {
            cargarExpedientes();
        });
    }

    if (btnLimpiarFiltros) {
        btnLimpiarFiltros.addEventListener("click", () => {
            if (buscarInput) {
                buscarInput.value = "";
            }

            if (filtroEstado) {
                filtroEstado.value = "";
            }

            cargarExpedientes();
        });
    }
}

async function cargarExpedientes() {
    const tbody = document.getElementById("expedientesTableBody");
    const message = document.getElementById("expedientesMessage");

    if (!tbody) {
        console.error("No existe el tbody con id expedientesTableBody");
        return;
    }

    tbody.innerHTML = "";

    if (message) {
        message.textContent = "Cargando expedientes...";
    }

    const buscar = document.getElementById("buscarExpediente")?.value.trim() || "";
    const estado = document.getElementById("filtroEstado")?.value.trim() || "";

    const params = new URLSearchParams();

    if (buscar !== "") {
        params.append("buscar", buscar);
    }

    if (estado !== "") {
        params.append("estado", estado);
    }

    try {
        const response = await fetch("../api/expedientes/listar.php?" + params.toString(), {
            method: "GET",
            credentials: "include"
        });

        const result = await response.json();

        if (!result.success) {
            if (message) {
                message.textContent = result.message || "No se pudieron cargar los expedientes.";
            }
            return;
        }

        let expedientes = [];

        if (Array.isArray(result.data)) {
            expedientes = result.data;
        } else if (result.data && Array.isArray(result.data.expedientes)) {
            expedientes = result.data.expedientes;
        }

        expedientes = expedientes.filter(exp => exp && typeof exp === "object");

        if (message) {
            message.textContent = "Total encontrado: " + expedientes.length;
        }

        if (expedientes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center;">
                        No hay expedientes registrados.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = expedientes
            .map(exp => crearFilaExpediente(exp))
            .join("");

    } catch (error) {
        console.error(error);

        if (message) {
            message.textContent = "Error de conexión con el servidor.";
        }
    }
}

function crearFilaExpediente(exp) {
    if (!exp || typeof exp !== "object") {
        return "";
    }

    const id = exp.id || "";
    const numeroExpediente = exp.numero_expediente || "---";
    const tipoActo = exp.tipo_acto || "Sin tipo de acto";
    const clienteNombre = exp.cliente_nombre || "---";
    const municipio = exp.municipio || "";
    const numeroEscritura = exp.numero_escritura || "---";
    const estadoActual = exp.estado_actual || "";
    const responsable = exp.responsable_actual || "---";
    const fechaRecepcion = exp.fecha_recepcion || "";

    return `
        <tr class="expediente-row">
            <td data-label="Expediente">
                <div class="exp-main">
                    <strong>${escaparHTML(numeroExpediente)}</strong>
                    <small>${escaparHTML(tipoActo)}</small>
                </div>
            </td>

            <td data-label="Cliente">
                <div class="exp-client">
                    <strong>${escaparHTML(clienteNombre)}</strong>
                    <small>${escaparHTML(municipio)}</small>
                </div>
            </td>

            <td data-label="Escritura">
                <span class="exp-number">
                    ${escaparHTML(numeroEscritura)}
                </span>
            </td>

            <td data-label="Estado">
                <span class="status-badge ${claseEstado(estadoActual)}">
                    ${formatoEstado(estadoActual)}
                </span>
            </td>

            <td data-label="Responsable">
                ${escaparHTML(responsable)}
            </td>

            <td data-label="Recepción">
                ${formatearFecha(fechaRecepcion)}
            </td>

            <td data-label="Acciones">
                <a href="expediente-ver.html?id=${id}" class="btn-view-exp">
                    Ver expediente
                </a>
            </td>
        </tr>
    `;
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
        CANCELACION: "Cancelación"
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
        CANCELACION: "status-red"
    };

    return clases[estado] || "status-gray";
}

function formatearFecha(fecha) {
    if (!fecha) {
        return "---";
    }

    const partes = fecha.split("-");

    if (partes.length !== 3) {
        return fecha;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function escaparHTML(texto) {
    return String(texto ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}