import { pgTable, bigserial, bigint, uuid, integer, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { organizaciones } from './organizaciones';
import { inventarioMedicamentos } from './farmacia';
import { usuarios } from './usuarios';

export const tipoMovimientoInventarioEnum = pgEnum('tipo_movimiento_inventario', [
  'SURTIMIENTO',
  'AJUSTE',
  'DISPENSACION',
  'CADUCIDAD',
  'TERMINADO',
]);

export const historialInventario = pgTable('historial_inventario', {
  idHistorial:      bigserial('id_historial', { mode: 'number' }).primaryKey(),
  tenantId:         uuid('tenant_id').notNull().references(() => organizaciones.id),
  idInventario:     bigint('id_inventario', { mode: 'number' }).notNull().references(() => inventarioMedicamentos.idInventario),
  cantidadAnterior: integer('cantidad_anterior').notNull(),
  cantidadIngresada: integer('cantidad_ingresada').notNull(),
  cantidadNueva:    integer('cantidad_nueva').notNull(),
  tipoMovimiento:   tipoMovimientoInventarioEnum('tipo_movimiento').notNull(),
  idUsuario:        uuid('id_usuario').references(() => usuarios.id),
  observaciones:    text('observaciones'),
  fecha:            timestamp('fecha', { withTimezone: true }).notNull().defaultNow(),
});

export type HistorialInventario      = typeof historialInventario.$inferSelect;
export type NuevoHistorialInventario = typeof historialInventario.$inferInsert;
export type TipoMovimientoInventario = typeof tipoMovimientoInventarioEnum.enumValues[number];
