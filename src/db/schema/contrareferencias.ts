import {
  pgTable, bigserial, bigint, uuid, varchar, text,
  timestamp, boolean, smallint, pgEnum, foreignKey,
} from 'drizzle-orm/pg-core';
import { organizaciones } from './organizaciones';
import { referenciasEspecialidad } from './referencias';
import { consulta } from './consulta';
import { pacientes } from './pacientes';
import { usuarios } from './usuarios';

export const estatusContraReferenciaEnum = pgEnum('estatus_contrareferencia', [
  'pendiente',
  'vista',
  'cerrada',
]);

export const contrareferencias = pgTable('contrareferencias', {
  idContrareferencia: bigserial('id_contrareferencia', { mode: 'number' }).primaryKey(),
  tenantId:           uuid('tenant_id').notNull().references(() => organizaciones.id),
  folio:              varchar('folio', { length: 20 }).notNull().unique(),

  // Origen
  idReferenciaOrigen:     bigint('id_referencia_origen', { mode: 'number' })
                            .notNull()
                            .references(() => referenciasEspecialidad.idReferencia, { onDelete: 'restrict' }),
  idConsultaEspecialista: bigint('id_consulta_especialista', { mode: 'number' })
                            .notNull()
                            .references(() => consulta.idConsulta, { onDelete: 'restrict' }),

  // Paciente (snapshot)
  idPaciente:     uuid('id_paciente').notNull().references(() => pacientes.id),
  nombrePaciente: varchar('nombre_paciente', { length: 200 }).notNull(),

  // Especialista que contrarrefiere
  idMedicoContrarrefiere:      uuid('id_medico_contrarrefiere').notNull().references(() => usuarios.id),
  nombreMedicoContrarrefiere:  varchar('nombre_medico_contrarrefiere', { length: 200 }).notNull(),
  nombreEspecialidadRemitente: varchar('nombre_especialidad_remitente', { length: 100 }).notNull(),

  // Médico destino
  idMedicoDestino:     uuid('id_medico_destino').notNull().references(() => usuarios.id),
  nombreMedicoDestino: varchar('nombre_medico_destino', { length: 200 }).notNull(),

  // Nota SOAP del especialista
  subjetivo: text('subjetivo'),
  objetivo:  text('objetivo'),
  analisis:  text('analisis'),
  planTexto: text('plan_texto'),

  // CIE-11
  cie11Codigo: varchar('cie11_codigo', { length: 15 }),
  cie11Titulo: text('cie11_titulo'),

  observacionesEspecialista: text('observaciones_especialista'),

  // Control cascada
  esParteCascada:          boolean('es_parte_cascada').default(false),
  idContrareferenciaPadre: bigint('id_contrareferencia_padre', { mode: 'number' }),
  nivelCascada:            smallint('nivel_cascada').default(1),

  estatus:    estatusContraReferenciaEnum('estatus').notNull().default('pendiente'),
  fechaVista: timestamp('fecha_vista', { withTimezone: true }),
  activo:     boolean('activo').default(true),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  selfRef: foreignKey({ columns: [table.idContrareferenciaPadre], foreignColumns: [table.idContrareferencia] }),
}));

export type Contrareferencia        = typeof contrareferencias.$inferSelect;
export type NuevaContrareferencia   = typeof contrareferencias.$inferInsert;
export type EstatusContrareferencia = typeof estatusContraReferenciaEnum.enumValues[number];
