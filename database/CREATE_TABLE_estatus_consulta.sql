-- =============================================
-- Tabla: estatus_consulta
-- Descripción: Catálogo de estados para las consultas médicas
-- Autor: Sistema
-- Fecha: Enero 2025
-- =============================================

-- Eliminar tabla si existe (solo para desarrollo)
-- DROP TABLE IF EXISTS public.estatus_consulta CASCADE;

CREATE TABLE public.estatus_consulta (
    id_estatus_consulta   SMALLINT PRIMARY KEY,
    descripcion           VARCHAR(50) NOT NULL UNIQUE,
    descripcion_corta     VARCHAR(20) NOT NULL,
    orden                 SMALLINT NOT NULL,
    activo                BOOLEAN NOT NULL DEFAULT TRUE,

    -- Auditoría
    creado_en             TIMESTAMPTZ DEFAULT now(),
    actualizado_en        TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Comentarios de la tabla
-- =============================================
COMMENT ON TABLE public.estatus_consulta IS 'Catálogo de estados para las consultas médicas';
COMMENT ON COLUMN public.estatus_consulta.id_estatus_consulta IS 'ID del estatus (0=Cancelada, 1=En espera, 2=Finalizada)';
COMMENT ON COLUMN public.estatus_consulta.descripcion IS 'Descripción completa del estatus';
COMMENT ON COLUMN public.estatus_consulta.descripcion_corta IS 'Descripción corta para UI';
COMMENT ON COLUMN public.estatus_consulta.orden IS 'Orden de visualización en listas';
COMMENT ON COLUMN public.estatus_consulta.activo IS 'Indica si el estatus está activo';

-- =============================================
-- Datos iniciales
-- =============================================
INSERT INTO public.estatus_consulta
    (id_estatus_consulta, descripcion, descripcion_corta, orden, activo)
VALUES
    (0, 'Cancelada', 'Cancelada', 3, TRUE),
    (1, 'En espera de atención', 'En espera', 1, TRUE),
    (2, 'Atendida y finalizada', 'Finalizada', 2, TRUE)
ON CONFLICT (id_estatus_consulta) DO NOTHING;

-- =============================================
-- Trigger para actualizar fecha de modificación
-- =============================================
CREATE OR REPLACE FUNCTION actualizar_fecha_estatus_consulta()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_estatus_consulta
    BEFORE UPDATE ON public.estatus_consulta
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_estatus_consulta();

-- =============================================
-- Verificación
-- =============================================
SELECT
    id_estatus_consulta,
    descripcion,
    descripcion_corta,
    orden,
    activo
FROM public.estatus_consulta
ORDER BY orden;
