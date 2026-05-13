// src/db/schema/recetas.ts

import { pgTable, bigserial, varchar, bigint, integer, boolean, timestamp, text, check, date, pgEnum, foreignKey } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { consulta } from './consulta';
import { medicamentos } from './farmacia';

// =====================================================
// ENUM: tipo_receta
// =====================================================
export const tipoRecetaEnum = pgEnum('tipo_receta', [
  'original',
  'resurtimiento'
]);

// =====================================================
// ENUM: estatus_resurtimiento
// =====================================================
export const estatusResurtimientoEnum = pgEnum('estatus_resurtimiento', [
  'pendiente',
  'surtido',
  'vencido',
  'cancelado'
]);

// =====================================================
// TABLA: recetas
// =====================================================
export const recetas = pgTable('recetas', {
  id_receta: bigserial('id_receta', { mode: 'number' }).primaryKey(),
  id_consulta: bigint('id_consulta', { mode: 'number' })
    .notNull()
    .references(() => consulta.idConsulta),

  // Tipo de receta y vinculación
  tipo_receta: tipoRecetaEnum('tipo_receta').notNull().default('original'),
  id_receta_original: bigint('id_receta_original', { mode: 'number' }),

  folio_receta: varchar('folio_receta', { length: 30 }).notNull().unique(),
  fecha_emision: timestamp('fecha_emision', { withTimezone: true }).notNull().defaultNow(),
  vigencia_dias: integer('vigencia_dias').notNull().default(30),
  observaciones_generales: text('observaciones_generales'),

  // Campos de cancelación
  cancelado: boolean('cancelado').notNull().default(false),
  motivo_cancelacion: text('motivo_cancelacion'),
  fecha_cancelacion: timestamp('fecha_cancelacion', { withTimezone: true }),
  id_usuario_cancela: bigint('id_usuario_cancela', { mode: 'number' }),

  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  checkVigencia: check('vigencia_dias_check', sql`${table.vigencia_dias} > 0`),
  selfReference: foreignKey({
    columns: [table.id_receta_original],
    foreignColumns: [table.id_receta],
  }),
}));

// =====================================================
// TABLA: detalle_receta
// =====================================================
export const detalleReceta = pgTable('detalle_receta', {
  id_detalle: bigserial('id_detalle', { mode: 'number' }).primaryKey(),
  id_receta: bigint('id_receta', { mode: 'number' })
    .notNull()
    .references(() => recetas.id_receta, { onDelete: 'cascade' }),
  id_medicamento: bigint('id_medicamento', { mode: 'number' })
    .notNull()
    .references(() => medicamentos.id_medicamento),

  // Prescripción
  cantidad_total: integer('cantidad_total').notNull(),
  dosis: text('dosis').notNull(),
  duracion_tratamiento_dias: integer('duracion_tratamiento_dias').notNull(),
  via_administracion: varchar('via_administracion', { length: 50 }).default('Oral'),
  indicaciones: text('indicaciones'),

  // Resurtimiento (para tratamientos prolongados)
  realizar_resurtimiento: boolean('realizar_resurtimiento').notNull().default(false),
  meses_resurtimiento: integer('meses_resurtimiento'),

  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  checkCantidad: check('cantidad_total_check', sql`${table.cantidad_total} > 0`),
  checkDuracion: check('duracion_tratamiento_check', sql`${table.duracion_tratamiento_dias} > 0`),
  checkMesesResurtimiento: check('meses_resurtimiento_check',
    sql`${table.meses_resurtimiento} IS NULL OR ${table.meses_resurtimiento} BETWEEN 1 AND 12`
  ),
}));

// =====================================================
// TABLA: surtimientos_receta
// =====================================================
export const surtimientosReceta = pgTable('surtimientos_receta', {
  id_surtimiento: bigserial('id_surtimiento', { mode: 'number' }).primaryKey(),
  id_detalle: bigint('id_detalle', { mode: 'number' })
    .notNull()
    .references(() => detalleReceta.id_detalle),

  cantidad_surtida: integer('cantidad_surtida').notNull(),
  fecha_surtimiento: timestamp('fecha_surtimiento', { withTimezone: true }).notNull().defaultNow(),
  id_farmaceutico: bigint('id_farmaceutico', { mode: 'number' }), // Usuario que surtió

  observaciones: text('observaciones'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  // Permitir 0 para registrar visitas sin stock (paciente acude pero no hay medicamentos)
  checkCantidadSurtida: check('cantidad_surtida_check', sql`${table.cantidad_surtida} >= 0`),
}));

// =====================================================
// TABLA: control_resurtimientos
// =====================================================
export const controlResurtimientos = pgTable('control_resurtimientos', {
  id_control: bigserial('id_control', { mode: 'number' }).primaryKey(),
  id_detalle: bigint('id_detalle', { mode: 'number' })
    .notNull()
    .references(() => detalleReceta.id_detalle, { onDelete: 'cascade' }),

  // Control del resurtimiento
  numero_resurtimiento: integer('numero_resurtimiento').notNull(),
  fecha_programada: date('fecha_programada').notNull(),
  fecha_limite: date('fecha_limite'),

  // Estado del resurtimiento
  estatus: estatusResurtimientoEnum('estatus').notNull().default('pendiente'),
  fecha_surtido: timestamp('fecha_surtido', { withTimezone: true }),
  id_surtimiento: bigint('id_surtimiento', { mode: 'number' })
    .references(() => surtimientosReceta.id_surtimiento),

  // Receta de resurtimiento generada
  id_receta_resurtimiento: bigint('id_receta_resurtimiento', { mode: 'number' })
    .references(() => recetas.id_receta),
  fecha_receta_generada: timestamp('fecha_receta_generada', { withTimezone: true }),

  // Auditoría
  observaciones: text('observaciones'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  checkNumeroResurtimiento: check('numero_resurtimiento_check', sql`${table.numero_resurtimiento} > 0`),
}));

// Tipos de TypeScript inferidos
export type Receta = typeof recetas.$inferSelect;
export type NuevaReceta = typeof recetas.$inferInsert;

export type DetalleReceta = typeof detalleReceta.$inferSelect;
export type NuevoDetalleReceta = typeof detalleReceta.$inferInsert;

export type SurtimientoReceta = typeof surtimientosReceta.$inferSelect;
export type NuevoSurtimientoReceta = typeof surtimientosReceta.$inferInsert;

export type ControlResurtimiento = typeof controlResurtimientos.$inferSelect;
export type NuevoControlResurtimiento = typeof controlResurtimientos.$inferInsert;
