<?php

require_once "../../config/db.php";
require_once "../../config/response.php";
require_once "../../config/session.php";

require_login();

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    json_response(false, "Método no permitido", null, 405);
}

$buscar = trim($_GET["buscar"] ?? "");
$estado = trim($_GET["estado"] ?? "");

try {
    $sql = "
        SELECT 
            e.id,
            e.numero_expediente,
            e.numero_escritura,
            e.fecha_escritura,
            e.tipo_acto,
            e.notaria,
            e.municipio,
            e.estado,
            e.registro_publico,
            e.estado_actual,
            e.responsable_actual,
            e.fecha_recepcion,
            e.fecha_cierre,
            e.created_at,
            c.nombre AS cliente_nombre,
            c.telefono AS cliente_telefono
        FROM expedientes e
        INNER JOIN clientes c ON c.id = e.cliente_id
        WHERE 1 = 1
        AND e.eliminado = 0
    ";

    $params = [];

    if ($buscar !== "") {
        $sql .= "
            AND (
                e.numero_expediente LIKE ?
                OR e.numero_escritura LIKE ?
                OR c.nombre LIKE ?
                OR e.tipo_acto LIKE ?
                OR e.notaria LIKE ?
                OR e.registro_publico LIKE ?
            )
        ";

        $like = "%" . $buscar . "%";

        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
    }

    if ($estado !== "") {
        $sql .= " AND e.estado_actual = ? ";
        $params[] = $estado;
    }

    $sql .= " ORDER BY e.id DESC ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    $expedientes = $stmt->fetchAll();

    json_response(true, "Expedientes obtenidos correctamente", $expedientes);

} catch (Exception $e) {
    json_response(false, "Error al obtener expedientes", $e->getMessage(), 500);
}