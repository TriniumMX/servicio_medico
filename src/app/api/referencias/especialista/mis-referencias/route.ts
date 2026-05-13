// src/app/api/referencias/especialista/mis-referencias/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/dbPostgres';
import type {
  ReferenciaEspecialidad,
  ReferenciasResponse
} from '@/types/referencias';

/**
 * GET - Obtener referencias asignadas al médico especialista logueado
 * FASE 5: Médico Especialista
 *
 * Query params opcionales:
 * - filtro: 'pendientes' | 'atendidas' | 'todas' (default: 'pendientes')
 */
import { jwtVerify } from 'jose';

// ... (existing imports)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filtro = searchParams.get('filtro') || 'pendientes';

    // Obtener ID del médico autenticado
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret) as any;
    const idMedico = payload.id;

    if (!idMedico) {
      return NextResponse.json(
        { success: false, error: 'ID de médico no válido en token' },
        { status: 401 }
      );
    }

    // Construir el WHERE según el filtro
    let condicionEstatus = '';
    if (filtro === 'pendientes') {
      condicionEstatus = "AND r.estatus IN ('asignada', 'notificada')";
    } else if (filtro === 'atendidas') {
      condicionEstatus = "AND r.estatus = 'atendida'";
    } else if (filtro === 'inasistencias') {
      condicionEstatus = "AND r.estatus = 'inasistencia'";
    }
    // Si filtro === 'todas', no agregamos condición de estatus

    const referencias = await executeQuery<ReferenciaEspecialidad>(`
      SELECT
        r.id_referencia,
        r.folio,
        r.id_consulta_origen,
        r.id_consulta_seguimiento,
        r.id_consulta_seguimiento AS id_consulta,
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
        r.motivo_inasistencia,
        r.id_usuario_inasistencia,
        r.fecha_inasistencia,
        r.estatus,
        r.activo,
        r.creado_en,
        r.actualizado_en,
        mr.nombre as nombre_medico_refiere_detalle,
        ui.nombre as nombre_usuario_inasistencia,
        c.edad,
        c.sexo,
        c.departamento,
        c.es_empleado,
        EXISTS (
          SELECT 1 FROM contrareferencias cr 
          WHERE cr.id_referencia_origen = r.id_referencia AND cr.activo = true
        ) AS tiene_contrareferencia,
        EXISTS (
          SELECT 1 FROM referencias_especialidad rs 
          WHERE rs.id_consulta_origen = r.id_consulta_seguimiento AND rs.tipo_referencia = 'seguimiento' AND rs.activo = true
        ) AS tiene_seguimiento
      FROM referencias_especialidad r
      INNER JOIN consulta c ON r.id_consulta_origen = c.id_consulta
      LEFT JOIN usuarios mr ON r.id_medico_refiere = mr.id_usuario
      LEFT JOIN usuarios ui ON r.id_usuario_inasistencia = ui.id_usuario
      WHERE r.id_medico_asignado = $1
        AND r.activo = true
        ${condicionEstatus}
      ORDER BY r.fecha_cita ASC NULLS LAST, r.creado_en ASC
    `, [idMedico]);

    const response: ReferenciasResponse = {
      success: true,
      referencias: referencias,
      total: referencias.length
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error al obtener mis referencias:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
