// src/app/api/hospitales/actualizar/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeQueryOne } from '@/lib/dbPostgres';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id_hospital, nombre_hospital, activo } = body;

    // Validaciones
    if (!id_hospital) {
      return NextResponse.json(
        {
          success: false,
          error: 'El ID del hospital es requerido',
        },
        { status: 400 }
      );
    }

    if (!nombre_hospital || nombre_hospital.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: 'El nombre del hospital es requerido',
        },
        { status: 400 }
      );
    }

    // Verificar si el hospital existe
    const checkExist = await executeQuery(`
      SELECT id_hospital
      FROM hospitales
      WHERE id_hospital = $1
    `, [id_hospital]);

    if (checkExist.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Hospital no encontrado',
        },
        { status: 404 }
      );
    }

    // Verificar si el nombre ya existe en otro hospital
    const checkName = await executeQueryOne<{ count: string }>(`
      SELECT COUNT(*) as count
      FROM hospitales
      WHERE nombre_hospital = $1 AND id_hospital != $2
    `, [nombre_hospital.trim(), id_hospital]);

    if (checkName && parseInt(checkName.count) > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ya existe otro hospital con ese nombre',
        },
        { status: 400 }
      );
    }

    // Actualizar el hospital
    const result = await executeQueryOne(`
      UPDATE hospitales
      SET
        nombre_hospital = $1,
        activo = $2,
        fecha_modificacion = CURRENT_TIMESTAMP
      WHERE id_hospital = $3
      RETURNING *
    `, [nombre_hospital.trim(), activo !== undefined ? activo : true, id_hospital]);

    return NextResponse.json({
      success: true,
      message: 'Hospital actualizado exitosamente',
      hospital: result,
    });
  } catch (error: any) {
    console.error('Error al actualizar hospital:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al actualizar el hospital',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
