// src/db/schema/contrareferencias.ts
import { pgTable, bigserial, bigint, varchar, text, timestamp, boolean, pgEnum, smallint } from 'drizzle-orm/pg-core';
import { referenciasEspecialidad } from './referencias';
import { consulta } from './consulta';

// =============================================
// ENUM para estatus de contrareferencia
// =============================================
export const estatusContrarreferencia = pgEnum('estatus_contrareferencia_enum', [
  'pendiente',
  'vista',
  'cerrada'
]);

// =============================================
// Tabla: contrareferencias
// =============================================
export const contrareferencias = pgTable('contrareferencias', {
  // ID principal
  idContrareferencia: bigserial('id_contrareferencia', { mode: 'number' }).primaryKey(),

  // Folio único (ej: CREF-A7K9M)
  folio: varchar('folio', { length: 20 }).unique().notNull(),

  // Relación con referencia original
  idReferenciaOrigen: bigint('id_referencia_origen', { mode: 'number' })
    .notNull()
    .references(() => referenciasEspecialidad.idReferencia, { onDelete: 'restrict' }),

  // Relación con consulta donde el especialista atendió
  idConsultaEspecialista: bigint('id_consulta_especialista', { mode: 'number' })
    .notNull()
    .references(() => consulta.idConsulta, { onDelete: 'restrict' }),

  // Médico que contrarrefiere (especialista que atendió)
  idMedicoContrarrefiere: bigint('id_medico_contrarrefiere', { mode: 'number' }).notNull(),
  nombreMedicoContrarrefiere: varchar('nombre_medico_contrarrefiere', { length: 200 }).notNull(),
  idEspecialidadRemitente: bigint('id_especialidad_remitente', { mode: 'number' }).notNull(),
  nombreEspecialidadRemitente: varchar('nombre_especialidad_remitente', { length: 100 }).notNull(),

  // Médico que recibe la contrareferencia (el que refirió originalmente)
  idMedicoDestino: bigint('id_medico_destino', { mode: 'number' }).notNull(),
  nombreMedicoDestino: varchar('nombre_medico_destino', { length: 200 }).notNull(),

  // Información del paciente (snapshot)
  noNomina: varchar('no_nomina', { length: 10 }).notNull(),
  idBeneficiario: bigint('id_beneficiario', { mode: 'number' }).notNull(),
  nombrePaciente: varchar('nombre_paciente', { length: 200 }).notNull(),

  // Contenido de la contrareferencia (SOAP completo)
  subjetivo: text('subjetivo'),
  objetivo: text('objetivo'),
  analisis: text('analisis'),
  planTexto: text('plan_texto'),

  // Diagnóstico CIE-11
  cie11Codigo: varchar('cie11_codigo', { length: 15 }),
  cie11Titulo: text('cie11_titulo'),

  // Observaciones adicionales del especialista
  observacionesEspecialista: text('observaciones_especialista'),

  // Control de cascada
  esParteCascada: boolean('es_parte_cascada').default(false),
  idContrareferenciaPadre: bigint('id_contrareferencia_padre', { mode: 'number' }),
  nivelCascada: smallint('nivel_cascada').default(1),

  // Control de estatus
  estatus: estatusContrarreferencia('estatus').notNull().default('pendiente'),
  fechaVista: timestamp('fecha_vista', { withTimezone: true }),
  activo: boolean('activo').default(true),

  // Auditoría
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true }).defaultNow(),
});

// =============================================
// Tipos TypeScript exportados
// =============================================

// Tipo completo de la tabla
export type Contrareferencia = typeof contrareferencias.$inferSelect;

// Tipo para insertar (sin campos auto-generados)
export type NuevaContrareferencia = typeof contrareferencias.$inferInsert;

// Tipo para el estatus
export type EstatusContrareferencia = typeof estatusContrarreferencia.enumValues[number];
