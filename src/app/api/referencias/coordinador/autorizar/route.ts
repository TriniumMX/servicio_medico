// src/app/api/referencias/coordinador/autorizar/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { executeQuery, executeQueryOne } from '@/lib/dbPostgres';
import { pusherServer } from '@/lib/pusher';
import { guardarNotificacion } from '@/lib/notificaciones';
import type {
  AutorizarReferenciaRequest,
  ReferenciaResponse
} from '@/types/referencias';

/**
 * POST - Autorizar una referencia
 * FASE 2: Coordinador (primera etapa tras la creación)
 */
export async function POST(request: NextRequest) {
  try {
    const body: AutorizarReferenciaRequest = await request.json();

    // Validación de campos requeridos
    if (!body.id_referencia) {
      return NextResponse.json(
        {
          success: false,
          error: 'El ID de referencia es requerido'
        },
        { status: 400 }
      );
    }

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

    if (referencia.estatus !== 'pendiente_autorizar') {
      return NextResponse.json(
        {
          success: false,
          error: `La referencia no puede ser autorizada. Estatus actual: ${referencia.estatus}`
        },
        { status: 400 }
      );
    }

    // Obtener el ID del coordinador logueado desde el JWT
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret) as { payload: { id: number } };
    const idCoordinador = payload.id;

    // Actualizar la referencia
    const referenciaActualizada = await executeQueryOne<{
      id_referencia: number;
      actualizado_en: string;
    }>(`
      UPDATE referencias_especialidad
      SET
        id_coordinador_autoriza = $1,
        fecha_autorizacion = NOW(),
        observaciones_coordinador = $2,
        firma_digital = $3,
        estatus = 'autorizada',
        actualizado_en = NOW()
      WHERE id_referencia = $4
      RETURNING id_referencia, actualizado_en
    `, [
      idCoordinador,
      body.observaciones_coordinador || null,
      body.firma_digital || null,
      body.id_referencia
    ]);

    if (!referenciaActualizada) {
      return NextResponse.json(
        {
          success: false,
          error: 'Error al autorizar la referencia'
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
        c.nombre as nombre_coordinador
      FROM referencias_especialidad r
      LEFT JOIN usuarios me ON r.id_medico_asignado = me.id_usuario
      LEFT JOIN usuarios ua ON r.id_usuario_asigna = ua.id_usuario
      LEFT JOIN usuarios c ON r.id_coordinador_autoriza = c.id_usuario
      WHERE r.id_referencia = $1
    `, [body.id_referencia]);

    // 🔔 Guardar notificación en BD + disparar Pusher SOLO a hospitales con especialistas para esta especialidad
    try {
      const notifPayload = {
        tipo: 'referencia',
        titulo: 'Referencia Autorizada - Pendiente de Asignación',
        mensaje: `${referenciaCompleta.nombre_paciente} - ${referenciaCompleta.nombre_especialidad}. Asignar médico especialista.`,
        datos: {
          id_referencia: body.id_referencia,
          folio: referenciaCompleta.folio,
          no_nomina: referenciaCompleta.no_nomina,
          nombre_paciente: referenciaCompleta.nombre_paciente,
          especialidad: referenciaCompleta.nombre_especialidad
        }
      };
      // Obtener solo los hospitales que tienen especialistas activos para esta especialidad
      const hospitalesDestino = await executeQuery<{ id_hospital: number }>(`
        SELECT DISTINCT id_hospital
        FROM usuarios
        WHERE id_especialidad = $1
          AND id_tipousuario IN (2, 11)
          AND activo = true
          AND id_hospital IS NOT NULL
      `, [referenciaCompleta.id_especialidad_solicitada]);

      const idsHospitales = hospitalesDestino.map(h => h.id_hospital);

      const dbId = await guardarNotificacion({
        tipo: notifPayload.tipo,
        titulo: notifPayload.titulo,
        mensaje: notifPayload.mensaje,
        datos: notifPayload.datos,
        permiso_requerido: 'NOTIF_HOSPITAL_REFERENCIA',
        id_hospitales: idsHospitales.length > 0 ? idsHospitales : undefined,
      });

      if (idsHospitales.length > 0) {
        // Disparar canal por hospital — solo los que tienen el especialista requerido
        await Promise.all(
          idsHospitales.map(idH =>
            pusherServer.trigger(`hospital-channel-${idH}`, 'referencia-autorizada', {
              ...notifPayload,
              datos: { ...notifPayload.datos, id_notificacion: dbId },
            })
          )
        );
        console.log(`📢 Notificación enviada a ${idsHospitales.length} hospital(es) vía Pusher`);
      } else {
        console.warn('⚠️ No se encontraron hospitales con especialistas para esta especialidad');
      }
    } catch (error) {
      console.error('❌ Error enviando notificación al Hospital:', error);
      // No bloqueamos el proceso si falla la notificación
    }

    const response: ReferenciaResponse = {
      success: true,
      referencia: referenciaCompleta
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error al autorizar referencia:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
