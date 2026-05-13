// src/app/api/catalogos/especialidades/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeQueryOne } from '@/lib/dbPostgres';
import type {
  Especialidad,
  CreateEspecialidadDTO,
  ApiResponse
} from '@/types/catalogos/especialidades';

/**
 * GET - Obtener especialidades
 * Si se pasa ?id_hospital=X, solo retorna las especialidades que tienen
 * al menos un médico especialista activo asignado a ese hospital.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idHospital = searchParams.get('id_hospital');

    let result: Especialidad[];

    if (idHospital) {
      // Solo especialidades con especialistas en ese hospital
      result = await executeQuery<Especialidad>(`
        SELECT DISTINCT
          e.claveespecialidad,
          e.especialidad,
          e.especial,
          e.estatus
        FROM especialidades e
        INNER JOIN usuarios u
          ON u.id_especialidad = e.claveespecialidad
          AND u.id_tipousuario IN (2, 11)
          AND u.activo = true
          AND u.id_hospital = $1
        WHERE e.estatus = true
        ORDER BY e.especialidad ASC
      `, [idHospital]);
    } else {
      result = await executeQuery<Especialidad>(`
        SELECT
          claveespecialidad,
          especialidad,
          especial,
          estatus
        FROM especialidades
        ORDER BY especialidad ASC
      `);
    }

    const response: ApiResponse<Especialidad[]> = {
      success: true,
      message: 'Especialidades obtenidas correctamente',
      data: result,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error al obtener especialidades:', error);

    const response: ApiResponse<null> = {
      success: false,
      message: 'Error al obtener las especialidades',
      error: error instanceof Error ? error.message : 'Error desconocido',
    };

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * POST - Crear nueva especialidad
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateEspecialidadDTO = await request.json();

    // Validación básica
    if (!body.especialidad || body.especialidad.trim() === '') {
      const response: ApiResponse<null> = {
        success: false,
        message: 'El nombre de la especialidad es requerido',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validar que especial sea S o N
    if (body.especial !== 'S' && body.especial !== 'N') {
      const response: ApiResponse<null> = {
        success: false,
        message: 'El campo especial debe ser S o N',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validar que no exista una especialidad con el mismo nombre
    const existe = await executeQueryOne<{ count: string }>(`
      SELECT COUNT(*) as count
      FROM especialidades
      WHERE especialidad = $1
    `, [body.especialidad.trim()]);

    if (existe && parseInt(existe.count) > 0) {
      const response: ApiResponse<null> = {
        success: false,
        message: 'Ya existe una especialidad con ese nombre',
      };
      return NextResponse.json(response, { status: 409 });
    }

    // Insertar nueva especialidad
    const result = await executeQueryOne<Especialidad>(`
      INSERT INTO especialidades (especialidad, especial, estatus)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [body.especialidad.trim(), body.especial, body.estatus]);

    const response: ApiResponse<Especialidad> = {
      success: true,
      message: 'Especialidad creada correctamente',
      data: result!,
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Error al crear especialidad:', error);

    const response: ApiResponse<null> = {
      success: false,
      message: 'Error al crear la especialidad',
      error: error instanceof Error ? error.message : 'Error desconocido',
    };

    return NextResponse.json(response, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { claveespecialidad, especialidad, especial, estatus } = body;

    if (!claveespecialidad) {
      return NextResponse.json({ success: false, message: 'ID requerido' }, { status: 400 });
    }

    // Si se está actualizando el nombre, verificar duplicados (excluyendo el actual)
    if (especialidad) {
      const existe = await executeQueryOne<{ count: string }>(`
        SELECT COUNT(*) as count
        FROM especialidades
        WHERE especialidad = $1 AND claveespecialidad != $2
      `, [especialidad.trim(), claveespecialidad]);

      if (existe && parseInt(existe.count) > 0) {
        return NextResponse.json({ success: false, message: 'Ya existe otra especialidad con ese nombre' }, { status: 409 });
      }
    }

    // Construimos la query dinámicamente o actualizamos todo
    // Aquí actualizamos todo lo que venga, si no viene se mantiene el valor actual (coalesce en SQL o lógica aquí)
    // Para simplificar, asumimos que el hook envía el objeto completo o los campos a cambiar.
    
    await executeQuery(`
      UPDATE especialidades
      SET 
        especialidad = COALESCE($1, especialidad),
        especial = COALESCE($2, especial),
        estatus = COALESCE($3, estatus)
      WHERE claveespecialidad = $4
    `, [especialidad, especial, estatus, claveespecialidad]);

    return NextResponse.json({
      success: true,
      message: 'Especialidad actualizada correctamente'
    });

  } catch (error) {
    console.error('Error al actualizar:', error);
    return NextResponse.json({ success: false, message: 'Error al actualizar' }, { status: 500 });
  }
}

/**
 * DELETE - Baja Lógica (Inactivar)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID requerido' }, { status: 400 });
    }

    // Baja lógica: estatus = false
    await executeQuery(`
      UPDATE especialidades SET estatus = false WHERE claveespecialidad = $1
    `, [id]);

    return NextResponse.json({
      success: true,
      message: 'Especialidad desactivada correctamente'
    });

  } catch (error) {
    console.error('Error al eliminar:', error);
    return NextResponse.json({ success: false, message: 'Error al eliminar' }, { status: 500 });
  }
}