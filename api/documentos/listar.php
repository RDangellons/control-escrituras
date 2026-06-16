<?php

require_once "../../config/db.php";
require_once "../../config/response.php";
require_once "../../config/session.php";

require_login();

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    json_response(false, "Método no permitido", null, 405);
}

$expediente_id = intval($_GET["expediente_id"] ?? 0);

if ($expediente_id <= 0) {
    json_response(false, "ID de expediente no válido", null, 400);
}

try {
    $stmt = $pdo->prepare("
        SELECT 
            d.id,
            d.tipo_documento,
            d.nombre_original,
            d.nombre_guardado,
            d.ruta_archivo,
            d.extension,
            d.peso,
            d.created_at,
            u.nombre AS subido_por_nombre
        FROM documentos_expediente d
        LEFT JOIN usuarios u ON u.id = d.subido_por
        WHERE d.expediente_id = ?
        ORDER BY d.created_at DESC, d.id DESC
    ");

    $stmt->execute([$expediente_id]);
    $documentos = $stmt->fetchAll();

    json_response(true, "Documentos obtenidos correctamente", $documentos);

} catch (Exception $e) {
    json_response(false, "Error al obtener documentos", $e->getMessage(), 500);
}