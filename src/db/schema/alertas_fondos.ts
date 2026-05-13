import { pgTable, bigserial, uuid, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';
import { organizaciones } from './organizaciones';

export const alertasFondosCorreos = pgTable('alertas_fondos_correos', {
  idCorreo:           bigserial('id_correo', { mode: 'number' }).primaryKey(),
  tenantId:           uuid('tenant_id').notNull().references(() => organizaciones.id),
  correo:             varchar('correo', { length: 255 }).notNull(),
  nombreDestinatario: varchar('nombre_destinatario', { length: 100 }).notNull(),
  activo:             boolean('activo').notNull().default(true),
  createdAt:          timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:          timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type AlertaFondoCorreo      = typeof alertasFondosCorreos.$inferSelect;
export type NuevoAlertaFondoCorreo = typeof alertasFondosCorreos.$inferInsert;
