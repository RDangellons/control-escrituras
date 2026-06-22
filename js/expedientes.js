document.addEventListener("DOMContentLoaded", async () => {
    const usuario = await verificarSesion();

    if (!usuario) {
        return;
    }

    document.getElementById("userName").textContent = usuario.nombre;
    document.getElementById("userRole").textContent = usuario.rol;

    configurarEventos();
    cargarExpedientes();
});

function configurarEventos() {
    const btnBuscar = document.getElementById("btnBuscar");
    const btnLimpiar = document.getElementById("btnLimpiar");
    const buscarInput = document.getElementById("buscarExpediente");
    const estadoFiltro = document.getElementById("estadoFiltro");

    btnBuscar.addEventListener("click", () => {
        cargarExpedientes();
    });

    btnLimpiar.addEventListener("click", () => {
        buscarInput.value = "";
        estadoFiltro.value = "";
        cargarExpedientes();
    });

    buscarInput.addEventListener("keyup", (e) => {
        if (e.key === "Enter") {
            cargarExpedientes();
        }
    });

    estadoFiltro.addEventListener("change", () => {
        cargarExpedientes();
    });
}

async function cargarExpedientes() {
    const tbody = document.getElementById("expedientesTableBody");
    const message = document.getElementById("tableMessage");

    const buscar = document.getElementById("buscarExpediente").value.trim();
    const estado = document.getElementById("estadoFiltro").value.trim();

    tbody.innerHTML = "";
    message.textContent = "Cargando expedientes...";
    message.className = "table-message";

    try {
        const params = new URLSearchParams();

        if (buscar !== "") {
            params.append("buscar", buscar);
        }

        if (estado !== "") {
            params.append("estado", estado);
        }

        const response = await fetch("../api/expedientes/listar.php?" + params.toString(), {
            method: "GET",
            credentials: "include"
        });

        const result = await response.json();

        if (!result.success) {
            message.textContent = result.message || "No se pudieron cargar los expedientes";
            message.classList.add("message-error");
            return;
        }

        const expedientes = result.data || [];

        if (expedientes.length === 0) {
            message.textContent = "No hay expedientes registrados con esos criterios.";
            tbody.innerHTML = "";
            return;
        }

        message.textContent = `Total encontrados: ${expedientes.length}`;

        tbody.innerHTML = expedientes.map(exp => crearFilaExpediente(exp)).join("");

    } catch (error) {
        console.error(error);
        message.textContent = "Error de conexión con el servidor";
        message.classList.add("message-error");
    }
}

function crearFilaExpediente(exp) {
    const estadoTexto = formatoEstado(exp.estado_actual);
    const estadoClase = claseEstado(exp.estado_actual);

    return `
        <tr>
            <td>
                <strong>${escaparHTML(exp.numero_expediente || "")}</strong>
            </td>
            <td>${escaparHTML(exp.numero_escritura || "Sin dato")}</td>
            <td>
                ${escaparHTML(exp.cliente_nombre || "")}
                <small>${escaparHTML(exp.cliente_telefono || "")}</small>
            </td>
            <td>${escaparHTML(exp.tipo_acto || "")}</td>
            <td>
                <span class="status-badge ${estadoClase}">
                    ${estadoTexto}
                </span>
            </td>
            <td>${escaparHTML(exp.responsable_actual || "Sin responsable")}</td>
            <td>${formatearFecha(exp.fecha_recepcion)}</td>
            <td>
                <a class="btn-table" href="expediente-ver.html?id=${exp.id}">
                    Ver
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

    return estados[estado] || estado;
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