import {
  pgTable, uuid, bigint, varchar, text, timestamp, jsonb, pgEnum,
} from 'drizzle-orm/pg-core';
import { organizaciones } from './organizaciones';
import { pacientes } from './pacientes';
import { usuarios } from './usuarios';
import { consulta } from './consulta';

export const tipoCertificadoEnum = pgEnum('tipo_certificado', [
  'aptitud_laboral',
  'incapacidad',
  'salud_general',
  'defuncion',
  'otro',
]);

export const certificados = pgTable('certificados', {
  id:              uuid('id').primaryKey().defaultRandom(),
  tenantId:        uuid('tenant_id').notNull().references(() => organizaciones.id),
  idConsulta:      bigint('id_consulta', { mode: 'number' }).references(() => consulta.idConsulta),
  idPaciente:      uuid('id_paciente').notNull().references(() => pacientes.id),
  idMedico:        uuid('id_medico').notNull().references(() => usuarios.id),
  tipoCertificado: tipoCertificadoEnum('tipo_certificado').notNull(),
  // Campos dinámicos según el tipo de certificado (estructura flexible)
  camposDinamicos: jsonb('campos_dinamicos').notNull().default({}),
  pdfUrl:          text('pdf_url'),
  folio:           varchar('folio', { length: 30 }).unique(),
  emitidoEn:       timestamp('emitido_en', { withTimezone: true }).notNull().defaultNow(),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Certificado      = typeof certificados.$inferSelect;
export type NuevoCertificado = typeof certificados.$inferInsert;
export type TipoCertificado  = typeof tipoCertificadoEnum.enumValues[number];
