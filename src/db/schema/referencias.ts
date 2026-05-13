// src/db/schema/referencias.ts
import { pgTable, bigserial, bigint, varchar, text, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { consulta } from './consulta';

// =============================================
// ENUM para estatus de referencia
// =============================================
export const estatusReferenciaEnum = pgEnum('estatus_referencia_enum', [
  'pendiente_autorizar',
  'pendiente_asignar', // Legacy: datos existentes antes de la inversión del flujo
  'autorizada',
  'asignada',
  'notificada',
  'atendida',
  'cancelada',
  'inasistencia'
]);

// =============================================
// Tabla: referencias_especialidad
// =============================================
export const referenciasEspecialidad = pgTable('referencias_especialidad', {
  // ID principal
  idReferencia: bigserial('id_referencia', { mode: 'number' }).primaryKey(),

  // Folio único de referencia (ej: REF-A7K9M)
  folio: varchar('folio', { length: 20 }).unique(),

  // Relación con consultas
  idConsultaOrigen: bigint('id_consulta_origen', { mode: 'number' })
    .notNull()
    .references(() => consulta.idConsulta, { onDelete: 'restrict' }),
  idConsultaSeguimiento: bigint('id_consulta_seguimiento', { mode: 'number' })
    .references(() => consulta.idConsulta, { onDelete: 'set null' }),

  // Información del paciente (snapshot)
  noNomina: varchar('no_nomina', { length: 10 }).notNull(),
  idBeneficiario: bigint('id_beneficiario', { mode: 'number' }).notNull(),
  nombrePaciente: varchar('nombre_paciente', { length: 200 }).notNull(),

  // Médico que refiere
  idMedicoRefiere: bigint('id_medico_refiere', { mode: 'number' }).notNull(),
  nombreMedicoRefiere: varchar('nombre_medico_refiere', { length: 200 }).notNull(),

  // Especialidad solicitada
  idEspecialidadSolicitada: bigint('id_especialidad_solicitada', { mode: 'number' }).notNull(),
  nombreEspecialidad: varchar('nombre_especialidad', { length: 100 }).notNull(),
  motivoReferencia: text('motivo_referencia').notNull(),

  // Autorización (FASE 2: Coordinador)
  idCoordinadorAutoriza: bigint('id_coordinador_autoriza', { mode: 'number' }),
  fechaAutorizacion: timestamp('fecha_autorizacion', { withTimezone: true }),
  observacionesCoordinador: text('observaciones_coordinador'),
  firmaDigital: text('firma_digital'),

  // Asignación de médico especialista (FASE 3: Hospital)
  idMedicoAsignado: bigint('id_medico_asignado', { mode: 'number' }),
  fechaCita: timestamp('fecha_cita', { withTimezone: true }),
  idUsuarioAsigna: bigint('id_usuario_asigna', { mode: 'number' }),
  fechaAsignacion: timestamp('fecha_asignacion', { withTimezone: true }),

  // Notificación al paciente (FASE 4: Admin Referencias)
  idUsuarioNotifica: bigint('id_usuario_notifica', { mode: 'number' }),
  fechaNotificacion: timestamp('fecha_notificacion', { withTimezone: true }),
  observacionesNotificacion: text('observaciones_notificacion'),

  // Atención (FASE 5: Médico Especialista)
  fechaAtencion: timestamp('fecha_atencion', { withTimezone: true }),

  // Inasistencia (FASE 5b: Médico Especialista marca inasistencia)
  motivoInasistencia: text('motivo_inasistencia'),
  idUsuarioInasistencia: bigint('id_usuario_inasistencia', { mode: 'number' }),
  fechaInasistencia: timestamp('fecha_inasistencia', { withTimezone: true }),

  // Control de estatus
  estatus: estatusReferenciaEnum('estatus').notNull().default('pendiente_autorizar'),
  activo: boolean('activo').default(true),

  // Auditoría
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true }).defaultNow(),
});

// =============================================
// Tipos TypeScript exportados
// =============================================

// Tipo completo de la tabla
export type ReferenciaEspecialidad = typeof referenciasEspecialidad.$inferSelect;

// Tipo para insertar (sin campos auto-generados)
export type NuevaReferenciaEspecialidad = typeof referenciasEspecialidad.$inferInsert;

// Tipo para el estatus
export type EstatusReferencia = typeof estatusReferenciaEnum.enumValues[number];
