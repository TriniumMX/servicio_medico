// src/app/api/referencias/admin/notificar/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { executeQueryOne } from '@/lib/dbPostgres';
import type {
  NotificarPacienteRequest,
  ReferenciaResponse
} from '@/types/referencias';

/**
 * POST - Registrar notificación al paciente
 * FASE 4: Admin Referencias
 */
export async function POST(request: NextRequest) {
  try {
    const body: NotificarPacienteRequest = await request.json();

    // Validar campos requeridos
    if (!body.id_referencia) {
      return NextResponse.json(
        {
          success: false,
          error: 'El ID de referencia es requerido'
        },
        { status: 400 }
      );
    }

    const medio = (body as any).medio_notificacion || 'No especificado';
    const obs = (body as any).observaciones || '';

    // Construir el string final para guardar en BD
    const finalObservaciones = `Medio: ${medio}. ${obs}`.trim();

    // Verificar que la referencia existe y está en estatus correcto
    const referencia = await executeQueryOne<{
      estatus: string;
    }>(`
      SELECT estatus
      FROM referencias_especialidad
      WHERE id_referencia = $1
    `, [body.id_referencia]);

    if (!referencia) {
      return NextResponse.json(
        {
          success: false,
          error: 'Referencia no encontrada'
        },
        { status: 404 }
      );
    }

    if (referencia.estatus !== 'asignada') {
      return NextResponse.json(
        {
          success: false,
          error: `La referencia no puede ser notificada. Estatus actual: ${referencia.estatus}`
        },
        { status: 400 }
      );
    }

    // Obtener el ID del admin logueado desde el JWT
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret) as { payload: { id: number } };
    const idAdmin = payload.id;

    // Actualizar la referencia
    const referenciaActualizada = await executeQueryOne<{
      id_referencia: number;
      actualizado_en: string;
    }>(`
      UPDATE referencias_especialidad
      SET
        id_usuario_notifica = $1,
        fecha_notificacion = NOW(),
        observaciones_notificacion = $2,
        estatus = 'notificada',
        actualizado_en = NOW()
      WHERE id_referencia = $3
      RETURNING id_referencia, actualizado_en
    `, [
      idAdmin,
      finalObservaciones,
      body.id_referencia
    ]);

    if (!referenciaActualizada) {
      return NextResponse.json(
        {
          success: false,
          error: 'Error al registrar la notificación'
        },
        { status: 500 }
      );
    }

    // Obtener la referencia completa actualizada
    const referenciaCompleta = await executeQueryOne(`
      SELECT
        r.*,
        me.nombre as nombre_medico_asignado,
        ua.nombre as nombre_usuario_asigna,
        co.nombre as nombre_coordinador,
        ad.nombre as nombre_admin_notifica
      FROM referencias_especialidad r
      LEFT JOIN usuarios me ON r.id_medico_asignado = me.id_usuario
      LEFT JOIN usuarios ua ON r.id_usuario_asigna = ua.id_usuario
      LEFT JOIN usuarios co ON r.id_coordinador_autoriza = co.id_usuario
      LEFT JOIN usuarios ad ON r.id_usuario_notifica = ad.id_usuario
      WHERE r.id_referencia = $1
    `, [body.id_referencia]);

    const response: ReferenciaResponse = {
      success: true,
      referencia: referenciaCompleta
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error al notificar paciente:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
