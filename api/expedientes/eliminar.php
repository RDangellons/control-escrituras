<?php

require_once "../../config/db.php";
require_once "../../config/session.php";
require_once "../../config/response.php";

verificarSesion();

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    jsonResponse(false, "Método no permitido.");
}

$data = json_decode(file_get_contents("php://input"), true);

$id = isset($data["id"]) ? intval($data["id"]) : 0;

if ($id <= 0) {
    jsonResponse(false, "ID de expediente inválido.");
}

$usuario_id = $_SESSION["usuario"]["id"] ?? null;

try {
    $sql = "
        UPDATE expedientes
        SET 
            eliminado = 1,
            eliminado_en = NOW(),
            eliminado_por = ?
        WHERE id = ?
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$usuario_id, $id]);

    if ($stmt->rowCount() === 0) {
        jsonResponse(false, "No se encontró el expediente o ya fue eliminado.");
    }

    jsonResponse(true, "Expediente eliminado correctamente.");

} catch (Exception $e) {
    jsonResponse(false, "Error al eliminar el expediente: " . $e->getMessage());
}