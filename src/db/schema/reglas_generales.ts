// src/db/schema/reglas_generales.ts

import { pgTable, serial, integer, text, timestamp, boolean } from 'drizzle-orm/pg-core';

/**
 * Tabla de reglas generales del sistema
 *
 * Contiene configuraciones globales que afectan el comportamiento
 * de diferentes módulos del sistema médico.
 */
export const reglasGenerales = pgTable('reglas_generales', {
  id_regla: serial('id_regla').primaryKey(),

  // Reglas de vigencia de recetas
  vigencia_primer_surtimiento_dias: integer('vigencia_primer_surtimiento_dias')
    .notNull()
    .default(3),

  vigencia_receta_dias: integer('vigencia_receta_dias')
    .notNull()
    .default(30),

  // Reglas de resurtimiento
  ventana_tolerancia_resurtimiento_dias: integer('ventana_tolerancia_resurtimiento_dias')
    .notNull()
    .default(2),

  // Reglas de stock
  stock_minimo_alerta: integer('stock_minimo_alerta')
    .notNull()
    .default(10),

  stock_critico_alerta: integer('stock_critico_alerta')
    .notNull()
    .default(5),

  // Descripción de la configuración
  descripcion: text('descripcion'),

  // Control de activación
  activo: boolean('activo')
    .notNull()
    .default(true),

  // Auditoría
  fecha_creacion: timestamp('fecha_creacion', { withTimezone: true })
    .notNull()
    .defaultNow(),

  fecha_actualizacion: timestamp('fecha_actualizacion', { withTimezone: true })
    .notNull()
    .defaultNow(),

  actualizado_por: text('actualizado_por'),
});

// Tipos TypeScript inferidos
export type ReglaGeneral = typeof reglasGenerales.$inferSelect;
export type NuevaReglaGeneral = typeof reglasGenerales.$inferInsert;
