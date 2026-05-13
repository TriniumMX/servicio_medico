// src/app/api/farmacia/medicamentos/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { medicamentos, unidadesMedida, inventarioMedicamentos } from '@/db/schema';
import { eq, or, ilike, desc, sql, and, isNull } from 'drizzle-orm';

// GET: Obtener todos los medicamentos con sus unidades de medida
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const busqueda = searchParams.get('busqueda');
    const soloActivos = searchParams.get('activos') === 'true';
    const clasificacion = searchParams.get('clasificacion');
    const sinEan = searchParams.get('sinEan') === 'true';

    let query = db
      .select({
        id_medicamento: medicamentos.id_medicamento,
        nombre_comercial: medicamentos.nombre_comercial,
        sustancia_activa: medicamentos.sustancia_activa,
        clasificacion: medicamentos.clasificacion,
        id_medida: medicamentos.id_medida,
        codigo_ean: medicamentos.codigo_ean,
        precio_unitario: medicamentos.precio_unitario,
        activo: medicamentos.activo,
        created_at: medicamentos.created_at,
        updated_at: medicamentos.updated_at,
        medida: unidadesMedida.medida,
        abreviatura: unidadesMedida.abreviatura,
      })
      .from(medicamentos)
      .leftJoin(unidadesMedida, eq(medicamentos.id_medida, unidadesMedida.id_medida))
      .$dynamic();

    // Filtros
    const conditions = [];

    if (soloActivos) {
      conditions.push(eq(medicamentos.activo, true));
    }

    if (clasificacion) {
      conditions.push(eq(medicamentos.clasificacion, clasificacion as any));
    }

    if (sinEan) {
      conditions.push(isNull(medicamentos.codigo_ean));
    }

    if (busqueda) {
      conditions.push(
        or(
          ilike(medicamentos.nombre_comercial, `%${busqueda}%`),
          ilike(medicamentos.sustancia_activa, `%${busqueda}%`),
          ilike(medicamentos.codigo_ean, `%${busqueda}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const resultado = await query.orderBy(desc(medicamentos.created_at));

    return NextResponse.json({
      success: true,
      data: resultado,
    });
  } catch (error: any) {
    console.error('❌ Error al obtener medicamentos:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener medicamentos' },
      { status: 500 }
    );
  }
}

// POST: Crear nuevo medicamento
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nombre_comercial,
      sustancia_activa,
      clasificacion,
      id_medida,
      codigo_ean,
      precio_unitario,
    } = body;

    // Validaciones
    if (!nombre_comercial || !sustancia_activa || !clasificacion || !id_medida || precio_unitario === undefined) {
      return NextResponse.json(
        { success: false, error: 'Todos los campos obligatorios son requeridos' },
        { status: 400 }
      );
    }

    if (precio_unitario < 0) {
      return NextResponse.json(
        { success: false, error: 'El precio no puede ser negativo' },
        { status: 400 }
      );
    }

    // Verificar que la unidad de medida existe
    const [unidadExiste] = await db
      .select()
      .from(unidadesMedida)
      .where(eq(unidadesMedida.id_medida, id_medida));

    if (!unidadExiste) {
      return NextResponse.json(
        { success: false, error: 'La unidad de medida seleccionada no existe' },
        { status: 404 }
      );
    }

    // Verificar si ya existe un medicamento con el mismo código EAN (si se proporcionó)
    if (codigo_ean) {
      const existente = await db
        .select()
        .from(medicamentos)
        .where(eq(medicamentos.codigo_ean, codigo_ean));

      if (existente.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Ya existe un medicamento con ese código EAN' },
          { status: 409 }
        );
      }
    }

    // Insertar medicamento
    const [nuevoMedicamento] = await db
      .insert(medicamentos)
      .values({
        nombre_comercial: nombre_comercial.trim(),
        sustancia_activa: sustancia_activa.trim(),
        clasificacion,
        id_medida,
        codigo_ean: codigo_ean?.trim() || null,
        precio_unitario: precio_unitario.toString(),
        activo: true,
      })
      .returning();

    // Crear registro de inventario automáticamente con valores por defecto
    await db.insert(inventarioMedicamentos).values({
      id_medicamento: nuevoMedicamento.id_medicamento,
      existencia_actual: 0,
      fondo_fijo: 100,
      es_cuadro_basico: false,
    });

    return NextResponse.json({
      success: true,
      data: nuevoMedicamento,
      message: 'Medicamento creado exitosamente',
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Error al crear medicamento:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear medicamento' },
      { status: 500 }
    );
  }
}
