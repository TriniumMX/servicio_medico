// src/db/schema/estatus_consulta.ts
import { pgTable, smallint, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';

export const estatusConsulta = pgTable('estatus_consulta', {
  idEstatusConsulta: smallint('id_estatus_consulta').primaryKey(),
  descripcion: varchar('descripcion', { length: 50 }).notNull().unique(),
  descripcionCorta: varchar('descripcion_corta', { length: 20 }).notNull(),
  orden: smallint('orden').notNull(),
  activo: boolean('activo').notNull().default(true),

  // Auditoría
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true }).defaultNow(),
});

// Constantes para los valores de estatus
export const ESTATUS_CONSULTA = {
  CANCELADA: 0,
  EN_ESPERA: 1,
  FINALIZADA: 2,
} as const;

export type EstatusConsultaValue = typeof ESTATUS_CONSULTA[keyof typeof ESTATUS_CONSULTA];
