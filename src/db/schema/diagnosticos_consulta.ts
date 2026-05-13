// src/db/schema/diagnosticos_consulta.ts
import { pgTable, bigserial, bigint, varchar, text, boolean, smallint, timestamp } from 'drizzle-orm/pg-core';
import { consulta } from './consulta';

export const diagnosticosConsulta = pgTable('diagnosticos_consulta', {
  // ID primario
  idDiagnostico: bigserial('id_diagnostico', { mode: 'number' }).primaryKey(),

  // Relación con consulta
  idConsulta: bigint('id_consulta', { mode: 'number' })
    .notNull()
    .references(() => consulta.idConsulta, { onDelete: 'cascade' }),

  // Datos del diagnóstico CIE-11
  cie11Codigo: varchar('cie11_codigo', { length: 15 }).notNull(),
  cie11Titulo: text('cie11_titulo').notNull(),
  cie11Capitulo: varchar('cie11_capitulo', { length: 15 }),

  // Control de orden y principal
  esPrincipal: boolean('es_principal').notNull().default(false),
  orden: smallint('orden').notNull().default(1),

  // Auditoría
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
});
