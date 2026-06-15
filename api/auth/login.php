<?php

require_once "../../config/db.php";
require_once "../../config/response.php";

session_start();

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    json_response(false, "Método no permitido", null, 405);
}

$input = json_decode(file_get_contents("php://input"), true);

$usuario = trim($input["usuario"] ?? "");
$password = trim($input["password"] ?? "");

if ($usuario === "" || $password === "") {
    json_response(false, "Usuario y contraseña son obligatorios", null, 400);
}

try {
    $stmt = $pdo->prepare("
        SELECT id, nombre, usuario, password, rol, activo
        FROM usuarios
        WHERE usuario = ?
        LIMIT 1
    ");

    $stmt->execute([$usuario]);
    $user = $stmt->fetch();

    if (!$user) {
        json_response(false, "Usuario o contraseña incorrectos", null, 401);
    }

    if ((int)$user["activo"] !== 1) {
        json_response(false, "El usuario se encuentra desactivado", null, 403);
    }

    if (!password_verify($password, $user["password"])) {
        json_response(false, "Usuario o contraseña incorrectos", null, 401);
    }

    $_SESSION["usuario_id"] = $user["id"];
    $_SESSION["usuario_nombre"] = $user["nombre"];
    $_SESSION["usuario_usuario"] = $user["usuario"];
    $_SESSION["usuario_rol"] = $user["rol"];

    json_response(true, "Inicio de sesión correcto", [
        "id" => $user["id"],
        "nombre" => $user["nombre"],
        "usuario" => $user["usuario"],
        "rol" => $user["rol"]
    ]);

} catch (Exception $e) {
    json_response(false, "Error al iniciar sesión", $e->getMessage(), 500);
}