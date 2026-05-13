// src/app/api/farmacia/medicamentos/buscar-ean/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { medicamentos, inventarioMedicamentos } from '@/db/schema/farmacia';
import { eq } from 'drizzle-orm';

/**
 * GET - Buscar medicamento por código EAN
 *
 * Query params:
 * - ean: Código EAN del medicamento (ej: 7501008493366)
 *
 * Retorna:
 * - Información del medicamento
 * - Información del inventario actual
 * - Stock disponible
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ean = searchParams.get('ean');

    // Validar parámetro
    if (!ean) {
      return NextResponse.json(
        {
          success: false,
          error: 'Debe proporcionar el código EAN del medicamento',
        },
        { status: 400 }
      );
    }

    console.log(`🔍 [Buscar EAN] Buscando medicamento con EAN: ${ean}`);

    // Buscar medicamento por EAN
    const [medicamento] = await db
      .select()
      .from(medicamentos)
      .where(eq(medicamentos.codigo_ean, ean));

    if (!medicamento) {
      return NextResponse.json(
        {
          success: false,
          error: 'Medicamento no encontrado',
          ean_buscado: ean,
        },
        { status: 404 }
      );
    }

    // Verificar si está activo
    if (!medicamento.activo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Este medicamento está inactivo',
          medicamento: {
            id_medicamento: medicamento.id_medicamento,
            nombre_comercial: medicamento.nombre_comercial,
          },
        },
        { status: 400 }
      );
    }

    // Obtener información del inventario
    const [inventario] = await db
      .select()
      .from(inventarioMedicamentos)
      .where(eq(inventarioMedicamentos.id_medicamento, medicamento.id_medicamento));

    if (!inventario) {
      return NextResponse.json(
        {
          success: false,
          error: 'Este medicamento no tiene registro en inventario',
          medicamento: {
            id_medicamento: medicamento.id_medicamento,
            nombre_comercial: medicamento.nombre_comercial,
          },
        },
        { status: 404 }
      );
    }

    // Calcular alertas de stock (basado en fondo fijo)
    const sinStock = inventario.existencia_actual === 0;
    const requiereReposicion = inventario.existencia_actual < inventario.fondo_fijo;
    const stockBajo = inventario.existencia_actual > 0 &&
                      inventario.existencia_actual < inventario.fondo_fijo * 0.5;
    const stockCritico = inventario.existencia_actual > 0 &&
                         inventario.existencia_actual < inventario.fondo_fijo * 0.25;

    // Preparar respuesta
    const response = {
      success: true,
      data: {
        medicamento: {
          id_medicamento: medicamento.id_medicamento,
          nombre_comercial: medicamento.nombre_comercial,
          sustancia_activa: medicamento.sustancia_activa,
          clasificacion: medicamento.clasificacion,
          codigo_ean: medicamento.codigo_ean,
          precio_unitario: medicamento.precio_unitario,
        },
        inventario: {
          id_inventario: inventario.id_inventario,
          existencia_actual: inventario.existencia_actual,
          fondo_fijo: inventario.fondo_fijo,
          es_cuadro_basico: inventario.es_cuadro_basico,
        },
        alertas: {
          sin_stock: sinStock,
          stock_bajo: stockBajo,
          stock_critico: stockCritico,
          requiere_reposicion: requiereReposicion,
          mensaje: sinStock
            ? '⛔ Sin stock disponible'
            : stockCritico
            ? '🔴 Stock crítico'
            : stockBajo
            ? '⚠️ Stock bajo'
            : requiereReposicion
            ? '⚠️ Requiere reposición'
            : '✅ Fondo completo',
        },
      },
    };

    console.log(`✅ [Buscar EAN] Medicamento encontrado: ${medicamento.nombre_comercial}`);
    console.log(`   📦 Existencia actual: ${inventario.existencia_actual} / Fondo fijo: ${inventario.fondo_fijo}`);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('❌ Error al buscar medicamento por EAN:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al buscar medicamento',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
