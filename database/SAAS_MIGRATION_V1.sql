-- ============================================================
-- TRINIUM MÉDICO SAAS v1 — ESQUEMA COMPLETO DE BASE DE DATOS
-- Fecha: 2026-05-12
-- Proyecto: imcxluibdakxmuftvnqb.supabase.co
-- Principio: tenant_id obligatorio en todas las tablas clínicas
--            RLS como segunda capa de aislamiento
-- ============================================================

-- ============================================================
-- 0. EXTENSIONES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. FUNCIÓN TRIGGER PARA updated_at AUTOMÁTICO
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 2. FUNCIONES HELPER PARA CONTEXTO TENANT (RLS)
-- ============================================================

-- Establece el tenant_id en el contexto de la sesión actual
CREATE OR REPLACE FUNCTION set_tenant_id(p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.tenant_id', p_tenant_id::text, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Lee el tenant_id del contexto (devuelve NULL si no está establecido)
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (current_setting('app.tenant_id', true))::uuid;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- 3. ENUMs
-- ============================================================

CREATE TYPE role_usuario AS ENUM (
  'super_admin',    -- Equipo Trinium, acceso total
  'admin_org',      -- Admin de la organización cliente
  'medico',         -- Médico general
  'enfermera',      -- Enfermera / triage
  'farmaceutico',   -- Farmacéutico
  'especialista'    -- Médico especialista
);

CREATE TYPE clasificacion_medicamento AS ENUM (
  'PATENTE',
  'GENERICO',
  'CONTROLADO'
);

CREATE TYPE tipo_receta AS ENUM (
  'original',
  'resurtimiento'
);

CREATE TYPE estatus_resurtimiento AS ENUM (
  'pendiente',
  'surtido',
  'vencido',
  'cancelado'
);

CREATE TYPE tipo_movimiento_inventario AS ENUM (
  'SURTIMIENTO',
  'AJUSTE',
  'DISPENSACION',
  'CADUCIDAD',
  'TERMINADO'
);

-- Referencias: flujo simplificado (era 5 etapas, ahora 3)
CREATE TYPE estatus_referencia AS ENUM (
  'pendiente',
  'programada',
  'atendida',
  'cancelada',
  'inasistencia'
);

CREATE TYPE tipo_referencia AS ENUM (
  'interna',   -- Dentro del mismo tenant/sucursal
  'externa'    -- A hospital/clínica externa
);

CREATE TYPE estatus_contrareferencia AS ENUM (
  'pendiente',
  'vista',
  'cerrada'
);

CREATE TYPE tipo_certificado AS ENUM (
  'aptitud_laboral',
  'incapacidad',
  'salud_general',
  'defuncion',
  'otro'
);

CREATE TYPE estatus_laboratorio AS ENUM (
  'pendiente',
  'en_proceso',
  'entregado',
  'cancelado'
);

-- ============================================================
-- 4. ORGANIZACIONES (raíz del sistema multi-tenant)
-- ============================================================
CREATE TABLE organizaciones (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre           VARCHAR(200) NOT NULL,
  slug             VARCHAR(100) NOT NULL UNIQUE,  -- Usado en subdominios/URLs
  logo_url         TEXT,
  color_primario   VARCHAR(7)  DEFAULT '#0EA5E9',
  color_secundario VARCHAR(7)  DEFAULT '#7C3AED',
  plan             VARCHAR(50) NOT NULL DEFAULT 'basic', -- basic | pro | enterprise
  activo           BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_organizaciones_updated_at
  BEFORE UPDATE ON organizaciones
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- 5. USUARIOS (reemplaza tabla SQL legacy)
-- ============================================================
CREATE TABLE usuarios (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID        NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
  email              VARCHAR(255) NOT NULL,
  password_hash      TEXT        NOT NULL,
  nombre             VARCHAR(100) NOT NULL,
  apellido_paterno   VARCHAR(100),
  apellido_materno   VARCHAR(100),
  role               role_usuario NOT NULL,
  cedula_profesional VARCHAR(20),   -- Solo médicos/especialistas (NOM-004)
  especialidad       VARCHAR(100),  -- Solo médicos/especialistas
  activo             BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);

CREATE INDEX idx_usuarios_tenant ON usuarios(tenant_id);
CREATE INDEX idx_usuarios_role   ON usuarios(tenant_id, role);

CREATE TRIGGER trg_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- 6. PACIENTES (reemplaza el modelo nómina/beneficiario)
-- ============================================================
CREATE TABLE pacientes (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID        NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
  nombre           VARCHAR(200) NOT NULL,
  apellido_paterno VARCHAR(100),
  apellido_materno VARCHAR(100),
  curp             VARCHAR(18),
  fecha_nacimiento DATE,
  sexo             CHAR(1)     CHECK (sexo IN ('M', 'F', 'I')),
  telefono         VARCHAR(15),
  email            VARCHAR(200),
  activo           BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pacientes_tenant  ON pacientes(tenant_id);
CREATE INDEX idx_pacientes_curp    ON pacientes(tenant_id, curp);   -- Para deduplicación futura (Fase 13 Opción B)
CREATE INDEX idx_pacientes_nombre  ON pacientes(tenant_id, nombre, apellido_paterno);

CREATE TRIGGER trg_pacientes_updated_at
  BEFORE UPDATE ON pacientes
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- 7. CATÁLOGOS GLOBALES (sin tenant_id — compartidos por todos)
-- ============================================================

CREATE TABLE unidades_medida (
  id_medida   SERIAL      PRIMARY KEY,
  medida      VARCHAR(50) NOT NULL,
  abreviatura VARCHAR(10) NOT NULL
);

-- Catálogo global de medicamentos. El inventario (stock) sí es por tenant.
CREATE TABLE medicamentos (
  id_medicamento   BIGSERIAL   PRIMARY KEY,
  nombre_comercial VARCHAR(150) NOT NULL,
  sustancia_activa VARCHAR(150) NOT NULL,
  clasificacion    clasificacion_medicamento NOT NULL,
  id_medida        INTEGER     NOT NULL REFERENCES unidades_medida(id_medida),
  codigo_ean       VARCHAR(20),
  precio_unitario  NUMERIC(12,2) NOT NULL CHECK (precio_unitario >= 0),
  activo           BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Catálogo global de estudios de laboratorio
CREATE TABLE laboratorio_estudios (
  id          SERIAL       PRIMARY KEY,
  nombre      VARCHAR(200) NOT NULL,
  codigo      VARCHAR(50),
  descripcion TEXT,
  activo      BOOLEAN      NOT NULL DEFAULT TRUE
);

-- ============================================================
-- 8. CONSULTA
-- ============================================================
CREATE TABLE consulta (
  -- Identidad
  id_consulta  BIGSERIAL    PRIMARY KEY,
  tenant_id    UUID         NOT NULL REFERENCES organizaciones(id),
  folio        VARCHAR(30)  NOT NULL UNIQUE,

  -- Paciente (UUID — reemplaza no_nomina + id_beneficiario + sindicato + parentesco)
  id_paciente     UUID         NOT NULL REFERENCES pacientes(id),
  nombre_paciente VARCHAR(200) NOT NULL,   -- snapshot al momento de la consulta
  edad            SMALLINT,
  sexo            CHAR(1),

  -- Médico
  id_medico       UUID         NOT NULL REFERENCES usuarios(id),

  -- Referencia de origen (sin FK formal para evitar circular con referencias_especialidad)
  id_referencia_origen BIGINT,

  -- Fechas
  fecha_consulta  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  fecha_cita      TIMESTAMPTZ,
  triage_nivel    SMALLINT,

  -- Motivo
  motivo_consulta TEXT,

  -- Signos vitales (NOM-004)
  temperatura_c       NUMERIC(4,1),
  ta_sistolica        SMALLINT,
  ta_diastolica       SMALLINT,
  frecuencia_cardiaca SMALLINT,
  oxigenacion         SMALLINT,
  altura_cm           NUMERIC(5,1),
  peso_kg             NUMERIC(6,1),
  glucosa_mg_dl       SMALLINT,

  -- Nota SOAP (NOM-004)
  subjetivo TEXT,
  objetivo  TEXT,
  analisis  TEXT,
  plan      TEXT,

  -- Pronóstico
  pronostico SMALLINT,

  -- Flags clínicos
  se_asigno_incapacidad     BOOLEAN NOT NULL DEFAULT FALSE,
  tiene_referencia          BOOLEAN NOT NULL DEFAULT FALSE,
  tiene_estudios_laboratorio BOOLEAN NOT NULL DEFAULT FALSE,
  tiene_certificado         BOOLEAN NOT NULL DEFAULT FALSE,

  -- Costos
  costo NUMERIC(10,2) NOT NULL DEFAULT 0,

  -- Estatus: 0=cancelada | 1=en_espera | 2=finalizada
  estatus_consulta SMALLINT NOT NULL DEFAULT 1
    CHECK (estatus_consulta IN (0, 1, 2)),
  estatus_activo   BOOLEAN  NOT NULL DEFAULT TRUE,

  -- Auditoría
  id_usuario_crea    UUID REFERENCES usuarios(id),
  id_usuario_cancela UUID REFERENCES usuarios(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints fisiológicos
  CONSTRAINT chk_temperatura      CHECK (temperatura_c IS NULL      OR temperatura_c BETWEEN 30 AND 45),
  CONSTRAINT chk_presion_arterial CHECK (
    (ta_sistolica IS NULL AND ta_diastolica IS NULL) OR
    (ta_sistolica BETWEEN 50 AND 300 AND ta_diastolica BETWEEN 30 AND 200)
  ),
  CONSTRAINT chk_frecuencia       CHECK (frecuencia_cardiaca IS NULL OR frecuencia_cardiaca BETWEEN 20 AND 300),
  CONSTRAINT chk_oxigenacion      CHECK (oxigenacion IS NULL         OR oxigenacion BETWEEN 0 AND 100),
  CONSTRAINT chk_peso             CHECK (peso_kg IS NULL             OR peso_kg BETWEEN 0 AND 500),
  CONSTRAINT chk_altura           CHECK (altura_cm IS NULL           OR altura_cm BETWEEN 0 AND 250),
  CONSTRAINT chk_glucosa          CHECK (glucosa_mg_dl IS NULL       OR glucosa_mg_dl BETWEEN 0 AND 999)
);

CREATE INDEX idx_consulta_tenant        ON consulta(tenant_id);
CREATE INDEX idx_consulta_paciente      ON consulta(tenant_id, id_paciente);
CREATE INDEX idx_consulta_medico        ON consulta(tenant_id, id_medico);
CREATE INDEX idx_consulta_fecha_estatus ON consulta(tenant_id, fecha_consulta, estatus_consulta);
CREATE INDEX idx_consulta_activos       ON consulta(tenant_id, estatus_activo, fecha_consulta DESC);

CREATE TRIGGER trg_consulta_updated_at
  BEFORE UPDATE ON consulta
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- 9. DIAGNÓSTICOS CONSULTA (CIE-11)
-- ============================================================
CREATE TABLE diagnosticos_consulta (
  id_diagnostico BIGSERIAL   PRIMARY KEY,
  tenant_id      UUID        NOT NULL REFERENCES organizaciones(id),
  id_consulta    BIGINT      NOT NULL REFERENCES consulta(id_consulta) ON DELETE CASCADE,
  cie11_codigo   VARCHAR(15) NOT NULL,
  cie11_titulo   TEXT        NOT NULL,
  cie11_capitulo VARCHAR(15),
  es_principal   BOOLEAN     NOT NULL DEFAULT FALSE,
  orden          SMALLINT    NOT NULL DEFAULT 1,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_diagnosticos_tenant   ON diagnosticos_consulta(tenant_id);
CREATE INDEX idx_diagnosticos_consulta ON diagnosticos_consulta(id_consulta);
CREATE INDEX idx_diagnosticos_cie11    ON diagnosticos_consulta(tenant_id, cie11_codigo);

-- ============================================================
-- 10. RECETAS
-- ============================================================
CREATE TABLE recetas (
  id_receta               BIGSERIAL   PRIMARY KEY,
  tenant_id               UUID        NOT NULL REFERENCES organizaciones(id),
  id_consulta             BIGINT      NOT NULL REFERENCES consulta(id_consulta),
  tipo_receta             tipo_receta NOT NULL DEFAULT 'original',
  id_receta_original      BIGINT      REFERENCES recetas(id_receta),
  folio_receta            VARCHAR(30) NOT NULL UNIQUE,
  fecha_emision           TIMESTAMPTZ NOT NULL DEFAULT now(),
  vigencia_dias           INTEGER     NOT NULL DEFAULT 30 CHECK (vigencia_dias > 0),
  observaciones_generales TEXT,
  cancelado               BOOLEAN     NOT NULL DEFAULT FALSE,
  motivo_cancelacion      TEXT,
  fecha_cancelacion       TIMESTAMPTZ,
  id_usuario_cancela      UUID        REFERENCES usuarios(id),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_recetas_tenant   ON recetas(tenant_id);
CREATE INDEX idx_recetas_consulta ON recetas(id_consulta);
CREATE INDEX idx_recetas_folio    ON recetas(folio_receta);

CREATE TRIGGER trg_recetas_updated_at
  BEFORE UPDATE ON recetas
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- 11. DETALLE RECETA
-- ============================================================
CREATE TABLE detalle_receta (
  id_detalle                BIGSERIAL   PRIMARY KEY,
  id_receta                 BIGINT      NOT NULL REFERENCES recetas(id_receta) ON DELETE CASCADE,
  id_medicamento            BIGINT      NOT NULL REFERENCES medicamentos(id_medicamento),
  cantidad_total            INTEGER     NOT NULL CHECK (cantidad_total > 0),
  dosis                     TEXT        NOT NULL,
  duracion_tratamiento_dias INTEGER     NOT NULL CHECK (duracion_tratamiento_dias > 0),
  via_administracion        VARCHAR(50) DEFAULT 'Oral',
  indicaciones              TEXT,
  realizar_resurtimiento    BOOLEAN     NOT NULL DEFAULT FALSE,
  meses_resurtimiento       INTEGER     CHECK (meses_resurtimiento IS NULL OR meses_resurtimiento BETWEEN 1 AND 12),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_detalle_receta ON detalle_receta(id_receta);

-- ============================================================
-- 12. SURTIMIENTOS RECETA
-- ============================================================
CREATE TABLE surtimientos_receta (
  id_surtimiento    BIGSERIAL   PRIMARY KEY,
  id_detalle        BIGINT      NOT NULL REFERENCES detalle_receta(id_detalle),
  cantidad_surtida  INTEGER     NOT NULL CHECK (cantidad_surtida >= 0),
  fecha_surtimiento TIMESTAMPTZ NOT NULL DEFAULT now(),
  id_farmaceutico   UUID        REFERENCES usuarios(id),
  observaciones     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_surtimientos_detalle ON surtimientos_receta(id_detalle);

-- ============================================================
-- 13. CONTROL RESURTIMIENTOS
-- ============================================================
CREATE TABLE control_resurtimientos (
  id_control              BIGSERIAL             PRIMARY KEY,
  id_detalle              BIGINT                NOT NULL REFERENCES detalle_receta(id_detalle) ON DELETE CASCADE,
  numero_resurtimiento    INTEGER               NOT NULL CHECK (numero_resurtimiento > 0),
  fecha_programada        DATE                  NOT NULL,
  fecha_limite            DATE,
  estatus                 estatus_resurtimiento NOT NULL DEFAULT 'pendiente',
  fecha_surtido           TIMESTAMPTZ,
  id_surtimiento          BIGINT                REFERENCES surtimientos_receta(id_surtimiento),
  id_receta_resurtimiento BIGINT                REFERENCES recetas(id_receta),
  fecha_receta_generada   TIMESTAMPTZ,
  observaciones           TEXT,
  created_at              TIMESTAMPTZ           NOT NULL DEFAULT now()
);

CREATE INDEX idx_control_detalle ON control_resurtimientos(id_detalle);
CREATE INDEX idx_control_estatus ON control_resurtimientos(estatus, fecha_programada);

-- ============================================================
-- 14. INVENTARIO MEDICAMENTOS (por tenant — stock independiente)
-- ============================================================
CREATE TABLE inventario_medicamentos (
  id_inventario     BIGSERIAL   PRIMARY KEY,
  tenant_id         UUID        NOT NULL REFERENCES organizaciones(id),
  id_medicamento    BIGINT      NOT NULL REFERENCES medicamentos(id_medicamento),
  existencia_actual INTEGER     NOT NULL DEFAULT 0  CHECK (existencia_actual >= 0),
  fondo_fijo        INTEGER     NOT NULL             CHECK (fondo_fijo > 0),
  es_cuadro_basico  BOOLEAN     NOT NULL DEFAULT FALSE,
  observaciones     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, id_medicamento)
);

CREATE INDEX idx_inventario_tenant ON inventario_medicamentos(tenant_id);

CREATE TRIGGER trg_inventario_updated_at
  BEFORE UPDATE ON inventario_medicamentos
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- 15. HISTORIAL INVENTARIO
-- ============================================================
CREATE TABLE historial_inventario (
  id_historial       BIGSERIAL                  PRIMARY KEY,
  tenant_id          UUID                       NOT NULL REFERENCES organizaciones(id),
  id_inventario      BIGINT                     NOT NULL REFERENCES inventario_medicamentos(id_inventario),
  cantidad_anterior  INTEGER                    NOT NULL,
  cantidad_ingresada INTEGER                    NOT NULL,
  cantidad_nueva     INTEGER                    NOT NULL,
  tipo_movimiento    tipo_movimiento_inventario NOT NULL,
  id_usuario         UUID                       REFERENCES usuarios(id),
  observaciones      TEXT,
  fecha              TIMESTAMPTZ                NOT NULL DEFAULT now()
);

CREATE INDEX idx_historial_tenant     ON historial_inventario(tenant_id);
CREATE INDEX idx_historial_inventario ON historial_inventario(id_inventario, fecha DESC);

-- ============================================================
-- 16. ALERTAS FONDOS CORREOS (por tenant)
-- ============================================================
CREATE TABLE alertas_fondos_correos (
  id_correo           BIGSERIAL    PRIMARY KEY,
  tenant_id           UUID         NOT NULL REFERENCES organizaciones(id),
  correo              VARCHAR(255) NOT NULL,
  nombre_destinatario VARCHAR(100) NOT NULL,
  activo              BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, correo)
);

CREATE INDEX idx_alertas_tenant ON alertas_fondos_correos(tenant_id);

CREATE TRIGGER trg_alertas_updated_at
  BEFORE UPDATE ON alertas_fondos_correos
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- 17. REGLAS GENERALES (una fila por tenant)
-- ============================================================
CREATE TABLE reglas_generales (
  id_regla                              BIGSERIAL   PRIMARY KEY,
  tenant_id                             UUID        NOT NULL UNIQUE REFERENCES organizaciones(id),
  vigencia_primer_surtimiento_dias      INTEGER     NOT NULL DEFAULT 3,
  vigencia_receta_dias                  INTEGER     NOT NULL DEFAULT 30,
  ventana_tolerancia_resurtimiento_dias INTEGER     NOT NULL DEFAULT 2,
  stock_minimo_alerta                   INTEGER     NOT NULL DEFAULT 10,
  stock_critico_alerta                  INTEGER     NOT NULL DEFAULT 5,
  descripcion                           TEXT,
  activo                                BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at                            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_reglas_updated_at
  BEFORE UPDATE ON reglas_generales
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- 18. FIRMAS DIGITALES
-- ============================================================
CREATE TABLE firmas_digitales (
  id_firma     BIGSERIAL   PRIMARY KEY,
  tenant_id    UUID        NOT NULL REFERENCES organizaciones(id),
  id_usuario   UUID        NOT NULL UNIQUE REFERENCES usuarios(id),
  firma_base64 TEXT        NOT NULL,
  hash_firma   VARCHAR(64) NOT NULL UNIQUE,
  activo       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_firmas_tenant ON firmas_digitales(tenant_id);

CREATE TRIGGER trg_firmas_updated_at
  BEFORE UPDATE ON firmas_digitales
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- 19. REFERENCIAS ESPECIALIDAD (flujo simplificado: 3 estados)
--     Antes: 5 etapas + roles coordinador/hospital/admin
--     Ahora: pendiente → programada → atendida (+ cancelada/inasistencia)
-- ============================================================
CREATE TABLE referencias_especialidad (
  id_referencia          BIGSERIAL        PRIMARY KEY,
  tenant_id              UUID             NOT NULL REFERENCES organizaciones(id),
  folio                  VARCHAR(20)      UNIQUE,
  tipo                   tipo_referencia  NOT NULL DEFAULT 'interna',

  -- Consulta origen y seguimiento
  id_consulta_origen     BIGINT           NOT NULL REFERENCES consulta(id_consulta) ON DELETE RESTRICT,
  id_consulta_seguimiento BIGINT          REFERENCES consulta(id_consulta) ON DELETE SET NULL,

  -- Paciente (snapshot)
  id_paciente            UUID             NOT NULL REFERENCES pacientes(id),
  nombre_paciente        VARCHAR(200)     NOT NULL,

  -- Médico que refiere
  id_medico_refiere      UUID             NOT NULL REFERENCES usuarios(id),
  nombre_medico_refiere  VARCHAR(200)     NOT NULL,

  -- Especialidad solicitada
  nombre_especialidad    VARCHAR(100)     NOT NULL,
  motivo_referencia      TEXT             NOT NULL,

  -- Asignación (antes era flujo de coordinador + hospital)
  id_medico_asignado     UUID             REFERENCES usuarios(id),
  nombre_medico_asignado VARCHAR(200),
  fecha_cita             TIMESTAMPTZ,
  id_usuario_programa    UUID             REFERENCES usuarios(id),
  fecha_programacion     TIMESTAMPTZ,

  -- Atención
  fecha_atencion         TIMESTAMPTZ,

  -- Cancelación / Inasistencia
  motivo_cancelacion     TEXT,
  motivo_inasistencia    TEXT,
  id_usuario_cierre      UUID             REFERENCES usuarios(id),

  -- Estado
  estatus  estatus_referencia NOT NULL DEFAULT 'pendiente',
  activo   BOOLEAN            DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_referencias_tenant   ON referencias_especialidad(tenant_id);
CREATE INDEX idx_referencias_paciente ON referencias_especialidad(tenant_id, id_paciente);
CREATE INDEX idx_referencias_medico   ON referencias_especialidad(tenant_id, id_medico_refiere);
CREATE INDEX idx_referencias_estatus  ON referencias_especialidad(tenant_id, estatus);

CREATE TRIGGER trg_referencias_updated_at
  BEFORE UPDATE ON referencias_especialidad
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- 20. CONTRAREFERENCIAS
-- ============================================================
CREATE TABLE contrareferencias (
  id_contrareferencia          BIGSERIAL                PRIMARY KEY,
  tenant_id                    UUID                     NOT NULL REFERENCES organizaciones(id),
  folio                        VARCHAR(20)              NOT NULL UNIQUE,

  -- Origen
  id_referencia_origen         BIGINT                   NOT NULL REFERENCES referencias_especialidad(id_referencia) ON DELETE RESTRICT,
  id_consulta_especialista     BIGINT                   NOT NULL REFERENCES consulta(id_consulta) ON DELETE RESTRICT,

  -- Paciente (snapshot)
  id_paciente                  UUID                     NOT NULL REFERENCES pacientes(id),
  nombre_paciente              VARCHAR(200)             NOT NULL,

  -- Especialista que contrarrefiere
  id_medico_contrarrefiere     UUID                     NOT NULL REFERENCES usuarios(id),
  nombre_medico_contrarrefiere VARCHAR(200)             NOT NULL,
  nombre_especialidad_remitente VARCHAR(100)            NOT NULL,

  -- Médico destino (quien refirió originalmente)
  id_medico_destino            UUID                     NOT NULL REFERENCES usuarios(id),
  nombre_medico_destino        VARCHAR(200)             NOT NULL,

  -- Nota SOAP del especialista
  subjetivo                    TEXT,
  objetivo                     TEXT,
  analisis                     TEXT,
  plan_texto                   TEXT,

  -- CIE-11
  cie11_codigo                 VARCHAR(15),
  cie11_titulo                 TEXT,

  -- Observaciones
  observaciones_especialista   TEXT,

  -- Control cascada (contrareferencia de contrareferencia)
  es_parte_cascada             BOOLEAN  DEFAULT FALSE,
  id_contrareferencia_padre    BIGINT   REFERENCES contrareferencias(id_contrareferencia),
  nivel_cascada                SMALLINT DEFAULT 1,

  -- Estado
  estatus      estatus_contrareferencia NOT NULL DEFAULT 'pendiente',
  fecha_vista  TIMESTAMPTZ,
  activo       BOOLEAN DEFAULT TRUE,

  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contrarefs_tenant     ON contrareferencias(tenant_id);
CREATE INDEX idx_contrarefs_referencia ON contrareferencias(id_referencia_origen);
CREATE INDEX idx_contrarefs_paciente   ON contrareferencias(tenant_id, id_paciente);

CREATE TRIGGER trg_contrareferencias_updated_at
  BEFORE UPDATE ON contrareferencias
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- 21. CERTIFICADOS MÉDICOS (módulo nuevo en SaaS)
-- ============================================================
CREATE TABLE certificados (
  id               UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID             NOT NULL REFERENCES organizaciones(id),
  id_consulta      BIGINT           REFERENCES consulta(id_consulta),
  id_paciente      UUID             NOT NULL REFERENCES pacientes(id),
  id_medico        UUID             NOT NULL REFERENCES usuarios(id),
  tipo_certificado tipo_certificado NOT NULL,
  campos_dinamicos JSONB            NOT NULL DEFAULT '{}',
  pdf_url          TEXT,
  folio            VARCHAR(30)      UNIQUE,
  emitido_en       TIMESTAMPTZ      NOT NULL DEFAULT now(),
  created_at       TIMESTAMPTZ      NOT NULL DEFAULT now()
);

CREATE INDEX idx_certificados_tenant   ON certificados(tenant_id);
CREATE INDEX idx_certificados_paciente ON certificados(tenant_id, id_paciente);
CREATE INDEX idx_certificados_consulta ON certificados(id_consulta);

-- ============================================================
-- 22. LABORATORIO — ÓRDENES
-- ============================================================
CREATE TABLE laboratorio_ordenes (
  id_orden    BIGSERIAL           PRIMARY KEY,
  tenant_id   UUID                NOT NULL REFERENCES organizaciones(id),
  folio       VARCHAR(30)         NOT NULL UNIQUE,
  id_consulta BIGINT              NOT NULL REFERENCES consulta(id_consulta),
  id_paciente UUID                NOT NULL REFERENCES pacientes(id),
  id_medico   UUID                NOT NULL REFERENCES usuarios(id),
  estatus     estatus_laboratorio NOT NULL DEFAULT 'pendiente',
  observaciones TEXT,
  created_at  TIMESTAMPTZ         NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ         NOT NULL DEFAULT now()
);

CREATE INDEX idx_lab_ordenes_tenant   ON laboratorio_ordenes(tenant_id);
CREATE INDEX idx_lab_ordenes_paciente ON laboratorio_ordenes(tenant_id, id_paciente);
CREATE INDEX idx_lab_ordenes_consulta ON laboratorio_ordenes(id_consulta);

CREATE TRIGGER trg_lab_ordenes_updated_at
  BEFORE UPDATE ON laboratorio_ordenes
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- 23. LABORATORIO — DETALLE DE ESTUDIOS POR ORDEN
-- ============================================================
CREATE TABLE laboratorio_orden_estudios (
  id_orden_estudio BIGSERIAL   PRIMARY KEY,
  id_orden         BIGINT      NOT NULL REFERENCES laboratorio_ordenes(id_orden) ON DELETE CASCADE,
  id_estudio       INTEGER     NOT NULL REFERENCES laboratorio_estudios(id),
  resultado        TEXT,
  unidad           VARCHAR(50),
  valor_referencia VARCHAR(100),
  resultado_url    TEXT,         -- URL firmada de Supabase Storage
  entregado_en     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_lab_detalle_orden ON laboratorio_orden_estudios(id_orden);

-- ============================================================
-- 24. ROW LEVEL SECURITY (RLS)
--     Todas las tablas con tenant_id quedan aisladas por tenant.
--     El service_role key bypasea RLS (para uso exclusivo server-side).
-- ============================================================

ALTER TABLE organizaciones          ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios                ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE consulta                ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosticos_consulta   ENABLE ROW LEVEL SECURITY;
ALTER TABLE recetas                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_receta          ENABLE ROW LEVEL SECURITY;
ALTER TABLE surtimientos_receta     ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_resurtimientos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario_medicamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_inventario    ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas_fondos_correos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reglas_generales        ENABLE ROW LEVEL SECURITY;
ALTER TABLE firmas_digitales        ENABLE ROW LEVEL SECURITY;
ALTER TABLE referencias_especialidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE contrareferencias       ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificados            ENABLE ROW LEVEL SECURITY;
ALTER TABLE laboratorio_ordenes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE laboratorio_orden_estudios ENABLE ROW LEVEL SECURITY;

-- Políticas de aislamiento por tenant_id directo
CREATE POLICY tenant_isolation ON organizaciones
  USING (id = current_tenant_id());

CREATE POLICY tenant_isolation ON usuarios
  USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation ON pacientes
  USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation ON consulta
  USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation ON diagnosticos_consulta
  USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation ON recetas
  USING (tenant_id = current_tenant_id());

-- detalle_receta no tiene tenant_id directo → acceso vía recetas
CREATE POLICY tenant_isolation ON detalle_receta
  USING (
    id_receta IN (
      SELECT id_receta FROM recetas WHERE tenant_id = current_tenant_id()
    )
  );

-- surtimientos_receta → acceso vía detalle_receta → recetas
CREATE POLICY tenant_isolation ON surtimientos_receta
  USING (
    id_detalle IN (
      SELECT dr.id_detalle
      FROM detalle_receta dr
      JOIN recetas r ON r.id_receta = dr.id_receta
      WHERE r.tenant_id = current_tenant_id()
    )
  );

-- control_resurtimientos → mismo camino
CREATE POLICY tenant_isolation ON control_resurtimientos
  USING (
    id_detalle IN (
      SELECT dr.id_detalle
      FROM detalle_receta dr
      JOIN recetas r ON r.id_receta = dr.id_receta
      WHERE r.tenant_id = current_tenant_id()
    )
  );

CREATE POLICY tenant_isolation ON inventario_medicamentos
  USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation ON historial_inventario
  USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation ON alertas_fondos_correos
  USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation ON reglas_generales
  USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation ON firmas_digitales
  USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation ON referencias_especialidad
  USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation ON contrareferencias
  USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation ON certificados
  USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation ON laboratorio_ordenes
  USING (tenant_id = current_tenant_id());

-- laboratorio_orden_estudios → acceso vía laboratorio_ordenes
CREATE POLICY tenant_isolation ON laboratorio_orden_estudios
  USING (
    id_orden IN (
      SELECT id_orden FROM laboratorio_ordenes WHERE tenant_id = current_tenant_id()
    )
  );

-- ============================================================
-- 25. DATOS SEMILLA — Unidades de medida
-- ============================================================
INSERT INTO unidades_medida (medida, abreviatura) VALUES
  ('Miligramos',  'mg'),
  ('Gramos',      'g'),
  ('Mililitros',  'ml'),
  ('Litros',      'L'),
  ('Unidades',    'UI'),
  ('Tabletas',    'tab'),
  ('Cápsulas',    'cap'),
  ('Gotas',       'gts'),
  ('Parches',     'pch'),
  ('Ampolletas',  'amp')
ON CONFLICT DO NOTHING;
