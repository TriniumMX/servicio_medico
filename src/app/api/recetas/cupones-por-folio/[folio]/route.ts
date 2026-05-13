// src/app/api/recetas/resurtimientos/[folio]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  recetas,
  detalleReceta,
  controlResurtimientos,
} from '@/db/schema/recetas';
import { medicamentos } from '@/db/schema/farmacia';
import { consulta, diagnosticosConsulta } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { obtenerVentanaToleranciaResurtimiento } from '@/lib/reglas-generales';
import { executeQueryOne } from '@/lib/dbPostgres';

/**
 * Verifica si una fecha está dentro de la ventana de tolerancia (±X días)
 * @param fechaProgramada Fecha programada del resurtimiento
 * @param diasTolerancia Días de tolerancia (±X días)
 */
function estaEnVentanaTolerancia(fechaProgramada: string | Date, diasTolerancia: number): boolean {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const fechaProg = new Date(fechaProgramada);
  fechaProg.setHours(0, 0, 0, 0);

  const diffMs = fechaProg.getTime() - hoy.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Permitir entre -X días (X días después) y +X días (X días antes)
  return diffDias >= -diasTolerancia && diffDias <= diasTolerancia;
}

/**
 * GET - Obtener cupones de resurtimiento de una receta
 *
 * Retorna medicamentos con resurtimiento y sus cupones disponibles para generar receta
 *
 * Reglas:
 * - NO incluye cupón #1 (se asume ya surtido con receta original)
 * - Solo incluye cupones con fecha programada dentro de ventana de tolerancia (±2 días)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ folio: string }> }
) {
  try {
    const { folio: inputFolio } = await params;

    console.log(`🔄 [Resurtimientos] Buscando cupones de: ${inputFolio}`);

    // Obtener ventana de tolerancia de las reglas generales
    const diasTolerancia = await obtenerVentanaToleranciaResurtimiento();
    console.log(`📏 [Resurtimientos] Ventana de tolerancia: ±${diasTolerancia} días`);

    // Detectar si es código de barras NOMINA-ID_RECETA o folio
    let recetaData: any = null;

    // FORMATO NUEVO: "NOMINA-ID_RECETA" (Ejemplo: 8474-00000022)
    if (inputFolio.includes('-') && inputFolio.split('-').length === 2) {
      const [nomina, idRecetaStr] = inputFolio.split('-');

      // Validar que la segunda parte sea numérica
      if (/^\d+$/.test(idRecetaStr)) {
        const idReceta = parseInt(idRecetaStr, 10);

        console.log(`🔍 [Resurtimientos - NUEVO] Buscando por NOMINA-ID_RECETA: ${nomina}-${idReceta}`);

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
              codigo_buscado: inputFolio,
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
              error: `⛔ Error de seguridad: Esta receta NO pertenece al paciente con nómina ${nomina}`,
              receta_pertenece_a: consultaValidacion.noNomina,
            },
            { status: 403 }
          );
        }

        console.log(`✅ [Validación] Nómina validada correctamente: ${nomina}`);
        recetaData = receta;
      }
    }

    // FORMATO ANTIGUO: Folio (R-2025-000123)
    if (!recetaData) {
      console.log(`🔍 [Resurtimientos - ANTIGUO] Buscando por folio: ${inputFolio}`);

      const [receta] = await db
        .select()
        .from(recetas)
        .where(eq(recetas.folio_receta, inputFolio));

      if (!receta) {
        return NextResponse.json(
          {
            success: false,
            error: 'Receta no encontrada',
            folio_buscado: inputFolio,
          },
          { status: 404 }
        );
      }

      recetaData = receta;
    }

    // ============================================================
    // VALIDAR QUE LA RECETA NO ESTÉ CANCELADA
    // ============================================================
    if (recetaData.cancelado) {
      // Obtener usuario que canceló
      let usuarioCancelo: { nombre: string; username: string } | null = null;
      if (recetaData.id_usuario_cancela) {
        const usuario = await executeQueryOne<{ nombre: string; username: string }>(`
          SELECT nombre, username FROM usuarios WHERE id_usuario = $1
        `, [recetaData.id_usuario_cancela]);
        if (usuario) {
          usuarioCancelo = usuario;
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: 'No se puede resurtir porque la receta fue cancelada',
          receta_cancelada: true,
          motivo_cancelacion: recetaData.motivo_cancelacion,
          fecha_cancelacion: recetaData.fecha_cancelacion,
          usuario_cancelo: usuarioCancelo,
        },
        { status: 403 }
      );
    }

    // Obtener datos de la consulta
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

    // Obtener medicamentos con resurtimiento
    const medicamentosConResurtimiento = await db
      .select({
        detalle: detalleReceta,
        medicamento: medicamentos,
      })
      .from(detalleReceta)
      .innerJoin(
        medicamentos,
        eq(detalleReceta.id_medicamento, medicamentos.id_medicamento)
      )
      .where(
        and(
          eq(detalleReceta.id_receta, recetaData.id_receta),
          eq(detalleReceta.realizar_resurtimiento, true)
        )
      );

    // Para cada medicamento, obtener sus cupones con info de receta generada
    const medicamentosConCupones = await Promise.all(
      medicamentosConResurtimiento.map(async ({ detalle, medicamento }) => {
        const cuponesConReceta = await db
          .select({
            cupon: controlResurtimientos,
            recetaGenerada: recetas,
          })
          .from(controlResurtimientos)
          .leftJoin(
            recetas,
            eq(controlResurtimientos.id_receta_resurtimiento, recetas.id_receta)
          )
          .where(eq(controlResurtimientos.id_detalle, detalle.id_detalle))
          .orderBy(asc(controlResurtimientos.numero_resurtimiento));

        // Mapear cupones con información de receta generada
        const cupones = cuponesConReceta.map((item) => ({
          ...item.cupon,
          receta_resurtimiento: item.recetaGenerada
            ? {
              folio: item.recetaGenerada.folio_receta,
              fecha_generacion: item.recetaGenerada.fecha_emision,
              id_receta: item.recetaGenerada.id_receta,
            }
            : null,
        }));

        // Filtrar y marcar cupones según reglas de negocio:
        // 1. NO incluir cupón #1 (se asume surtido con receta original)
        // 2. Marcar cupones según estén dentro/fuera de ventana de tolerancia (±2 días)
        const cuponesSurtidos = cupones.filter((c) => c.estatus === 'surtido');

        const cuponesExcluidosCupon1: any[] = [];

        // Procesar cupones pendientes (excluir cupón #1 pero mostrar todos los demás)
        const cuponesPendientesConDisponibilidad = cupones
          .filter((c) => {
            // Excluir cupón #1
            if (c.numero_resurtimiento === 1) {
              cuponesExcluidosCupon1.push(c);
              return false;
            }
            // Solo incluir si está pendiente
            return c.estatus === 'pendiente';
          })
          .map((c) => {
            // Verificar si está dentro de ventana de tolerancia
            const enVentana = c.fecha_programada
              ? estaEnVentanaTolerancia(c.fecha_programada, diasTolerancia)
              : false;

            return {
              ...c,
              disponible_para_resurtir: enVentana, // ✅ Nuevo campo
            };
          });

        // Separar cupones por disponibilidad
        const cuponesDisponibles = cuponesPendientesConDisponibilidad.filter(
          (c) => c.disponible_para_resurtir
        );
        const cuponesFueraVentana = cuponesPendientesConDisponibilidad.filter(
          (c) => !c.disponible_para_resurtir
        );

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
            meses_resurtimiento: detalle.meses_resurtimiento,
          },
          cupones: {
            todos: cupones,
            surtidos: cuponesSurtidos,
            pendientes: cuponesPendientesConDisponibilidad, // ✅ Todos los pendientes (con campo disponible)
            disponibles: cuponesDisponibles, // ✅ Solo los que están en ventana
            fuera_ventana: cuponesFueraVentana, // ✅ Los que están fuera de ventana
            excluidos_cupon_1: cuponesExcluidosCupon1,
            total_cupones: cupones.length,
            cupones_surtidos: cuponesSurtidos.length,
            cupones_pendientes: cuponesPendientesConDisponibilidad.length, // Total pendientes
            cupones_disponibles: cuponesDisponibles.length, // Solo disponibles
            cupones_fuera_ventana: cuponesFueraVentana.length,
            cupones_excluidos_cupon_1: cuponesExcluidosCupon1.length,
          },
        };
      })
    );

    // Filtrar medicamentos que tienen cupones pendientes (sin importar si están en ventana o no)
    const medicamentosConPendientes = medicamentosConCupones.filter(
      (m) => m.cupones.cupones_pendientes > 0
    );

    // Medicamentos que tienen al menos un cupón disponible (dentro de ventana)
    const medicamentosConDisponibles = medicamentosConCupones.filter(
      (m) => m.cupones.cupones_disponibles > 0
    );

    // Obtener diagnóstico principal
    const [diagnosticoData] = await db
      .select({
        titulo: diagnosticosConsulta.cie11Titulo
      })
      .from(diagnosticosConsulta)
      .where(
        and(
          eq(diagnosticosConsulta.idConsulta, recetaData.id_consulta),
          eq(diagnosticosConsulta.esPrincipal, true)
        )
      );

    const response = {
      success: true,
      data: {
        receta: {
          id_receta: recetaData.id_receta,
          folio_receta: recetaData.folio_receta,
          fecha_emision: recetaData.fecha_emision,
        },
        paciente: {
          nomina: consultaData.noNomina,
          nombre: consultaData.nombre,
        },
        consulta: {
          folio: consultaData.folio,
          diagnostico: diagnosticoData?.titulo || 'Sin diagnóstico',
        },
        medicamentos: medicamentosConCupones,
        medicamentos_con_pendientes: medicamentosConPendientes,
        medicamentos_con_disponibles: medicamentosConDisponibles, // ✅ Nuevo
        resumen: {
          total_medicamentos_con_resurtimiento: medicamentosConCupones.length,
          medicamentos_con_cupones_pendientes: medicamentosConPendientes.length,
          medicamentos_con_cupones_disponibles: medicamentosConDisponibles.length, // ✅ Nuevo
          total_cupones_pendientes: medicamentosConCupones.reduce(
            (sum, m) => sum + m.cupones.cupones_pendientes,
            0
          ),
          total_cupones_disponibles: medicamentosConCupones.reduce( // ✅ Nuevo
            (sum, m) => sum + m.cupones.cupones_disponibles,
            0
          ),
          total_cupones_fuera_ventana: medicamentosConCupones.reduce( // ✅ Nuevo
            (sum, m) => sum + m.cupones.cupones_fuera_ventana,
            0
          ),
          total_cupones_surtidos: medicamentosConCupones.reduce(
            (sum, m) => sum + m.cupones.cupones_surtidos,
            0
          ),
          total_cupones_excluidos_cupon_1: medicamentosConCupones.reduce(
            (sum, m) => sum + m.cupones.cupones_excluidos_cupon_1,
            0
          ),
        },
      },
    };

    console.log(
      `✅ [Resurtimientos] Resultado de búsqueda:
      - ${response.data.resumen.medicamentos_con_cupones_pendientes} medicamentos con cupones pendientes
      - ${response.data.resumen.total_cupones_pendientes} cupones pendientes totales
      - ${response.data.resumen.total_cupones_disponibles} cupones DISPONIBLES (dentro de ventana ±2 días)
      - ${response.data.resumen.total_cupones_fuera_ventana} cupones fuera de ventana (se muestran pero deshabilitados)
      - ${response.data.resumen.total_cupones_excluidos_cupon_1} cupones excluidos (cupón #1)`
    );

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('❌ Error al obtener cupones de resurtimiento:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener cupones',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
