-- =============================================
-- Script: Insertar parentesco "EMPLEADO" si no existe
-- Descripción: Asegura que exista el registro de parentesco para empleados
-- =============================================

-- Verificar si existe el parentesco "EMPLEADO" con ID = 1
DO $$
BEGIN
  -- Intentar insertar solo si no existe
  IF NOT EXISTS (SELECT 1 FROM public.parentesco WHERE id_parentesco = 1) THEN
    INSERT INTO public.parentesco (id_parentesco, parentesco, estatus, creado_en, actualizado_en)
    VALUES (1, 'EMPLEADO', true, now(), now());

    RAISE NOTICE 'Parentesco "EMPLEADO" insertado con ID = 1';
  ELSE
    RAISE NOTICE 'Parentesco "EMPLEADO" ya existe con ID = 1';
  END IF;
END $$;

-- Verificar resultado
SELECT id_parentesco, parentesco, estatus
FROM public.parentesco
WHERE id_parentesco = 1;
