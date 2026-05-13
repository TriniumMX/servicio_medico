import { pgTable, uuid, varchar, char, date, boolean, timestamp, text } from 'drizzle-orm/pg-core';
import { organizaciones } from './organizaciones';

export const pacientes = pgTable('pacientes', {
  id:              uuid('id').primaryKey().defaultRandom(),
  tenantId:        uuid('tenant_id').notNull().references(() => organizaciones.id, { onDelete: 'cascade' }),

  // Identificación
  clavePaciente:   varchar('clave_paciente', { length: 50 }).unique(), // Número de expediente propio
  nombre:          varchar('nombre', { length: 200 }).notNull(),
  apellidoPaterno: varchar('apellido_paterno', { length: 100 }),
  apellidoMaterno: varchar('apellido_materno', { length: 100 }),
  curp:            varchar('curp', { length: 18 }),
  fechaNacimiento: date('fecha_nacimiento'),
  sexo:            char('sexo', { length: 1 }),

  // Contacto
  telefono:        varchar('telefono', { length: 15 }),
  email:           varchar('email', { length: 200 }),

  // Datos médicos (críticos para la atención segura)
  tipoSangre:           varchar('tipo_sangre', { length: 5 }),    // O+, A-, etc.
  alergias:             text('alergias'),                          // Alergias conocidas — evita recetas peligrosas
  observacionesMedicas: text('observaciones_medicas'),            // Antecedentes patológicos relevantes
  fotoUrl:              text('foto_url'),

  activo:          boolean('activo').notNull().default(true),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Paciente      = typeof pacientes.$inferSelect;
export type NuevoPaciente = typeof pacientes.$inferInsert;
