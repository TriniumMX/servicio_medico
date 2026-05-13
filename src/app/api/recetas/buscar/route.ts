// src/app/api/recetas/buscar/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  recetas,
  detalleReceta,
  surtimientosReceta,
  controlResurtimientos,
} from '@/db/schema/recetas';
import { medicamentos } from '@/db/schema/farmacia';
import { consulta, diagnosticosConsulta } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { obtenerVigenciaPrimerSurtimiento } from '@/lib/reglas-generales';
import { executeQueryOne } from '@/lib/dbPostgres';

/**
 * GET - Buscar receta por folio o código de barras
 *
 * Query params:
 * - folio: Folio de receta (ej: R-2025-000123)
 * - codigo: Código de barras (ej: 2025000123)
 *
 * Retorna:
 * - Información completa de la receta
 * - Datos del paciente
 * - Lista de medicamentos con surtimientos previos
 * - Cupones de resurtimiento (si aplica)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folio = searchParams.get('folio');
    const codigo = searchParams.get('codigo');

    // Validar que se proporcione al menos un parámetro
    if (!folio && !codigo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Debe proporcionar el folio o código de barras de la receta',
        },
        { status: 400 }
      );
    }

    // Buscar la receta
    let folioReceta = folio;
    let recetaData: any = null;

    // Si se proporciona código de barras, detectar formato y buscar
    if (codigo && !folio) {
      // FORMATO NUEVO: "NOMINA-ID_RECETA" (Ejemplo: 2238-00000123)
      if (codigo.includes('-') && codigo.split('-').length === 2) {
        const [nomina, idRecetaStr] = codigo.split('-');

        // Validar que la segunda parte sea numérica
        if (/^\d+$/.test(idRecetaStr)) {
          const idReceta = parseInt(idRecetaStr, 10);

          console.log(`🔍 [Buscar Receta - NUEVO] Buscando por NOMINA-ID_RECETA: ${nomina}-${idReceta}`);

          // Buscar receta directamente por ID
          const [receta] = await db
            .select()
            .from(recetas)
            .where(eq(recetas.id_receta, idReceta));

          if (!receta) {
            return NextResponse.json(
              {
                success: false,
                error: 'Receta no encontrada',
                codigo_buscado: codigo,
              },
              { status: 404 }
            );
          }

          // Validar que la nómina coincida con el paciente
          const [consultaValidacion] = await db
            .select()
            .from(consulta)
            .where(eq(consulta.idConsulta, receta.id_consulta));

          if (!consultaValidacion) {
            return NextResponse.json(
              {
                success: false,
                error: 'Datos de consulta no encontrados',
              },
              { status: 404 }
            );
          }

          if (consultaValidacion.noNomina !== nomina) {
            return NextResponse.json(
              {
                success: false,
                error: '⛔ Error de seguridad: Esta receta NO pertenece al paciente con nómina ' + nomina,
                receta_pertenece_a: consultaValidacion.noNomina,
              },
              { status: 403 }
            );
          }

          console.log(`✅ [Validación] Nómina validada correctamente: ${nomina}`);
          recetaData = receta;
        }
      }

      // FORMATO ANTIGUO: Solo folio (R-2025-000123 o 2025000123)
      if (!recetaData) {
        if (codigo.startsWith('R-')) {
          folioReceta = codigo;
        } else {
          // Código de barras formato antiguo: 2025000123 → R-2025-000123
          const cleanCode = codigo.replace(/[^0-9]/g, '');
          if (cleanCode.length >= 10) {
            const year = cleanCode.substring(0, 4);
            const numero = cleanCode.substring(4);
            folioReceta = `R-${year}-${numero}`;
          } else {
            return NextResponse.json(
              {
                success: false,
                error: 'Código de barras inválido.',
              },
              { status: 400 }
            );
          }
        }

        console.log(`🔍 [Buscar Receta - ANTIGUO] Buscando folio: ${folioReceta}`);

        // Obtener receta por folio (formato antiguo)
        const [receta] = await db
          .select()
          .from(recetas)
          .where(eq(recetas.folio_receta, folioReceta!));

        if (!receta) {
          return NextResponse.json(
            {
              success: false,
              error: 'Receta no encontrada',
              folio_buscado: folioReceta,
            },
            { status: 404 }
          );
        }

        recetaData = receta;
      }
    }
    // Si se proporciona folio directamente
    else if (folio) {
      console.log(`🔍 [Buscar Receta] Buscando por folio: ${folio}`);

      const [receta] = await db
        .select()
        .from(recetas)
        .where(eq(recetas.folio_receta, folio));

      if (!receta) {
        return NextResponse.json(
          {
            success: false,
            error: 'Receta no encontrada',
            folio_buscado: folio,
          },
          { status: 404 }
        );
      }

      recetaData = receta;
    }

    // Obtener datos de la consulta (que incluye datos del paciente)
    const [consultaData] = await db
      .select()
      .from(consulta)
      .where(eq(consulta.idConsulta, recetaData.id_consulta));

    if (!consultaData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos de consulta no encontrados',
        },
        { status: 404 }
      );
    }

    // Obtener diagnóstico principal de la consulta
    const [diagnosticoPrincipal] = await db
      .select()
      .from(diagnosticosConsulta)
      .where(
        and(
          eq(diagnosticosConsulta.idConsulta, recetaData.id_consulta),
          eq(diagnosticosConsulta.esPrincipal, true)
        )
      );

    // Obtener detalles de medicamentos prescritos
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
      .where(eq(detalleReceta.id_receta, recetaData.id_receta));

    // Para cada medicamento, obtener surtimientos previos y cupones
    const medicamentosConInfo = await Promise.all(
      detalles.map(async ({ detalle, medicamento }) => {
        // Obtener surtimientos previos
        const surtimientos = await db
          .select()
          .from(surtimientosReceta)
          .where(eq(surtimientosReceta.id_detalle, detalle.id_detalle))
          .orderBy(desc(surtimientosReceta.fecha_surtimiento));

        const totalSurtido = surtimientos.reduce(
          (sum, s) => sum + s.cantidad_surtida,
          0
        );

        // Obtener cupones de resurtimiento (si aplica)
        let cupones = null;
        if (detalle.realizar_resurtimiento) {
          cupones = await db
            .select()
            .from(controlResurtimientos)
            .where(eq(controlResurtimientos.id_detalle, detalle.id_detalle))
            .orderBy(controlResurtimientos.numero_resurtimiento);
        }

        return {
          id_detalle: detalle.id_detalle,
          medicamento: {
            id_medicamento: medicamento.id_medicamento,
            nombre_comercial: medicamento.nombre_comercial,
            sustancia_activa: medicamento.sustancia_activa,
            clasificacion: medicamento.clasificacion,
            codigo_ean: medicamento.codigo_ean,
          },
          prescripcion: {
            cantidad_total: detalle.cantidad_total,
            dosis: detalle.dosis,
            duracion_tratamiento_dias: detalle.duracion_tratamiento_dias,
            via_administracion: detalle.via_administracion,
            indicaciones: detalle.indicaciones,
          },
          resurtimiento: {
            realizar_resurtimiento: detalle.realizar_resurtimiento,
            meses_resurtimiento: detalle.meses_resurtimiento,
            cupones: cupones || [],
          },
          surtimientos: {
            total_surtido: totalSurtido,
            pendiente_surtir: detalle.cantidad_total - totalSurtido,
            completado: totalSurtido >= detalle.cantidad_total,
            historial: surtimientos,
          },
        };
      })
    );

    // Calcular totales generales
    const totalMedicamentos = medicamentosConInfo.length;
    const medicamentosCompletados = medicamentosConInfo.filter(
      (m) => m.surtimientos.completado
    ).length;
    const recetaCompletada = totalMedicamentos === medicamentosCompletados;

    // Validar vigencia del primer surtimiento
    const diasVigenciaPrimerSurtimiento = await obtenerVigenciaPrimerSurtimiento();
    const fechaEmision = new Date(recetaData.fecha_emision);
    const fechaActual = new Date();
    const diffMs = fechaActual.getTime() - fechaEmision.getTime();
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const vencidaPrimerSurtimiento = diffDias > diasVigenciaPrimerSurtimiento && medicamentosCompletados === 0;
    const diasRestantesPrimerSurtimiento = diasVigenciaPrimerSurtimiento - diffDias;

    console.log(`📅 [Validación Vigencia] Días transcurridos: ${diffDias}/${diasVigenciaPrimerSurtimiento}`);
    console.log(`📅 [Validación Vigencia] Vencida para primer surtimiento: ${vencidaPrimerSurtimiento}`);

    // Obtener usuario que canceló (si aplica)
    let usuarioCancelo: { nombre: string; username: string } | null = null;
    if (recetaData.id_usuario_cancela) {
      const usuario = await executeQueryOne<{ nombre: string; username: string }>(`
        SELECT nombre, username FROM usuarios WHERE id_usuario = $1
      `, [recetaData.id_usuario_cancela]);
      if (usuario) {
        usuarioCancelo = usuario;
      }
    }

    // Preparar respuesta
    const response = {
      success: true,
      data: {
        receta: {
          id_receta: recetaData.id_receta,
          folio_receta: recetaData.folio_receta,
          codigo_barras: recetaData.folio_receta
            .replace('R-', '')
            .replace(/-/g, ''), // Ej: R-2025-000123 → 2025000123
          fecha_emision: recetaData.fecha_emision,
          vigencia_dias: recetaData.vigencia_dias,
          observaciones_generales: recetaData.observaciones_generales,
          // Campos de cancelación
          cancelado: recetaData.cancelado || false,
          motivo_cancelacion: recetaData.motivo_cancelacion || null,
          fecha_cancelacion: recetaData.fecha_cancelacion || null,
          usuario_cancelo: usuarioCancelo,
        },
        paciente: {
          nomina: consultaData.noNomina,
          nombre: consultaData.nombre,
          nombre_completo: consultaData.nombre,
        },
        consulta: {
          folio: consultaData.folio,
          diagnostico: diagnosticoPrincipal?.cie11Titulo || 'Sin diagnóstico',
          diagnostico_codigo: diagnosticoPrincipal?.cie11Codigo || null,
          fecha_consulta: consultaData.fechaConsulta,
        },
        medicamentos: medicamentosConInfo,
        resumen: {
          total_medicamentos: totalMedicamentos,
          medicamentos_completados: medicamentosCompletados,
          medicamentos_pendientes: totalMedicamentos - medicamentosCompletados,
          receta_completada: recetaCompletada,
        },
        validacion_vigencia: {
          dias_vigencia_primer_surtimiento: diasVigenciaPrimerSurtimiento,
          dias_transcurridos: diffDias,
          dias_restantes: diasRestantesPrimerSurtimiento,
          vencida_primer_surtimiento: vencidaPrimerSurtimiento,
          puede_marcar_como_cero: !vencidaPrimerSurtimiento && medicamentosCompletados === 0,
        },
      },
    };

    console.log(`✅ [Buscar Receta] Receta encontrada: ${folioReceta}`);
    console.log(
      `   📊 Medicamentos: ${medicamentosCompletados}/${totalMedicamentos} surtidos`
    );

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('❌ Error al buscar receta:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al buscar receta',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
