-- ===============================================================================
-- MIGRACIÓN: Ampliar meses de resurtimiento de (1,2,3,6,12) a rango 1-12
-- Fecha: 2026-01-17
-- Descripción: Permite cualquier valor de meses entre 1 y 12 para resurtimientos
-- ===============================================================================

-- Eliminar constraint anterior
ALTER TABLE detalle_receta
  DROP CONSTRAINT IF EXISTS meses_resurtimiento_check;

-- Agregar nuevo constraint que permite valores de 1 a 12
ALTER TABLE detalle_receta
  ADD CONSTRAINT meses_resurtimiento_check
  CHECK (meses_resurtimiento IS NULL OR meses_resurtimiento BETWEEN 1 AND 12);

-- Verificar el cambio
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'detalle_receta'::regclass;
