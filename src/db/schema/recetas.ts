import {
  pgTable, bigserial, bigint, uuid, varchar, integer,
  boolean, timestamp, text, check, date, pgEnum, foreignKey,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizaciones } from './organizaciones';
import { consulta } from './consulta';
import { medicamentos } from './farmacia';
import { usuarios } from './usuarios';

export const tipoRecetaEnum = pgEnum('tipo_receta', [
  'original',
  'resurtimiento',
]);

export const estatusResurtimientoEnum = pgEnum('estatus_resurtimiento', [
  'pendiente',
  'surtido',
  'vencido',
  'cancelado',
]);

// ─── Recetas ──────────────────────────────────────────────────────────────────

export const recetas = pgTable('recetas', {
  idReceta:              bigserial('id_receta', { mode: 'number' }).primaryKey(),
  tenantId:              uuid('tenant_id').notNull().references(() => organizaciones.id),
  idConsulta:            bigint('id_consulta', { mode: 'number' }).notNull().references(() => consulta.idConsulta),
  tipoReceta:            tipoRecetaEnum('tipo_receta').notNull().default('original'),
  idRecetaOriginal:      bigint('id_receta_original', { mode: 'number' }),
  folioReceta:           varchar('folio_receta', { length: 30 }).notNull().unique(),
  fechaEmision:          timestamp('fecha_emision', { withTimezone: true }).notNull().defaultNow(),
  vigenciaDias:          integer('vigencia_dias').notNull().default(30),
  observacionesGenerales: text('observaciones_generales'),
  cancelado:             boolean('cancelado').notNull().default(false),
  motivoCancelacion:     text('motivo_cancelacion'),
  fechaCancelacion:      timestamp('fecha_cancelacion', { withTimezone: true }),
  idUsuarioCancela:      uuid('id_usuario_cancela').references(() => usuarios.id),
  createdAt:             timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:             timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  checkVigencia:  check('vigencia_dias_check', sql`${table.vigenciaDias} > 0`),
  selfReference:  foreignKey({ columns: [table.idRecetaOriginal], foreignColumns: [table.idReceta] }),
}));

// ─── Detalle receta ───────────────────────────────────────────────────────────

export const detalleReceta = pgTable('detalle_receta', {
  idDetalle:              bigserial('id_detalle', { mode: 'number' }).primaryKey(),
  idReceta:               bigint('id_receta', { mode: 'number' }).notNull().references(() => recetas.idReceta, { onDelete: 'cascade' }),
  idMedicamento:          bigint('id_medicamento', { mode: 'number' }).notNull().references(() => medicamentos.idMedicamento),
  cantidadTotal:          integer('cantidad_total').notNull(),
  dosis:                  text('dosis').notNull(),
  duracionTratamientoDias: integer('duracion_tratamiento_dias').notNull(),
  viaAdministracion:      varchar('via_administracion', { length: 50 }).default('Oral'),
  indicaciones:           text('indicaciones'),
  realizarResurtimiento:  boolean('realizar_resurtimiento').notNull().default(false),
  mesesResurtimiento:     integer('meses_resurtimiento'),
  createdAt:              timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  checkCantidad:          check('cantidad_total_check', sql`${table.cantidadTotal} > 0`),
  checkDuracion:          check('duracion_tratamiento_check', sql`${table.duracionTratamientoDias} > 0`),
  checkMesesResurtimiento: check('meses_resurtimiento_check', sql`${table.mesesResurtimiento} IS NULL OR ${table.mesesResurtimiento} BETWEEN 1 AND 12`),
}));

// ─── Surtimientos ─────────────────────────────────────────────────────────────

export const surtimientosReceta = pgTable('surtimientos_receta', {
  idSurtimiento:   bigserial('id_surtimiento', { mode: 'number' }).primaryKey(),
  idDetalle:       bigint('id_detalle', { mode: 'number' }).notNull().references(() => detalleReceta.idDetalle),
  cantidadSurtida: integer('cantidad_surtida').notNull(),
  fechaSurtimiento: timestamp('fecha_surtimiento', { withTimezone: true }).notNull().defaultNow(),
  idFarmaceutico:  uuid('id_farmaceutico').references(() => usuarios.id),
  observaciones:   text('observaciones'),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  checkCantidadSurtida: check('cantidad_surtida_check', sql`${table.cantidadSurtida} >= 0`),
}));

// ─── Control de resurtimientos ────────────────────────────────────────────────

export const controlResurtimientos = pgTable('control_resurtimientos', {
  idControl:            bigserial('id_control', { mode: 'number' }).primaryKey(),
  idDetalle:            bigint('id_detalle', { mode: 'number' }).notNull().references(() => detalleReceta.idDetalle, { onDelete: 'cascade' }),
  numeroResurtimiento:  integer('numero_resurtimiento').notNull(),
  fechaProgramada:      date('fecha_programada').notNull(),
  fechaLimite:          date('fecha_limite'),
  estatus:              estatusResurtimientoEnum('estatus').notNull().default('pendiente'),
  fechaSurtido:         timestamp('fecha_surtido', { withTimezone: true }),
  idSurtimiento:        bigint('id_surtimiento', { mode: 'number' }).references(() => surtimientosReceta.idSurtimiento),
  idRecetaResurtimiento: bigint('id_receta_resurtimiento', { mode: 'number' }).references(() => recetas.idReceta),
  fechaRecetaGenerada:  timestamp('fecha_receta_generada', { withTimezone: true }),
  observaciones:        text('observaciones'),
  createdAt:            timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  checkNumeroResurtimiento: check('numero_resurtimiento_check', sql`${table.numeroResurtimiento} > 0`),
}));

export type Receta                  = typeof recetas.$inferSelect;
export type NuevaReceta             = typeof recetas.$inferInsert;
export type DetalleReceta           = typeof detalleReceta.$inferSelect;
export type NuevoDetalleReceta      = typeof detalleReceta.$inferInsert;
export type SurtimientoReceta       = typeof surtimientosReceta.$inferSelect;
export type NuevoSurtimientoReceta  = typeof surtimientosReceta.$inferInsert;
export type ControlResurtimiento    = typeof controlResurtimientos.$inferSelect;
export type NuevoControlResurtimiento = typeof controlResurtimientos.$inferInsert;
export type EstatusResurtimiento    = typeof estatusResurtimientoEnum.enumValues[number];
