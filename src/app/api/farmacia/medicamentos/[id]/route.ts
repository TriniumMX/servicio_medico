// src/app/api/farmacia/medicamentos/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { medicamentos, unidadesMedida, inventarioMedicamentos } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

// GET: Obtener un medicamento por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idMedicamento = parseInt(id);

    if (isNaN(idMedicamento)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    const [medicamento] = await db
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
      .where(eq(medicamentos.id_medicamento, idMedicamento));

    if (!medicamento) {
      return NextResponse.json(
        { success: false, error: 'Medicamento no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: medicamento,
    });

  } catch (error: any) {
    console.error('❌ Error al obtener medicamento:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener medicamento' },
      { status: 500 }
    );
  }
}

// PUT: Actualizar medicamento
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idMedicamento = parseInt(id);

    if (isNaN(idMedicamento)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      nombre_comercial,
      sustancia_activa,
      clasificacion,
      id_medida,
      codigo_ean,
      precio_unitario,
      activo,
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

    // Verificar que el medicamento existe
    const [medicamentoExistente] = await db
      .select()
      .from(medicamentos)
      .where(eq(medicamentos.id_medicamento, idMedicamento));

    if (!medicamentoExistente) {
      return NextResponse.json(
        { success: false, error: 'Medicamento no encontrado' },
        { status: 404 }
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

    // Verificar si el código EAN ya está en uso por otro medicamento
    if (codigo_ean) {
      const existente = await db
        .select()
        .from(medicamentos)
        .where(
          sql`${medicamentos.codigo_ean} = ${codigo_ean}
              AND ${medicamentos.id_medicamento} != ${idMedicamento}`
        );

      if (existente.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Ya existe otro medicamento con ese código EAN' },
          { status: 409 }
        );
      }
    }

    // Actualizar medicamento
    const [medicamentoActualizado] = await db
      .update(medicamentos)
      .set({
        nombre_comercial: nombre_comercial.trim(),
        sustancia_activa: sustancia_activa.trim(),
        clasificacion,
        id_medida,
        codigo_ean: codigo_ean?.trim() || null,
        precio_unitario: precio_unitario.toString(),
        activo: activo !== undefined ? activo : medicamentoExistente.activo,
        updated_at: new Date(),
      })
      .where(eq(medicamentos.id_medicamento, idMedicamento))
      .returning();

    return NextResponse.json({
      success: true,
      data: medicamentoActualizado,
      message: 'Medicamento actualizado exitosamente',
    });

  } catch (error: any) {
    console.error('❌ Error al actualizar medicamento:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar medicamento' },
      { status: 500 }
    );
  }
}

// DELETE: Desactivar medicamento (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idMedicamento = parseInt(id);

    if (isNaN(idMedicamento)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Verificar que el medicamento existe
    const [medicamentoExistente] = await db
      .select()
      .from(medicamentos)
      .where(eq(medicamentos.id_medicamento, idMedicamento));

    if (!medicamentoExistente) {
      return NextResponse.json(
        { success: false, error: 'Medicamento no encontrado' },
        { status: 404 }
      );
    }

    // Desactivar medicamento (soft delete)
    await db
      .update(medicamentos)
      .set({
        activo: false,
        updated_at: new Date(),
      })
      .where(eq(medicamentos.id_medicamento, idMedicamento));

    return NextResponse.json({
      success: true,
      message: 'Medicamento desactivado exitosamente',
    });

  } catch (error: any) {
    console.error('❌ Error al desactivar medicamento:', error);
    return NextResponse.json(
      { success: false, error: 'Error al desactivar medicamento' },
      { status: 500 }
    );
  }
}
