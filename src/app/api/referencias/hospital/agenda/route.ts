// src/app/api/referencias/hospital/agenda/route.ts

import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/dbPostgres';

interface CitaRaw {
  id_usuario: number;
  nombre_medico: string;
  id_referencia: number;
  folio: string;
  nombre_paciente: string;
  no_nomina: string;
  nombre_especialidad: string;
  fecha_cita: string;
  estatus: string;
}

export interface CitaAgenda {
  id_referencia: number;
  folio: string;
  nombre_paciente: string;
  no_nomina: string;
  nombre_especialidad: string;
  fecha_cita: string;
  estatus: 'asignada' | 'notificada';
}

export interface MedicoAgenda {
  id_usuario: number;
  nombre: string;
  especialidad: string;
  total_citas: number;
  citas: CitaAgenda[];
}

/**
 * GET — Agenda de médicos especialistas.
 * Devuelve médicos que tienen al menos una cita próxima (asignada | notificada),
 * cada uno con su lista de citas ordenadas por fecha.
 */
export async function GET() {
  try {
    const rows = await executeQuery<CitaRaw>(`
      SELECT
        u.id_usuario,
        u.nombre              AS nombre_medico,
        r.id_referencia,
        r.folio,
        r.nombre_paciente,
        r.no_nomina,
        r.nombre_especialidad,
        r.fecha_cita,
        r.estatus
      FROM referencias_especialidad r
      INNER JOIN usuarios u ON r.id_medico_asignado = u.id_usuario
      WHERE r.estatus IN ('asignada', 'notificada')
        AND r.activo = true
        AND r.fecha_cita IS NOT NULL
      ORDER BY u.nombre ASC, r.fecha_cita ASC
    `);

    // Agrupar por médico
    const mapa = new Map<number, MedicoAgenda>();

    for (const row of rows) {
      if (!mapa.has(row.id_usuario)) {
        mapa.set(row.id_usuario, {
          id_usuario:  row.id_usuario,
          nombre:      row.nombre_medico,
          especialidad: row.nombre_especialidad,
          total_citas: 0,
          citas:       [],
        });
      }

      const medico = mapa.get(row.id_usuario)!;
      medico.citas.push({
        id_referencia:     row.id_referencia,
        folio:             row.folio,
        nombre_paciente:   row.nombre_paciente,
        no_nomina:         row.no_nomina,
        nombre_especialidad: row.nombre_especialidad,
        fecha_cita:        row.fecha_cita,
        estatus:           row.estatus as 'asignada' | 'notificada',
      });
      medico.total_citas++;
    }

    const medicos = Array.from(mapa.values());

    return NextResponse.json({ success: true, medicos, total: medicos.length });
  } catch (error) {
    console.error('Error al obtener agenda:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
