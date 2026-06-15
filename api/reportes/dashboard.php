<?php

require_once "../../config/db.php";
require_once "../../config/response.php";
require_once "../../config/session.php";

require_login();

try {
    $sql = "
        SELECT
            COUNT(*) AS total,

            SUM(CASE 
                WHEN estado_actual NOT IN ('CERRADO', 'CANCELADO') 
                THEN 1 ELSE 0 
            END) AS activos,

            SUM(CASE 
                WHEN estado_actual = 'EN_TRASLADO' 
                THEN 1 ELSE 0 
            END) AS en_traslado,

            SUM(CASE 
                WHEN estado_actual = 'PRESENTADO_INSCRIPCION' 
                THEN 1 ELSE 0 
            END) AS en_inscripcion,

            SUM(CASE 
                WHEN estado_actual = 'OBSERVADO' 
                THEN 1 ELSE 0 
            END) AS observados,

            SUM(CASE 
                WHEN estado_actual = 'INSCRITO' 
                THEN 1 ELSE 0 
            END) AS inscritos,

            SUM(CASE 
                WHEN estado_actual = 'CERRADO' 
                THEN 1 ELSE 0 
            END) AS cerrados

        FROM expedientes
    ";

    $stmt = $pdo->query($sql);
    $data = $stmt->fetch();

    foreach ($data as $key => $value) {
        $data[$key] = (int) $value;
    }

    json_response(true, "Datos del dashboard obtenidos correctamente", $data);

} catch (Exception $e) {
    json_response(false, "Error al obtener datos del dashboard", $e->getMessage(), 500);
}