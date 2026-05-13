// src/app/api/farmacia/unidades-medida/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { unidadesMedida, medicamentos } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

// GET: Obtener una unidad de medida por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idMedida = parseInt(id);

    if (isNaN(idMedida)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    const [unidad] = await db
      .select()
      .from(unidadesMedida)
      .where(eq(unidadesMedida.id_medida, idMedida));

    if (!unidad) {
      return NextResponse.json(
        { success: false, error: 'Unidad de medida no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: unidad,
    });

  } catch (error: any) {
    console.error('❌ Error al obtener unidad de medida:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener unidad de medida' },
      { status: 500 }
    );
  }
}

// PUT: Actualizar una unidad de medida
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idMedida = parseInt(id);

    if (isNaN(idMedida)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

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

    // Verificar que la unidad existe
    const [unidadExistente] = await db
      .select()
      .from(unidadesMedida)
      .where(eq(unidadesMedida.id_medida, idMedida));

    if (!unidadExistente) {
      return NextResponse.json(
        { success: false, error: 'Unidad de medida no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si la nueva abreviatura ya está en uso por otra unidad
    const existente = await db
      .select()
      .from(unidadesMedida)
      .where(
        sql`LOWER(${unidadesMedida.abreviatura}) = LOWER(${abreviatura})
            AND ${unidadesMedida.id_medida} != ${idMedida}`
      );

    if (existente.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Ya existe otra unidad de medida con esa abreviatura' },
        { status: 409 }
      );
    }

    // Actualizar unidad
    const [unidadActualizada] = await db
      .update(unidadesMedida)
      .set({
        medida: medida.trim(),
        abreviatura: abreviatura.trim().toUpperCase(),
      })
      .where(eq(unidadesMedida.id_medida, idMedida))
      .returning();

    return NextResponse.json({
      success: true,
      data: unidadActualizada,
      message: 'Unidad de medida actualizada exitosamente',
    });

  } catch (error: any) {
    console.error('❌ Error al actualizar unidad de medida:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar unidad de medida' },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar una unidad de medida
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idMedida = parseInt(id);

    if (isNaN(idMedida)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Verificar que la unidad existe
    const [unidadExistente] = await db
      .select()
      .from(unidadesMedida)
      .where(eq(unidadesMedida.id_medida, idMedida));

    if (!unidadExistente) {
      return NextResponse.json(
        { success: false, error: 'Unidad de medida no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si hay medicamentos usando esta unidad
    const medicamentosConUnidad = await db
      .select()
      .from(medicamentos)
      .where(eq(medicamentos.id_medida, idMedida))
      .limit(1);

    if (medicamentosConUnidad.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se puede eliminar esta unidad de medida porque está siendo usada por uno o más medicamentos'
        },
        { status: 409 }
      );
    }

    // Eliminar unidad
    await db
      .delete(unidadesMedida)
      .where(eq(unidadesMedida.id_medida, idMedida));

    return NextResponse.json({
      success: true,
      message: 'Unidad de medida eliminada exitosamente',
    });

  } catch (error: any) {
    console.error('❌ Error al eliminar unidad de medida:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar unidad de medida' },
      { status: 500 }
    );
  }
}
