import { pgTable, uuid, varchar, text, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { organizaciones } from './organizaciones';

export const roleUsuarioEnum = pgEnum('role_usuario', [
  'super_admin',
  'admin_org',
  'medico',
  'enfermera',
  'farmaceutico',
  'especialista',
]);

export const usuarios = pgTable('usuarios', {
  id:                uuid('id').primaryKey().defaultRandom(),
  tenantId:          uuid('tenant_id').notNull().references(() => organizaciones.id, { onDelete: 'cascade' }),
  email:             varchar('email', { length: 255 }).notNull(),
  passwordHash:      text('password_hash').notNull(),
  nombre:            varchar('nombre', { length: 100 }).notNull(),
  apellidoPaterno:   varchar('apellido_paterno', { length: 100 }),
  apellidoMaterno:   varchar('apellido_materno', { length: 100 }),
  role:              roleUsuarioEnum('role').notNull(),
  cedulaProfesional: varchar('cedula_profesional', { length: 20 }),
  especialidad:      varchar('especialidad', { length: 100 }),
  activo:            boolean('activo').notNull().default(true),
  createdAt:         timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:         timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Usuario      = typeof usuarios.$inferSelect;
export type NuevoUsuario = typeof usuarios.$inferInsert;
export type RoleUsuario  = typeof roleUsuarioEnum.enumValues[number];
