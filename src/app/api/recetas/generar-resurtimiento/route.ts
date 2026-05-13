// src/app/api/recetas/generar-resurtimiento/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  recetas,
  detalleReceta,
  controlResurtimientos,
} from '@/db/schema/recetas';
import { consulta } from '@/db/schema/consulta';
import { medicamentos } from '@/db/schema/farmacia';
import { eq, and, inArray, desc, like } from 'drizzle-orm';

/**
 * Genera un nuevo folio para receta de resurtimiento
 * Formato: R-{AÑO}-{NUMERO_SECUENCIAL}
 * Ejemplo: R-2025-000123
 */
async function generarFolioReceta(): Promise<string> {
  const año = new Date().getFullYear();

  // Obtener el último folio del año actual
  const ultimaReceta = await db
    .select({ folio: recetas.folio_receta })
    .from(recetas)
    .where(like(recetas.folio_receta, `R-${año}-%`))
    .orderBy(desc(recetas.id_receta))
    .limit(1);

  let numeroSecuencial = 1;

  if (ultimaReceta.length > 0) {
    const ultimoFolio = ultimaReceta[0].folio;
    const match = ultimoFolio.match(/R-\d{4}-(\d+)/);
    if (match) {
      numeroSecuencial = parseInt(match[1]) + 1;
    }
  }

  // Formato: R-2025-000123 (6 dígitos con padding de ceros)
  const folioNumero = numeroSecuencial.toString().padStart(6, '0');
  return `R-${año}-${folioNumero}`;
}

/**
 * POST - Genera una receta de resurtimiento con registros en BD
 *
 * Body esperado:
 * {
 *   folio_original: string,
 *   cupones: [
 *     {
 *       id_control: number,
 *       id_medicamento: number,
 *       cantidad: number,
 *       dosis: string,
 *       numero_resurtimiento: number
 *     }
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { folio_original, cupones } = body;

    console.log('📝 [Generar Resurtimiento] Inicio...');
    console.log('📋 Folio original:', folio_original);
    console.log('🎫 Cupones seleccionados:', cupones.length);

    // ============================================================
    // VALIDACIONES INICIALES
    // ============================================================

    if (!folio_original || !cupones || cupones.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Faltan datos requeridos (folio_original, cupones)',
        },
        { status: 400 }
      );
    }

    // Verificar que la receta original existe
    const [recetaOriginal] = await db
      .select()
      .from(recetas)
      .where(eq(recetas.folio_receta, folio_original));

    if (!recetaOriginal) {
      return NextResponse.json(
        { success: false, error: 'Receta original no encontrada' },
        { status: 404 }
      );
    }

    // ============================================================
    // VALIDAR QUE LA RECETA ORIGINAL NO ESTÉ CANCELADA
    // ============================================================
    if (recetaOriginal.cancelado) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se puede generar resurtimiento porque la receta original fue cancelada',
          receta_cancelada: true,
          motivo_cancelacion: recetaOriginal.motivo_cancelacion,
          fecha_cancelacion: recetaOriginal.fecha_cancelacion,
        },
        { status: 403 }
      );
    }

    console.log('✅ Receta original encontrada:', recetaOriginal.id_receta);

    // Verificar que todos los cupones existen y están pendientes
    const idsCupones = cupones.map((c: any) => c.id_control);
    const cuponesDB = await db
      .select()
      .from(controlResurtimientos)
      .where(inArray(controlResurtimientos.id_control, idsCupones));

    if (cuponesDB.length !== cupones.length) {
      return NextResponse.json(
        { success: false, error: 'Algunos cupones no existen' },
        { status: 400 }
      );
    }

    // Validar que todos están pendientes y no tienen receta de resurtimiento
    const cuponesInvalidos = cuponesDB.filter(
      (c) => c.estatus !== 'pendiente' || c.id_receta_resurtimiento !== null
    );

    if (cuponesInvalidos.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Algunos cupones ya tienen receta de resurtimiento o no están pendientes',
        },
        { status: 400 }
      );
    }

    console.log('✅ Todos los cupones son válidos');

    // ============================================================
    // GENERAR FOLIO PARA LA NUEVA RECETA
    // ============================================================

    const nuevoFolio = await generarFolioReceta();
    console.log('🎫 Nuevo folio generado:', nuevoFolio);

    // ============================================================
    // CREAR NUEVA RECETA DE RESURTIMIENTO
    // ============================================================

    const insertedReceta = await db
      .insert(recetas)
      .values({
        id_consulta: recetaOriginal.id_consulta,
        tipo_receta: 'resurtimiento',
        id_receta_original: recetaOriginal.id_receta,
        folio_receta: nuevoFolio,
        fecha_emision: new Date(),
        vigencia_dias: 30, // Vigencia estándar de 30 días
        observaciones_generales: `Receta de resurtimiento generada a partir de ${folio_original}`,
      })
      .returning();

    const nuevaReceta = (insertedReceta as any)[0];

    console.log('✅ Nueva receta creada:', nuevaReceta.id_receta);

    // ============================================================
    // AGRUPAR CUPONES POR MEDICAMENTO
    // ============================================================

    // Los cupones pueden ser del mismo medicamento (diferentes meses)
    // Necesitamos agruparlos para crear un solo detalle_receta por medicamento
    const medicamentosMap = new Map<
      number,
      {
        id_medicamento: number;
        cantidad_total: number;
        dosis: string;
        cupones: any[];
      }
    >();

    for (const cupon of cupones) {
      if (!medicamentosMap.has(cupon.id_medicamento)) {
        medicamentosMap.set(cupon.id_medicamento, {
          id_medicamento: cupon.id_medicamento,
          cantidad_total: cupon.cantidad,
          dosis: cupon.dosis,
          cupones: [cupon],
        });
      } else {
        const existente = medicamentosMap.get(cupon.id_medicamento)!;
        existente.cantidad_total += cupon.cantidad;
        existente.cupones.push(cupon);
      }
    }

    console.log(
      `📦 Medicamentos agrupados: ${medicamentosMap.size} medicamento(s)`
    );

    // ============================================================
    // CREAR DETALLES DE RECETA
    // ============================================================

    const detallesCreados: any[] = [];

    for (const [id_med, datos] of medicamentosMap) {
      // Obtener información del medicamento
      const [med] = await db
        .select()
        .from(medicamentos)
        .where(eq(medicamentos.id_medicamento, id_med));

      if (!med) {
        console.warn(`⚠️ Medicamento ${id_med} no encontrado`);
        continue;
      }

      // Crear detalle de receta
      const insertedDetalle = await db
        .insert(detalleReceta)
        .values({
          id_receta: nuevaReceta.id_receta,
          id_medicamento: id_med,
          cantidad_total: datos.cantidad_total,
          dosis: datos.dosis,
          duracion_tratamiento_dias: 30, // Estándar para resurtimiento
          via_administracion: 'Oral',
          indicaciones: `Resurtimiento - Cupón(es) #${datos.cupones.map((c: any) => c.numero_resurtimiento).join(', ')}`,
          realizar_resurtimiento: false, // Las recetas de resurtimiento NO generan nuevos cupones
          meses_resurtimiento: null,
        })
        .returning();

      const nuevoDetalle = (insertedDetalle as any)[0];

      detallesCreados.push({
        ...nuevoDetalle,
        medicamento: med,
        cupones_asociados: datos.cupones,
      });

      console.log(
        `✅ Detalle creado para ${med.nombre_comercial} - ${datos.cantidad_total} piezas`
      );
    }

    // ============================================================
    // MARCAR CUPONES CON LA RECETA DE RESURTIMIENTO GENERADA
    // ============================================================

    await db
      .update(controlResurtimientos)
      .set({
        id_receta_resurtimiento: nuevaReceta.id_receta,
        fecha_receta_generada: new Date(),
      })
      .where(inArray(controlResurtimientos.id_control, idsCupones));

    console.log(`✅ ${idsCupones.length} cupones marcados con receta de resurtimiento`);

    // ============================================================
    // OBTENER INFORMACIÓN COMPLETA PARA IMPRIMIR
    // ============================================================

    // Obtener datos de la consulta para información del paciente
    const [consultaData] = await db
      .select()
      .from(consulta)
      .where(eq(consulta.idConsulta, recetaOriginal.id_consulta));

    // Preparar datos para impresión
    const datosImpresion = {
      receta: {
        id_receta: nuevaReceta.id_receta,
        folio_receta: nuevaReceta.folio_receta,
        fecha_emision: nuevaReceta.fecha_emision,
        tipo_receta: nuevaReceta.tipo_receta,
        folio_receta_original: folio_original,
      },
      paciente: {
        nombre: consultaData?.nombre || 'N/A',
        nomina: consultaData?.noNomina || 'N/A',
      },
      medicamentos: detallesCreados.map((d) => ({
        id_detalle: d.id_detalle,
        nombre_comercial: d.medicamento.nombre_comercial,
        sustancia_activa: d.medicamento.sustancia_activa,
        presentacion: d.medicamento.presentacion,
        dosis: d.dosis,
        cantidad_total: d.cantidad_total,
        via_administracion: d.via_administracion,
        indicaciones: d.indicaciones,
        cupones: d.cupones_asociados.map((c: any) => c.numero_resurtimiento),
      })),
    };

    console.log('✅ [Generar Resurtimiento] Completado exitosamente');

    return NextResponse.json({
      success: true,
      message: 'Receta de resurtimiento generada exitosamente',
      data: {
        ...datosImpresion,
        // ✨ NUEVO: URL para descargar el PDF
        url_pdf: `/api/recetas/generar-pdf/${nuevaReceta.id_receta}`,
      },
    });
  } catch (error: any) {
    console.error('❌ Error al generar receta de resurtimiento:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al generar receta de resurtimiento',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
