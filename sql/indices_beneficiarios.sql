-- Script para crear índices en la tabla beneficiarios
-- Esto mejorará significativamente el rendimiento de las consultas
-- Especialmente importante con más de 3000 registros

-- 1. Índice en no_nomina (la búsqueda principal)
-- Este es el índice más importante ya que todas las búsquedas filtran por número de nómina
CREATE INDEX IF NOT EXISTS idx_beneficiarios_no_nomina
ON beneficiarios(no_nomina);

-- 2. Índice compuesto para búsquedas de beneficiarios activos por nómina
-- Optimiza la query principal que filtra por no_nomina Y activo = 'A'
CREATE INDEX IF NOT EXISTS idx_beneficiarios_nomina_activo
ON beneficiarios(no_nomina, activo);

-- 3. Índice en id_beneficiario para búsquedas directas
-- Útil para las operaciones de edición y eliminación
CREATE INDEX IF NOT EXISTS idx_beneficiarios_id
ON beneficiarios(id_beneficiario);

-- 4. Índice en parentesco para los JOINs
-- Mejora el rendimiento del LEFT JOIN con la tabla parentesco
CREATE INDEX IF NOT EXISTS idx_beneficiarios_parentesco
ON beneficiarios(parentesco);

-- 5. Índice en activo para filtros de estatus
CREATE INDEX IF NOT EXISTS idx_beneficiarios_activo
ON beneficiarios(activo);

-- 6. Índice en CURP para búsquedas y validaciones de unicidad
CREATE INDEX IF NOT EXISTS idx_beneficiarios_curp
ON beneficiarios(curp);

-- Verificar los índices creados
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    tablename = 'beneficiarios'
ORDER BY
    indexname;

-- Analizar la tabla para actualizar estadísticas
ANALYZE beneficiarios;
