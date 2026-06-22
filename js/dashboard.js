document.addEventListener("DOMContentLoaded", async () => {
    const usuario = await verificarSesion();

    if (!usuario) {
        return;
    }

    document.getElementById("userName").textContent = usuario.nombre;
    document.getElementById("userRole").textContent = usuario.rol;

    cargarDashboard();
});

async function cargarDashboard() {
    try {
        const response = await fetch("../api/reportes/dashboard.php", {
            method: "GET",
            credentials: "include"
        });

        const result = await response.json();

        if (!result.success) {
            console.error(result.message);
            return;
        }

        const data = result.data;

        document.getElementById("totalExpedientes").textContent = data.total;
        document.getElementById("activos").textContent = data.activos;
        document.getElementById("saleFolioNotaria").textContent = data.sale_folio_notaria;
        document.getElementById("folioFirma").textContent = data.folio_firma;
        document.getElementById("ingresaFolioNotaria").textContent = data.ingresa_folio_notaria;
        document.getElementById("trasladoEntregado").textContent = data.traslado_entregado;
        document.getElementById("trasladoRecibido").textContent = data.traslado_recibido;
        document.getElementById("entregaExpediente").textContent = data.entrega_expediente;
        document.getElementById("cancelacion").textContent = data.cancelacion;

    } catch (error) {
        console.error("Error cargando dashboard:", error);
    }
}