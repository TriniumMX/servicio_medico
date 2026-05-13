// src/app/api/recetas/resurtimientos/[id_detalle]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { controlResurtimientos, detalleReceta, medicamentos, unidadesMedida } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * GET - Obtener todos los cupones de resurtimiento de un medicamento
 * Incluye información del medicamento y estado de cada cupón
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id_detalle: string }> }
) {
  try {
    const { id_detalle: id_detalle_str } = await context.params;
    const id_detalle = parseInt(id_detalle_str);

    if (isNaN(id_detalle)) {
      return NextResponse.json(
        { success: false, error: 'ID de detalle inválido' },
        { status: 400 }
      );
    }

    // Obtener información del detalle de receta
    const [detalle] = await db
      .select({
        id_detalle: detalleReceta.id_detalle,
        id_receta: detalleReceta.id_receta,
        id_medicamento: detalleReceta.id_medicamento,
        cantidad_total: detalleReceta.cantidad_total,
        dosis: detalleReceta.dosis,
        indicaciones: detalleReceta.indicaciones,
        realizar_resurtimiento: detalleReceta.realizar_resurtimiento,
        meses_resurtimiento: detalleReceta.meses_resurtimiento,
        // Datos del medicamento
        nombre_comercial: medicamentos.nombre_comercial,
        sustancia_activa: medicamentos.sustancia_activa,
        medida: unidadesMedida.medida,
        abreviatura: unidadesMedida.abreviatura,
      })
      .from(detalleReceta)
      .leftJoin(medicamentos, eq(detalleReceta.id_medicamento, medicamentos.id_medicamento))
      .leftJoin(unidadesMedida, eq(medicamentos.id_medida, unidadesMedida.id_medida))
      .where(eq(detalleReceta.id_detalle, id_detalle));

    if (!detalle) {
      return NextResponse.json(
        { success: false, error: 'Detalle de receta no encontrado' },
        { status: 404 }
      );
    }

    // Si no tiene resurtimiento, retornar vacío
    if (!detalle.realizar_resurtimiento) {
      return NextResponse.json({
        success: true,
        data: {
          detalle,
          cupones: [],
          resumen: {
            total_cupones: 0,
            cupones_pendientes: 0,
            cupones_surtidos: 0,
            cupones_vencidos: 0,
          },
        },
      });
    }

    // Obtener todos los cupones de resurtimiento
    const cupones = await db
      .select()
      .from(controlResurtimientos)
      .where(eq(controlResurtimientos.id_detalle, id_detalle))
      .orderBy(controlResurtimientos.numero_resurtimiento);

    // Calcular resumen
    const resumen = {
      total_cupones: cupones.length,
      cupones_pendientes: cupones.filter(c => c.estatus === 'pendiente').length,
      cupones_surtidos: cupones.filter(c => c.estatus === 'surtido').length,
      cupones_vencidos: cupones.filter(c => c.estatus === 'vencido').length,
      cupones_cancelados: cupones.filter(c => c.estatus === 'cancelado').length,
    };

    return NextResponse.json({
      success: true,
      data: {
        detalle,
        cupones,
        resumen,
      },
    });
  } catch (error: any) {
    console.error('❌ Error al obtener resurtimientos:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener resurtimientos' },
      { status: 500 }
    );
  }
}
