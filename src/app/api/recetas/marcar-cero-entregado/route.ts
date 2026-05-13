// src/app/api/recetas/marcar-cero-entregado/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  recetas,
  detalleReceta,
  surtimientosReceta,
  controlResurtimientos,
} from '@/db/schema/recetas';
import { eq, and } from 'drizzle-orm';
import { obtenerVigenciaPrimerSurtimiento } from '@/lib/reglas-generales';

/**
 * POST - Marcar receta como 0 entregado
 *
 * Se usa cuando el paciente acude a farmacia en el plazo de vigencia
 * pero NO hay stock de medicamentos. Esto registra que SÍ acudió
 * pero recibió 0 unidades, evitando que se bloquee la receta.
 *
 * Body:
 * {
 *   folio_receta: string,
 *   motivo: string,
 *   observaciones?: string,
 *   id_farmaceutico?: number
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { folio_receta, motivo, observaciones, id_farmaceutico } = body;

    // Validar campos requeridos
    if (!folio_receta || !motivo) {
      return NextResponse.json(
        {
          success: false,
          error: 'El folio de receta y el motivo son obligatorios',
        },
        { status: 400 }
      );
    }

    console.log(`🚫 [Marcar Cero] Procesando receta: ${folio_receta}`);
    console.log(`   Motivo: ${motivo}`);

    // 1. Buscar la receta
    const [recetaData] = await db
      .select()
      .from(recetas)
      .where(eq(recetas.folio_receta, folio_receta));

    if (!recetaData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Receta no encontrada',
        },
        { status: 404 }
      );
    }

    // 2. Validar que esté dentro del plazo de vigencia del PRIMER surtimiento
    const diasVigenciaPrimerSurtimiento = await obtenerVigenciaPrimerSurtimiento();

    const fechaEmision = new Date(recetaData.fecha_emision);
    const fechaActual = new Date();

    const diffMs = fechaActual.getTime() - fechaEmision.getTime();
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDias > diasVigenciaPrimerSurtimiento) {
      return NextResponse.json(
        {
          success: false,
          error: `La receta venció para primer surtimiento. Tenía ${diasVigenciaPrimerSurtimiento} días desde su emisión (${fechaEmision.toLocaleDateString('es-MX')})`,
        },
        { status: 400 }
      );
    }

    console.log(`✅ [Marcar Cero] Dentro de vigencia: ${diffDias}/${diasVigenciaPrimerSurtimiento} días`);

    // 3. Verificar que NO tenga surtimientos previos (debe ser primera visita)
    const detalles = await db
      .select()
      .from(detalleReceta)
      .where(eq(detalleReceta.id_receta, recetaData.id_receta));

    for (const detalle of detalles) {
      const surtimientosPrevios = await db
        .select()
        .from(surtimientosReceta)
        .where(eq(surtimientosReceta.id_detalle, detalle.id_detalle));

      if (surtimientosPrevios.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Esta receta ya tiene surtimientos registrados. Solo se puede marcar como 0 en la primera visita.',
          },
          { status: 400 }
        );
      }
    }

    console.log(`✅ [Marcar Cero] Validaciones pasadas. Creando surtimientos con cantidad = 0`);

    // 4. Crear surtimientos con cantidad = 0 para cada detalle
    const observacionesCompletas = `[SIN STOCK] ${motivo}${observaciones ? ` - ${observaciones}` : ''}`;
    const surtimientosCreados = [];

    for (const detalle of detalles) {
      // Crear surtimiento con cantidad 0
      const [nuevoSurtimiento] = await db
        .insert(surtimientosReceta)
        .values({
          id_detalle: detalle.id_detalle,
          cantidad_surtida: 0,
          fecha_surtimiento: new Date(),
          id_farmaceutico: id_farmaceutico || null,
          observaciones: observacionesCompletas,
        })
        .returning();

      surtimientosCreados.push(nuevoSurtimiento);

      // 5. Si tiene resurtimiento, actualizar el cupón #1 (Mes 1)
      if (detalle.realizar_resurtimiento) {
        const cuponesMes1 = await db
          .select()
          .from(controlResurtimientos)
          .where(
            and(
              eq(controlResurtimientos.id_detalle, detalle.id_detalle),
              eq(controlResurtimientos.numero_resurtimiento, 1)
            )
          );

        if (cuponesMes1.length > 0) {
          const cupon1 = cuponesMes1[0];

          await db
            .update(controlResurtimientos)
            .set({
              estatus: 'surtido',
              fecha_surtido: new Date(),
              id_surtimiento: nuevoSurtimiento.id_surtimiento,
            })
            .where(eq(controlResurtimientos.id_control, cupon1.id_control));

          console.log(`   ✅ Cupón #1 (Mes 1) marcado como surtido con cantidad 0`);
        }
      }
    }

    console.log(`✅ [Marcar Cero] ${surtimientosCreados.length} surtimientos creados con cantidad = 0`);

    return NextResponse.json({
      success: true,
      message: 'Visita registrada sin entrega de medicamentos',
      data: {
        folio_receta: recetaData.folio_receta,
        fecha_registro: new Date(),
        total_medicamentos: surtimientosCreados.length,
        motivo: motivo,
        observaciones: observacionesCompletas,
      },
    });
  } catch (error: any) {
    console.error('❌ Error al marcar receta como 0 entregado:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al procesar la solicitud',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
