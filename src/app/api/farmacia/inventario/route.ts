// src/app/api/farmacia/inventario/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { inventarioMedicamentos, medicamentos, unidadesMedida } from '@/db/schema';
import { eq, and, or, ilike } from 'drizzle-orm';

// GET: Obtener inventario completo con información de medicamentos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const busqueda = searchParams.get('busqueda');
    const cuadroBasico = searchParams.get('cuadro_basico');
    const estadoFondo = searchParams.get('estado_fondo'); // completo, requiere_reposicion

    let query = db
      .select({
        id_inventario: inventarioMedicamentos.id_inventario,
        id_medicamento: inventarioMedicamentos.id_medicamento,
        existencia_actual: inventarioMedicamentos.existencia_actual,
        fondo_fijo: inventarioMedicamentos.fondo_fijo,
        es_cuadro_basico: inventarioMedicamentos.es_cuadro_basico,
        observaciones: inventarioMedicamentos.observaciones,
        created_at: inventarioMedicamentos.created_at,
        updated_at: inventarioMedicamentos.updated_at,
        // Datos del medicamento
        nombre_comercial: medicamentos.nombre_comercial,
        sustancia_activa: medicamentos.sustancia_activa,
        clasificacion: medicamentos.clasificacion,
        precio_unitario: medicamentos.precio_unitario,
        activo: medicamentos.activo,
        // Datos de unidad de medida
        medida: unidadesMedida.medida,
        abreviatura: unidadesMedida.abreviatura,
      })
      .from(inventarioMedicamentos)
      .innerJoin(medicamentos, eq(inventarioMedicamentos.id_medicamento, medicamentos.id_medicamento))
      .leftJoin(unidadesMedida, eq(medicamentos.id_medida, unidadesMedida.id_medida))
      .$dynamic();

    const conditions = [];

    // Filtro de búsqueda por nombre o sustancia activa
    if (busqueda) {
      conditions.push(
        or(
          ilike(medicamentos.nombre_comercial, `%${busqueda}%`),
          ilike(medicamentos.sustancia_activa, `%${busqueda}%`)
        )
      );
    }

    // Filtro de cuadro básico
    if (cuadroBasico === 'true') {
      conditions.push(eq(inventarioMedicamentos.es_cuadro_basico, true));
    } else if (cuadroBasico === 'false') {
      conditions.push(eq(inventarioMedicamentos.es_cuadro_basico, false));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    let resultado = await query;

    // Filtro de estado de fondo (se hace en memoria porque depende de cálculos)
    if (estadoFondo) {
      resultado = resultado.filter((item) => {
        const existencia = item.existencia_actual;
        const fondo = item.fondo_fijo;

        switch (estadoFondo) {
          case 'completo':
            return existencia >= fondo;
          case 'requiere_reposicion':
            return existencia < fondo;
          default:
            return true;
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: resultado,
    });
  } catch (error: any) {
    console.error('Error al obtener inventario:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener inventario' },
      { status: 500 }
    );
  }
}
