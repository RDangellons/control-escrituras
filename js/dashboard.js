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
        document.getElementById("enTraslado").textContent = data.en_traslado;
        document.getElementById("enInscripcion").textContent = data.en_inscripcion;
        document.getElementById("observados").textContent = data.observados;
        document.getElementById("inscritos").textContent = data.inscritos;
        document.getElementById("cerrados").textContent = data.cerrados;

    } catch (error) {
        console.error("Error cargando dashboard:", error);
    }
}