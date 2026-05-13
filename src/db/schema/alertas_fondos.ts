// src/db/schema/alertas_fondos.ts

import { pgTable, serial, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';

// =====================================================
// TABLA: alertas_fondos_correos
// Almacena los correos electrónicos de destinatarios
// que recibirán alertas de fondos fijos bajos
// =====================================================
export const alertasFondosCorreos = pgTable('alertas_fondos_correos', {
  id_correo: serial('id_correo').primaryKey(),
  correo: varchar('correo', { length: 255 }).notNull().unique(),
  nombre_destinatario: varchar('nombre_destinatario', { length: 100 }).notNull(),
  activo: boolean('activo').notNull().default(true),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Tipos de TypeScript inferidos
export type AlertaFondoCorreo = typeof alertasFondosCorreos.$inferSelect;
export type NuevoAlertaFondoCorreo = typeof alertasFondosCorreos.$inferInsert;
