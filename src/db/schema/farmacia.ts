// src/db/schema/farmacia.ts

import { pgTable, serial, varchar, integer, bigserial, bigint, numeric, boolean, timestamp, text, pgEnum, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// =====================================================
// TABLA: unidades_medida
// =====================================================
export const unidadesMedida = pgTable('unidades_medida', {
  id_medida: serial('id_medida').primaryKey(),
  medida: varchar('medida', { length: 50 }).notNull(),
  abreviatura: varchar('abreviatura', { length: 10 }).notNull(),
});

// =====================================================
// ENUM: clasificacion_medicamento
// =====================================================
export const clasificacionMedicamentoEnum = pgEnum('clasificacion_medicamento', [
  'PATENTE',
  'GENERICO',
  'CONTROLADO'
]);

// =====================================================
// TABLA: medicamentos
// =====================================================
export const medicamentos = pgTable('medicamentos', {
  id_medicamento: bigserial('id_medicamento', { mode: 'number' }).primaryKey(),
  nombre_comercial: varchar('nombre_comercial', { length: 150 }).notNull(),
  sustancia_activa: varchar('sustancia_activa', { length: 150 }).notNull(),
  clasificacion: clasificacionMedicamentoEnum('clasificacion').notNull(),
  id_medida: integer('id_medida').notNull().references(() => unidadesMedida.id_medida),
  codigo_ean: varchar('codigo_ean', { length: 20 }),
  precio_unitario: numeric('precio_unitario', { precision: 12, scale: 2 }).notNull(),
  activo: boolean('activo').notNull().default(true),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  checkPrecio: check('precio_unitario_check', sql`${table.precio_unitario} >= 0`),
}));

// =====================================================
// TABLA: inventario_medicamentos
// =====================================================
export const inventarioMedicamentos = pgTable('inventario_medicamentos', {
  id_inventario: bigserial('id_inventario', { mode: 'number' }).primaryKey(),
  id_medicamento: bigint('id_medicamento', { mode: 'number' }).notNull().references(() => medicamentos.id_medicamento),
  existencia_actual: integer('existencia_actual').notNull().default(0),
  fondo_fijo: integer('fondo_fijo').notNull(),
  es_cuadro_basico: boolean('es_cuadro_basico').notNull().default(false),
  observaciones: text('observaciones'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  checkExistencia: check('inventario_medicamentos_existencia_actual_check', sql`${table.existencia_actual} >= 0`),
  checkFondoFijo: check('inventario_medicamentos_fondo_fijo_check', sql`${table.fondo_fijo} > 0`),
}));

// Tipos de TypeScript inferidos
export type UnidadMedida = typeof unidadesMedida.$inferSelect;
export type NuevaUnidadMedida = typeof unidadesMedida.$inferInsert;

export type Medicamento = typeof medicamentos.$inferSelect;
export type NuevoMedicamento = typeof medicamentos.$inferInsert;

export type InventarioMedicamento = typeof inventarioMedicamentos.$inferSelect;
export type NuevoInventarioMedicamento = typeof inventarioMedicamentos.$inferInsert;
