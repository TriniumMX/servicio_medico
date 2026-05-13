// src/app/api/hospitales/eliminar/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/dbPostgres';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id_hospital = searchParams.get('id');

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

    // Verificar si el hospital existe
    const checkExist = await executeQuery(`
      SELECT id_hospital
      FROM hospitales
      WHERE id_hospital = $1
    `, [parseInt(id_hospital)]);

    if (checkExist.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Hospital no encontrado',
        },
        { status: 404 }
      );
    }

    // Soft delete - marcar como inactivo
    await executeQuery(`
      UPDATE hospitales
      SET
        activo = false,
        fecha_modificacion = CURRENT_TIMESTAMP
      WHERE id_hospital = $1
    `, [parseInt(id_hospital)]);

    return NextResponse.json({
      success: true,
      message: 'Hospital eliminado exitosamente',
    });
  } catch (error: any) {
    console.error('Error al eliminar hospital:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al eliminar el hospital',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
