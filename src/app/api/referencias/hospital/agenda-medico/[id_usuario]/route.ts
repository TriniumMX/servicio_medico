// src/app/api/referencias/hospital/agenda-medico/[id_usuario]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/dbPostgres';

/**
 * GET — Devuelve la agenda semanal de un médico específico.
 * Usado por el hospital al asignar/reprogramar citas para validar disponibilidad.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id_usuario: string }> }
) {
  try {
    const { id_usuario: idParam } = await params;
    const id_usuario = parseInt(idParam);

    if (isNaN(id_usuario)) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }

    const agenda = await executeQuery<{
      dia_semana: number;
      hora_inicio: string;
      hora_fin: string;
    }>(
      `SELECT dia_semana,
              TO_CHAR(hora_inicio, 'HH24:MI') AS hora_inicio,
              TO_CHAR(hora_fin,    'HH24:MI') AS hora_fin
       FROM agenda_medico
       WHERE id_usuario = $1
       ORDER BY dia_semana`,
      [id_usuario]
    );

    return NextResponse.json({ success: true, agenda });
  } catch (error) {
    console.error('Error al obtener agenda del médico:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener agenda' },
      { status: 500 }
    );
  }
}
