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
        "recibidos" => 0,
        "en_revision" => 0,
        "en_traslado" => 0,
        "en_inscripcion" => 0,
        "observados" => 0,
        "inscritos" => 0,
        "entregados" => 0,
        "cerrados" => 0,
        "detenidos" => 0,
        "cancelados" => 0
    ];

    foreach ($expedientes as $exp) {
        switch ($exp["estado_actual"]) {
            case "RECIBIDO":
                $resumen["recibidos"]++;
                break;
            case "EN_REVISION":
                $resumen["en_revision"]++;
                break;
            case "EN_TRASLADO":
                $resumen["en_traslado"]++;
                break;
            case "PRESENTADO_INSCRIPCION":
                $resumen["en_inscripcion"]++;
                break;
            case "OBSERVADO":
                $resumen["observados"]++;
                break;
            case "INSCRITO":
                $resumen["inscritos"]++;
                break;
            case "ENTREGADO":
                $resumen["entregados"]++;
                break;
            case "CERRADO":
                $resumen["cerrados"]++;
                break;
            case "DETENIDO":
                $resumen["detenidos"]++;
                break;
            case "CANCELADO":
                $resumen["cancelados"]++;
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