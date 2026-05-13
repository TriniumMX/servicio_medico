// src/app/api/especialidades/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/dbPostgres';

interface Especialidad {
  claveespecialidad: number;
  especialidad: string;
  especial: string;
  estatus: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const especialidades = await executeQuery<Especialidad>(`
      SELECT
        claveespecialidad,
        especialidad,
        especial,
        estatus
      FROM public.especialidades
      ORDER BY especialidad ASC
    `);

    return NextResponse.json({
      success: true,
      especialidades
    }, { status: 200 });
  } catch (error) {
    console.error('Error al obtener especialidades:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al obtener especialidades'
    }, { status: 500 });
  }
}
