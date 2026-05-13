// src/app/api/referencias/hospital/reprogramar/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { executeQueryOne } from '@/lib/dbPostgres';
import { pusherServer } from '@/lib/pusher';
import { guardarNotificacion } from '@/lib/notificaciones';
import { enviarEmailCitaReferencia } from '@/lib/enviarEmailReferencia';

/**
 * PATCH - El hospital reprograma la cita de una referencia ya asignada.
 * Caso de uso: el médico especialista llama a la recepción para cambiar su cita.
 *
 * Acepta estatus: 'asignada' | 'notificada'
 * Si venía 'notificada' → regresa a 'asignada' para que el notificador re-avise al paciente.
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id_referencia, id_medico_asignado, fecha_cita } = body;

    if (!id_referencia || !id_medico_asignado || !fecha_cita) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos: id_referencia, id_medico_asignado, fecha_cita' },
        { status: 400 }
      );
    }

    // Validar que la nueva fecha no sea en el pasado
    if (new Date(fecha_cita) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'La nueva fecha de cita no puede ser en el pasado' },
        { status: 400 }
      );
    }

    // Verificar que la referencia existe y está en un estatus reprogramable
    const referencia = await executeQueryOne<{
      estatus: string;
      id_especialidad_solicitada: number;
      nombre_paciente: string;
      nombre_especialidad: string;
      folio: string;
      no_nomina: string;
    }>(`
      SELECT estatus, id_especialidad_solicitada, nombre_paciente, nombre_especialidad, folio, no_nomina
      FROM referencias_especialidad
      WHERE id_referencia = $1
    `, [id_referencia]);

    if (!referencia) {
      return NextResponse.json({ success: false, error: 'Referencia no encontrada' }, { status: 404 });
    }

    if (!['asignada', 'notificada'].includes(referencia.estatus)) {
      return NextResponse.json(
        { success: false, error: `La referencia no puede reprogramarse. Estatus actual: ${referencia.estatus}` },
        { status: 400 }
      );
    }

    // Verificar que el médico existe, está activo y tiene la especialidad correcta
    const medico = await executeQueryOne<{ nombre: string; id_especialidad: number }>(`
      SELECT nombre, id_especialidad
      FROM usuarios
      WHERE id_usuario = $1 AND activo = true
    `, [id_medico_asignado]);

    if (!medico) {
      return NextResponse.json({ success: false, error: 'Médico no encontrado o inactivo' }, { status: 404 });
    }

    if (medico.id_especialidad !== referencia.id_especialidad_solicitada) {
      return NextResponse.json(
        { success: false, error: 'El médico no tiene la especialidad requerida por esta referencia' },
        { status: 400 }
      );
    }

    // Autenticación
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret) as { payload: { id: number } };
    const idUsuarioAsigna = payload.id;

    // Obtener el hospital del usuario que reprograma (para scoping de notificaciones)
    const usuarioAsigna = await executeQueryOne<{ id_hospital: number | null }>(`
      SELECT id_hospital FROM usuarios WHERE id_usuario = $1
    `, [idUsuarioAsigna]);
    const idHospital = usuarioAsigna?.id_hospital;

    // Si venía notificada → regresar a asignada para que el notificador re-avise al paciente
    const nuevoEstatus = referencia.estatus === 'notificada' ? 'asignada' : referencia.estatus;

    // Actualizar la referencia
    await executeQueryOne(`
      UPDATE referencias_especialidad
      SET
        id_medico_asignado      = $1,
        fecha_cita              = $2,
        id_usuario_asigna       = $3,
        fecha_asignacion        = NOW(),
        estatus                 = $4,
        reprogramada            = true,
        fecha_reprogramacion    = NOW(),
        actualizado_en          = NOW()
      WHERE id_referencia       = $5
      RETURNING id_referencia
    `, [id_medico_asignado, fecha_cita, idUsuarioAsigna, nuevoEstatus, id_referencia]);

    // Guardar notificación en BD + notificar al notificador si hay que re-avisar al paciente
    if (referencia.estatus === 'notificada') {
      try {
        const notifPayload = {
          tipo: 'referencia_notificador',
          titulo: 'Cita Reprogramada — Requiere Nueva Notificación',
          mensaje: `${referencia.nombre_paciente} — ${referencia.nombre_especialidad} reprogramada con ${medico.nombre}`,
          datos: {
            id_referencia,
            folio: referencia.folio,
            no_nomina: referencia.no_nomina,
            nombre_paciente: referencia.nombre_paciente,
            especialidad: referencia.nombre_especialidad,
            medico_asignado: medico.nombre,
            fecha_cita,
          },
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
        await pusherServer.trigger(gestoresChannel, 'referencia-reprogramada', {
          ...notifPayload,
          datos: { ...notifPayload.datos, id_notificacion: dbId },
        });
      } catch (e) {
        console.error('Error enviando notificación Pusher:', e);
      }
    }

    // Refrescar estadísticas del dashboard
    try {
      await pusherServer.trigger('dashboard', 'stats-refresh', {
        type: 'referencia_reprogramada',
        message: 'Cita de referencia reprogramada',
      });
    } catch (e) {
      console.error('Error notificando dashboard:', e);
    }

    // 📧 Enviar email al paciente si registró su correo
    enviarEmailCitaReferencia(id_referencia, 'reprogramada');

    return NextResponse.json({
      success: true,
      message: `Cita reprogramada correctamente${referencia.estatus === 'notificada' ? '. El notificador debe re-avisar al paciente.' : '.'}`,
      requiere_renotificacion: referencia.estatus === 'notificada',
    });

  } catch (error) {
    console.error('Error al reprogramar referencia:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
