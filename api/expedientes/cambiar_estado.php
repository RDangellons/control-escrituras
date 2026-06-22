<?php

require_once "../../config/db.php";
require_once "../../config/response.php";
require_once "../../config/session.php";

require_login();

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    json_response(false, "Método no permitido", null, 405);
}

$input = json_decode(file_get_contents("php://input"), true);

$expediente_id = intval($input["expediente_id"] ?? 0);
$estado_nuevo = trim($input["estado_nuevo"] ?? "");
$responsable_nuevo = trim($input["responsable_nuevo"] ?? "");
$comentario = trim($input["comentario"] ?? "");

if ($expediente_id <= 0) {
    json_response(false, "ID de expediente no válido", null, 400);
}

if ($estado_nuevo === "") {
    json_response(false, "El nuevo estado es obligatorio", null, 400);
}

if ($comentario === "") {
    json_response(false, "El comentario del movimiento es obligatorio", null, 400);
}

$estados_validos = [
    "SALE_FOLIO_NOTARIA",
    "FOLIO_FIRMA",
    "INGRESA_FOLIO_NOTARIA",
    "TRASLADO_ENTREGADO",
    "TRASLADO_RECIBIDO",
    "CIERRE_NOTARIA",
    "CIERRE_GESTOR",
    "ENTREGA_ESCRITURA",
    "ENTREGA_EXPEDIENTE",
    "CANCELACION"
];

if (!in_array($estado_nuevo, $estados_validos)) {
    json_response(false, "Estado no válido", null, 400);
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("
        SELECT 
            id,
            estado_actual,
            responsable_actual,
            fecha_cierre
        FROM expedientes
        WHERE id = ?
        LIMIT 1
    ");

    $stmt->execute([$expediente_id]);
    $expediente = $stmt->fetch();

    if (!$expediente) {
        $pdo->rollBack();
        json_response(false, "No se encontró el expediente", null, 404);
    }

    if ($expediente["estado_actual"] === "CERRADO") {
        $pdo->rollBack();
        json_response(false, "El expediente ya está cerrado y no puede modificarse", null, 409);
    }

    $estado_anterior = $expediente["estado_actual"];
    $responsable_anterior = $expediente["responsable_actual"];

    if ($estado_anterior === $estado_nuevo && $responsable_anterior === $responsable_nuevo) {
        $pdo->rollBack();
        json_response(false, "No hubo cambios en el estado o responsable", null, 400);
    }

    $fecha_cierre = null;

    if ($estado_nuevo === "CERRADO") {
        $fecha_cierre = date("Y-m-d");
    }

    $stmtUpdate = $pdo->prepare("
        UPDATE expedientes
        SET 
            estado_actual = ?,
            responsable_actual = ?,
            fecha_cierre = CASE 
                WHEN ? = 'CERRADO' THEN ?
                ELSE fecha_cierre
            END
        WHERE id = ?
    ");

    $stmtUpdate->execute([
        $estado_nuevo,
        $responsable_nuevo !== "" ? $responsable_nuevo : null,
        $estado_nuevo,
        $fecha_cierre,
        $expediente_id
    ]);

    $stmtSeguimiento = $pdo->prepare("
        INSERT INTO seguimiento_expediente (
            expediente_id,
            estado_anterior,
            estado_nuevo,
            responsable_anterior,
            responsable_nuevo,
            comentario,
            usuario_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ");

    $stmtSeguimiento->execute([
        $expediente_id,
        $estado_anterior,
        $estado_nuevo,
        $responsable_anterior,
        $responsable_nuevo !== "" ? $responsable_nuevo : null,
        $comentario,
        current_user_id()
    ]);

    $pdo->commit();

    json_response(true, "Estado actualizado correctamente", [
        "expediente_id" => $expediente_id,
        "estado_anterior" => $estado_anterior,
        "estado_nuevo" => $estado_nuevo
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    json_response(false, "Error al cambiar el estado del expediente", $e->getMessage(), 500);
}