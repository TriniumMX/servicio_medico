import { pgTable, serial, integer, text, timestamp, varchar, pgEnum } from 'drizzle-orm/pg-core';
import { inventarioMedicamentos } from './farmacia';

// =====================================================
// ENUM: tipo_movimiento_inventario
// =====================================================
export const tipoMovimientoInventarioEnum = pgEnum('tipo_movimiento_inventario', [
    'SURTIMIENTO',    // Entrada de stock (resurtimiento)
    'AJUSTE',         // Corrección manual
    'DISPENSACION',   // Salida por receta/uso (futuro)
    'CADUCIDAD',      // Salida por caducidad (futuro)
    'TERMINADO'       // Salida por consumo total (futuro)
]);

// =====================================================
// TABLA: historial_inventario
// =====================================================
export const historialInventario = pgTable('historial_inventario', {
    id_historial: serial('id_historial').primaryKey(),
    id_inventario: integer('id_inventario').notNull().references(() => inventarioMedicamentos.id_inventario),
    cantidad_anterior: integer('cantidad_anterior').notNull(),
    cantidad_ingresada: integer('cantidad_ingresada').notNull(), // Lo que se sumó/restó
    cantidad_nueva: integer('cantidad_nueva').notNull(),
    tipo_movimiento: tipoMovimientoInventarioEnum('tipo_movimiento').notNull(),
    usuario_id: text('usuario_id'), // ID del usuario que hizo el movimiento (opcional por ahora si no hay auth estricta)
    observaciones: text('observaciones'),
    fecha: timestamp('fecha', { withTimezone: true }).notNull().defaultNow(),
});

export type HistorialInventario = typeof historialInventario.$inferSelect;
export type NuevoHistorialInventario = typeof historialInventario.$inferInsert;
