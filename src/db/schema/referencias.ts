import {
  pgTable, bigserial, bigint, uuid, varchar, text, timestamp, boolean, pgEnum,
} from 'drizzle-orm/pg-core';
import { organizaciones } from './organizaciones';
import { consulta } from './consulta';
import { pacientes } from './pacientes';
import { usuarios } from './usuarios';

// Flujo simplificado SaaS: pendiente → programada → atendida (+ cancelada | inasistencia)
export const estatusReferenciaEnum = pgEnum('estatus_referencia', [
  'pendiente',
  'programada',
  'atendida',
  'cancelada',
  'inasistencia',
]);

export const tipoReferenciaEnum = pgEnum('tipo_referencia', [
  'interna',   // Dentro del mismo tenant
  'externa',   // A hospital/clínica externa
]);

export const referenciasEspecialidad = pgTable('referencias_especialidad', {
  idReferencia: bigserial('id_referencia', { mode: 'number' }).primaryKey(),
  tenantId:     uuid('tenant_id').notNull().references(() => organizaciones.id),
  folio:        varchar('folio', { length: 20 }).unique(),
  tipo:         tipoReferenciaEnum('tipo').notNull().default('interna'),

  // Consultas vinculadas
  idConsultaOrigen:      bigint('id_consulta_origen', { mode: 'number' })
                           .notNull()
                           .references(() => consulta.idConsulta, { onDelete: 'restrict' }),
  idConsultaSeguimiento: bigint('id_consulta_seguimiento', { mode: 'number' })
                           .references(() => consulta.idConsulta, { onDelete: 'set null' }),

  // Paciente (snapshot)
  idPaciente:     uuid('id_paciente').notNull().references(() => pacientes.id),
  nombrePaciente: varchar('nombre_paciente', { length: 200 }).notNull(),

  // Médico que refiere
  idMedicoRefiere:     uuid('id_medico_refiere').notNull().references(() => usuarios.id),
  nombreMedicoRefiere: varchar('nombre_medico_refiere', { length: 200 }).notNull(),

  // Especialidad solicitada
  nombreEspecialidad: varchar('nombre_especialidad', { length: 100 }).notNull(),
  motivoReferencia:   text('motivo_referencia').notNull(),

  // Asignación de especialista
  idMedicoAsignado:     uuid('id_medico_asignado').references(() => usuarios.id),
  nombreMedicoAsignado: varchar('nombre_medico_asignado', { length: 200 }),
  fechaCita:            timestamp('fecha_cita', { withTimezone: true }),
  idUsuarioPrograma:    uuid('id_usuario_programa').references(() => usuarios.id),
  fechaProgramacion:    timestamp('fecha_programacion', { withTimezone: true }),

  // Atención
  fechaAtencion: timestamp('fecha_atencion', { withTimezone: true }),

  // Cancelación / Inasistencia
  motivoCancelacion:  text('motivo_cancelacion'),
  motivoInasistencia: text('motivo_inasistencia'),
  idUsuarioCierre:    uuid('id_usuario_cierre').references(() => usuarios.id),

  estatus: estatusReferenciaEnum('estatus').notNull().default('pendiente'),
  activo:  boolean('activo').default(true),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type ReferenciaEspecialidad      = typeof referenciasEspecialidad.$inferSelect;
export type NuevaReferenciaEspecialidad = typeof referenciasEspecialidad.$inferInsert;
export type EstatusReferencia           = typeof estatusReferenciaEnum.enumValues[number];
export type TipoReferencia              = typeof tipoReferenciaEnum.enumValues[number];
