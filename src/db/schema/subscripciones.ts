import {
  pgTable, pgEnum, uuid, varchar, text, boolean, smallint,
  numeric, timestamp, primaryKey, unique,
} from 'drizzle-orm/pg-core';
import { organizaciones } from './organizaciones';

// ─── ENUMs ────────────────────────────────────────────────────────────────────

export const estatusSubscripcionEnum = pgEnum('estatus_subscripcion', [
  'trial',
  'activa',
  'vencida',
  'suspendida',
  'cancelada',
]);

export const cicloFacturacionEnum = pgEnum('ciclo_facturacion', [
  'mensual',
  'anual',
]);

export const estatusPagoEnum = pgEnum('estatus_pago', [
  'pendiente',
  'pagado',
  'fallido',
  'reembolsado',
]);

// ─── Catálogo de módulos ───────────────────────────────────────────────────────

export const modulos = pgTable('modulos', {
  id:            uuid('id').primaryKey().defaultRandom(),
  clave:         varchar('clave', { length: 50 }).notNull().unique(),
  nombre:        varchar('nombre', { length: 100 }).notNull(),
  descripcion:   text('descripcion'),
  precioMensual: numeric('precio_mensual', { precision: 10, scale: 2 }).notNull().default('0'),
  precioAnual:   numeric('precio_anual',   { precision: 10, scale: 2 }).notNull().default('0'),
  icono:         varchar('icono', { length: 50 }),
  activo:        boolean('activo').notNull().default(true),
  orden:         smallint('orden').notNull().default(0),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Planes ───────────────────────────────────────────────────────────────────

export const planes = pgTable('planes', {
  id:               uuid('id').primaryKey().defaultRandom(),
  clave:            varchar('clave', { length: 50 }).notNull().unique(),
  nombre:           varchar('nombre', { length: 100 }).notNull(),
  descripcion:      text('descripcion'),
  precioMensual:    numeric('precio_mensual', { precision: 10, scale: 2 }).notNull().default('0'),
  precioAnual:      numeric('precio_anual',   { precision: 10, scale: 2 }).notNull().default('0'),
  maxUsuarios:      smallint('max_usuarios'),
  maxPacientes:     smallint('max_pacientes'),
  esPersonalizado:  boolean('es_personalizado').notNull().default(false),
  activo:           boolean('activo').notNull().default(true),
  orden:            smallint('orden').notNull().default(0),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Módulos incluidos en cada plan ───────────────────────────────────────────

export const planesModulos = pgTable('planes_modulos', {
  planId:   uuid('plan_id').notNull().references(() => planes.id, { onDelete: 'cascade' }),
  moduloId: uuid('modulo_id').notNull().references(() => modulos.id, { onDelete: 'cascade' }),
}, (t) => [primaryKey({ columns: [t.planId, t.moduloId] })]);

// ─── Suscripción por organización ────────────────────────────────────────────

export const subscripciones = pgTable('subscripciones', {
  id:       uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().unique().references(() => organizaciones.id, { onDelete: 'cascade' }),
  planId:   uuid('plan_id').notNull().references(() => planes.id),

  estatus: estatusSubscripcionEnum('estatus').notNull().default('trial'),
  ciclo:   cicloFacturacionEnum('ciclo').notNull().default('mensual'),

  trialIniciaAt:  timestamp('trial_inicia_at',  { withTimezone: true }),
  trialTerminaAt: timestamp('trial_termina_at', { withTimezone: true }),

  periodoInicio: timestamp('periodo_inicio', { withTimezone: true }),
  periodoFin:    timestamp('periodo_fin',    { withTimezone: true }),

  precioAcordado:     numeric('precio_acordado', { precision: 10, scale: 2 }),
  canceladaAt:        timestamp('cancelada_at', { withTimezone: true }),
  motivoCancelacion:  text('motivo_cancelacion'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Personalizaciones de módulos por suscripción ────────────────────────────

export const subscripcionesModulos = pgTable('subscripciones_modulos', {
  id:             uuid('id').primaryKey().defaultRandom(),
  subscripcionId: uuid('subscripcion_id').notNull().references(() => subscripciones.id, { onDelete: 'cascade' }),
  moduloId:       uuid('modulo_id').notNull().references(() => modulos.id, { onDelete: 'cascade' }),
  habilitado:     boolean('habilitado').notNull().default(true),
  precioAdicional: numeric('precio_adicional', { precision: 10, scale: 2 }).notNull().default('0'),
}, (t) => [unique().on(t.subscripcionId, t.moduloId)]);

// ─── Pagos ────────────────────────────────────────────────────────────────────

export const pagos = pgTable('pagos', {
  id:             uuid('id').primaryKey().defaultRandom(),
  subscripcionId: uuid('subscripcion_id').notNull().references(() => subscripciones.id),
  tenantId:       uuid('tenant_id').notNull().references(() => organizaciones.id),

  monto:   numeric('monto',  { precision: 10, scale: 2 }).notNull(),
  moneda:  varchar('moneda', { length: 3 }).notNull().default('MXN'),
  concepto: text('concepto').notNull(),

  cicloInicio: timestamp('ciclo_inicio', { withTimezone: true }),
  cicloFin:    timestamp('ciclo_fin',    { withTimezone: true }),

  metodoPago:        varchar('metodo_pago',        { length: 50 }),
  referenciaExterna: varchar('referencia_externa', { length: 200 }),

  estatus:  estatusPagoEnum('estatus').notNull().default('pendiente'),
  pagadoAt: timestamp('pagado_at', { withTimezone: true }),
  notas:    text('notas'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type Modulo              = typeof modulos.$inferSelect;
export type Plan                = typeof planes.$inferSelect;
export type Subscripcion        = typeof subscripciones.$inferSelect;
export type SubscripcionModulo  = typeof subscripcionesModulos.$inferSelect;
export type Pago                = typeof pagos.$inferSelect;
export type NuevoPago           = typeof pagos.$inferInsert;
export type NuevaSubscripcion   = typeof subscripciones.$inferInsert;

export type EstatusSubscripcion = typeof estatusSubscripcionEnum.enumValues[number];
export type CicloFacturacion    = typeof cicloFacturacionEnum.enumValues[number];
export type EstatusPago         = typeof estatusPagoEnum.enumValues[number];
