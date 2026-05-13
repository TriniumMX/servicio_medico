// src/app/api/hospitales/crear/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { executeQueryOne } from '@/lib/dbPostgres';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre_hospital, activo = true } = body;

    // Validaciones
    if (!nombre_hospital || nombre_hospital.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: 'El nombre del hospital es requerido',
        },
        { status: 400 }
      );
    }

    // Verificar si el hospital ya existe
    const checkExist = await executeQueryOne<{ count: string }>(`
      SELECT COUNT(*) as count
      FROM hospitales
      WHERE nombre_hospital = $1
    `, [nombre_hospital.trim()]);

    if (checkExist && parseInt(checkExist.count) > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ya existe un hospital con ese nombre',
        },
        { status: 400 }
      );
    }

    // Insertar el hospital
    const result = await executeQueryOne(`
      INSERT INTO hospitales (nombre_hospital, activo)
      VALUES ($1, $2)
      RETURNING *
    `, [nombre_hospital.trim(), activo]);

    return NextResponse.json({
      success: true,
      message: 'Hospital creado exitosamente',
      hospital: result,
    });
  } catch (error: any) {
    console.error('Error al crear hospital:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al crear el hospital',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
