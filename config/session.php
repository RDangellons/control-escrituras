<?php

session_start();

function require_login()
{
    if (!isset($_SESSION['usuario_id'])) {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "Sesión no válida. Inicie sesión nuevamente."
        ]);
        exit;
    }
}

function current_user_id()
{
    return $_SESSION['usuario_id'] ?? null;
}

function current_user_role()
{
    return $_SESSION['usuario_rol'] ?? null;
}

function require_role($roles = [])
{
    require_login();

    if (!in_array(current_user_role(), $roles)) {
        http_response_code(403);
        echo json_encode([
            "success" => false,
            "message" => "No tiene permisos para realizar esta acción."
        ]);
        exit;
    }
}