// src/app/api/referencias/hospital/pendientes/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { executeQuery, executeQueryOne } from '@/lib/dbPostgres';
import type {
  ReferenciaEspecialidad,
  ReferenciasResponse
} from '@/types/referencias';

/**
 * GET - Obtener referencias autorizadas pendientes de asignar médico especialista
 * Solo muestra referencias cuyos especialistas disponibles pertenecen al hospital del usuario logueado.
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

    // Si el usuario no tiene hospital asignado, devolvemos lista vacía
    if (!idHospital) {
      return NextResponse.json({ success: true, referencias: [], total: 0 });
    }

    // Solo referencias cuya especialidad solicitada tiene especialistas en este hospital
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
        r.tipo_referencia,
        r.fecha_sugerida_seguimiento,
        r.id_medico_sugerido,
        r.nivel_triage,
        r.estatus,
        r.activo,
        r.creado_en,
        r.actualizado_en,
        coord.nombre AS nombre_coordinador,
        ms.nombre   AS nombre_medico_sugerido,
        c.edad,
        c.sexo,
        c.departamento
      FROM referencias_especialidad r
      INNER JOIN consulta c ON r.id_consulta_origen = c.id_consulta
      LEFT JOIN usuarios coord ON r.id_coordinador_autoriza = coord.id_usuario
      LEFT JOIN usuarios ms    ON r.id_medico_sugerido = ms.id_usuario
      -- Filtrar: solo referencias donde hay al menos un especialista en este hospital
      WHERE r.estatus = 'autorizada'
        AND r.activo = true
        AND EXISTS (
          SELECT 1 FROM usuarios u
          WHERE u.id_especialidad = r.id_especialidad_solicitada
            AND u.id_tipousuario IN (2, 11)
            AND u.activo = true
            AND u.id_hospital = $1
        )
      ORDER BY r.fecha_autorizacion ASC
    `, [idHospital]);

    const response: ReferenciasResponse = {
      success: true,
      referencias: referencias,
      total: referencias.length
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error al obtener referencias pendientes:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
