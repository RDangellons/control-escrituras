<?php

require_once "../../config/db.php";
require_once "../../config/response.php";
require_once "../../config/session.php";

require_role(["ADMIN"]);

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    json_response(false, "Método no permitido", null, 405);
}

$input = json_decode(file_get_contents("php://input"), true);

$usuario_id = intval($input["usuario_id"] ?? 0);
$activo = intval($input["activo"] ?? 0);

if ($usuario_id <= 0) {
    json_response(false, "ID de usuario no válido", null, 400);
}

if (!in_array($activo, [0, 1])) {
    json_response(false, "Estado no válido", null, 400);
}

if ($usuario_id == current_user_id() && $activo === 0) {
    json_response(false, "No puede desactivar su propio usuario", null, 409);
}

try {
    $stmt = $pdo->prepare("
        UPDATE usuarios
        SET activo = ?
        WHERE id = ?
    ");

    $stmt->execute([
        $activo,
        $usuario_id
    ]);

    json_response(true, $activo === 1 ? "Usuario activado correctamente" : "Usuario desactivado correctamente");

} catch (Exception $e) {
    json_response(false, "Error al cambiar estado del usuario", $e->getMessage(), 500);
}