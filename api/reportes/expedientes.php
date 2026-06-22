<?php

require_once "../../config/db.php";
require_once "../../config/response.php";
require_once "../../config/session.php";

require_login();

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    json_response(false, "Método no permitido", null, 405);
}

$estado = trim($_GET["estado"] ?? "");
$responsable = trim($_GET["responsable"] ?? "");
$fecha_inicio = trim($_GET["fecha_inicio"] ?? "");
$fecha_fin = trim($_GET["fecha_fin"] ?? "");

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
            c.nombre AS cliente_nombre
        FROM expedientes e
        INNER JOIN clientes c ON c.id = e.cliente_id
        WHERE 1 = 1
    ";

    $params = [];

    if ($estado !== "") {
        $sql .= " AND e.estado_actual = ? ";
        $params[] = $estado;
    }

    if ($responsable !== "") {
        $sql .= " AND e.responsable_actual LIKE ? ";
        $params[] = "%" . $responsable . "%";
    }

    if ($fecha_inicio !== "") {
        $sql .= " AND e.fecha_recepcion >= ? ";
        $params[] = $fecha_inicio;
    }

    if ($fecha_fin !== "") {
        $sql .= " AND e.fecha_recepcion <= ? ";
        $params[] = $fecha_fin;
    }

    $sql .= " ORDER BY e.fecha_recepcion DESC, e.id DESC ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    $expedientes = $stmt->fetchAll();

    $resumen = [
    "total" => count($expedientes),
    "sale_folio_notaria" => 0,
    "folio_firma" => 0,
    "ingresa_folio_notaria" => 0,
    "traslado_entregado" => 0,
    "traslado_recibido" => 0,
    "cierre_notaria" => 0,
    "cierre_gestor" => 0,
    "entrega_escritura" => 0,
    "entrega_expediente" => 0,
    "cancelacion" => 0
];

foreach ($expedientes as $exp) {
    switch ($exp["estado_actual"]) {
        case "SALE_FOLIO_NOTARIA":
            $resumen["sale_folio_notaria"]++;
            break;
        case "FOLIO_FIRMA":
            $resumen["folio_firma"]++;
            break;
        case "INGRESA_FOLIO_NOTARIA":
            $resumen["ingresa_folio_notaria"]++;
            break;
        case "TRASLADO_ENTREGADO":
            $resumen["traslado_entregado"]++;
            break;
        case "TRASLADO_RECIBIDO":
            $resumen["traslado_recibido"]++;
            break;
        case "CIERRE_NOTARIA":
            $resumen["cierre_notaria"]++;
            break;
        case "CIERRE_GESTOR":
            $resumen["cierre_gestor"]++;
            break;
        case "ENTREGA_ESCRITURA":
            $resumen["entrega_escritura"]++;
            break;
        case "ENTREGA_EXPEDIENTE":
            $resumen["entrega_expediente"]++;
            break;
        case "CANCELACION":
            $resumen["cancelacion"]++;
            break;
    }
}

    json_response(true, "Reporte obtenido correctamente", [
        "resumen" => $resumen,
        "expedientes" => $expedientes
    ]);

} catch (Exception $e) {
    json_response(false, "Error al generar reporte", $e->getMessage(), 500);
}