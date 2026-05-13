-- Tabla: signos_vitales para PostgreSQL
-- Compatible con el flujo actual de la aplicación

DROP TABLE IF EXISTS public.signos_vitales CASCADE;

CREATE TABLE public.signos_vitales (
    -- Identificador único
    id_signo_vital SERIAL PRIMARY KEY,

    -- Datos del Paciente (desnormalizado para rapidez)
    clavenomina VARCHAR(20) NOT NULL,
    clavepaciente INTEGER,  -- NULL si es empleado, ID del beneficiario si no
    nombrepaciente VARCHAR(255) NOT NULL,
    edad VARCHAR(100),
    departamento VARCHAR(255),
    elpacienteesempleado BOOLEAN NOT NULL DEFAULT false,

    -- Estado de la consulta
    -- 0 = Cancelado/No atendido
    -- 1 = En espera (registrado en signos vitales)
    -- 2 = Atendido
    clavestatus INTEGER NOT NULL DEFAULT 1,

    -- Signos Vitales Principales (REQUERIDOS)
    presion_arterial VARCHAR(20) NOT NULL,  -- Formato: "120/80"
    temperatura NUMERIC(4,2) NOT NULL,      -- Ejemplo: 36.5
    frecuencia_cardiaca INTEGER NOT NULL,   -- Ejemplo: 75 bpm

    -- Signos Vitales Adicionales (OPCIONALES)
    oxigenacion INTEGER,                    -- Saturación de oxígeno: 98%
    altura INTEGER,                         -- Estatura en cm: 175
    peso NUMERIC(5,2),                      -- Peso en kg: 70.5
    glucosa INTEGER,                        -- Glucosa en mg/dL: 90

    -- Auditoría
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario_registro INTEGER,  -- FK a usuarios

    -- Observaciones
    observaciones TEXT,

    -- Estado del registro
    activo BOOLEAN NOT NULL DEFAULT true,

    -- Constraints
    CONSTRAINT chk_clavestatus CHECK (clavestatus IN (0, 1, 2)),
    CONSTRAINT chk_temperatura CHECK (temperatura >= 30 AND temperatura <= 45),
    CONSTRAINT chk_frecuencia_cardiaca CHECK (frecuencia_cardiaca >= 20 AND frecuencia_cardiaca <= 300),
    CONSTRAINT chk_oxigenacion CHECK (oxigenacion IS NULL OR (oxigenacion >= 0 AND oxigenacion <= 100)),
    CONSTRAINT chk_peso CHECK (peso IS NULL OR (peso > 0 AND peso <= 500)),
    CONSTRAINT chk_altura CHECK (altura IS NULL OR (altura > 0 AND altura <= 250)),
    CONSTRAINT chk_glucosa CHECK (glucosa IS NULL OR (glucosa >= 0 AND glucosa <= 999))
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_signos_vitales_clavenomina ON public.signos_vitales(clavenomina);
CREATE INDEX idx_signos_vitales_clavestatus ON public.signos_vitales(clavestatus);
CREATE INDEX idx_signos_vitales_fecha ON public.signos_vitales(fecha_registro);
CREATE INDEX idx_signos_vitales_activo ON public.signos_vitales(activo);
CREATE INDEX idx_signos_vitales_fecha_status ON public.signos_vitales(fecha_registro, clavestatus);

-- Comentario en la tabla
COMMENT ON TABLE public.signos_vitales IS 'Registro de signos vitales de los pacientes (empleados y beneficiarios)';
COMMENT ON COLUMN public.signos_vitales.clavestatus IS '0=Cancelado, 1=En espera, 2=Atendido';
COMMENT ON COLUMN public.signos_vitales.elpacienteesempleado IS 'true=empleado, false=beneficiario';
