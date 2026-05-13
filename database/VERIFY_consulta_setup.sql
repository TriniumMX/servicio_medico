-- =============================================
-- Script: Verificación de configuración de consultas
-- Descripción: Verifica que todas las tablas y datos necesarios estén configurados
-- =============================================

\echo '========================================='
\echo 'VERIFICANDO CONFIGURACIÓN DE CONSULTAS'
\echo '========================================='
\echo ''

-- 1. Verificar que existe la tabla consulta
\echo '1. Verificando tabla consulta...'
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'consulta'
        ) THEN '✅ Tabla consulta existe'
        ELSE '❌ ERROR: Tabla consulta NO existe'
    END AS resultado;

\echo ''

-- 2. Verificar que existe la tabla parentesco
\echo '2. Verificando tabla parentesco...'
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'parentesco'
        ) THEN '✅ Tabla parentesco existe'
        ELSE '❌ ERROR: Tabla parentesco NO existe'
    END AS resultado;

\echo ''

-- 3. Verificar que existe el parentesco "EMPLEADO" con ID = 1
\echo '3. Verificando parentesco EMPLEADO (ID=1)...'
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1 FROM public.parentesco
            WHERE id_parentesco = 1
            AND parentesco = 'EMPLEADO'
        ) THEN '✅ Parentesco EMPLEADO existe con ID=1'
        ELSE '❌ ERROR: Parentesco EMPLEADO (ID=1) NO existe'
    END AS resultado;

\echo ''

-- 4. Verificar índices de la tabla consulta
\echo '4. Verificando índices de consulta...'
SELECT
    indexname AS indice,
    indexdef AS definicion
FROM pg_indexes
WHERE tablename = 'consulta'
ORDER BY indexname;

\echo ''

-- 5. Verificar constraints de la tabla consulta
\echo '5. Verificando constraints de consulta...'
SELECT
    conname AS constraint_name,
    contype AS tipo
FROM pg_constraint
WHERE conrelid = 'public.consulta'::regclass
ORDER BY conname;

\echo ''

-- 6. Mostrar estructura de la tabla consulta
\echo '6. Estructura de la tabla consulta:'
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'consulta'
ORDER BY ordinal_position;

\echo ''

-- 7. Contar registros en consulta
\echo '7. Contando registros en consulta...'
SELECT
    COUNT(*) AS total_consultas,
    COUNT(CASE WHEN estatus_consulta = 1 THEN 1 END) AS en_espera,
    COUNT(CASE WHEN estatus_consulta = 2 THEN 1 END) AS atendidas,
    COUNT(CASE WHEN estatus_consulta = 0 THEN 1 END) AS canceladas
FROM public.consulta;

\echo ''

-- 8. Verificar último folio generado
\echo '8. Último folio generado:'
SELECT
    folio,
    fecha_consulta,
    nombre,
    estatus_consulta
FROM public.consulta
ORDER BY id_consulta DESC
LIMIT 5;

\echo ''
\echo '========================================='
\echo 'VERIFICACIÓN COMPLETADA'
\echo '========================================='
