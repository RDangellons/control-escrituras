<?php

require_once "../../config/db.php";
require_once "../../config/response.php";
require_once "../../config/session.php";

require_role(["ADMIN"]);

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    json_response(false, "Método no permitido", null, 405);
}

$input = json_decode(file_get_contents("php://input"), true);

$nombre = trim($input["nombre"] ?? "");
$usuario = trim($input["usuario"] ?? "");
$password = trim($input["password"] ?? "");
$rol = trim($input["rol"] ?? "CONSULTA");

if ($nombre === "") {
    json_response(false, "El nombre es obligatorio", null, 400);
}

if ($usuario === "") {
    json_response(false, "El usuario es obligatorio", null, 400);
}

if ($password === "") {
    json_response(false, "La contraseña es obligatoria", null, 400);
}

if (strlen($password) < 6) {
    json_response(false, "La contraseña debe tener mínimo 6 caracteres", null, 400);
}

$roles_validos = ["ADMIN", "CAPTURISTA"];

if (!in_array($rol, $roles_validos)) {
    json_response(false, "Rol no válido", null, 400);
}

try {
    $stmtExiste = $pdo->prepare("
        SELECT id 
        FROM usuarios 
        WHERE usuario = ?
        LIMIT 1
    ");

    $stmtExiste->execute([$usuario]);

    if ($stmtExiste->fetch()) {
        json_response(false, "Ya existe un usuario con ese nombre de usuario", null, 409);
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("
        INSERT INTO usuarios (
            nombre,
            usuario,
            password,
            rol,
            activo
        ) VALUES (?, ?, ?, ?, 1)
    ");

    $stmt->execute([
        $nombre,
        $usuario,
        $hash,
        $rol
    ]);

    json_response(true, "Usuario creado correctamente", [
        "usuario_id" => $pdo->lastInsertId()
    ], 201);

} catch (Exception $e) {
    json_response(false, "Error al crear usuario", $e->getMessage(), 500);
}