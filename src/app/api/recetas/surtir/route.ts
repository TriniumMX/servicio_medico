// src/app/api/recetas/surtir/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { surtimientosReceta, detalleReceta, controlResurtimientos, recetas } from '@/db/schema';
import { inventarioMedicamentos } from '@/db/schema/farmacia';
import { pusherServer } from '@/lib/pusher';
import { eq, and, asc, sql } from 'drizzle-orm';

/**
 * POST - Registrar surtimiento de un medicamento
 *
 * Body esperado:
 * {
 *   id_detalle: number,
 *   cantidad_surtida: number,
 *   id_farmaceutico?: number,
 *   observaciones?: string,
 *   id_control?: number  // Opcional: ID del cupón específico a surtir
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id_detalle, cantidad_surtida, id_farmaceutico, observaciones, id_control } = body;

    // Validaciones
    if (!id_detalle || !cantidad_surtida) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos (id_detalle, cantidad_surtida)' },
        { status: 400 }
      );
    }

    if (cantidad_surtida <= 0) {
      return NextResponse.json(
        { success: false, error: 'La cantidad surtida debe ser mayor a 0' },
        { status: 400 }
      );
    }

    // Verificar que el detalle de receta existe
    const [detalle] = await db
      .select()
      .from(detalleReceta)
      .where(eq(detalleReceta.id_detalle, id_detalle));

    if (!detalle) {
      return NextResponse.json(
        { success: false, error: 'Detalle de receta no encontrado' },
        { status: 404 }
      );
    }

    // ============================================================
    // VALIDAR QUE LA RECETA NO ESTÉ CANCELADA
    // ============================================================
    const [receta] = await db
      .select()
      .from(recetas)
      .where(eq(recetas.id_receta, detalle.id_receta));

    if (receta?.cancelado) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se puede surtir esta receta porque fue cancelada',
          receta_cancelada: true,
          motivo_cancelacion: receta.motivo_cancelacion,
          fecha_cancelacion: receta.fecha_cancelacion,
        },
        { status: 403 }
      );
    }

    // Obtener el total ya surtido
    const surtimientosPrevios = await db
      .select()
      .from(surtimientosReceta)
      .where(eq(surtimientosReceta.id_detalle, id_detalle));

    const totalSurtido = surtimientosPrevios.reduce(
      (sum, s) => sum + s.cantidad_surtida,
      0
    );

    // Validar que no exceda la cantidad total prescrita
    if (totalSurtido + cantidad_surtida > detalle.cantidad_total) {
      return NextResponse.json(
        {
          success: false,
          error: `No se puede surtir ${cantidad_surtida} piezas. Solo quedan ${detalle.cantidad_total - totalSurtido} piezas por surtir.`,
          disponible: detalle.cantidad_total - totalSurtido,
        },
        { status: 400 }
      );
    }

    // ============================================================
    // NOTA: La validación de cupones ahora se hace DESPUÉS del surtimiento
    // para calcular automáticamente cuántos cupones se completaron
    // ============================================================

    // ============================================================
    // VERIFICAR INVENTARIO DISPONIBLE
    // ============================================================

    const [inventario] = await db
      .select()
      .from(inventarioMedicamentos)
      .where(eq(inventarioMedicamentos.id_medicamento, detalle.id_medicamento));

    if (!inventario) {
      return NextResponse.json(
        {
          success: false,
          error: 'Este medicamento no tiene registro en inventario',
        },
        { status: 404 }
      );
    }

    // Validar que hay suficiente stock
    if (inventario.existencia_actual < cantidad_surtida) {
      return NextResponse.json(
        {
          success: false,
          error: `Stock insuficiente. Disponible: ${inventario.existencia_actual} piezas, solicitado: ${cantidad_surtida} piezas`,
          stock_disponible: inventario.existencia_actual,
          stock_solicitado: cantidad_surtida,
        },
        { status: 400 }
      );
    }

    console.log(`📦 [Surtir] Stock actual: ${inventario.existencia_actual} piezas`);
    console.log(`📤 [Surtir] A descontar: ${cantidad_surtida} piezas`);

    // ============================================================
    // REGISTRAR EL SURTIMIENTO
    // ============================================================

    const [nuevoSurtimiento] = await db
      .insert(surtimientosReceta)
      .values({
        id_detalle,
        cantidad_surtida,
        id_farmaceutico: id_farmaceutico || null,
        observaciones: observaciones || null,
      })
      .returning();

    // ============================================================
    // DESCONTAR DEL INVENTARIO
    // ============================================================

    await db
      .update(inventarioMedicamentos)
      .set({
        existencia_actual: sql`${inventarioMedicamentos.existencia_actual} - ${cantidad_surtida}`,
        updated_at: new Date(),
      })
      .where(eq(inventarioMedicamentos.id_medicamento, detalle.id_medicamento));

    const nuevoStock = inventario.existencia_actual - cantidad_surtida;
    console.log(`✅ [Surtir] Inventario actualizado. Nuevo stock: ${nuevoStock} piezas`);

    // ============================================================
    // MARCAR CUPONES COMO SURTIDOS (si aplica)
    // ============================================================

    if (detalle.realizar_resurtimiento) {
      // NUEVA LÓGICA: Solo marcar cupones COMPLETOS como surtidos

      // 1. Calcular total surtido (incluyendo el nuevo surtimiento)
      const nuevoTotalSurtido = totalSurtido + cantidad_surtida;

      // 2. Calcular cuántos cupones COMPLETOS se han surtido
      // Cada cupón representa `cantidad_total` piezas
      const cuponesCompletados = Math.floor(nuevoTotalSurtido / detalle.cantidad_total);

      console.log(`📊 [Cupones] Total surtido: ${nuevoTotalSurtido}/${detalle.cantidad_total * (detalle.meses_resurtimiento || 1)} piezas`);
      console.log(`📊 [Cupones] Cupones completados: ${cuponesCompletados}`);

      // 3. Obtener todos los cupones del medicamento
      const todosCupones = await db
        .select()
        .from(controlResurtimientos)
        .where(eq(controlResurtimientos.id_detalle, id_detalle))
        .orderBy(asc(controlResurtimientos.numero_resurtimiento));

      // 4. Marcar como surtidos solo los cupones que se han completado
      for (let i = 0; i < cuponesCompletados && i < todosCupones.length; i++) {
        const cupon = todosCupones[i];

        // Solo actualizar si aún está pendiente
        if (cupon.estatus === 'pendiente') {
          await db
            .update(controlResurtimientos)
            .set({
              estatus: 'surtido',
              fecha_surtido: new Date(),
              id_surtimiento: nuevoSurtimiento.id_surtimiento,
            })
            .where(eq(controlResurtimientos.id_control, cupon.id_control));

          console.log(`✅ Cupón #${cupon.numero_resurtimiento} marcado como surtido`);
        }
      }
    }

    // ============================================================
    // CALCULAR TOTALES Y RESPUESTA
    // ============================================================

    const nuevoTotalSurtido = totalSurtido + cantidad_surtida;
    const pendienteSurtir = detalle.cantidad_total - nuevoTotalSurtido;

    // Si tiene resurtimiento, obtener cupones restantes
    let cuponesPendientes = null;
    if (detalle.realizar_resurtimiento) {
      cuponesPendientes = await db
        .select()
        .from(controlResurtimientos)
        .where(
          and(
            eq(controlResurtimientos.id_detalle, id_detalle),
            eq(controlResurtimientos.estatus, 'pendiente')
          )
        );
    }

    // Calcular alertas de stock (basado en fondo fijo)
    const requiereReposicion = nuevoStock < inventario.fondo_fijo;
    const stockBajo = nuevoStock > 0 && nuevoStock < inventario.fondo_fijo * 0.5;
    const stockCritico = nuevoStock > 0 && nuevoStock < inventario.fondo_fijo * 0.25;

    // 🔔 Notificar al dashboard para actualizar contadores
    try {
      await pusherServer.trigger('dashboard', 'stats-refresh', {
        type: 'receta_surtida',
        message: 'Medicamento surtido'
      });
    } catch (error) {
      console.error('Error notificando a Pusher:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Surtimiento registrado exitosamente',
      data: {
        surtimiento: nuevoSurtimiento,
        resumen: {
          cantidad_total: detalle.cantidad_total,
          total_surtido: nuevoTotalSurtido,
          pendiente_surtir: pendienteSurtir,
          completado: pendienteSurtir === 0,
          cupones_pendientes: cuponesPendientes?.length || 0,
        },
        inventario: {
          stock_anterior: inventario.existencia_actual,
          cantidad_descontada: cantidad_surtida,
          stock_actual: nuevoStock,
          fondo_fijo: inventario.fondo_fijo,
          alertas: {
            stock_bajo: stockBajo,
            stock_critico: stockCritico,
            requiere_reposicion: requiereReposicion,
            mensaje: nuevoStock === 0
              ? '⛔ Medicamento agotado'
              : stockCritico
                ? '🔴 Stock crítico - Solicitar pedido urgente'
                : stockBajo
                  ? '⚠️ Stock bajo - Considerar reposición'
                  : requiereReposicion
                    ? '⚠️ Requiere reposición'
                    : '✅ Fondo completo',
          },
        },
      },
    });
  } catch (error: any) {
    console.error('❌ Error al registrar surtimiento:', error);
    return NextResponse.json(
      { success: false, error: 'Error al registrar surtimiento' },
      { status: 500 }
    );
  }
}
