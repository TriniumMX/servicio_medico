-- =============================================
-- MIGRACIÓN: Sistema de Diagnósticos Múltiples CIE-11
-- Fecha: 2026-01-20
-- Descripción: Migra el sistema de diagnóstico único por consulta
--              a soporte de múltiples diagnósticos CIE-11
--
-- IMPORTANTE: Ejecutar en orden, este script es idempotente
-- =============================================

-- =============================================
-- PASO 1: Crear tabla diagnosticos_consulta
-- =============================================

CREATE TABLE IF NOT EXISTS public.diagnosticos_consulta (
    -- ID primario
    id_diagnostico           BIGSERIAL PRIMARY KEY,

    -- Relación con consulta
    id_consulta              BIGINT NOT NULL REFERENCES public.consulta(id_consulta) ON DELETE CASCADE,

    -- Datos del diagnóstico CIE-11
    cie11_codigo             VARCHAR(15) NOT NULL,
    cie11_titulo             TEXT NOT NULL,
    cie11_capitulo           VARCHAR(15),

    -- Control de orden y principal
    es_principal             BOOLEAN NOT NULL DEFAULT FALSE,
    orden                    SMALLINT NOT NULL DEFAULT 1,

    -- Auditoría
    creado_en                TIMESTAMPTZ DEFAULT now()
);

-- Índices (con IF NOT EXISTS para idempotencia)
CREATE INDEX IF NOT EXISTS idx_diagnosticos_consulta_id_consulta
ON public.diagnosticos_consulta(id_consulta);

CREATE INDEX IF NOT EXISTS idx_diagnosticos_consulta_codigo
ON public.diagnosticos_consulta(cie11_codigo);

-- Índice único para garantizar solo un diagnóstico principal por consulta
-- Usamos DO para manejar si ya existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_diagnosticos_consulta_unico_principal'
    ) THEN
        CREATE UNIQUE INDEX idx_diagnosticos_consulta_unico_principal
        ON public.diagnosticos_consulta(id_consulta)
        WHERE es_principal = TRUE;
    END IF;
END $$;

-- Comentarios
COMMENT ON TABLE public.diagnosticos_consulta IS 'Tabla para almacenar múltiples diagnósticos CIE-11 por consulta médica';


-- =============================================
-- PASO 2: Migrar datos existentes de consulta a diagnosticos_consulta
-- Solo para consultas que tienen diagnóstico pero NO están en la nueva tabla
-- =============================================

INSERT INTO public.diagnosticos_consulta (
    id_consulta,
    cie11_codigo,
    cie11_titulo,
    cie11_capitulo,
    es_principal,
    orden,
    creado_en
)
SELECT
    c.id_consulta,
    c.cie11_codigo,
    c.cie11_titulo,
    c.cie11_capitulo,
    TRUE as es_principal,  -- El diagnóstico legacy se marca como principal
    1 as orden,
    COALESCE(c.updated_at, c.created_at, now()) as creado_en
FROM public.consulta c
WHERE
    c.cie11_codigo IS NOT NULL
    AND c.cie11_codigo != ''
    AND c.cie11_titulo IS NOT NULL
    AND c.cie11_titulo != ''
    -- Solo migrar si NO existe ya en la nueva tabla
    AND NOT EXISTS (
        SELECT 1
        FROM public.diagnosticos_consulta dc
        WHERE dc.id_consulta = c.id_consulta
    );

-- Mostrar cuántos registros se migraron
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM public.diagnosticos_consulta;
    RAISE NOTICE 'Total de diagnósticos en nueva tabla: %', v_count;
END $$;


-- =============================================
-- PASO 3: Agregar campos de diagnóstico a tabla incapacidades
-- =============================================

-- Agregar columna para el código del diagnóstico CIE-11
ALTER TABLE public.incapacidades
ADD COLUMN IF NOT EXISTS diagnostico_codigo VARCHAR(50) NULL;

-- Agregar columna para el título/descripción del diagnóstico CIE-11
ALTER TABLE public.incapacidades
ADD COLUMN IF NOT EXISTS diagnostico_titulo TEXT NULL;

-- Índice para búsquedas por diagnóstico
CREATE INDEX IF NOT EXISTS idx_incapacidades_diagnostico
ON public.incapacidades(diagnostico_codigo);

-- Comentarios
COMMENT ON COLUMN public.incapacidades.diagnostico_codigo IS 'Código CIE-11 del diagnóstico que causa la incapacidad';
COMMENT ON COLUMN public.incapacidades.diagnostico_titulo IS 'Título/descripción del diagnóstico CIE-11';


-- =============================================
-- PASO 4: Migrar diagnósticos a incapacidades existentes (opcional)
-- Actualiza incapacidades que no tienen diagnóstico con el principal de la consulta
-- =============================================

UPDATE public.incapacidades i
SET
    diagnostico_codigo = dc.cie11_codigo,
    diagnostico_titulo = dc.cie11_titulo
FROM public.diagnosticos_consulta dc
WHERE
    i.id_consulta = dc.id_consulta
    AND dc.es_principal = TRUE
    AND (i.diagnostico_codigo IS NULL OR i.diagnostico_codigo = '');


-- =============================================
-- VERIFICACIONES FINALES
-- =============================================

-- Verificar estructura de diagnosticos_consulta
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Contar registros
    SELECT COUNT(*) INTO v_count FROM public.diagnosticos_consulta;
    RAISE NOTICE '=== RESUMEN DE MIGRACIÓN ===';
    RAISE NOTICE 'Total diagnósticos en diagnosticos_consulta: %', v_count;

    -- Contar consultas con diagnóstico
    SELECT COUNT(DISTINCT id_consulta) INTO v_count FROM public.diagnosticos_consulta;
    RAISE NOTICE 'Total consultas con diagnóstico(s): %', v_count;

    -- Contar incapacidades con diagnóstico
    SELECT COUNT(*) INTO v_count FROM public.incapacidades
    WHERE diagnostico_codigo IS NOT NULL AND diagnostico_codigo != '';
    RAISE NOTICE 'Total incapacidades con diagnóstico: %', v_count;

    RAISE NOTICE '=== MIGRACIÓN COMPLETADA ===';
END $$;


-- =============================================
-- NOTAS IMPORTANTES
-- =============================================
/*
DESPUÉS DE EJECUTAR ESTE SCRIPT:

1. Los campos cie11_codigo, cie11_titulo, cie11_capitulo en la tabla "consulta"
   pueden mantenerse por compatibilidad o eliminarse en una migración futura.

2. Las APIs ahora leen de "diagnosticos_consulta" usando:
   - LEFT JOIN diagnosticos_consulta dc ON dc.id_consulta = c.id_consulta
     AND (dc.es_principal = true OR dc.orden = 1)

3. Para obtener TODOS los diagnósticos de una consulta:
   SELECT * FROM diagnosticos_consulta WHERE id_consulta = ?
   ORDER BY es_principal DESC, orden ASC;

4. El campo "diagnosticos" ahora se envía como array JSON en las APIs de referencias.

ROLLBACK (si es necesario):
-- Solo si necesitas revertir (NO recomendado en producción con datos nuevos):
-- DROP TABLE IF EXISTS public.diagnosticos_consulta CASCADE;
-- ALTER TABLE public.incapacidades DROP COLUMN IF EXISTS diagnostico_codigo;
-- ALTER TABLE public.incapacidades DROP COLUMN IF EXISTS diagnostico_titulo;
*/
