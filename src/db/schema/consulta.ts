import {
  pgTable, bigserial, uuid, varchar, bigint, smallint,
  char, boolean, timestamp, text, numeric, check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizaciones } from './organizaciones';
import { pacientes } from './pacientes';
import { usuarios } from './usuarios';

export const consulta = pgTable('consulta', {
  // Identidad
  idConsulta: bigserial('id_consulta', { mode: 'number' }).primaryKey(),
  tenantId:   uuid('tenant_id').notNull().references(() => organizaciones.id),
  folio:      varchar('folio', { length: 30 }).notNull().unique(),

  // Paciente (UUID + snapshot de nombre al momento de la consulta)
  idPaciente:     uuid('id_paciente').notNull().references(() => pacientes.id),
  nombrePaciente: varchar('nombre_paciente', { length: 200 }).notNull(),
  edad:           smallint('edad'),
  sexo:           char('sexo', { length: 1 }),

  // Médico
  idMedico: uuid('id_medico').notNull().references(() => usuarios.id),

  // Referencia de origen (sin FK formal para evitar circularidad)
  idReferenciaOrigen: bigint('id_referencia_origen', { mode: 'number' }),

  // Fechas y triage
  fechaConsulta: timestamp('fecha_consulta', { withTimezone: true }).notNull().defaultNow(),
  fechaCita:     timestamp('fecha_cita', { withTimezone: true }),
  triageNivel:   smallint('triage_nivel'),

  // Motivo
  motivoConsulta: text('motivo_consulta'),

  // Signos vitales (NOM-004)
  temperaturaC:      numeric('temperatura_c', { precision: 4, scale: 1 }),
  taSistolica:       smallint('ta_sistolica'),
  taDiastolica:      smallint('ta_diastolica'),
  frecuenciaCardiaca: smallint('frecuencia_cardiaca'),
  oxigenacion:       smallint('oxigenacion'),
  alturaCm:          numeric('altura_cm', { precision: 5, scale: 1 }),
  pesoKg:            numeric('peso_kg', { precision: 6, scale: 1 }),
  glucosaMgDl:       smallint('glucosa_mg_dl'),

  // Nota SOAP (NOM-004)
  subjetivo: text('subjetivo'),
  objetivo:  text('objetivo'),
  analisis:  text('analisis'),
  plan:      text('plan'),

  // Pronóstico
  pronostico: smallint('pronostico'),

  // Flags clínicos
  seAsignoIncapacidad:      boolean('se_asigno_incapacidad').notNull().default(false),
  tieneReferencia:          boolean('tiene_referencia').notNull().default(false),
  tieneEstudiosLaboratorio: boolean('tiene_estudios_laboratorio').notNull().default(false),
  tieneCertificado:         boolean('tiene_certificado').notNull().default(false),

  // Costo
  costo: numeric('costo', { precision: 10, scale: 2 }).notNull().default('0'),

  // Estatus: 0=cancelada | 1=en_espera | 2=finalizada
  estatusConsulta: smallint('estatus_consulta').notNull().default(1),
  estatusActivo:   boolean('estatus_activo').notNull().default(true),

  // Auditoría
  idUsuarioCrea:    uuid('id_usuario_crea').references(() => usuarios.id),
  idUsuarioCancela: uuid('id_usuario_cancela').references(() => usuarios.id),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  checkEstatus:       check('estatus_consulta_check', sql`${table.estatusConsulta} IN (0, 1, 2)`),
  checkTemperatura:   check('chk_temperatura', sql`${table.temperaturaC} IS NULL OR ${table.temperaturaC} BETWEEN 30 AND 45`),
  checkPresion:       check('chk_presion_arterial', sql`(${table.taSistolica} IS NULL AND ${table.taDiastolica} IS NULL) OR (${table.taSistolica} BETWEEN 50 AND 300 AND ${table.taDiastolica} BETWEEN 30 AND 200)`),
  checkFrecuencia:    check('chk_frecuencia', sql`${table.frecuenciaCardiaca} IS NULL OR ${table.frecuenciaCardiaca} BETWEEN 20 AND 300`),
  checkOxigenacion:   check('chk_oxigenacion', sql`${table.oxigenacion} IS NULL OR ${table.oxigenacion} BETWEEN 0 AND 100`),
  checkPeso:          check('chk_peso', sql`${table.pesoKg} IS NULL OR ${table.pesoKg} BETWEEN 0 AND 500`),
  checkAltura:        check('chk_altura', sql`${table.alturaCm} IS NULL OR ${table.alturaCm} BETWEEN 0 AND 250`),
  checkGlucosa:       check('chk_glucosa', sql`${table.glucosaMgDl} IS NULL OR ${table.glucosaMgDl} BETWEEN 0 AND 999`),
}));

// Constantes de estatus (sin tabla — ahora es smallint con check)
export const ESTATUS_CONSULTA = {
  CANCELADA: 0,
  EN_ESPERA:  1,
  FINALIZADA: 2,
} as const;

export type Consulta      = typeof consulta.$inferSelect;
export type NuevaConsulta = typeof consulta.$inferInsert;
export type EstatusConsultaValue = typeof ESTATUS_CONSULTA[keyof typeof ESTATUS_CONSULTA];
