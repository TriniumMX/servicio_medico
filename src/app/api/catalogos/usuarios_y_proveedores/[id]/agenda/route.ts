// src/app/api/catalogos/usuarios_y_proveedores/[id]/agenda/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/dbPostgres';

export interface AgendaDia {
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
}

/** GET — devuelve la agenda semanal de un usuario */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const id_usuario = parseInt(id);

    if (isNaN(id_usuario)) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }

    const agenda = await executeQuery<AgendaDia>(
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
    console.error('Error al obtener agenda:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener agenda' },
      { status: 500 }
    );
  }
}

/** POST — reemplaza la agenda completa de un usuario (upsert total) */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const id_usuario = parseInt(id);

    if (isNaN(id_usuario)) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }

    const { agenda } = await req.json() as { agenda: AgendaDia[] };

    // Borrar agenda existente y reinsertar
    await executeQuery(`DELETE FROM agenda_medico WHERE id_usuario = $1`, [id_usuario]);

    if (Array.isArray(agenda) && agenda.length > 0) {
      for (const dia of agenda) {
        await executeQuery(
          `INSERT INTO agenda_medico (id_usuario, dia_semana, hora_inicio, hora_fin)
           VALUES ($1, $2, $3, $4)`,
          [id_usuario, dia.dia_semana, dia.hora_inicio, dia.hora_fin]
        );
      }
    }

    return NextResponse.json({ success: true, message: 'Agenda guardada correctamente' });
  } catch (error) {
    console.error('Error al guardar agenda:', error);
    return NextResponse.json(
      { success: false, error: 'Error al guardar agenda' },
      { status: 500 }
    );
  }
}
