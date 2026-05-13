// src/app/api/medicamentos/route.ts

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { medicamentos, unidadesMedida, inventarioMedicamentos } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

/**
 * GET - Obtiene la lista de medicamentos activos desde PostgreSQL
 * Incluye información de inventario para mostrar stock disponible
 */
export async function GET() {
  try {
    const resultado = await db
      .select({
        // Datos del medicamento
        clavemedicamento: medicamentos.id_medicamento,
        medicamento: medicamentos.nombre_comercial,
        clasificacion: medicamentos.clasificacion,
        ean: medicamentos.codigo_ean,
        medida: medicamentos.id_medida,
        unidadmedida: unidadesMedida.medida,
        abreviatura: unidadesMedida.abreviatura,
        sustancia_activa: medicamentos.sustancia_activa,
        precio_unitario: medicamentos.precio_unitario,

        // Datos de inventario (fondo fijo)
        piezas: inventarioMedicamentos.existencia_actual,
        fondo_fijo: inventarioMedicamentos.fondo_fijo,

        // Calcular status del stock (basado en fondo fijo)
        stockstatus: sql<string>`
          CASE
            WHEN ${inventarioMedicamentos.existencia_actual} < ${inventarioMedicamentos.fondo_fijo} * 0.5 THEN 'stock bajo'
            WHEN ${inventarioMedicamentos.existencia_actual} >= ${inventarioMedicamentos.fondo_fijo} THEN 'stock alto'
            ELSE 'stock medio'
          END
        `,
      })
      .from(medicamentos)
      .leftJoin(unidadesMedida, eq(medicamentos.id_medida, unidadesMedida.id_medida))
      .leftJoin(inventarioMedicamentos, eq(medicamentos.id_medicamento, inventarioMedicamentos.id_medicamento))
      .where(eq(medicamentos.activo, true))
      .orderBy(medicamentos.nombre_comercial);

    // Formatear los datos para mantener compatibilidad con el frontend
    const medicamentosFormateados = resultado.map(med => ({
      ...med,
      // Asegurar que ean sea string (puede ser null)
      ean: med.ean || '',
      // Asegurar valores por defecto para inventario (en caso de LEFT JOIN sin match)
      piezas: med.piezas ?? 0,
      maximo: med.fondo_fijo ?? 100,
      minimo: Math.floor((med.fondo_fijo ?? 100) * 0.5),
      stockstatus: (med.stockstatus || 'stock medio') as 'stock bajo' | 'stock medio' | 'stock alto',
    }));

    return NextResponse.json({
      success: true,
      medicamentos: medicamentosFormateados,
      total: medicamentosFormateados.length,
    });

  } catch (error: any) {
    console.error('❌ Error al obtener medicamentos:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener medicamentos' },
      { status: 500 }
    );
  }
}
