import { pgTable, bigserial, uuid, integer, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { organizaciones } from './organizaciones';

export const reglasGenerales = pgTable('reglas_generales', {
  idRegla:   bigserial('id_regla', { mode: 'number' }).primaryKey(),
  tenantId:  uuid('tenant_id').notNull().unique().references(() => organizaciones.id),

  vigenciaPrimerSurtimientoDias:     integer('vigencia_primer_surtimiento_dias').notNull().default(3),
  vigenciaRecetaDias:                integer('vigencia_receta_dias').notNull().default(30),
  ventanaToleranciaResurtimientoDias: integer('ventana_tolerancia_resurtimiento_dias').notNull().default(2),
  stockMinimoAlerta:                 integer('stock_minimo_alerta').notNull().default(10),
  stockCriticoAlerta:                integer('stock_critico_alerta').notNull().default(5),

  descripcion: text('descripcion'),
  activo:      boolean('activo').notNull().default(true),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type ReglaGeneral      = typeof reglasGenerales.$inferSelect;
export type NuevaReglaGeneral = typeof reglasGenerales.$inferInsert;
