-- =====================================================
-- Script SQL para crear la tabla control_resurtimientos
-- Sistema de Control de Resurtimientos de Medicamentos
-- Sistema Médico SJR 2.0
-- =====================================================

-- ENUM: estatus_resurtimiento
CREATE TYPE estatus_resurtimiento AS ENUM ('pendiente', 'surtido', 'vencido', 'cancelado');

-- TABLA: control_resurtimientos
CREATE TABLE IF NOT EXISTS control_resurtimientos (
  id_control BIGSERIAL PRIMARY KEY,
  id_detalle BIGINT NOT NULL REFERENCES detalle_receta(id_detalle) ON DELETE CASCADE,

  -- Control del resurtimiento
  numero_resurtimiento INTEGER NOT NULL,
  fecha_programada DATE NOT NULL,
  fecha_limite DATE,

  -- Estado del resurtimiento
  estatus estatus_resurtimiento NOT NULL DEFAULT 'pendiente',
  fecha_surtido TIMESTAMP WITH TIME ZONE,
  id_surtimiento BIGINT REFERENCES surtimientos_receta(id_surtimiento),

  -- Auditoría
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT numero_resurtimiento_check CHECK (numero_resurtimiento > 0)
);

-- Comentarios
COMMENT ON TABLE control_resurtimientos IS 'Control de "cupones" o "vales" de resurtimiento mensual de medicamentos';
COMMENT ON COLUMN control_resurtimientos.id_control IS 'ID único del cupón de resurtimiento';
COMMENT ON COLUMN control_resurtimientos.id_detalle IS 'Referencia al detalle de la receta';
COMMENT ON COLUMN control_resurtimientos.numero_resurtimiento IS 'Número del resurtimiento (1, 2, 3, etc.)';
COMMENT ON COLUMN control_resurtimientos.fecha_programada IS 'Fecha desde la cual se puede surtir este cupón';
COMMENT ON COLUMN control_resurtimientos.fecha_limite IS 'Fecha límite para surtir (opcional)';
COMMENT ON COLUMN control_resurtimientos.estatus IS 'Estado del cupón: pendiente, surtido, vencido, cancelado';
COMMENT ON COLUMN control_resurtimientos.fecha_surtido IS 'Fecha y hora en que se surtió el cupón';
COMMENT ON COLUMN control_resurtimientos.id_surtimiento IS 'Referencia al surtimiento realizado';

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_control_resurtimientos_id_detalle ON control_resurtimientos(id_detalle);
CREATE INDEX IF NOT EXISTS idx_control_resurtimientos_estatus ON control_resurtimientos(estatus);
CREATE INDEX IF NOT EXISTS idx_control_resurtimientos_fecha_programada ON control_resurtimientos(fecha_programada);
CREATE INDEX IF NOT EXISTS idx_control_resurtimientos_numero ON control_resurtimientos(id_detalle, numero_resurtimiento);

-- =====================================================
-- Función para generar cupones de resurtimiento automáticamente
-- =====================================================

CREATE OR REPLACE FUNCTION generar_cupones_resurtimiento()
RETURNS TRIGGER AS $$
DECLARE
  mes INTEGER;
  fecha_base DATE;
BEGIN
  -- Solo generar cupones si realizar_resurtimiento es TRUE
  IF NEW.realizar_resurtimiento = TRUE AND NEW.meses_resurtimiento > 0 THEN

    fecha_base := CURRENT_DATE;

    -- Generar un cupón por cada mes de resurtimiento
    FOR mes IN 1..NEW.meses_resurtimiento LOOP
      INSERT INTO control_resurtimientos (
        id_detalle,
        numero_resurtimiento,
        fecha_programada,
        fecha_limite,
        estatus
      ) VALUES (
        NEW.id_detalle,
        mes,
        fecha_base + ((mes - 1) * INTERVAL '1 month'),
        fecha_base + (mes * INTERVAL '1 month') + INTERVAL '15 days', -- 15 días de gracia
        'pendiente'
      );
    END LOOP;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para generar cupones automáticamente al insertar un detalle de receta
CREATE TRIGGER trigger_generar_cupones_resurtimiento
  AFTER INSERT ON detalle_receta
  FOR EACH ROW
  EXECUTE FUNCTION generar_cupones_resurtimiento();

-- =====================================================

COMMENT ON FUNCTION generar_cupones_resurtimiento() IS 'Genera automáticamente los cupones de resurtimiento cuando se inserta un detalle de receta con resurtimiento habilitado';
COMMENT ON TRIGGER trigger_generar_cupones_resurtimiento ON detalle_receta IS 'Dispara la generación de cupones al insertar un nuevo detalle de receta';
