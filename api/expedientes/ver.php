<?php

require_once "../../config/db.php";
require_once "../../config/response.php";
require_once "../../config/session.php";

require_login();

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    json_response(false, "Método no permitido", null, 405);
}

$id = intval($_GET["id"] ?? 0);

if ($id <= 0) {
    json_response(false, "ID de expediente no válido", null, 400);
}

try {
    $stmt = $pdo->prepare("
        SELECT 
            e.id,
            e.numero_expediente,
            e.numero_escritura,
            e.fecha_escritura,
            e.tipo_acto,
            e.notaria,
            e.municipio,
            e.estado,
            e.registro_publico,
            e.estado_actual,
            e.responsable_actual,
            e.observaciones,
            e.fecha_recepcion,
            e.fecha_cierre,
            e.created_at,
            e.updated_at,

            c.id AS cliente_id,
            c.nombre AS cliente_nombre,
            c.telefono AS cliente_telefono,
            c.correo AS cliente_correo,
            c.direccion AS cliente_direccion,

            u.nombre AS creado_por_nombre

        FROM expedientes e
        INNER JOIN clientes c ON c.id = e.cliente_id
        LEFT JOIN usuarios u ON u.id = e.creado_por
        WHERE e.id = ?
        LIMIT 1
    ");

    $stmt->execute([$id]);
    $expediente = $stmt->fetch();

    if (!$expediente) {
        json_response(false, "No se encontró el expediente", null, 404);
    }

    $stmtSeguimiento = $pdo->prepare("
        SELECT 
            s.id,
            s.estado_anterior,
            s.estado_nuevo,
            s.responsable_anterior,
            s.responsable_nuevo,
            s.comentario,
            s.fecha_movimiento,
            u.nombre AS usuario_nombre
        FROM seguimiento_expediente s
        LEFT JOIN usuarios u ON u.id = s.usuario_id
        WHERE s.expediente_id = ?
        ORDER BY s.fecha_movimiento DESC, s.id DESC
    ");

    $stmtSeguimiento->execute([$id]);
    $seguimiento = $stmtSeguimiento->fetchAll();

    json_response(true, "Expediente obtenido correctamente", [
        "expediente" => $expediente,
        "seguimiento" => $seguimiento
    ]);

} catch (Exception $e) {
    json_response(false, "Error al obtener expediente", $e->getMessage(), 500);
}