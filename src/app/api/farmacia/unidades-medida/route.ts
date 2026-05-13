// src/app/api/farmacia/unidades-medida/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { unidadesMedida } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

// GET: Obtener todas las unidades de medida
export async function GET() {
  try {
    const unidades = await db
      .select()
      .from(unidadesMedida)
      .orderBy(unidadesMedida.medida);

    return NextResponse.json({
      success: true,
      data: unidades,
    });
  } catch (error: any) {
    console.error('❌ Error al obtener unidades de medida:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener unidades de medida' },
      { status: 500 }
    );
  }
}

// POST: Crear nueva unidad de medida
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { medida, abreviatura } = body;

    // Validaciones
    if (!medida || !abreviatura) {
      return NextResponse.json(
        { success: false, error: 'Medida y abreviatura son requeridos' },
        { status: 400 }
      );
    }

    if (medida.length > 50) {
      return NextResponse.json(
        { success: false, error: 'El nombre de la medida no puede exceder 50 caracteres' },
        { status: 400 }
      );
    }

    if (abreviatura.length > 10) {
      return NextResponse.json(
        { success: false, error: 'La abreviatura no puede exceder 10 caracteres' },
        { status: 400 }
      );
    }

    // Verificar si ya existe una unidad con la misma abreviatura
    const existente = await db
      .select()
      .from(unidadesMedida)
      .where(sql`LOWER(${unidadesMedida.abreviatura}) = LOWER(${abreviatura})`);

    if (existente.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Ya existe una unidad de medida con esa abreviatura' },
        { status: 409 }
      );
    }

    // Insertar nueva unidad
    const [nuevaUnidad] = await db
      .insert(unidadesMedida)
      .values({
        medida: medida.trim(),
        abreviatura: abreviatura.trim().toUpperCase(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: nuevaUnidad,
      message: 'Unidad de medida creada exitosamente',
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Error al crear unidad de medida:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear unidad de medida' },
      { status: 500 }
    );
  }
}
