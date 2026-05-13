-- =============================================
-- Tabla: diagnosticos_consulta
-- Descripción: Tabla para almacenar múltiples diagnósticos CIE-11 por consulta
-- Base de datos: PostgreSQL
-- =============================================

-- Eliminar tabla si existe (solo para desarrollo)
-- DROP TABLE IF EXISTS public.diagnosticos_consulta CASCADE;

CREATE TABLE public.diagnosticos_consulta (
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

-- =============================================
-- Índices para optimizar búsquedas
-- =============================================

-- Índice para búsquedas por consulta (muy frecuente)
CREATE INDEX idx_diagnosticos_consulta_id_consulta ON public.diagnosticos_consulta(id_consulta);

-- Índice para búsquedas por código CIE-11 (analytics)
CREATE INDEX idx_diagnosticos_consulta_codigo ON public.diagnosticos_consulta(cie11_codigo);

-- Índice para encontrar diagnósticos principales
CREATE INDEX idx_diagnosticos_consulta_principal ON public.diagnosticos_consulta(id_consulta, es_principal) WHERE es_principal = TRUE;

-- =============================================
-- Comentarios descriptivos
-- =============================================

COMMENT ON TABLE public.diagnosticos_consulta IS 'Tabla para almacenar múltiples diagnósticos CIE-11 por consulta médica';
COMMENT ON COLUMN public.diagnosticos_consulta.id_diagnostico IS 'ID único del diagnóstico';
COMMENT ON COLUMN public.diagnosticos_consulta.id_consulta IS 'ID de la consulta médica asociada';
COMMENT ON COLUMN public.diagnosticos_consulta.cie11_codigo IS 'Código CIE-11 del diagnóstico (ej: 8A62, AB54)';
COMMENT ON COLUMN public.diagnosticos_consulta.cie11_titulo IS 'Título/nombre completo del diagnóstico';
COMMENT ON COLUMN public.diagnosticos_consulta.cie11_capitulo IS 'Número de capítulo CIE-11';
COMMENT ON COLUMN public.diagnosticos_consulta.es_principal IS 'Indica si es el diagnóstico principal de la consulta';
COMMENT ON COLUMN public.diagnosticos_consulta.orden IS 'Orden de prioridad del diagnóstico (1 = más importante)';

-- =============================================
-- Constraint: Solo un diagnóstico principal por consulta
-- =============================================

-- Crear índice único parcial para garantizar solo un diagnóstico principal por consulta
CREATE UNIQUE INDEX idx_diagnosticos_consulta_unico_principal
ON public.diagnosticos_consulta(id_consulta)
WHERE es_principal = TRUE;

-- =============================================
-- Ejemplos de uso
-- =============================================

/*
-- Insertar diagnósticos para una consulta
INSERT INTO public.diagnosticos_consulta (id_consulta, cie11_codigo, cie11_titulo, cie11_capitulo, es_principal, orden)
VALUES
    (1, '8A62', 'Diabetes mellitus tipo 2', '5', TRUE, 1),
    (1, 'BA00', 'Hipertensión esencial', '11', FALSE, 2),
    (1, 'AB54', 'Presbiacusia', '10', FALSE, 3);

-- Obtener diagnósticos de una consulta
SELECT * FROM public.diagnosticos_consulta
WHERE id_consulta = 1
ORDER BY es_principal DESC, orden ASC;

-- Obtener el diagnóstico principal de una consulta
SELECT * FROM public.diagnosticos_consulta
WHERE id_consulta = 1 AND es_principal = TRUE;

-- Contar diagnósticos más frecuentes (analytics)
SELECT cie11_codigo, cie11_titulo, COUNT(*) as total
FROM public.diagnosticos_consulta
GROUP BY cie11_codigo, cie11_titulo
ORDER BY total DESC
LIMIT 10;
*/
