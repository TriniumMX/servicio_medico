import { pgTable, bigserial, uuid, text, varchar, timestamp, boolean } from 'drizzle-orm/pg-core';
import { organizaciones } from './organizaciones';
import { usuarios } from './usuarios';

export const firmasDigitales = pgTable('firmas_digitales', {
  idFirma:     bigserial('id_firma', { mode: 'number' }).primaryKey(),
  tenantId:    uuid('tenant_id').notNull().references(() => organizaciones.id),
  idUsuario:   uuid('id_usuario').notNull().unique().references(() => usuarios.id),
  firmaBase64: text('firma_base64').notNull(),
  hashFirma:   varchar('hash_firma', { length: 64 }).notNull().unique(),
  activo:      boolean('activo').default(true),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type FirmaDigital      = typeof firmasDigitales.$inferSelect;
export type NuevaFirmaDigital = typeof firmasDigitales.$inferInsert;
