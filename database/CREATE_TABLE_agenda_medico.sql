-- Tabla para gestionar la agenda semanal de los médicos especialistas
-- Cada fila representa un día laboral con su rango de horario

CREATE TABLE IF NOT EXISTS agenda_medico (
  id_agenda   SERIAL PRIMARY KEY,
  id_usuario  INT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  dia_semana  SMALLINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  -- 0 = Domingo, 1 = Lunes, 2 = Martes, 3 = Miércoles,
  -- 4 = Jueves,  5 = Viernes, 6 = Sábado
  hora_inicio TIME NOT NULL,
  hora_fin    TIME NOT NULL,
  CONSTRAINT chk_horas CHECK (hora_fin > hora_inicio),
  UNIQUE (id_usuario, dia_semana)
);

CREATE INDEX IF NOT EXISTS idx_agenda_medico_usuario
  ON agenda_medico(id_usuario);
