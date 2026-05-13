-- =====================================================
-- Script SQL para crear las tablas del módulo de RECETAS
-- Sistema Médico SJR 2.0
-- =====================================================

-- TABLA: recetas
-- Almacena la información general de cada receta médica emitida
CREATE TABLE IF NOT EXISTS recetas (
  id_receta BIGSERIAL PRIMARY KEY,
  id_consulta BIGINT NOT NULL UNIQUE REFERENCES consulta(id_consulta),
  folio_receta VARCHAR(30) NOT NULL UNIQUE,
  fecha_emision TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  vigencia_dias INTEGER NOT NULL DEFAULT 30,
  observaciones_generales TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT vigencia_dias_check CHECK (vigencia_dias > 0)
);

-- Comentarios
COMMENT ON TABLE recetas IS 'Recetas médicas emitidas durante las consultas';
COMMENT ON COLUMN recetas.id_receta IS 'ID único de la receta';
COMMENT ON COLUMN recetas.id_consulta IS 'Referencia a la consulta (relación 1:1)';
COMMENT ON COLUMN recetas.folio_receta IS 'Folio único de la receta (ej: R-2025-000123)';
COMMENT ON COLUMN recetas.vigencia_dias IS 'Días de validez de la receta (por defecto 30 días)';
COMMENT ON COLUMN recetas.observaciones_generales IS 'Notas del médico sobre la receta completa';

-- =====================================================

-- TABLA: detalle_receta
-- Almacena cada medicamento prescrito dentro de una receta
CREATE TABLE IF NOT EXISTS detalle_receta (
  id_detalle BIGSERIAL PRIMARY KEY,
  id_receta BIGINT NOT NULL REFERENCES recetas(id_receta) ON DELETE CASCADE,
  id_medicamento BIGINT NOT NULL REFERENCES medicamentos(id_medicamento),

  -- Prescripción
  cantidad_total INTEGER NOT NULL,
  dosis VARCHAR(200) NOT NULL,
  duracion_tratamiento_dias INTEGER NOT NULL,
  via_administracion VARCHAR(50) DEFAULT 'Oral',
  indicaciones TEXT,

  -- Resurtimiento (para tratamientos prolongados)
  realizar_resurtimiento BOOLEAN NOT NULL DEFAULT FALSE,
  meses_resurtimiento INTEGER,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT cantidad_total_check CHECK (cantidad_total > 0),
  CONSTRAINT duracion_tratamiento_check CHECK (duracion_tratamiento_dias > 0),
  CONSTRAINT meses_resurtimiento_check CHECK (
    meses_resurtimiento IS NULL OR
    meses_resurtimiento IN (1, 2, 3, 6, 12)
  )
);

-- Comentarios
COMMENT ON TABLE detalle_receta IS 'Detalle de medicamentos prescritos en cada receta';
COMMENT ON COLUMN detalle_receta.id_detalle IS 'ID único del detalle';
COMMENT ON COLUMN detalle_receta.id_receta IS 'Referencia a la receta';
COMMENT ON COLUMN detalle_receta.id_medicamento IS 'Referencia al medicamento del catálogo';
COMMENT ON COLUMN detalle_receta.cantidad_total IS 'Piezas totales a entregar';
COMMENT ON COLUMN detalle_receta.dosis IS 'Dosis prescrita (ej: 1 tableta cada 8 horas)';
COMMENT ON COLUMN detalle_receta.duracion_tratamiento_dias IS 'Duración del tratamiento en días';
COMMENT ON COLUMN detalle_receta.via_administracion IS 'Vía de administración (Oral, IV, Tópica, etc.)';
COMMENT ON COLUMN detalle_receta.indicaciones IS 'Instrucciones específicas (ej: Tomar con alimentos)';
COMMENT ON COLUMN detalle_receta.realizar_resurtimiento IS 'Indica si el medicamento requiere resurtimiento';
COMMENT ON COLUMN detalle_receta.meses_resurtimiento IS 'Cada cuántos meses se resurtirá (1, 2, 3, 6 o 12)';

-- =====================================================

-- TABLA: surtimientos_receta
-- Control de surtimiento de medicamentos en farmacia
CREATE TABLE IF NOT EXISTS surtimientos_receta (
  id_surtimiento BIGSERIAL PRIMARY KEY,
  id_detalle BIGINT NOT NULL REFERENCES detalle_receta(id_detalle),

  cantidad_surtida INTEGER NOT NULL,
  fecha_surtimiento TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  id_farmaceutico BIGINT, -- Usuario que surtió el medicamento

  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT cantidad_surtida_check CHECK (cantidad_surtida > 0)
);

-- Comentarios
COMMENT ON TABLE surtimientos_receta IS 'Registro de surtimientos de medicamentos en farmacia';
COMMENT ON COLUMN surtimientos_receta.id_surtimiento IS 'ID único del surtimiento';
COMMENT ON COLUMN surtimientos_receta.id_detalle IS 'Referencia al detalle de la receta';
COMMENT ON COLUMN surtimientos_receta.cantidad_surtida IS 'Cantidad entregada al paciente';
COMMENT ON COLUMN surtimientos_receta.fecha_surtimiento IS 'Fecha y hora del surtimiento';
COMMENT ON COLUMN surtimientos_receta.id_farmaceutico IS 'Usuario farmacéutico que entregó el medicamento';
COMMENT ON COLUMN surtimientos_receta.observaciones IS 'Observaciones del surtimiento';

-- =====================================================

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_recetas_id_consulta ON recetas(id_consulta);
CREATE INDEX IF NOT EXISTS idx_recetas_folio ON recetas(folio_receta);
CREATE INDEX IF NOT EXISTS idx_detalle_receta_id_receta ON detalle_receta(id_receta);
CREATE INDEX IF NOT EXISTS idx_detalle_receta_id_medicamento ON detalle_receta(id_medicamento);
CREATE INDEX IF NOT EXISTS idx_surtimientos_id_detalle ON surtimientos_receta(id_detalle);
CREATE INDEX IF NOT EXISTS idx_surtimientos_fecha ON surtimientos_receta(fecha_surtimiento);

-- =====================================================

-- Trigger para actualizar updated_at en recetas
CREATE OR REPLACE FUNCTION update_recetas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_recetas_updated_at
  BEFORE UPDATE ON recetas
  FOR EACH ROW
  EXECUTE FUNCTION update_recetas_updated_at();

-- =====================================================

COMMENT ON SCHEMA public IS 'Módulo de Recetas Médicas - Sistema Médico SJR 2.0';
