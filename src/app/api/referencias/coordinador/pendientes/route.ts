// src/app/api/referencias/coordinador/pendientes/route.ts

import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/dbPostgres';
import type {
  ReferenciaEspecialidad,
  ReferenciasResponse
} from '@/types/referencias';

/**
 * GET - Obtener referencias pendientes de autorización
 * FASE 2: Coordinador (primera etapa tras la creación)
 */
export async function GET() {
  try {
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
        c.edad,
        c.sexo,
        c.departamento
      FROM referencias_especialidad r
      INNER JOIN consulta c ON r.id_consulta_origen = c.id_consulta
      WHERE r.estatus = 'pendiente_autorizar'
        AND r.tipo_referencia = 'normal'
        AND r.activo = true
      ORDER BY r.creado_en ASC
    `);

    const response: ReferenciasResponse = {
      success: true,
      referencias: referencias,
      total: referencias.length
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error al obtener referencias pendientes de autorización:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
