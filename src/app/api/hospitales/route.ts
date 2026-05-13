// src/app/api/hospitales/route.ts

import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/dbPostgres';

export async function GET() {
  try {
    const result = await executeQuery(`
      SELECT
        id_hospital,
        nombre_hospital,
        activo,
        fecha_creacion,
        fecha_modificacion
      FROM hospitales
      ORDER BY nombre_hospital
    `);

    return NextResponse.json({
      success: true,
      hospitales: result,
      total: result.length,
    });
  } catch (error: any) {
    console.error('Error al obtener hospitales:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener la lista de hospitales',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
