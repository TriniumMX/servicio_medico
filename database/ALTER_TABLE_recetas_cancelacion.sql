-- =====================================================
-- ALTER TABLE: Agregar campos de cancelación a recetas
-- Fecha: 2026-01-26
-- Descripción: Agrega campos para manejar cancelación de recetas
-- =====================================================

-- Agregar campo 'cancelado' (boolean, default FALSE)
ALTER TABLE recetas
ADD COLUMN IF NOT EXISTS cancelado BOOLEAN NOT NULL DEFAULT FALSE;

-- Agregar campo 'motivo_cancelacion' (text, nullable)
ALTER TABLE recetas
ADD COLUMN IF NOT EXISTS motivo_cancelacion TEXT;

-- Agregar campo 'fecha_cancelacion' (timestamp, nullable) para auditoría
ALTER TABLE recetas
ADD COLUMN IF NOT EXISTS fecha_cancelacion TIMESTAMP WITH TIME ZONE;

-- Agregar campo 'id_usuario_cancela' (bigint, nullable) para saber quién canceló
ALTER TABLE recetas
ADD COLUMN IF NOT EXISTS id_usuario_cancela BIGINT;

-- Índice para búsquedas de recetas canceladas
CREATE INDEX IF NOT EXISTS idx_recetas_cancelado ON recetas(cancelado);

-- Comentarios de documentación
COMMENT ON COLUMN recetas.cancelado IS 'Indica si la receta ha sido cancelada';
COMMENT ON COLUMN recetas.motivo_cancelacion IS 'Motivo por el cual se canceló la receta';
COMMENT ON COLUMN recetas.fecha_cancelacion IS 'Fecha y hora en que se canceló la receta';
COMMENT ON COLUMN recetas.id_usuario_cancela IS 'ID del usuario que canceló la receta';
