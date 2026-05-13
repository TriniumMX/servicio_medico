// src/app/api/farmacia/inventario/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { inventarioMedicamentos, historialInventario } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET: Obtener un registro de inventario por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idInventario = parseInt(id);

    if (isNaN(idInventario)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    const [inventario] = await db
      .select()
      .from(inventarioMedicamentos)
      .where(eq(inventarioMedicamentos.id_inventario, idInventario));

    if (!inventario) {
      return NextResponse.json(
        { success: false, error: 'Registro de inventario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: inventario,
    });
  } catch (error: any) {
    console.error('❌ Error al obtener registro de inventario:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener registro de inventario' },
      { status: 500 }
    );
  }
}

// PATCH: Actualizar registro de inventario & Resurtir
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idInventario = parseInt(id);

    if (isNaN(idInventario)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      existencia_actual, // Solo si se quiere corregir manualmente (sobreescribe)
      cantidad_surtir,   // NUEVO: Sumar al stock actual
      fondo_fijo,
      es_cuadro_basico,
      observaciones,
      usuario_id,        // Opcional: ID del usuario que hace la acción
    } = body;

    // Verificar que el registro existe
    const [inventarioExistente] = await db
      .select()
      .from(inventarioMedicamentos)
      .where(eq(inventarioMedicamentos.id_inventario, idInventario));

    if (!inventarioExistente) {
      return NextResponse.json(
        { success: false, error: 'Registro de inventario no encontrado' },
        { status: 404 }
      );
    }

    let nuevaExistencia = inventarioExistente.existencia_actual;
    let tipoMovimiento = '';
    let cantidadIngresada = 0;

    // Lógica de Resurtimiento (Prioridad sobre corrección simple)
    if (cantidad_surtir !== undefined) {
      if (cantidad_surtir <= 0) {
        return NextResponse.json(
          { success: false, error: 'La cantidad a surtir debe ser mayor a 0' },
          { status: 400 }
        );
      }
      cantidadIngresada = cantidad_surtir;
      nuevaExistencia = inventarioExistente.existencia_actual + cantidad_surtir;
      tipoMovimiento = 'SURTIMIENTO';
    }
    // Lógica de Corrección Manual (Si se envía existencia_actual directamente)
    else if (existencia_actual !== undefined) {
      if (existencia_actual < 0) {
        return NextResponse.json(
          { success: false, error: 'La existencia actual no puede ser negativa' },
          { status: 400 }
        );
      }
      // Si cambia el valor, es un ajuste
      if (existencia_actual !== inventarioExistente.existencia_actual) {
        cantidadIngresada = existencia_actual - inventarioExistente.existencia_actual;
        nuevaExistencia = existencia_actual;
        tipoMovimiento = 'AJUSTE';
      }
    }

    if (fondo_fijo !== undefined && fondo_fijo <= 0) {
      return NextResponse.json(
        { success: false, error: 'El fondo fijo debe ser mayor a 0' },
        { status: 400 }
      );
    }

    // Transacción para asegurar consistencia
    const resultado = await db.transaction(async (tx) => {
      // 1. Actualizar Inventario
      const updateData: any = {
        updated_at: new Date(),
      };

      // Si hubo cambio en existencia
      if (tipoMovimiento) {
        updateData.existencia_actual = nuevaExistencia;
      }

      if (fondo_fijo !== undefined) updateData.fondo_fijo = fondo_fijo;
      if (es_cuadro_basico !== undefined) updateData.es_cuadro_basico = es_cuadro_basico;
      if (observaciones !== undefined) updateData.observaciones = observaciones;

      const [inventarioActualizado] = await tx
        .update(inventarioMedicamentos)
        .set(updateData)
        .where(eq(inventarioMedicamentos.id_inventario, idInventario))
        .returning();

      // 2. Registrar en Historial si hubo movimiento de stock
      if (tipoMovimiento) {

        await tx.insert(historialInventario).values({
          id_inventario: idInventario,
          cantidad_anterior: inventarioExistente.existencia_actual,
          cantidad_ingresada: cantidadIngresada,
          cantidad_nueva: nuevaExistencia,
          tipo_movimiento: tipoMovimiento as any,
          usuario_id: usuario_id || 'SISTEMA', // O el usuario de la sesión
          observaciones: observaciones || (tipoMovimiento === 'SURTIMIENTO' ? 'Resurtimiento de farmacia' : 'Ajuste de inventario'),
        });
      }

      return inventarioActualizado;
    });

    return NextResponse.json({
      success: true,
      data: resultado,
      message: 'Inventario actualizado exitosamente',
    });

  } catch (error: any) {
    console.error('Error al actualizar inventario:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar inventario' },
      { status: 500 }
    );
  }
}
