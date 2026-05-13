// src/app/api/recetas/cancelar/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { recetas, detalleReceta, surtimientosReceta } from '@/db/schema/recetas';
import { consulta } from '@/db/schema/consulta';
import { medicamentos } from '@/db/schema/farmacia';
import { eq, desc } from 'drizzle-orm';
import { executeQueryOne } from '@/lib/dbPostgres';

/**
 * POST - Cancelar una receta buscando por folio de consulta
 *
 * Body esperado:
 * {
 *   folio_consulta: string,
 *   motivo_cancelacion: string,
 *   id_usuario_cancela?: number
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { folio_consulta, motivo_cancelacion, id_usuario_cancela } = body;

    // ============================================================
    // VALIDACIONES
    // ============================================================

    if (!folio_consulta) {
      return NextResponse.json(
        { success: false, error: 'El folio de consulta es requerido' },
        { status: 400 }
      );
    }

    if (!motivo_cancelacion || motivo_cancelacion.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'El motivo de cancelación es requerido' },
        { status: 400 }
      );
    }

    // ============================================================
    // BUSCAR CONSULTA POR FOLIO
    // ============================================================

    const [consultaEncontrada] = await db
      .select()
      .from(consulta)
      .where(eq(consulta.folio, folio_consulta));

    if (!consultaEncontrada) {
      return NextResponse.json(
        { success: false, error: 'No se encontró ninguna consulta con ese folio' },
        { status: 404 }
      );
    }

    console.log(`📋 [Cancelar] Consulta encontrada: ${consultaEncontrada.idConsulta}`);

    // ============================================================
    // BUSCAR RECETA ASOCIADA (1:1)
    // ============================================================

    const [recetaEncontrada] = await db
      .select()
      .from(recetas)
      .where(eq(recetas.id_consulta, consultaEncontrada.idConsulta));

    if (!recetaEncontrada) {
      return NextResponse.json(
        { success: false, error: 'No se encontró ninguna receta asociada a esta consulta' },
        { status: 404 }
      );
    }

    console.log(`📋 [Cancelar] Receta encontrada: ${recetaEncontrada.folio_receta}`);

    // ============================================================
    // VALIDAR QUE NO ESTÉ YA CANCELADA
    // ============================================================

    if (recetaEncontrada.cancelado) {
      return NextResponse.json(
        {
          success: false,
          error: 'Esta receta ya fue cancelada anteriormente',
          motivo_previo: recetaEncontrada.motivo_cancelacion,
          fecha_cancelacion: recetaEncontrada.fecha_cancelacion,
        },
        { status: 400 }
      );
    }

    // ============================================================
    // CANCELAR LA RECETA
    // ============================================================

    const [recetaActualizada] = await db
      .update(recetas)
      .set({
        cancelado: true,
        motivo_cancelacion: motivo_cancelacion.trim(),
        fecha_cancelacion: new Date(),
        id_usuario_cancela: id_usuario_cancela || null,
        updated_at: new Date(),
      })
      .where(eq(recetas.id_receta, recetaEncontrada.id_receta))
      .returning();

    console.log(`✅ [Cancelar] Receta ${recetaActualizada.folio_receta} cancelada exitosamente`);

    return NextResponse.json({
      success: true,
      message: 'Receta cancelada exitosamente',
      data: {
        receta: {
          id_receta: recetaActualizada.id_receta,
          folio_receta: recetaActualizada.folio_receta,
          cancelado: recetaActualizada.cancelado,
          motivo_cancelacion: recetaActualizada.motivo_cancelacion,
          fecha_cancelacion: recetaActualizada.fecha_cancelacion,
        },
        consulta: {
          id_consulta: consultaEncontrada.idConsulta,
          folio: consultaEncontrada.folio,
          paciente: consultaEncontrada.nombre,
        },
      },
    });
  } catch (error: any) {
    console.error('❌ Error al cancelar receta:', error);
    return NextResponse.json(
      { success: false, error: 'Error al cancelar la receta' },
      { status: 500 }
    );
  }
}

/**
 * GET - Buscar receta por folio de consulta para previsualizar antes de cancelar
 *
 * Query params:
 * - folio_consulta: string
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folio_consulta = searchParams.get('folio_consulta');

    if (!folio_consulta) {
      return NextResponse.json(
        { success: false, error: 'El folio de consulta es requerido' },
        { status: 400 }
      );
    }

    // Buscar consulta
    const [consultaEncontrada] = await db
      .select()
      .from(consulta)
      .where(eq(consulta.folio, folio_consulta));

    if (!consultaEncontrada) {
      return NextResponse.json(
        { success: false, error: 'No se encontró ninguna consulta con ese folio' },
        { status: 404 }
      );
    }

    // Buscar receta asociada
    const [recetaEncontrada] = await db
      .select()
      .from(recetas)
      .where(eq(recetas.id_consulta, consultaEncontrada.idConsulta));

    if (!recetaEncontrada) {
      return NextResponse.json(
        { success: false, error: 'No se encontró ninguna receta asociada a esta consulta' },
        { status: 404 }
      );
    }

    // Obtener detalles de medicamentos con sus surtimientos
    const detalles = await db
      .select({
        detalle: detalleReceta,
        medicamento: medicamentos,
      })
      .from(detalleReceta)
      .innerJoin(medicamentos, eq(detalleReceta.id_medicamento, medicamentos.id_medicamento))
      .where(eq(detalleReceta.id_receta, recetaEncontrada.id_receta));

    // Para cada detalle, obtener surtimientos
    const medicamentosConSurtimientos = await Promise.all(
      detalles.map(async ({ detalle, medicamento }) => {
        const surtimientos = await db
          .select()
          .from(surtimientosReceta)
          .where(eq(surtimientosReceta.id_detalle, detalle.id_detalle))
          .orderBy(desc(surtimientosReceta.fecha_surtimiento));

        const totalSurtido = surtimientos.reduce((sum, s) => sum + s.cantidad_surtida, 0);

        return {
          id_detalle: detalle.id_detalle,
          medicamento: {
            id_medicamento: medicamento.id_medicamento,
            nombre_comercial: medicamento.nombre_comercial,
            sustancia_activa: medicamento.sustancia_activa,
          },
          prescripcion: {
            cantidad_total: detalle.cantidad_total,
            dosis: detalle.dosis,
            duracion_tratamiento_dias: detalle.duracion_tratamiento_dias,
            realizar_resurtimiento: detalle.realizar_resurtimiento,
            meses_resurtimiento: detalle.meses_resurtimiento,
          },
          surtimientos: {
            total_surtido: totalSurtido,
            pendiente_surtir: detalle.cantidad_total - totalSurtido,
            cantidad_entregas: surtimientos.length,
            historial: surtimientos.map(s => ({
              cantidad: s.cantidad_surtida,
              fecha: s.fecha_surtimiento,
              observaciones: s.observaciones,
            })),
          },
        };
      })
    );

    // Calcular resumen
    const totalMedicamentos = medicamentosConSurtimientos.length;
    const medicamentosConEntregas = medicamentosConSurtimientos.filter(m => m.surtimientos.total_surtido > 0).length;
    const hayEntregasPrevias = medicamentosConEntregas > 0;

    // Obtener nombre del usuario que canceló (si existe)
    let usuarioCancelo: { nombre: string; username: string } | null = null;
    if (recetaEncontrada.id_usuario_cancela) {
      const usuario = await executeQueryOne<{ nombre: string; username: string }>(`
        SELECT nombre, username FROM usuarios WHERE id_usuario = $1
      `, [recetaEncontrada.id_usuario_cancela]);
      if (usuario) {
        usuarioCancelo = usuario;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        consulta: {
          id_consulta: consultaEncontrada.idConsulta,
          folio: consultaEncontrada.folio,
          paciente: consultaEncontrada.nombre,
          nomina: consultaEncontrada.noNomina,
          fecha_consulta: consultaEncontrada.fechaConsulta,
          edad: consultaEncontrada.edad,
          sexo: consultaEncontrada.sexo,
          departamento: consultaEncontrada.departamento,
          motivo_consulta: consultaEncontrada.motivoConsulta,
          // SOAP
          subjetivo: consultaEncontrada.subjetivo,
          objetivo: consultaEncontrada.objetivo,
          analisis: consultaEncontrada.analisis,
          plan: consultaEncontrada.plan,
        },
        receta: {
          id_receta: recetaEncontrada.id_receta,
          folio_receta: recetaEncontrada.folio_receta,
          tipo_receta: recetaEncontrada.tipo_receta,
          fecha_emision: recetaEncontrada.fecha_emision,
          cancelado: recetaEncontrada.cancelado,
          motivo_cancelacion: recetaEncontrada.motivo_cancelacion,
          fecha_cancelacion: recetaEncontrada.fecha_cancelacion,
          usuario_cancelo: usuarioCancelo,
        },
        medicamentos: medicamentosConSurtimientos,
        resumen: {
          total_medicamentos: totalMedicamentos,
          medicamentos_con_entregas: medicamentosConEntregas,
          hay_entregas_previas: hayEntregasPrevias,
        },
      },
    });
  } catch (error: any) {
    console.error('❌ Error al buscar receta:', error);
    return NextResponse.json(
      { success: false, error: 'Error al buscar la receta' },
      { status: 500 }
    );
  }
}
