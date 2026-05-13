-- ===============================================================================
-- MIGRACIÓN: Conversión de Stock Mínimo/Máximo a Fondo Fijo
-- Fecha: 2026-01-17
-- Descripción: Transforma el sistema de inventario de farmacia de un modelo
--              de "stock mínimo/máximo" a un modelo simplificado de "fondo fijo"
-- ===============================================================================

-- PASO 1: Eliminar punto_reorden PRIMERO (depende de stock_minimo en algunas configuraciones)
ALTER TABLE inventario_medicamentos
  DROP COLUMN IF EXISTS punto_reorden;

-- PASO 2: Eliminar stock_minimo (ya no se usa en fondo fijo)
ALTER TABLE inventario_medicamentos
  DROP COLUMN IF EXISTS stock_minimo;

-- PASO 3: Renombrar columnas
-- stock_maximo -> fondo_fijo (la cantidad que debe mantenerse)
ALTER TABLE inventario_medicamentos
  RENAME COLUMN stock_maximo TO fondo_fijo;

-- piezas_almacen -> existencia_actual (lo que hay actualmente)
ALTER TABLE inventario_medicamentos
  RENAME COLUMN piezas_almacen TO existencia_actual;

-- PASO 4: Limpiar constraints antiguos (si existen)
ALTER TABLE inventario_medicamentos
  DROP CONSTRAINT IF EXISTS inventario_medicamentos_stock_maximo_check;

ALTER TABLE inventario_medicamentos
  DROP CONSTRAINT IF EXISTS inventario_medicamentos_piezas_almacen_check;

ALTER TABLE inventario_medicamentos
  DROP CONSTRAINT IF EXISTS stock_minimo_check;

ALTER TABLE inventario_medicamentos
  DROP CONSTRAINT IF EXISTS stock_maximo_check;

ALTER TABLE inventario_medicamentos
  DROP CONSTRAINT IF EXISTS piezas_almacen_check;

-- PASO 5: Agregar nuevos constraints
ALTER TABLE inventario_medicamentos
  ADD CONSTRAINT inventario_medicamentos_fondo_fijo_check
  CHECK (fondo_fijo > 0);

ALTER TABLE inventario_medicamentos
  ADD CONSTRAINT inventario_medicamentos_existencia_actual_check
  CHECK (existencia_actual >= 0);

-- ===============================================================================
-- VERIFICACIÓN: Ejecutar después de la migración para confirmar los cambios
-- ===============================================================================
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'inventario_medicamentos'
-- ORDER BY ordinal_position;
