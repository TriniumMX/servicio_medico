-- =============================================
-- Tabla: consulta
-- Descripción: Tabla principal de consultas médicas con signos vitales integrados
-- Base de datos: PostgreSQL
-- =============================================

-- Eliminar tabla si existe (solo para desarrollo)
-- DROP TABLE IF EXISTS public.consulta CASCADE;

CREATE TABLE public.consulta (
    -- ID y Folio
    id_consulta              BIGSERIAL PRIMARY KEY,
    folio                    VARCHAR(30) NOT NULL UNIQUE,  -- Formato: C-25-000123

    -- Relación con padrón
    id_beneficiario          BIGINT NOT NULL,
    no_nomina                VARCHAR(10) NOT NULL,

    -- 📌 Snapshot del paciente al momento de la consulta
    nombre                   VARCHAR(200) NOT NULL,
    edad                     SMALLINT,
    sexo                     CHAR(1),
    id_parentesco            BIGINT NOT NULL REFERENCES public.parentesco(id_parentesco),
    departamento             VARCHAR(200),
    sindicato                VARCHAR(10),
    es_empleado              BOOLEAN NOT NULL,

    -- Médico / hospital
    id_medico                BIGINT NOT NULL,
    id_hospital              BIGINT,

    -- Consulta que responde una referencia
    id_referencia_origen     BIGINT,

    -- Fechas y triage
    fecha_consulta           TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_cita               TIMESTAMPTZ,
    triage_nivel             SMALLINT,

    -- Motivo
    motivo_consulta          TEXT,

    -- 🫀 Signos vitales (versión final integrada)
    temperatura_c            NUMERIC(4,1),     -- Ej: 36.7
    ta_sistolica             SMALLINT,         -- Ej: 120
    ta_diastolica            SMALLINT,         -- Ej: 80
    frecuencia_cardiaca      SMALLINT,         -- Ej: 72
    oxigenacion              SMALLINT,         -- Ej: 98 (%)
    altura_cm                NUMERIC(5,1),     -- Ej: 170.5 cm
    peso_kg                  NUMERIC(6,1),     -- Ej: 72.3 kg
    glucosa_mg_dl            SMALLINT,         -- Ej: 110

    -- Nota SOAP
    subjetivo                TEXT,
    objetivo                 TEXT,
    analisis                 TEXT,
    plan                     TEXT,

    -- Pronóstico
    pronostico               SMALLINT,

    -- Flags clínicos
    se_asigno_incapacidad    BOOLEAN NOT NULL DEFAULT FALSE,
    tiene_referencia         BOOLEAN NOT NULL DEFAULT FALSE,
    tiene_estudios_laboratorio BOOLEAN NOT NULL DEFAULT FALSE,

    -- Costos
    costo                    NUMERIC(10,2) NOT NULL DEFAULT 0,

    -- Estatus
    -- 0 = Cancelada
    -- 1 = En espera (registrada con signos vitales)
    -- 2 = Atendida/Finalizada
    estatus_consulta         SMALLINT NOT NULL DEFAULT 1,
    estatus_activo           BOOLEAN NOT NULL DEFAULT TRUE,

    -- Auditoría
    id_usuario_crea          BIGINT,
    id_usuario_cancela       BIGINT,
    creado_en                TIMESTAMPTZ DEFAULT now(),
    actualizado_en           TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Índices para optimizar búsquedas
-- =============================================

-- Índice único en folio
CREATE UNIQUE INDEX idx_consulta_folio ON public.consulta(folio);

-- Índice para búsquedas por paciente
CREATE INDEX idx_consulta_beneficiario ON public.consulta(id_beneficiario);
CREATE INDEX idx_consulta_nomina ON public.consulta(no_nomina);

-- Índice para búsquedas por fecha y estatus (muy común)
CREATE INDEX idx_consulta_fecha_estatus ON public.consulta(fecha_consulta, estatus_consulta);

-- Índice para búsquedas por estatus
CREATE INDEX idx_consulta_estatus ON public.consulta(estatus_consulta);

-- Índice para búsquedas del día actual
CREATE INDEX idx_consulta_fecha_activo ON public.consulta(fecha_consulta, estatus_activo);

-- Índice para médico
CREATE INDEX idx_consulta_medico ON public.consulta(id_medico);

-- =============================================
-- Comentarios descriptivos
-- =============================================

COMMENT ON TABLE public.consulta IS 'Tabla principal de consultas médicas con signos vitales integrados';
COMMENT ON COLUMN public.consulta.folio IS 'Folio único de consulta: C-YY-NNNNNN (Ej: C-25-000123)';
COMMENT ON COLUMN public.consulta.estatus_consulta IS '0=Cancelada, 1=En espera, 2=Atendida/Finalizada';
COMMENT ON COLUMN public.consulta.id_beneficiario IS 'ID del beneficiario (puede ser empleado o familiar)';
COMMENT ON COLUMN public.consulta.es_empleado IS 'true=empleado, false=beneficiario/familiar';
COMMENT ON COLUMN public.consulta.temperatura_c IS 'Temperatura en grados Celsius';
COMMENT ON COLUMN public.consulta.ta_sistolica IS 'Tensión arterial sistólica (máxima)';
COMMENT ON COLUMN public.consulta.ta_diastolica IS 'Tensión arterial diastólica (mínima)';
COMMENT ON COLUMN public.consulta.frecuencia_cardiaca IS 'Frecuencia cardíaca en latidos por minuto';
COMMENT ON COLUMN public.consulta.oxigenacion IS 'Saturación de oxígeno en porcentaje (%)';
COMMENT ON COLUMN public.consulta.altura_cm IS 'Altura en centímetros';
COMMENT ON COLUMN public.consulta.peso_kg IS 'Peso en kilogramos';
COMMENT ON COLUMN public.consulta.glucosa_mg_dl IS 'Glucosa en miligramos por decilitro';

-- =============================================
-- Constraints adicionales
-- =============================================

-- Validar que la temperatura sea razonable
ALTER TABLE public.consulta ADD CONSTRAINT chk_temperatura
    CHECK (temperatura_c IS NULL OR (temperatura_c >= 30 AND temperatura_c <= 45));

-- Validar que la presión arterial sea razonable
ALTER TABLE public.consulta ADD CONSTRAINT chk_presion_arterial
    CHECK (
        (ta_sistolica IS NULL AND ta_diastolica IS NULL) OR
        (ta_sistolica >= 50 AND ta_sistolica <= 300 AND
         ta_diastolica >= 30 AND ta_diastolica <= 200)
    );

-- Validar que la frecuencia cardíaca sea razonable
ALTER TABLE public.consulta ADD CONSTRAINT chk_frecuencia_cardiaca
    CHECK (frecuencia_cardiaca IS NULL OR (frecuencia_cardiaca >= 20 AND frecuencia_cardiaca <= 300));

-- Validar que la oxigenación sea un porcentaje válido
ALTER TABLE public.consulta ADD CONSTRAINT chk_oxigenacion
    CHECK (oxigenacion IS NULL OR (oxigenacion >= 0 AND oxigenacion <= 100));

-- Validar que el peso sea razonable
ALTER TABLE public.consulta ADD CONSTRAINT chk_peso
    CHECK (peso_kg IS NULL OR (peso_kg > 0 AND peso_kg <= 500));

-- Validar que la altura sea razonable
ALTER TABLE public.consulta ADD CONSTRAINT chk_altura
    CHECK (altura_cm IS NULL OR (altura_cm > 0 AND altura_cm <= 250));

-- Validar que la glucosa sea razonable
ALTER TABLE public.consulta ADD CONSTRAINT chk_glucosa
    CHECK (glucosa_mg_dl IS NULL OR (glucosa_mg_dl >= 0 AND glucosa_mg_dl <= 999));

-- Validar que el estatus sea válido
ALTER TABLE public.consulta ADD CONSTRAINT chk_estatus_consulta
    CHECK (estatus_consulta IN (0, 1, 2));

-- =============================================
-- Función para actualizar el timestamp
-- =============================================

CREATE OR REPLACE FUNCTION actualizar_timestamp_consulta()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar automáticamente el timestamp
DROP TRIGGER IF EXISTS trg_actualizar_timestamp_consulta ON public.consulta;
CREATE TRIGGER trg_actualizar_timestamp_consulta
    BEFORE UPDATE ON public.consulta
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp_consulta();

-- =============================================
-- Ejemplos de uso
-- =============================================

/*
-- Insertar una consulta
INSERT INTO public.consulta (
    folio, id_beneficiario, no_nomina, nombre, edad, sexo,
    id_parentesco, departamento, es_empleado, id_medico,
    temperatura_c, ta_sistolica, ta_diastolica, frecuencia_cardiaca,
    oxigenacion, altura_cm, peso_kg, glucosa_mg_dl
) VALUES (
    'C-25-000001', 123, '12345', 'Juan Pérez', 35, 'M',
    1, 'Recursos Humanos', true, 1,
    36.5, 120, 80, 72,
    98, 175.0, 75.5, 95
);

-- Buscar consultas del día actual en espera
SELECT * FROM public.consulta
WHERE fecha_consulta >= CURRENT_DATE
  AND fecha_consulta < CURRENT_DATE + INTERVAL '1 day'
  AND estatus_consulta = 1
  AND estatus_activo = true
ORDER BY id_consulta DESC;

-- Finalizar una consulta (nota: los diagnósticos CIE-11 se guardan en diagnosticos_consulta)
UPDATE public.consulta
SET
    subjetivo = 'Paciente refiere...',
    objetivo = 'TA: 120/80...',
    analisis = 'Se observa...',
    plan = '{"medicamentos": [...]}',
    estatus_consulta = 2
WHERE id_consulta = 1;

-- Insertar diagnósticos de la consulta (en tabla separada)
-- INSERT INTO public.diagnosticos_consulta (id_consulta, cie11_codigo, cie11_titulo, cie11_capitulo, es_principal, orden)
-- VALUES (1, '8A62', 'Diabetes mellitus tipo 2', '5', TRUE, 1);

-- Buscar consultas de un paciente
SELECT * FROM public.consulta
WHERE id_beneficiario = 123
ORDER BY fecha_consulta DESC;
*/
