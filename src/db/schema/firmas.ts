// src/db/schema/firmas.ts
import { pgTable, bigserial, bigint, text, varchar, timestamp, boolean } from 'drizzle-orm/pg-core';

// =============================================
// Tabla: firmas_digitales
// Almacena las firmas digitales de coordinadores para reutilización
// =============================================
export const firmasDigitales = pgTable('firmas_digitales', {
  // ID principal
  idFirma: bigserial('id_firma', { mode: 'number' }).primaryKey(),

  // Usuario (coordinador) propietario de la firma
  idUsuario: bigint('id_usuario', { mode: 'number' }).notNull().unique(),

  // Firma en base64 (imagen PNG)
  firmaBase64: text('firma_base64').notNull(),

  // Hash SHA-256 de la firma para identificación única
  hashFirma: varchar('hash_firma', { length: 64 }).notNull().unique(),

  // Control
  activo: boolean('activo').default(true),

  // Auditoría
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true }).defaultNow(),
});

// =============================================
// Tipos TypeScript exportados
// =============================================

// Tipo completo de la tabla
export type FirmaDigital = typeof firmasDigitales.$inferSelect;

// Tipo para insertar (sin campos auto-generados)
export type NuevaFirmaDigital = typeof firmasDigitales.$inferInsert;
