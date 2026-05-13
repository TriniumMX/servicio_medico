// src/app/api/recetas/historial-surtimientos/[id_receta]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  recetas,
  detalleReceta,
  surtimientosReceta,
} from '@/db/schema/recetas';
import { medicamentos } from '@/db/schema/farmacia';
import { eq, desc } from 'drizzle-orm';

/**
 * GET - Obtener historial de surtimientos de una receta
 *
 * Retorna:
 * - Lista de todos los surtimientos realizados
 * - Agrupados por medicamento
 * - Con fechas y cantidades
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id_receta: string }> }
) {
  try {
    const { id_receta: id_receta_str } = await context.params;
    const id_receta = parseInt(id_receta_str);

    if (isNaN(id_receta)) {
      return NextResponse.json(
        { success: false, error: 'ID de receta inválido' },
        { status: 400 }
      );
    }

    console.log(`📋 [Historial] Obteniendo surtimientos de receta: ${id_receta}`);

    // Verificar que la receta existe
    const [receta] = await db
      .select()
      .from(recetas)
      .where(eq(recetas.id_receta, id_receta));

    if (!receta) {
      return NextResponse.json(
        { success: false, error: 'Receta no encontrada' },
        { status: 404 }
      );
    }

    // Obtener detalles de medicamentos y sus surtimientos
    const detalles = await db
      .select({
        detalle: detalleReceta,
        medicamento: medicamentos,
      })
      .from(detalleReceta)
      .innerJoin(
        medicamentos,
        eq(detalleReceta.id_medicamento, medicamentos.id_medicamento)
      )
      .where(eq(detalleReceta.id_receta, id_receta));

    // Para cada medicamento, obtener historial de surtimientos
    const historialCompleto = await Promise.all(
      detalles.map(async ({ detalle, medicamento }) => {
        const surtimientos = await db
          .select()
          .from(surtimientosReceta)
          .where(eq(surtimientosReceta.id_detalle, detalle.id_detalle))
          .orderBy(desc(surtimientosReceta.fecha_surtimiento));

        const totalSurtido = surtimientos.reduce(
          (sum, s) => sum + s.cantidad_surtida,
          0
        );

        return {
          medicamento: {
            id_medicamento: medicamento.id_medicamento,
            nombre_comercial: medicamento.nombre_comercial,
            sustancia_activa: medicamento.sustancia_activa,
          },
          prescripcion: {
            cantidad_total: detalle.cantidad_total,
            dosis: detalle.dosis,
            duracion_tratamiento_dias: detalle.duracion_tratamiento_dias,
          },
          surtimientos: surtimientos.map((s) => ({
            id_surtimiento: s.id_surtimiento,
            cantidad_surtida: s.cantidad_surtida,
            fecha_surtimiento: s.fecha_surtimiento,
            observaciones: s.observaciones,
          })),
          resumen: {
            total_surtido: totalSurtido,
            pendiente_surtir: detalle.cantidad_total - totalSurtido,
            completado: totalSurtido >= detalle.cantidad_total,
            numero_surtimientos: surtimientos.length,
          },
        };
      })
    );

    // Calcular totales
    const totalMedicamentos = historialCompleto.length;
    const medicamentosCompletados = historialCompleto.filter(
      (h) => h.resumen.completado
    ).length;
    const totalSurtimientos = historialCompleto.reduce(
      (sum, h) => sum + h.surtimientos.length,
      0
    );

    const response = {
      success: true,
      data: {
        receta: {
          id_receta: receta.id_receta,
          folio_receta: receta.folio_receta,
          fecha_emision: receta.fecha_emision,
        },
        historial: historialCompleto,
        resumen_general: {
          total_medicamentos: totalMedicamentos,
          medicamentos_completados: medicamentosCompletados,
          medicamentos_pendientes: totalMedicamentos - medicamentosCompletados,
          total_surtimientos_realizados: totalSurtimientos,
          receta_completada: totalMedicamentos === medicamentosCompletados,
        },
      },
    };

    console.log(`✅ [Historial] ${totalSurtimientos} surtimientos encontrados`);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('❌ Error al obtener historial de surtimientos:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener historial',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
