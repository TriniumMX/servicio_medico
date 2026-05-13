// src/app/api/referencias/hospital/asignadas/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { executeQuery, executeQueryOne } from '@/lib/dbPostgres';
import type { ReferenciaEspecialidad, ReferenciasResponse } from '@/types/referencias';

/**
 * GET - Referencias ya asignadas (asignada | notificada) que el hospital puede reprogramar.
 * Solo muestra referencias cuyo médico especialista asignado pertenece al hospital del usuario logueado.
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener hospital del usuario logueado
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret) as { payload: { id: number } };

    const usuarioData = await executeQueryOne<{ id_hospital: number | null }>(`
      SELECT id_hospital FROM usuarios WHERE id_usuario = $1
    `, [payload.id]);

    const idHospital = usuarioData?.id_hospital;

    if (!idHospital) {
      return NextResponse.json({ success: true, referencias: [], total: 0 });
    }

    // Solo referencias cuyo especialista asignado pertenece a este hospital
    const referencias = await executeQuery<ReferenciaEspecialidad>(`
      SELECT
        r.id_referencia,
        r.folio,
        r.id_consulta_origen,
        r.id_consulta_seguimiento,
        r.no_nomina,
        r.id_beneficiario,
        r.nombre_paciente,
        r.id_medico_refiere,
        r.nombre_medico_refiere,
        r.id_especialidad_solicitada,
        r.nombre_especialidad,
        r.motivo_referencia,
        r.id_medico_asignado,
        r.fecha_cita,
        r.id_usuario_asigna,
        r.fecha_asignacion,
        r.id_coordinador_autoriza,
        r.fecha_autorizacion,
        r.observaciones_coordinador,
        r.firma_digital,
        r.id_usuario_notifica,
        r.fecha_notificacion,
        r.observaciones_notificacion,
        r.fecha_atencion,
        r.nivel_triage,
        r.estatus,
        r.activo,
        r.creado_en,
        r.actualizado_en,
        me.nombre  AS nombre_medico_asignado,
        coord.nombre AS nombre_coordinador,
        c.edad,
        c.sexo,
        c.departamento
      FROM referencias_especialidad r
      INNER JOIN consulta c ON r.id_consulta_origen = c.id_consulta
      -- Filtrar: especialista asignado debe ser de este hospital
      INNER JOIN usuarios me ON r.id_medico_asignado = me.id_usuario
        AND me.id_hospital = $1
      LEFT JOIN usuarios coord ON r.id_coordinador_autoriza = coord.id_usuario
      WHERE r.estatus IN ('asignada', 'notificada')
        AND r.activo = true
      ORDER BY r.fecha_cita ASC NULLS LAST
    `, [idHospital]);

    const response: ReferenciasResponse = {
      success: true,
      referencias,
      total: referencias.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error al obtener referencias asignadas:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
