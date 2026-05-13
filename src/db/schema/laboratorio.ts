import {
  pgTable, serial, bigserial, bigint, uuid, varchar, text,
  boolean, timestamp, pgEnum,
} from 'drizzle-orm/pg-core';
import { organizaciones } from './organizaciones';
import { pacientes } from './pacientes';
import { usuarios } from './usuarios';
import { consulta } from './consulta';

// ─── Catálogo global de estudios ─────────────────────────────────────────────

export const laboratorioEstudios = pgTable('laboratorio_estudios', {
  id:          serial('id').primaryKey(),
  nombre:      varchar('nombre', { length: 200 }).notNull(),
  codigo:      varchar('codigo', { length: 50 }),
  descripcion: text('descripcion'),
  activo:      boolean('activo').notNull().default(true),
});

// ─── Órdenes de laboratorio (por tenant) ─────────────────────────────────────

export const estatusLaboratorioEnum = pgEnum('estatus_laboratorio', [
  'pendiente',
  'en_proceso',
  'entregado',
  'cancelado',
]);

export const laboratorioOrdenes = pgTable('laboratorio_ordenes', {
  idOrden:      bigserial('id_orden', { mode: 'number' }).primaryKey(),
  tenantId:     uuid('tenant_id').notNull().references(() => organizaciones.id),
  folio:        varchar('folio', { length: 30 }).notNull().unique(),
  idConsulta:   bigint('id_consulta', { mode: 'number' }).notNull().references(() => consulta.idConsulta),
  idPaciente:   uuid('id_paciente').notNull().references(() => pacientes.id),
  idMedico:     uuid('id_medico').notNull().references(() => usuarios.id),
  estatus:      estatusLaboratorioEnum('estatus').notNull().default('pendiente'),
  observaciones: text('observaciones'),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Detalle de estudios por orden ───────────────────────────────────────────

export const laboratorioOrdenEstudios = pgTable('laboratorio_orden_estudios', {
  idOrdenEstudio:  bigserial('id_orden_estudio', { mode: 'number' }).primaryKey(),
  idOrden:         bigint('id_orden', { mode: 'number' }).notNull().references(() => laboratorioOrdenes.idOrden, { onDelete: 'cascade' }),
  idEstudio:       bigint('id_estudio', { mode: 'number' }).notNull().references(() => laboratorioEstudios.id),
  resultado:       text('resultado'),
  unidad:          varchar('unidad', { length: 50 }),
  valorReferencia: varchar('valor_referencia', { length: 100 }),
  resultadoUrl:    text('resultado_url'),
  entregadoEn:     timestamp('entregado_en', { withTimezone: true }),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type LaboratorioEstudio         = typeof laboratorioEstudios.$inferSelect;
export type LaboratorioOrden           = typeof laboratorioOrdenes.$inferSelect;
export type NuevaLaboratorioOrden      = typeof laboratorioOrdenes.$inferInsert;
export type LaboratorioOrdenEstudio    = typeof laboratorioOrdenEstudios.$inferSelect;
export type NuevaLaboratorioOrdenEstudio = typeof laboratorioOrdenEstudios.$inferInsert;
export type EstatusLaboratorio         = typeof estatusLaboratorioEnum.enumValues[number];
