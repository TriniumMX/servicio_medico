import { pgTable, uuid, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const organizaciones = pgTable('organizaciones', {
  id:              uuid('id').primaryKey().defaultRandom(),

  // Identidad pública
  nombre:          varchar('nombre', { length: 200 }).notNull(),
  slug:            varchar('slug', { length: 100 }).notNull().unique(), // Para subdominios/URLs
  razonSocial:     varchar('razon_social', { length: 200 }),
  rfc:             varchar('rfc', { length: 13 }),
  slogan:          varchar('slogan', { length: 300 }),

  // Contacto
  direccion:       text('direccion'),
  telefono:        varchar('telefono', { length: 20 }),
  correoContacto:  varchar('correo_contacto', { length: 150 }),

  // Branding (inyectado como CSS vars en el dashboard)
  logoUrl:         text('logo_url'),
  colorPrimario:   varchar('color_primario', { length: 7 }).default('#0EA5E9'),
  colorSecundario: varchar('color_secundario', { length: 7 }).default('#7C3AED'),

  // Plan comercial y estado
  plan:            varchar('plan', { length: 50 }).notNull().default('basic'), // basic | pro | enterprise
  activo:          boolean('activo').notNull().default(true),

  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Organizacion    = typeof organizaciones.$inferSelect;
export type NuevaOrganizacion = typeof organizaciones.$inferInsert;
