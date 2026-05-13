// src/app/api/recetas/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { recetas, detalleReceta, medicamentos, unidadesMedida, surtimientosReceta } from '@/db/schema';
import { eq, sum } from 'drizzle-orm';

/**
 * GET - Obtener una receta completa por ID de consulta
 * Incluye los detalles de medicamentos y surtimientos
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const id_consulta = parseInt(id);

    if (isNaN(id_consulta)) {
      return NextResponse.json(
        { success: false, error: 'ID de consulta inválido' },
        { status: 400 }
      );
    }

    // Buscar la receta de esta consulta
    const [receta] = await db
      .select()
      .from(recetas)
      .where(eq(recetas.id_consulta, id_consulta));

    if (!receta) {
      return NextResponse.json(
        { success: false, error: 'No se encontró receta para esta consulta' },
        { status: 404 }
      );
    }

    // Obtener los detalles de la receta con información de medicamentos
    const detalles = await db
      .select({
        id_detalle: detalleReceta.id_detalle,
        id_receta: detalleReceta.id_receta,
        id_medicamento: detalleReceta.id_medicamento,
        cantidad_total: detalleReceta.cantidad_total,
        dosis: detalleReceta.dosis,
        duracion_tratamiento_dias: detalleReceta.duracion_tratamiento_dias,
        via_administracion: detalleReceta.via_administracion,
        indicaciones: detalleReceta.indicaciones,
        realizar_resurtimiento: detalleReceta.realizar_resurtimiento,
        meses_resurtimiento: detalleReceta.meses_resurtimiento,
        created_at: detalleReceta.created_at,
        // Datos del medicamento
        nombre_comercial: medicamentos.nombre_comercial,
        sustancia_activa: medicamentos.sustancia_activa,
        medida: unidadesMedida.medida,
        abreviatura: unidadesMedida.abreviatura,
      })
      .from(detalleReceta)
      .leftJoin(medicamentos, eq(detalleReceta.id_medicamento, medicamentos.id_medicamento))
      .leftJoin(unidadesMedida, eq(medicamentos.id_medida, unidadesMedida.id_medida))
      .where(eq(detalleReceta.id_receta, receta.id_receta));

    // Para cada detalle, obtener los surtimientos
    const detallesConSurtimientos = await Promise.all(
      detalles.map(async (detalle) => {
        const surtimientos = await db
          .select()
          .from(surtimientosReceta)
          .where(eq(surtimientosReceta.id_detalle, detalle.id_detalle));

        const total_surtido = surtimientos.reduce(
          (sum, s) => sum + s.cantidad_surtida,
          0
        );

        return {
          ...detalle,
          surtimientos,
          total_surtido,
          pendiente_surtir: detalle.cantidad_total - total_surtido,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        ...receta,
        detalles: detallesConSurtimientos,
      },
    });
  } catch (error: any) {
    console.error('❌ Error al obtener receta:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener receta' },
      { status: 500 }
    );
  }
}
