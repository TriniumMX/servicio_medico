-- =============================================
-- Tabla: contrareferencias
-- Descripción: Sistema de contrareferencias entre especialistas
-- Permite que un especialista devuelva al paciente al médico que lo refirió
-- Base de datos: PostgreSQL
-- Fecha: 2026-01-13
-- =============================================

-- 1. Crear ENUM para estatus de contrareferencia
DO $$ BEGIN
    CREATE TYPE estatus_contrareferencia_enum AS ENUM (
        'pendiente',      -- Creada, pendiente de ser vista
        'vista',          -- Médico destino la ha visto
        'cerrada'         -- Ciclo completo cerrado
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Crear tabla contrareferencias
CREATE TABLE public.contrareferencias (
    -- ID principal
    id_contrareferencia          BIGSERIAL PRIMARY KEY,

    -- Folio único (ej: CREF-A7K9M)
    folio                        VARCHAR(20) UNIQUE NOT NULL,

    -- Relación con referencia original
    id_referencia_origen         BIGINT NOT NULL,

    -- Relación con consulta donde el especialista atendió
    id_consulta_especialista     BIGINT NOT NULL,

    -- Médico que contrarrefiere (especialista que atendió)
    id_medico_contrarrefiere     BIGINT NOT NULL,
    nombre_medico_contrarrefiere VARCHAR(200) NOT NULL,
    id_especialidad_remitente    BIGINT NOT NULL,
    nombre_especialidad_remitente VARCHAR(100) NOT NULL,

    -- Médico que recibe la contrareferencia (el que refirió originalmente)
    id_medico_destino            BIGINT NOT NULL,
    nombre_medico_destino        VARCHAR(200) NOT NULL,

    -- Información del paciente (snapshot)
    no_nomina                    VARCHAR(10) NOT NULL,
    id_beneficiario              BIGINT NOT NULL,
    nombre_paciente              VARCHAR(200) NOT NULL,

    -- Contenido de la contrareferencia (SOAP completo)
    subjetivo                    TEXT,
    objetivo                     TEXT,
    analisis                     TEXT,
    plan_texto                   TEXT,  -- Plan completo en formato JSON

    -- Diagnóstico CIE-11
    cie11_codigo                 VARCHAR(15),
    cie11_titulo                 TEXT,

    -- Observaciones adicionales del especialista
    observaciones_especialista   TEXT,

    -- Control de cascada
    es_parte_cascada             BOOLEAN DEFAULT FALSE,
    id_contrareferencia_padre    BIGINT,  -- Si es parte de cascada, referencia a la que la originó
    nivel_cascada                SMALLINT DEFAULT 1,  -- 1=primera contrareferencia, 2=segunda, etc.

    -- Control de estatus
    estatus                      estatus_contrareferencia_enum NOT NULL DEFAULT 'pendiente',
    fecha_vista                  TIMESTAMPTZ,
    activo                       BOOLEAN DEFAULT TRUE,

    -- Auditoría
    creado_en                    TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en               TIMESTAMPTZ DEFAULT NOW(),

    -- Foreign Keys
    CONSTRAINT fk_referencia_origen
        FOREIGN KEY (id_referencia_origen)
        REFERENCES public.referencias_especialidad(id_referencia)
        ON DELETE RESTRICT,

    CONSTRAINT fk_consulta_especialista
        FOREIGN KEY (id_consulta_especialista)
        REFERENCES public.consulta(id_consulta)
        ON DELETE RESTRICT,

    CONSTRAINT fk_medico_contrarrefiere
        FOREIGN KEY (id_medico_contrarrefiere)
        REFERENCES public.usuarios(id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT fk_medico_destino
        FOREIGN KEY (id_medico_destino)
        REFERENCES public.usuarios(id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT fk_contrareferencia_padre
        FOREIGN KEY (id_contrareferencia_padre)
        REFERENCES public.contrareferencias(id_contrareferencia)
        ON DELETE SET NULL
);

-- 3. Crear índices para optimizar consultas
CREATE INDEX idx_contrareferencias_referencia_origen
    ON public.contrareferencias(id_referencia_origen);

CREATE INDEX idx_contrareferencias_medico_destino
    ON public.contrareferencias(id_medico_destino);

CREATE INDEX idx_contrareferencias_estatus
    ON public.contrareferencias(estatus);

CREATE INDEX idx_contrareferencias_activo_estatus
    ON public.contrareferencias(activo, estatus);

CREATE INDEX idx_contrareferencias_nomina
    ON public.contrareferencias(no_nomina);

CREATE INDEX idx_contrareferencias_cascada
    ON public.contrareferencias(es_parte_cascada, id_contrareferencia_padre);

-- 4. Trigger para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION actualizar_timestamp_contrareferencias()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_timestamp_contrareferencias
    BEFORE UPDATE ON public.contrareferencias
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp_contrareferencias();

-- 5. Comentarios para documentación
COMMENT ON TABLE public.contrareferencias IS
    'Sistema de contrareferencias - Devolución de pacientes al médico que refirió';

COMMENT ON COLUMN public.contrareferencias.folio IS
    'Folio único con formato CREF-XXXXX para identificación';

COMMENT ON COLUMN public.contrareferencias.es_parte_cascada IS
    'TRUE si esta contrareferencia es parte de una cascada automática';

COMMENT ON COLUMN public.contrareferencias.nivel_cascada IS
    'Profundidad en la cadena: 1=directa, 2=segunda contrareferencia, etc.';

COMMENT ON COLUMN public.contrareferencias.estatus IS
    'pendiente: Creada pero no vista | vista: Médico destino la vio | cerrada: Ciclo completo';

-- 6. Permisos (opcional - ajustar según configuración)
-- GRANT SELECT, INSERT, UPDATE ON public.contrareferencias TO rol_medicos;
-- GRANT USAGE, SELECT ON SEQUENCE contrareferencias_id_contrareferencia_seq TO rol_medicos;
