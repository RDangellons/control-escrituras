<?php

require_once "../../config/db.php";
require_once "../../config/response.php";
require_once "../../config/session.php";

require_role(["ADMIN"]);

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    json_response(false, "Método no permitido", null, 405);
}

try {
    $stmt = $pdo->query("
        SELECT 
            id,
            nombre,
            usuario,
            rol,
            activo,
            created_at,
            updated_at
        FROM usuarios
        ORDER BY id DESC
    ");

    $usuarios = $stmt->fetchAll();

    json_response(true, "Usuarios obtenidos correctamente", $usuarios);

} catch (Exception $e) {
    json_response(false, "Error al obtener usuarios", $e->getMessage(), 500);
}