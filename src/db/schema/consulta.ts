// src/db/schema/consulta.ts
import { pgTable, bigserial, varchar, bigint, smallint, char, boolean, timestamp, text, numeric } from 'drizzle-orm/pg-core';
import { parentesco } from './parentesco';
import { estatusConsulta } from './estatus_consulta';

export const consulta = pgTable('consulta', {
  // ID y Folio
  idConsulta: bigserial('id_consulta', { mode: 'number' }).primaryKey(),
  folio: varchar('folio', { length: 30 }).notNull().unique(), // 8 caracteres alfanuméricos (ej: A7K9M2F8)

  // Relación con padrón
  idBeneficiario: bigint('id_beneficiario', { mode: 'number' }).notNull(),
  noNomina: varchar('no_nomina', { length: 10 }).notNull(),

  // 📌 Snapshot del paciente al momento de la consulta
  nombre: varchar('nombre', { length: 200 }).notNull(),
  edad: smallint('edad'),
  sexo: char('sexo', { length: 1 }),
  idParentesco: bigint('id_parentesco', { mode: 'number' })
    .notNull()
    .references(() => parentesco.idParentesco),
  departamento: varchar('departamento', { length: 200 }),
  sindicato: varchar('sindicato', { length: 10 }),
  esEmpleado: boolean('es_empleado').notNull(),

  // Médico / hospital
  idMedico: bigint('id_medico', { mode: 'number' }).notNull(),
  idHospital: bigint('id_hospital', { mode: 'number' }),

  // Consulta que responde una referencia
  idReferenciaOrigen: bigint('id_referencia_origen', { mode: 'number' }),

  // Fechas y triage
  fechaConsulta: timestamp('fecha_consulta', { withTimezone: true }).notNull().defaultNow(),
  fechaCita: timestamp('fecha_cita', { withTimezone: true }),
  triageNivel: smallint('triage_nivel'),

  // Motivo
  motivoConsulta: text('motivo_consulta'),

  // 🫀 Signos vitales
  temperaturaC: numeric('temperatura_c', { precision: 4, scale: 1 }),      // 36.7
  taSistolica: smallint('ta_sistolica'),                                   // 120
  taDiastolica: smallint('ta_diastolica'),                                 // 80
  frecuenciaCardiaca: smallint('frecuencia_cardiaca'),                     // 72
  oxigenacion: smallint('oxigenacion'),                                    // 98 (%)
  alturaCm: numeric('altura_cm', { precision: 5, scale: 1 }),              // 170.5 cm
  pesoKg: numeric('peso_kg', { precision: 6, scale: 1 }),                  // 72.3 kg
  glucosaMgDl: smallint('glucosa_mg_dl'),                                  // 110

  // Nota SOAP
  subjetivo: text('subjetivo'),
  objetivo: text('objetivo'),
  analisis: text('analisis'),
  plan: text('plan'),

  // Pronóstico
  pronostico: smallint('pronostico'),

  // Flags clínicos
  seAsignoIncapacidad: boolean('se_asigno_incapacidad').notNull().default(false),
  tieneReferencia: boolean('tiene_referencia').notNull().default(false),
  tieneEstudiosLaboratorio: boolean('tiene_estudios_laboratorio').notNull().default(false),

  // Costos
  costo: numeric('costo', { precision: 10, scale: 2 }).notNull().default('0'),

  // Estatus
  estatusConsulta: smallint('estatus_consulta')
    .notNull()
    .default(1)
    .references(() => estatusConsulta.idEstatusConsulta),
  estatusActivo: boolean('estatus_activo').notNull().default(true),

  // Auditoría
  idUsuarioCrea: bigint('id_usuario_crea', { mode: 'number' }),
  idUsuarioCancela: bigint('id_usuario_cancela', { mode: 'number' }),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true }).defaultNow(),
});
