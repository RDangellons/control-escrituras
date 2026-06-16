<?php

require_once "../../config/db.php";
require_once "../../config/response.php";
require_once "../../config/session.php";

require_login();

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    json_response(false, "Método no permitido", null, 405);
}

$expediente_id = intval($_POST["expediente_id"] ?? 0);
$tipo_documento = trim($_POST["tipo_documento"] ?? "");

if ($expediente_id <= 0) {
    json_response(false, "ID de expediente no válido", null, 400);
}

if ($tipo_documento === "") {
    json_response(false, "El tipo de documento es obligatorio", null, 400);
}

if (!isset($_FILES["archivo"])) {
    json_response(false, "Debe seleccionar un archivo", null, 400);
}

$archivo = $_FILES["archivo"];

if ($archivo["error"] !== UPLOAD_ERR_OK) {
    json_response(false, "Error al subir el archivo", null, 400);
}

$nombre_original = $archivo["name"];
$tmp_name = $archivo["tmp_name"];
$peso = intval($archivo["size"]);

$extension = strtolower(pathinfo($nombre_original, PATHINFO_EXTENSION));

$extensiones_permitidas = ["pdf", "jpg", "jpeg", "png"];

if (!in_array($extension, $extensiones_permitidas)) {
    json_response(false, "Solo se permiten archivos PDF, JPG, JPEG o PNG", null, 400);
}

$maximo = 10 * 1024 * 1024;

if ($peso > $maximo) {
    json_response(false, "El archivo no debe pesar más de 10 MB", null, 400);
}

try {
    $stmtExp = $pdo->prepare("
        SELECT id, numero_expediente
        FROM expedientes
        WHERE id = ?
        LIMIT 1
    ");

    $stmtExp->execute([$expediente_id]);
    $expediente = $stmtExp->fetch();

    if (!$expediente) {
        json_response(false, "No se encontró el expediente", null, 404);
    }

    $numero_limpio = preg_replace("/[^A-Za-z0-9_-]/", "_", $expediente["numero_expediente"]);

    $directorio_base = "../../uploads/expedientes/";
    $directorio_expediente = $directorio_base . $numero_limpio . "/";

    if (!is_dir($directorio_base)) {
        mkdir($directorio_base, 0777, true);
    }

    if (!is_dir($directorio_expediente)) {
        mkdir($directorio_expediente, 0777, true);
    }

    $nombre_guardado = date("YmdHis") . "_" . uniqid() . "." . $extension;
    $ruta_fisica = $directorio_expediente . $nombre_guardado;

    if (!move_uploaded_file($tmp_name, $ruta_fisica)) {
        json_response(false, "No se pudo guardar el archivo en el servidor", null, 500);
    }

    $ruta_bd = "uploads/expedientes/" . $numero_limpio . "/" . $nombre_guardado;

    $stmt = $pdo->prepare("
        INSERT INTO documentos_expediente (
            expediente_id,
            tipo_documento,
            nombre_original,
            nombre_guardado,
            ruta_archivo,
            extension,
            peso,
            subido_por
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->execute([
        $expediente_id,
        $tipo_documento,
        $nombre_original,
        $nombre_guardado,
        $ruta_bd,
        $extension,
        $peso,
        current_user_id()
    ]);

    $documento_id = $pdo->lastInsertId();

    $stmtSeg = $pdo->prepare("
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

    $stmtEstado = $pdo->prepare("
        SELECT estado_actual, responsable_actual
        FROM expedientes
        WHERE id = ?
        LIMIT 1
    ");
    $stmtEstado->execute([$expediente_id]);
    $estadoActual = $stmtEstado->fetch();

    $stmtSeg->execute([
        $expediente_id,
        $estadoActual["estado_actual"] ?? null,
        $estadoActual["estado_actual"] ?? "RECIBIDO",
        $estadoActual["responsable_actual"] ?? null,
        $estadoActual["responsable_actual"] ?? null,
        "Se subió documento: " . $tipo_documento . " (" . $nombre_original . ")",
        current_user_id()
    ]);

    json_response(true, "Documento subido correctamente", [
        "documento_id" => $documento_id,
        "ruta" => $ruta_bd
    ], 201);

} catch (Exception $e) {
    json_response(false, "Error al subir documento", $e->getMessage(), 500);
}