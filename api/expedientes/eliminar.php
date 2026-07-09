<?php

require_once "../../config/db.php";
require_once "../../config/response.php";
require_once "../../config/session.php";

require_login();

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    json_response(false, "Método no permitido", null, 405);
}

$data = json_decode(file_get_contents("php://input"), true);

$id = intval($data["id"] ?? 0);

if ($id <= 0) {
    json_response(false, "ID de expediente inválido", null, 400);
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
        AND eliminado = 0
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$usuario_id, $id]);

    if ($stmt->rowCount() === 0) {
        json_response(false, "No se encontró el expediente o ya fue eliminado", null, 404);
    }

    json_response(true, "Expediente eliminado correctamente");

} catch (Exception $e) {
    json_response(false, "Error al eliminar expediente", $e->getMessage(), 500);
}