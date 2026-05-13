import { pgTable, bigserial, bigint, uuid, varchar, text, boolean, smallint, timestamp } from 'drizzle-orm/pg-core';
import { organizaciones } from './organizaciones';
import { consulta } from './consulta';

export const diagnosticosConsulta = pgTable('diagnosticos_consulta', {
  idDiagnostico: bigserial('id_diagnostico', { mode: 'number' }).primaryKey(),
  tenantId:      uuid('tenant_id').notNull().references(() => organizaciones.id),
  idConsulta:    bigint('id_consulta', { mode: 'number' })
                   .notNull()
                   .references(() => consulta.idConsulta, { onDelete: 'cascade' }),
  cie11Codigo:   varchar('cie11_codigo', { length: 15 }).notNull(),
  cie11Titulo:   text('cie11_titulo').notNull(),
  cie11Capitulo: varchar('cie11_capitulo', { length: 15 }),
  esPrincipal:   boolean('es_principal').notNull().default(false),
  orden:         smallint('orden').notNull().default(1),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type DiagnosticoConsulta      = typeof diagnosticosConsulta.$inferSelect;
export type NuevoDiagnosticoConsulta = typeof diagnosticosConsulta.$inferInsert;
