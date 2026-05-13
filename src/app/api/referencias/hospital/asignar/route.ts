// src/app/api/referencias/hospital/asignar/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { executeQuery, executeQueryOne } from '@/lib/dbPostgres';
import { pusherServer } from '@/lib/pusher';
import { guardarNotificacion } from '@/lib/notificaciones';
import { enviarEmailCitaReferencia } from '@/lib/enviarEmailReferencia';
import type {
  AsignarMedicoRequest,
  ReferenciaResponse
} from '@/types/referencias';

/**
 * POST - Asignar médico especialista a una referencia
 * FASE 3: Hospital (después de autorización del coordinador)
 */
export async function POST(request: NextRequest) {
  try {
    const body: AsignarMedicoRequest = await request.json();

    // Validación de campos requeridos
    if (!body.id_referencia || !body.id_medico_asignado || !body.fecha_cita) {
      return NextResponse.json(
        {
          success: false,
          error: 'Faltan campos requeridos: id_referencia, id_medico_asignado, fecha_cita'
        },
        { status: 400 }
      );
    }

    // Validar que la fecha de cita no sea en el pasado
    const fechaCita = new Date(body.fecha_cita);
    const ahora = new Date();

    if (fechaCita < ahora) {
      return NextResponse.json(
        {
          success: false,
          error: 'La fecha de cita no puede ser en el pasado'
        },
        { status: 400 }
      );
    }

    // Verificar que la referencia existe y está en estatus correcto
    const referencia = await executeQueryOne<{
      estatus: string;
      id_especialidad_solicitada: number;
    }>(`
      SELECT estatus, id_especialidad_solicitada
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

    if (referencia.estatus !== 'autorizada') {
      return NextResponse.json(
        {
          success: false,
          error: `La referencia no puede ser asignada. Estatus actual: ${referencia.estatus}`
        },
        { status: 400 }
      );
    }

    // Verificar que el médico existe y tiene la especialidad correcta
    const medico = await executeQueryOne<{
      id_especialidad: number;
      nombre: string;
    }>(`
      SELECT id_especialidad, nombre
      FROM usuarios
      WHERE id_usuario = $1 AND activo = true
    `, [body.id_medico_asignado]);

    if (!medico) {
      return NextResponse.json(
        {
          success: false,
          error: 'Médico no encontrado o inactivo'
        },
        { status: 404 }
      );
    }

    if (medico.id_especialidad !== referencia.id_especialidad_solicitada) {
      return NextResponse.json(
        {
          success: false,
          error: 'El médico no tiene la especialidad solicitada'
        },
        { status: 400 }
      );
    }

    // Obtener el ID del usuario logueado desde el JWT
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret) as { payload: { id: number } };
    const idUsuarioAsigna = payload.id;

    // Obtener el hospital del usuario que asigna (para scoping de notificaciones)
    const usuarioAsigna = await executeQueryOne<{ id_hospital: number | null }>(`
      SELECT id_hospital FROM usuarios WHERE id_usuario = $1
    `, [idUsuarioAsigna]);
    const idHospital = usuarioAsigna?.id_hospital;

    // Actualizar la referencia
    const referenciaActualizada = await executeQueryOne<{
      id_referencia: number;
      actualizado_en: string;
    }>(`
      UPDATE referencias_especialidad
      SET
        id_medico_asignado = $1,
        fecha_cita = $2,
        id_usuario_asigna = $3,
        fecha_asignacion = NOW(),
        estatus = 'asignada',
        actualizado_en = NOW()
      WHERE id_referencia = $4
      RETURNING id_referencia, actualizado_en
    `, [
      body.id_medico_asignado,
      body.fecha_cita,
      idUsuarioAsigna,
      body.id_referencia
    ]);

    if (!referenciaActualizada) {
      return NextResponse.json(
        {
          success: false,
          error: 'Error al actualizar la referencia'
        },
        { status: 500 }
      );
    }

    // Obtener la referencia completa actualizada
    const referenciaCompleta = await executeQueryOne(`
      SELECT
        r.*,
        m.nombre as nombre_medico_asignado,
        u.nombre as nombre_usuario_asigna
      FROM referencias_especialidad r
      LEFT JOIN usuarios m ON r.id_medico_asignado = m.id_usuario
      LEFT JOIN usuarios u ON r.id_usuario_asigna = u.id_usuario
      WHERE r.id_referencia = $1
    `, [body.id_referencia]);

    // 🔔 Guardar notificación en BD + disparar Pusher para notificar al Notificador
    try {
      const notifPayload = {
        tipo: 'referencia_notificador',
        titulo: 'Referencia Asignada - Pendiente de Notificación',
        mensaje: `${referenciaCompleta.nombre_paciente} - ${referenciaCompleta.nombre_especialidad} asignado a ${medico.nombre}`,
        datos: {
          id_referencia: body.id_referencia,
          folio: referenciaCompleta.folio,
          no_nomina: referenciaCompleta.no_nomina,
          nombre_paciente: referenciaCompleta.nombre_paciente,
          especialidad: referenciaCompleta.nombre_especialidad,
          medico_asignado: medico.nombre,
          fecha_cita: body.fecha_cita
        }
      };
      const dbId = await guardarNotificacion({
        tipo: notifPayload.tipo,
        titulo: notifPayload.titulo,
        mensaje: notifPayload.mensaje,
        datos: notifPayload.datos,
        permiso_requerido: 'NOTIF_GESTOR_ENTREGA',
        id_hospitales: idHospital ? [idHospital] : undefined,
      });
      const gestoresChannel = idHospital ? `gestores-hospital-${idHospital}` : 'gestores-channel';
      await pusherServer.trigger(gestoresChannel, 'referencia-asignada', {
        ...notifPayload,
        datos: { ...notifPayload.datos, id_notificacion: dbId },
      });
      console.log('📢 Notificación enviada al Notificador vía Pusher');
    } catch (error) {
      console.error('❌ Error enviando notificación al Notificador:', error);
      // No bloqueamos el proceso si falla la notificación
    }

    // 🔔 Notificar al dashboard también
    try {
      await pusherServer.trigger('dashboard', 'stats-refresh', {
        type: 'referencia_asignada',
        message: 'Referencia asignada a especialista'
      });
    } catch (error) {
      console.error('Error notificando dashboard:', error);
    }

    // 📧 Enviar email al paciente si registró su correo
    enviarEmailCitaReferencia(body.id_referencia, 'asignada');

    const response: ReferenciaResponse = {
      success: true,
      referencia: referenciaCompleta
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error al asignar médico:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
