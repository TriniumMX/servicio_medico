-- =====================================================
-- TABLA: alertas_fondos_correos
-- Almacena los correos electrónicos de destinatarios
-- que recibirán alertas de fondos fijos bajos
-- =====================================================

-- Crear tabla de correos para alertas
CREATE TABLE IF NOT EXISTS alertas_fondos_correos (
  id_correo SERIAL PRIMARY KEY,
  correo VARCHAR(255) NOT NULL UNIQUE,
  nombre_destinatario VARCHAR(100) NOT NULL,
  activo BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Índice para búsquedas por correo
CREATE INDEX IF NOT EXISTS idx_alertas_correos_correo ON alertas_fondos_correos(correo);

-- Índice para filtrar por activos
CREATE INDEX IF NOT EXISTS idx_alertas_correos_activo ON alertas_fondos_correos(activo);

-- Comentarios de la tabla
COMMENT ON TABLE alertas_fondos_correos IS 'Destinatarios de correo electrónico para alertas de fondos fijos bajos';
COMMENT ON COLUMN alertas_fondos_correos.id_correo IS 'Identificador único del registro';
COMMENT ON COLUMN alertas_fondos_correos.correo IS 'Dirección de correo electrónico del destinatario';
COMMENT ON COLUMN alertas_fondos_correos.nombre_destinatario IS 'Nombre del destinatario para personalizar el correo';
COMMENT ON COLUMN alertas_fondos_correos.activo IS 'Si el correo está activo para recibir alertas';
COMMENT ON COLUMN alertas_fondos_correos.created_at IS 'Fecha de creación del registro';
COMMENT ON COLUMN alertas_fondos_correos.updated_at IS 'Fecha de última actualización';

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_alertas_fondos_correos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_alertas_fondos_correos ON alertas_fondos_correos;
CREATE TRIGGER trigger_update_alertas_fondos_correos
  BEFORE UPDATE ON alertas_fondos_correos
  FOR EACH ROW
  EXECUTE FUNCTION update_alertas_fondos_correos_updated_at();
