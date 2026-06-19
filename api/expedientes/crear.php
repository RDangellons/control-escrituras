<?php

require_once "../../config/db.php";
require_once "../../config/response.php";
require_once "../../config/session.php";

require_login();

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    json_response(false, "Método no permitido", null, 405);
}

$input = json_decode(file_get_contents("php://input"), true);

$numero_expediente = trim($input["numero_expediente"] ?? "");
$numero_escritura = trim($input["numero_escritura"] ?? "");
$fecha_escritura = $input["fecha_escritura"] ?? null;

$cliente_nombre = trim($input["cliente_nombre"] ?? "");
$cliente_telefono = trim($input["cliente_telefono"] ?? "");
$cliente_correo = trim($input["cliente_correo"] ?? "");
$cliente_direccion = trim($input["cliente_direccion"] ?? "");

$tipo_acto = trim($input["tipo_acto"] ?? "");
$notaria = trim($input["notaria"] ?? "");
$municipio = trim($input["municipio"] ?? "");
$estado = trim($input["estado"] ?? "");
$registro_publico = trim($input["registro_publico"] ?? "");

$estado_actual = trim($input["estado_actual"] ?? "SALE_FOLIO_NOTARIA");
$responsable_actual = trim($input["responsable_actual"] ?? "");
$observaciones = trim($input["observaciones"] ?? "");
$fecha_recepcion = $input["fecha_recepcion"] ?? date("Y-m-d");

if ($numero_expediente === "") {
    json_response(false, "El número de expediente es obligatorio", null, 400);
}

if ($cliente_nombre === "") {
    json_response(false, "El nombre del cliente es obligatorio", null, 400);
}

if ($tipo_acto === "") {
    json_response(false, "El tipo de acto jurídico es obligatorio", null, 400);
}

if ($fecha_recepcion === "") {
    json_response(false, "La fecha de recepción es obligatoria", null, 400);
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
    json_response(false, "Estado del expediente no válido", null, 400);
}

try {
    $pdo->beginTransaction();

    $stmtExiste = $pdo->prepare("
        SELECT id 
        FROM expedientes 
        WHERE numero_expediente = ?
        LIMIT 1
    ");
    $stmtExiste->execute([$numero_expediente]);

    if ($stmtExiste->fetch()) {
        $pdo->rollBack();
        json_response(false, "Ya existe un expediente con ese número", null, 409);
    }

    $stmtCliente = $pdo->prepare("
        INSERT INTO clientes (
            nombre,
            telefono,
            correo,
            direccion
        ) VALUES (?, ?, ?, ?)
    ");

    $stmtCliente->execute([
        $cliente_nombre,
        $cliente_telefono !== "" ? $cliente_telefono : null,
        $cliente_correo !== "" ? $cliente_correo : null,
        $cliente_direccion !== "" ? $cliente_direccion : null
    ]);

    $cliente_id = $pdo->lastInsertId();

    $stmtExpediente = $pdo->prepare("
        INSERT INTO expedientes (
            numero_expediente,
            numero_escritura,
            fecha_escritura,
            cliente_id,
            tipo_acto,
            notaria,
            municipio,
            estado,
            registro_publico,
            estado_actual,
            responsable_actual,
            observaciones,
            fecha_recepcion,
            creado_por
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmtExpediente->execute([
        $numero_expediente,
        $numero_escritura !== "" ? $numero_escritura : null,
        $fecha_escritura !== "" ? $fecha_escritura : null,
        $cliente_id,
        $tipo_acto,
        $notaria !== "" ? $notaria : null,
        $municipio !== "" ? $municipio : null,
        $estado !== "" ? $estado : null,
        $registro_publico !== "" ? $registro_publico : null,
        $estado_actual,
        $responsable_actual !== "" ? $responsable_actual : null,
        $observaciones !== "" ? $observaciones : null,
        $fecha_recepcion,
        current_user_id()
    ]);

    $expediente_id = $pdo->lastInsertId();

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
        null,
        $estado_actual,
        null,
        $responsable_actual !== "" ? $responsable_actual : null,
        "Alta inicial del expediente",
        current_user_id()
    ]);

    $pdo->commit();

    json_response(true, "Expediente registrado correctamente", [
        "expediente_id" => $expediente_id,
        "cliente_id" => $cliente_id
    ], 201);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    json_response(false, "Error al registrar expediente", $e->getMessage(), 500);
}