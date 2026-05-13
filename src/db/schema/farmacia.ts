import {
  pgTable, serial, varchar, integer, bigserial, bigint, uuid,
  numeric, boolean, timestamp, text, pgEnum, check, uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizaciones } from './organizaciones';

// ─── Catálogos globales (sin tenant_id) ───────────────────────────────────────

export const unidadesMedida = pgTable('unidades_medida', {
  idMedida:    serial('id_medida').primaryKey(),
  medida:      varchar('medida', { length: 50 }).notNull(),
  abreviatura: varchar('abreviatura', { length: 10 }).notNull(),
});

export const clasificacionMedicamentoEnum = pgEnum('clasificacion_medicamento', [
  'PATENTE',
  'GENERICO',
  'CONTROLADO',
]);

export const medicamentos = pgTable('medicamentos', {
  idMedicamento:   bigserial('id_medicamento', { mode: 'number' }).primaryKey(),
  nombreComercial: varchar('nombre_comercial', { length: 150 }).notNull(),
  sustanciaActiva: varchar('sustancia_activa', { length: 150 }).notNull(),
  clasificacion:   clasificacionMedicamentoEnum('clasificacion').notNull(),
  idMedida:        integer('id_medida').notNull().references(() => unidadesMedida.idMedida),
  codigoEan:       varchar('codigo_ean', { length: 20 }),
  precioUnitario:  numeric('precio_unitario', { precision: 12, scale: 2 }).notNull(),
  activo:          boolean('activo').notNull().default(true),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  checkPrecio: check('precio_unitario_check', sql`${table.precioUnitario} >= 0`),
}));

// ─── Inventario por tenant ─────────────────────────────────────────────────────

export const inventarioMedicamentos = pgTable('inventario_medicamentos', {
  idInventario:    bigserial('id_inventario', { mode: 'number' }).primaryKey(),
  tenantId:        uuid('tenant_id').notNull().references(() => organizaciones.id),
  idMedicamento:   bigint('id_medicamento', { mode: 'number' }).notNull().references(() => medicamentos.idMedicamento),
  existenciaActual: integer('existencia_actual').notNull().default(0),
  fondoFijo:       integer('fondo_fijo').notNull(),
  esCuadroBasico:  boolean('es_cuadro_basico').notNull().default(false),
  observaciones:   text('observaciones'),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  checkExistencia:  check('inventario_medicamentos_existencia_actual_check', sql`${table.existenciaActual} >= 0`),
  checkFondoFijo:   check('inventario_medicamentos_fondo_fijo_check', sql`${table.fondoFijo} > 0`),
  uniqueTenantMed:  uniqueIndex('inventario_medicamentos_tenant_id_id_medicamento_key').on(table.tenantId, table.idMedicamento),
}));

export type UnidadMedida            = typeof unidadesMedida.$inferSelect;
export type NuevaUnidadMedida       = typeof unidadesMedida.$inferInsert;

export type Medicamento             = typeof medicamentos.$inferSelect;
export type NuevoMedicamento        = typeof medicamentos.$inferInsert;

export type InventarioMedicamento   = typeof inventarioMedicamentos.$inferSelect;
export type NuevoInventarioMedicamento = typeof inventarioMedicamentos.$inferInsert;
