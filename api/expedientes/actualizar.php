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

$numero_expediente = trim($input["numero_expediente"] ?? "");
$numero_escritura = trim($input["numero_escritura"] ?? "");
$fecha_escritura = trim($input["fecha_escritura"] ?? "");

$cliente_nombre = trim($input["cliente_nombre"] ?? "");
$cliente_telefono = trim($input["cliente_telefono"] ?? "");
$cliente_correo = trim($input["cliente_correo"] ?? "");
$cliente_direccion = trim($input["cliente_direccion"] ?? "");

$tipo_acto = trim($input["tipo_acto"] ?? "");
$notaria = trim($input["notaria"] ?? "");
$municipio = trim($input["municipio"] ?? "");
$estado = trim($input["estado"] ?? "");
$registro_publico = trim($input["registro_publico"] ?? "");

$estado_actual = trim($input["estado_actual"] ?? "");
$responsable_actual = trim($input["responsable_actual"] ?? "");
$observaciones = trim($input["observaciones"] ?? "");
$comentario_correccion = trim($input["comentario_correccion"] ?? "");

if ($expediente_id <= 0) {
    json_response(false, "ID de expediente no válido", null, 400);
}

if ($numero_expediente === "") {
    json_response(false, "El número de expediente es obligatorio", null, 400);
}

if ($cliente_nombre === "") {
    json_response(false, "El nombre del cliente es obligatorio", null, 400);
}

if ($tipo_acto === "") {
    json_response(false, "El tipo de acto jurídico es obligatorio", null, 400);
}

if ($estado_actual === "") {
    json_response(false, "El estado actual es obligatorio", null, 400);
}

if ($comentario_correccion === "") {
    json_response(false, "Debe indicar el motivo de la corrección", null, 400);
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
    "Cancelado"
];

if (!in_array($estado_actual, $estados_validos)) {
    json_response(false, "Estado no válido", null, 400);
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("
        SELECT 
            e.id,
            e.cliente_id,
            e.numero_expediente,
            e.estado_actual,
            e.responsable_actual
        FROM expedientes e
        WHERE e.id = ?
        LIMIT 1
    ");

    $stmt->execute([$expediente_id]);
    $expediente = $stmt->fetch();

    if (!$expediente) {
        $pdo->rollBack();
        json_response(false, "No se encontró el expediente", null, 404);
    }

    $stmtDuplicado = $pdo->prepare("
        SELECT id
        FROM expedientes
        WHERE numero_expediente = ?
        AND id != ?
        LIMIT 1
    ");

    $stmtDuplicado->execute([$numero_expediente, $expediente_id]);

    if ($stmtDuplicado->fetch()) {
        $pdo->rollBack();
        json_response(false, "Ya existe otro expediente con ese número", null, 409);
    }

    $estado_anterior = $expediente["estado_actual"];
    $responsable_anterior = $expediente["responsable_actual"];

    $fecha_cierre = null;

    if ($estado_actual === "CERRADO") {
        $fecha_cierre = date("Y-m-d");
    }

    $stmtCliente = $pdo->prepare("
        UPDATE clientes
        SET
            nombre = ?,
            telefono = ?,
            correo = ?,
            direccion = ?
        WHERE id = ?
    ");

    $stmtCliente->execute([
        $cliente_nombre,
        $cliente_telefono !== "" ? $cliente_telefono : null,
        $cliente_correo !== "" ? $cliente_correo : null,
        $cliente_direccion !== "" ? $cliente_direccion : null,
        $expediente["cliente_id"]
    ]);

    $stmtExpediente = $pdo->prepare("
        UPDATE expedientes
        SET
            numero_expediente = ?,
            numero_escritura = ?,
            fecha_escritura = ?,
            tipo_acto = ?,
            notaria = ?,
            municipio = ?,
            estado = ?,
            registro_publico = ?,
            estado_actual = ?,
            responsable_actual = ?,
            observaciones = ?,
            fecha_cierre = CASE
                WHEN ? = 'CERRADO' THEN ?
                WHEN ? != 'CERRADO' THEN NULL
                ELSE fecha_cierre
            END
        WHERE id = ?
    ");

    $stmtExpediente->execute([
        $numero_expediente,
        $numero_escritura !== "" ? $numero_escritura : null,
        $fecha_escritura !== "" ? $fecha_escritura : null,
        $tipo_acto,
        $notaria !== "" ? $notaria : null,
        $municipio !== "" ? $municipio : null,
        $estado !== "" ? $estado : null,
        $registro_publico !== "" ? $registro_publico : null,
        $estado_actual,
        $responsable_actual !== "" ? $responsable_actual : null,
        $observaciones !== "" ? $observaciones : null,
        $estado_actual,
        $fecha_cierre,
        $estado_actual,
        $expediente_id
    ]);

    /*
        Si se corrigió estado o responsable, se deja movimiento en bitácora.
        Si solo se corrigieron datos generales, también dejamos constancia.
    */

    $estado_cambio = $estado_anterior !== $estado_actual;
    $responsable_cambio = ($responsable_anterior ?? "") !== ($responsable_actual ?? "");

    if ($estado_cambio || $responsable_cambio) {
        $comentario_bitacora = "Corrección administrativa: " . $comentario_correccion;

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
            $estado_actual,
            $responsable_anterior,
            $responsable_actual !== "" ? $responsable_actual : null,
            $comentario_bitacora,
            current_user_id()
        ]);
    } else {
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
            $estado_actual,
            $responsable_anterior,
            $responsable_actual !== "" ? $responsable_actual : null,
            "Corrección de datos generales: " . $comentario_correccion,
            current_user_id()
        ]);
    }

    $pdo->commit();

    json_response(true, "Expediente actualizado correctamente", [
        "expediente_id" => $expediente_id
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    json_response(false, "Error al actualizar expediente", $e->getMessage(), 500);
}