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
            WHEN estado_actual NOT IN ('ENTREGA_EXPEDIENTE', 'CANCELACION') 
            THEN 1 ELSE 0 
        END) AS activos,

        SUM(CASE 
            WHEN estado_actual = 'SALE_FOLIO_NOTARIA' 
            THEN 1 ELSE 0 
        END) AS sale_folio_notaria,

        SUM(CASE 
            WHEN estado_actual = 'FOLIO_FIRMA' 
            THEN 1 ELSE 0 
        END) AS folio_firma,

        SUM(CASE 
            WHEN estado_actual = 'INGRESA_FOLIO_NOTARIA' 
            THEN 1 ELSE 0 
        END) AS ingresa_folio_notaria,

        SUM(CASE 
            WHEN estado_actual = 'TRASLADO_ENTREGADO' 
            THEN 1 ELSE 0 
        END) AS traslado_entregado,

        SUM(CASE 
            WHEN estado_actual = 'TRASLADO_RECIBIDO' 
            THEN 1 ELSE 0 
        END) AS traslado_recibido,

        SUM(CASE 
            WHEN estado_actual = 'CIERRE_NOTARIA' 
            THEN 1 ELSE 0 
        END) AS cierre_notaria,

        SUM(CASE 
            WHEN estado_actual = 'CIERRE_GESTOR' 
            THEN 1 ELSE 0 
        END) AS cierre_gestor,

        SUM(CASE 
            WHEN estado_actual = 'ENTREGA_ESCRITURA' 
            THEN 1 ELSE 0 
        END) AS entrega_escritura,

        SUM(CASE 
            WHEN estado_actual = 'ENTREGA_EXPEDIENTE' 
            THEN 1 ELSE 0 
        END) AS entrega_expediente,

        SUM(CASE 
             WHEN estado_actual = 'CANCELACION' 
            THEN 1 ELSE 0 
        END) AS cancelacion


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