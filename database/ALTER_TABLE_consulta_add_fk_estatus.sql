-- =============================================
-- Script: Agregar Foreign Key a estatus_consulta
-- Descripción: Agrega la FK desde consulta.estatus_consulta a estatus_consulta.id_estatus_consulta
-- Fecha: Enero 2025
-- =============================================

-- IMPORTANTE: Ejecutar este script DESPUÉS de crear la tabla estatus_consulta

-- Verificar que la tabla estatus_consulta existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'estatus_consulta'
    ) THEN
        RAISE EXCEPTION 'La tabla estatus_consulta no existe. Ejecuta primero CREATE_TABLE_estatus_consulta.sql';
    END IF;
END $$;

-- Verificar que todos los valores actuales en consulta.estatus_consulta son válidos
DO $$
DECLARE
    valores_invalidos INTEGER;
BEGIN
    SELECT COUNT(*) INTO valores_invalidos
    FROM consulta
    WHERE estatus_consulta NOT IN (0, 1, 2);

    IF valores_invalidos > 0 THEN
        RAISE EXCEPTION 'Existen % registros con estatus_consulta inválido. Corrígelos antes de agregar la FK.', valores_invalidos;
    END IF;
END $$;

-- Eliminar constraint CHECK existente (si existe)
ALTER TABLE public.consulta
DROP CONSTRAINT IF EXISTS chk_estatus_consulta;

-- Agregar Foreign Key
ALTER TABLE public.consulta
ADD CONSTRAINT fk_consulta_estatus
FOREIGN KEY (estatus_consulta)
REFERENCES public.estatus_consulta(id_estatus_consulta)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Verificar que la FK se creó correctamente
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'consulta'
    AND kcu.column_name = 'estatus_consulta';

COMMENT ON CONSTRAINT fk_consulta_estatus ON public.consulta IS 'FK a tabla catálogo estatus_consulta';

-- Mensaje de éxito
DO $$
BEGIN
    RAISE NOTICE '✅ Foreign Key agregada exitosamente: consulta.estatus_consulta -> estatus_consulta.id_estatus_consulta';
END $$;
