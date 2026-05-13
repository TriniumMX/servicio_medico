-- ================================================
-- MIGRACIÓN: Agregar campos de diagnóstico CIE-11 a incapacidades
-- Fecha: 2026-01-20
-- Descripción: Agrega campos para almacenar el diagnóstico CIE-11
--              que causa la incapacidad
-- ================================================

-- Agregar columna para el código del diagnóstico CIE-11
ALTER TABLE incapacidades
ADD COLUMN IF NOT EXISTS diagnostico_codigo VARCHAR(50) NULL;

-- Agregar columna para el título/descripción del diagnóstico CIE-11
ALTER TABLE incapacidades
ADD COLUMN IF NOT EXISTS diagnostico_titulo TEXT NULL;

-- Comentarios para documentación
COMMENT ON COLUMN incapacidades.diagnostico_codigo IS 'Código CIE-11 del diagnóstico que causa la incapacidad';
COMMENT ON COLUMN incapacidades.diagnostico_titulo IS 'Título/descripción del diagnóstico CIE-11';

-- Índice para búsquedas por diagnóstico (opcional, útil para reportes)
CREATE INDEX IF NOT EXISTS idx_incapacidades_diagnostico
ON incapacidades(diagnostico_codigo);
