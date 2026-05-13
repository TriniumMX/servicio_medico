// src/db/schema/parentesco.ts
import { pgTable, bigserial, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';

export const parentesco = pgTable('parentesco', {
  idParentesco: bigserial('id_parentesco', { mode: 'number' }).primaryKey(),
  parentesco: varchar('parentesco', { length: 100 }).notNull(),
  estatus: boolean('estatus').notNull().default(true),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true }).defaultNow(),
});
