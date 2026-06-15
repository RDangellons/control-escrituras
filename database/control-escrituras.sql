CREATE DATABASE IF NOT EXISTS control_escrituras
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE control_escrituras;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    usuario VARCHAR(80) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol ENUM('ADMIN', 'CAPTURISTA', 'GESTOR', 'CONSULTA') NOT NULL DEFAULT 'CONSULTA',
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(180) NOT NULL,
    telefono VARCHAR(30) NULL,
    correo VARCHAR(120) NULL,
    direccion TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE expedientes (
    id INT AUTO_INCREMENT PRIMARY KEY,

    numero_expediente VARCHAR(50) NOT NULL UNIQUE,
    numero_escritura VARCHAR(80) NULL,
    fecha_escritura DATE NULL,

    cliente_id INT NOT NULL,

    tipo_acto VARCHAR(120) NOT NULL,
    notaria VARCHAR(150) NULL,
    municipio VARCHAR(120) NULL,
    estado VARCHAR(120) NULL,
    registro_publico VARCHAR(180) NULL,

    estado_actual ENUM(
        'RECIBIDO',
        'EN_REVISION',
        'EN_TRASLADO',
        'PRESENTADO_INSCRIPCION',
        'OBSERVADO',
        'EN_CORRECCION',
        'REINGRESADO',
        'INSCRITO',
        'ENTREGADO',
        'CERRADO',
        'DETENIDO',
        'CANCELADO'
    ) NOT NULL DEFAULT 'RECIBIDO',

    responsable_actual VARCHAR(150) NULL,
    observaciones TEXT NULL,

    fecha_recepcion DATE NOT NULL,
    fecha_cierre DATE NULL,

    creado_por INT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_expedientes_cliente
        FOREIGN KEY (cliente_id) REFERENCES clientes(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_expedientes_usuario
        FOREIGN KEY (creado_por) REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

CREATE TABLE seguimiento_expediente (
    id INT AUTO_INCREMENT PRIMARY KEY,

    expediente_id INT NOT NULL,

    estado_anterior VARCHAR(80) NULL,
    estado_nuevo VARCHAR(80) NOT NULL,

    responsable_anterior VARCHAR(150) NULL,
    responsable_nuevo VARCHAR(150) NULL,

    comentario TEXT NULL,

    usuario_id INT NULL,

    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_seguimiento_expediente
        FOREIGN KEY (expediente_id) REFERENCES expedientes(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_seguimiento_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

CREATE TABLE documentos_expediente (
    id INT AUTO_INCREMENT PRIMARY KEY,

    expediente_id INT NOT NULL,

    tipo_documento VARCHAR(100) NOT NULL,
    nombre_original VARCHAR(255) NOT NULL,
    nombre_guardado VARCHAR(255) NOT NULL,
    ruta_archivo VARCHAR(255) NOT NULL,
    extension VARCHAR(20) NULL,
    peso INT NULL,

    subido_por INT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_documentos_expediente
        FOREIGN KEY (expediente_id) REFERENCES expedientes(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_documentos_usuario
        FOREIGN KEY (subido_por) REFERENCES usuarios(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

INSERT INTO usuarios (nombre, usuario, password, rol)
VALUES (
    'Administrador General',
    'admin1',
    '$2y$10$ufth24GHvbj0EislCQjICeP7Oft0DdSlDht.Q0ilOPgPGA0fDzsW.',
    'ADMIN'
);