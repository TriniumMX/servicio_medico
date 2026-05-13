-- =====================================================
-- CORRECCIÓN: Eliminar duplicados y configurar IDs correctamente
-- =====================================================

-- PASO 1: Ver los registros que vamos a eliminar (para confirmar)
SELECT id_beneficiario, no_nomina, nombre, a_paterno, a_materno
FROM beneficiarios
WHERE id_beneficiario IN (1, 2) AND no_nomina = '11680A';

-- PASO 1b: Eliminar SOLO los registros con ID 1 y 2 de la nómina 11680A
-- (Los que acabamos de crear por error)
DELETE FROM beneficiarios
WHERE id_beneficiario IN (1, 2)
AND no_nomina = '11680A';

-- PASO 2: Verificar cuál es el ID más alto actual en la tabla
-- (Esto mostrará el máximo ID que ya existe)
SELECT MAX(id_beneficiario) as max_id_actual FROM beneficiarios;

-- PASO 3: Configurar la secuencia para que inicie DESPUÉS del máximo ID existente
-- Esto asegura que no haya conflictos con los IDs que ya existen
SELECT setval('beneficiarios_id_beneficiario_seq',
    COALESCE((SELECT MAX(id_beneficiario) FROM beneficiarios), 0) + 1,
    false
);

-- PASO 4: Ahora asignar IDs SOLO a los registros que tienen NULL
-- usando la secuencia que ya sabe cuál es el siguiente número
UPDATE beneficiarios
SET id_beneficiario = nextval('beneficiarios_id_beneficiario_seq')
WHERE id_beneficiario IS NULL;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- Ver cuántos registros tienen NULL (debería ser 0)
SELECT
    COUNT(*) as total_registros,
    COUNT(id_beneficiario) as registros_con_id,
    COUNT(*) FILTER (WHERE id_beneficiario IS NULL) as registros_sin_id
FROM beneficiarios;

-- Ver los últimos 10 registros para confirmar
SELECT
    id_beneficiario,
    no_nomina,
    nombre,
    a_paterno,
    a_materno
FROM beneficiarios
ORDER BY id_beneficiario DESC
LIMIT 10;

-- Verificar que no hay duplicados
SELECT
    id_beneficiario,
    COUNT(*) as cantidad
FROM beneficiarios
WHERE id_beneficiario IS NOT NULL
GROUP BY id_beneficiario
HAVING COUNT(*) > 1;
-- Si esta consulta devuelve registros, hay duplicados

-- Ver el valor actual de la secuencia
SELECT last_value, is_called FROM beneficiarios_id_beneficiario_seq;
