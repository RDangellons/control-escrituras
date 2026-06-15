<?php

require_once "../../config/response.php";
require_once "../../config/session.php";

require_login();

json_response(true, "Usuario autenticado", [
    "id" => $_SESSION["usuario_id"],
    "nombre" => $_SESSION["usuario_nombre"],
    "usuario" => $_SESSION["usuario_usuario"],
    "rol" => $_SESSION["usuario_rol"]
]);