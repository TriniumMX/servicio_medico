-- =============================================
-- Script: ALTER_TABLE_referencias_add_contrareferencia.sql
-- Descripción: Agrega campos para control de contrareferencias en la tabla referencias_especialidad
-- Base de datos: PostgreSQL
-- Fecha: 2026-01-13
-- =============================================

-- 1. Agregar campos de control de contrareferencias
ALTER TABLE public.referencias_especialidad
ADD COLUMN IF NOT EXISTS tiene_contrareferencia BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS id_contrareferencia BIGINT;

-- 2. Agregar foreign key a tabla contrareferencias
-- Nota: Solo se puede agregar después de crear la tabla contrareferencias
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_referencia_contrareferencia'
    ) THEN
        ALTER TABLE public.referencias_especialidad
        ADD CONSTRAINT fk_referencia_contrareferencia
            FOREIGN KEY (id_contrareferencia)
            REFERENCES public.contrareferencias(id_contrareferencia)
            ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Crear índice para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_referencias_tiene_contrareferencia
    ON public.referencias_especialidad(tiene_contrareferencia);

-- 4. Comentarios para documentación
COMMENT ON COLUMN public.referencias_especialidad.tiene_contrareferencia IS
    'Indica si esta referencia ya tiene una contrareferencia asociada';

COMMENT ON COLUMN public.referencias_especialidad.id_contrareferencia IS
    'FK a la contrareferencia generada para esta referencia';

-- 5. Actualizar registros existentes (por defecto false)
UPDATE public.referencias_especialidad
SET tiene_contrareferencia = FALSE
WHERE tiene_contrareferencia IS NULL;
