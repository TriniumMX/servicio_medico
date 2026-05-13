-- =====================================================
-- FIX: Agregar secuencia SERIAL a id_beneficiario
-- Problema: Los registros se están insertando sin ID
-- Solución: Crear secuencia y configurar DEFAULT
-- =====================================================

-- 1. Crear la secuencia si no existe
CREATE SEQUENCE IF NOT EXISTS beneficiarios_id_beneficiario_seq;

-- 2. Asignar IDs a los registros existentes que tienen NULL
-- Esto es crítico para que los registros actuales sean editables
UPDATE beneficiarios
SET id_beneficiario = nextval('beneficiarios_id_beneficiario_seq')
WHERE id_beneficiario IS NULL;

-- 3. Configurar la secuencia para que empiece desde el siguiente valor
SELECT setval('beneficiarios_id_beneficiario_seq',
    COALESCE((SELECT MAX(id_beneficiario) FROM beneficiarios), 0) + 1,
    false
);

-- 4. Establecer el DEFAULT para que use la secuencia automáticamente
ALTER TABLE beneficiarios
ALTER COLUMN id_beneficiario SET DEFAULT nextval('beneficiarios_id_beneficiario_seq');

-- 5. Hacer que la columna sea NOT NULL (debe tener valor siempre)
ALTER TABLE beneficiarios
ALTER COLUMN id_beneficiario SET NOT NULL;

-- 6. Asociar la secuencia con la columna (para que se borre automáticamente si se borra la columna)
ALTER SEQUENCE beneficiarios_id_beneficiario_seq
OWNED BY beneficiarios.id_beneficiario;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar la definición de la columna
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'beneficiarios'
AND column_name = 'id_beneficiario';

-- Verificar que todos los registros ahora tienen ID
SELECT
    COUNT(*) as total_registros,
    COUNT(id_beneficiario) as registros_con_id,
    COUNT(*) - COUNT(id_beneficiario) as registros_sin_id
FROM beneficiarios;

-- Ver algunos registros para confirmar
SELECT
    id_beneficiario,
    no_nomina,
    nombre,
    a_paterno,
    a_materno
FROM beneficiarios
ORDER BY id_beneficiario
LIMIT 10;

-- =====================================================
-- PRUEBA DE INSERT
-- =====================================================
-- Descomenta estas líneas para probar que el ID se genera automáticamente:
/*
INSERT INTO beneficiarios (
    no_nomina, parentesco, nombre, a_paterno, a_materno,
    sexo, f_nacimiento, curp, sangre, activo
) VALUES (
    'TEST123', 1, 'PRUEBA', 'APELLIDO1', 'APELLIDO2',
    '1', '2000-01-01', 'PRUEBA000000000000', 'O+', 'A'
) RETURNING id_beneficiario, nombre;

-- Si funcionó, eliminar el registro de prueba:
DELETE FROM beneficiarios WHERE no_nomina = 'TEST123';
*/
