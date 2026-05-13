// src/app/api/referencias/admin/seguimientos/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { executeQuery, executeQueryOne } from '@/lib/dbPostgres';
import { obtenerDatosContactoPaciente } from '@/lib/obtenerDatosContacto';
import type { ReferenciaEspecialidad, ReferenciasResponse } from '@/types/referencias';

interface JwtPayload { id: number; usuario: string; tipoUsuario: number; }

/**
 * GET - Seguimientos visibles para la gestora/admin
 * Devuelve referencias con tipo_referencia = 'seguimiento' en todos los
 * estados post-coordinador: autorizada, asignada, notificada.
 * (pendiente_autorizar y rechazada son del coordinador, no de admin)
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener hospital del usuario en sesión
    const token = request.cookies.get('token')?.value;
    let idHospitalUsuario: number | null = null;
    if (token) {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret) as { payload: JwtPayload };
      const usuarioDb = await executeQueryOne<{ id_hospital: number | null }>(
        `SELECT id_hospital FROM usuarios WHERE id_usuario = $1`,
        [payload.id]
      );
      idHospitalUsuario = usuarioDb?.id_hospital ?? null;
    }

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
        r.estatus,
        r.activo,
        r.creado_en,
        r.actualizado_en,
        (
          SELECT COUNT(*)::int
          FROM referencias_especialidad r2
          WHERE r2.no_nomina = r.no_nomina
            AND r2.id_especialidad_solicitada = r.id_especialidad_solicitada
            AND r2.activo = true
            AND r2.creado_en <= r.creado_en
        ) AS numero_consulta,
        ms.nombre  AS nombre_medico_sugerido,
        me.nombre  AS nombre_medico_asignado,
        me.cedula_profesional,
        co.nombre  AS nombre_coordinador,
        c.edad,
        c.sexo,
        c.departamento,
        c.es_empleado
      FROM referencias_especialidad r
      INNER JOIN consulta c ON r.id_consulta_origen = c.id_consulta
      LEFT JOIN usuarios ms ON r.id_medico_sugerido  = ms.id_usuario
      LEFT JOIN usuarios me ON r.id_medico_asignado   = me.id_usuario
      LEFT JOIN usuarios co ON r.id_coordinador_autoriza = co.id_usuario
      WHERE r.tipo_referencia = 'seguimiento'
        AND r.estatus NOT IN ('pendiente_autorizar', 'cancelada')
        AND r.activo = true
        ${idHospitalUsuario !== null ? 'AND me.id_hospital = ' + idHospitalUsuario : ''}
      ORDER BY r.creado_en DESC
    `);

    // Enriquecer con datos de contacto del paciente
    const referenciasCompletas = await Promise.all(
      referencias.map(async (ref) => {
        const datosContacto = await obtenerDatosContactoPaciente(ref.id_consulta_origen);
        return { ...ref, ...datosContacto };
      })
    );

    const response: ReferenciasResponse = {
      success: true,
      referencias: referenciasCompletas,
      total: referenciasCompletas.length,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error al obtener seguimientos para admin:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
