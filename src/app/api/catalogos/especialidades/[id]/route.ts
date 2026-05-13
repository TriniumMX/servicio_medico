// src/app/api/catalogos/especialidades/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeQueryOne } from '@/lib/dbPostgres';
import type {
  Especialidad,
  UpdateEspecialidadDTO,
  ApiResponse
} from '@/types/catalogos/especialidades';

/**
 * GET - Obtener especialidad por ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const claveespecialidad = parseInt(id);

    if (isNaN(claveespecialidad)) {
      const response: ApiResponse<null> = {
        success: false,
        message: 'ID de especialidad inválido',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const result = await executeQueryOne<Especialidad>(`
      SELECT
        claveespecialidad,
        especialidad,
        especial,
        estatus
      FROM especialidades
      WHERE claveespecialidad = $1
    `, [claveespecialidad]);

    if (!result) {
      const response: ApiResponse<null> = {
        success: false,
        message: 'Especialidad no encontrada',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<Especialidad> = {
      success: true,
      message: 'Especialidad obtenida correctamente',
      data: result,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error al obtener especialidad:', error);

    const response: ApiResponse<null> = {
      success: false,
      message: 'Error al obtener la especialidad',
      error: error instanceof Error ? error.message : 'Error desconocido',
    };

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * PUT - Actualizar especialidad
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const claveespecialidad = parseInt(id);

    if (isNaN(claveespecialidad)) {
      const response: ApiResponse<null> = {
        success: false,
        message: 'ID de especialidad inválido',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const body: UpdateEspecialidadDTO = await request.json();

    // Validar que especial sea S o N si viene en el body
    if (body.especial && body.especial !== 'S' && body.especial !== 'N') {
      const response: ApiResponse<null> = {
        success: false,
        message: 'El campo especial debe ser S o N',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Verificar que la especialidad existe
    const existe = await executeQueryOne<{ count: string }>(`
      SELECT COUNT(*) as count
      FROM especialidades
      WHERE claveespecialidad = $1
    `, [claveespecialidad]);

    if (!existe || parseInt(existe.count) === 0) {
      const response: ApiResponse<null> = {
        success: false,
        message: 'Especialidad no encontrada',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Validar que no exista otra especialidad con el mismo nombre (si se está actualizando el nombre)
    if (body.especialidad) {
      const duplicado = await executeQueryOne<{ count: string }>(`
        SELECT COUNT(*) as count
        FROM especialidades
        WHERE especialidad = $1
          AND claveespecialidad != $2
      `, [body.especialidad.trim(), claveespecialidad]);

      if (duplicado && parseInt(duplicado.count) > 0) {
        const response: ApiResponse<null> = {
          success: false,
          message: 'Ya existe otra especialidad con ese nombre',
        };
        return NextResponse.json(response, { status: 409 });
      }
    }

    // Construir query de actualización dinámica
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (body.especialidad !== undefined) {
      updates.push(`especialidad = $${paramCount}`);
      values.push(body.especialidad.trim());
      paramCount++;
    }

    if (body.especial !== undefined) {
      updates.push(`especial = $${paramCount}`);
      values.push(body.especial);
      paramCount++;
    }

    if (body.estatus !== undefined) {
      updates.push(`estatus = $${paramCount}`);
      values.push(body.estatus);
      paramCount++;
    }

    if (updates.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        message: 'No hay campos para actualizar',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Agregar el ID al final de los valores
    values.push(claveespecialidad);

    // Ejecutar actualización
    const result = await executeQueryOne<Especialidad>(`
      UPDATE especialidades
      SET ${updates.join(', ')}
      WHERE claveespecialidad = $${paramCount}
      RETURNING *
    `, values);

    const response: ApiResponse<Especialidad> = {
      success: true,
      message: 'Especialidad actualizada correctamente',
      data: result!,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error al actualizar especialidad:', error);

    const response: ApiResponse<null> = {
      success: false,
      message: 'Error al actualizar la especialidad',
      error: error instanceof Error ? error.message : 'Error desconocido',
    };

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * DELETE - Eliminar especialidad
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const claveespecialidad = parseInt(id);

    if (isNaN(claveespecialidad)) {
      const response: ApiResponse<null> = {
        success: false,
        message: 'ID de especialidad inválido',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Verificar que la especialidad existe
    const existe = await executeQueryOne<{ count: string }>(`
      SELECT COUNT(*) as count
      FROM especialidades
      WHERE claveespecialidad = $1
    `, [claveespecialidad]);

    if (!existe || parseInt(existe.count) === 0) {
      const response: ApiResponse<null> = {
        success: false,
        message: 'Especialidad no encontrada',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Eliminar especialidad
    await executeQuery(`
      DELETE FROM especialidades
      WHERE claveespecialidad = $1
    `, [claveespecialidad]);

    const response: ApiResponse<null> = {
      success: true,
      message: 'Especialidad eliminada correctamente',
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error al eliminar especialidad:', error);

    const response: ApiResponse<null> = {
      success: false,
      message: 'Error al eliminar la especialidad',
      error: error instanceof Error ? error.message : 'Error desconocido',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
