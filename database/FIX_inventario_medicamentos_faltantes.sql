-- =============================================================
-- FIX: Crear registros de inventario para medicamentos faltantes
-- =============================================================
-- Problema: Los medicamentos insertados por SQL directo no tienen
-- registro en inventario_medicamentos (solo se crea automaticamente
-- cuando se usa el endpoint POST de la API).
-- =============================================================

-- 1. Corregir tipo de columna: bigserial → bigint (quitar la secuencia auto-incremental)
--    Nota: En PostgreSQL, ALTER COLUMN TYPE a bigint elimina el DEFAULT de la secuencia.
ALTER TABLE inventario_medicamentos
  ALTER COLUMN id_medicamento DROP DEFAULT;

-- Eliminar la secuencia huérfana si existe
DROP SEQUENCE IF EXISTS inventario_medicamentos_id_medicamento_seq;

-- 2. Insertar registros de inventario para todos los medicamentos que no tienen uno
INSERT INTO inventario_medicamentos (id_medicamento, existencia_actual, fondo_fijo, es_cuadro_basico)
SELECT
  m.id_medicamento,
  0,       -- existencia_actual: sin stock inicial
  100,     -- fondo_fijo: valor por defecto (ajustar despues por medicamento)
  false    -- es_cuadro_basico: no por defecto
FROM medicamentos m
LEFT JOIN inventario_medicamentos i
  ON m.id_medicamento = i.id_medicamento
WHERE i.id_inventario IS NULL;

-- 3. Verificar resultado
SELECT
  (SELECT COUNT(*) FROM medicamentos) AS total_medicamentos,
  (SELECT COUNT(*) FROM inventario_medicamentos) AS total_inventario,
  (SELECT COUNT(*)
   FROM medicamentos m
   LEFT JOIN inventario_medicamentos i ON m.id_medicamento = i.id_medicamento
   WHERE i.id_inventario IS NULL
  ) AS medicamentos_sin_inventario;
