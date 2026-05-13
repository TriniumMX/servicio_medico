// src/app/api/referencias/crear/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeQueryOne } from '@/lib/dbPostgres';
import { pusherServer } from '@/lib/pusher';
import { guardarNotificacion } from '@/lib/notificaciones';
import type {
  CrearReferenciaRequest,
  ReferenciaResponse
} from '@/types/referencias';

/**
 * Genera un folio único para la referencia
 * Formato: REF-XXXXX (5 caracteres alfanuméricos)
 * Valida que no exista en la base de datos
 */
async function generarFolioUnico(): Promise<string> {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const maxIntentos = 10;

  for (let intento = 0; intento < maxIntentos; intento++) {
    // Generar código alfanumérico de 5 caracteres
    let codigo = '';
    for (let i = 0; i < 5; i++) {
      codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    const folio = `REF-${codigo}`;

    // Verificar que no exista
    const existe = await executeQueryOne<{ folio: string }>(
      'SELECT folio FROM referencias_especialidad WHERE folio = $1',
      [folio]
    );

    if (!existe) {
      return folio; // Folio único encontrado
    }
  }

  throw new Error('No se pudo generar un folio único después de varios intentos');
}

/**
 * POST - Crear nueva referencia a especialidad
 * FASE 1: Médico General genera la referencia
 */
export async function POST(request: NextRequest) {
  try {
    const body: CrearReferenciaRequest = await request.json();

    // Validación de campos requeridos
    if (!body.id_consulta || !body.id_especialidad_solicitada || !body.motivo_referencia) {
      return NextResponse.json(
        {
          success: false,
          error: 'Faltan campos requeridos: id_consulta, id_especialidad_solicitada, motivo_referencia'
        },
        { status: 400 }
      );
    }

    // Validar que el motivo no esté vacío
    if (body.motivo_referencia.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'El motivo de referencia no puede estar vacío'
        },
        { status: 400 }
      );
    }

    // Obtener datos de la consulta (paciente y médico)
    const consulta = await executeQueryOne<{
      id_beneficiario: number;
      no_nomina: string;
      nombre: string;
      id_medico: number;
    }>(`
      SELECT
        id_beneficiario,
        no_nomina,
        nombre,
        id_medico
      FROM consulta
      WHERE id_consulta = $1
    `, [body.id_consulta]);

    if (!consulta) {
      return NextResponse.json(
        {
          success: false,
          error: 'Consulta no encontrada'
        },
        { status: 404 }
      );
    }

    // Obtener nombre del médico que refiere
    const medico = await executeQueryOne<{
      nombre: string;
    }>(`
      SELECT nombre
      FROM usuarios
      WHERE id_usuario = $1
    `, [consulta.id_medico]);

    if (!medico) {
      return NextResponse.json(
        {
          success: false,
          error: 'Médico no encontrado'
        },
        { status: 404 }
      );
    }

    // Obtener nombre de la especialidad
    const especialidad = await executeQueryOne<{
      especialidad: string;
    }>(`
      SELECT especialidad
      FROM especialidades
      WHERE claveespecialidad = $1
    `, [body.id_especialidad_solicitada]);

    if (!especialidad) {
      return NextResponse.json(
        {
          success: false,
          error: 'Especialidad no encontrada'
        },
        { status: 404 }
      );
    }

    // Generar folio único
    const folio = await generarFolioUnico();

    // Insertar la referencia
    const nuevaReferencia = await executeQueryOne<{
      id_referencia: number;
      folio: string;
      creado_en: string;
    }>(`
      INSERT INTO referencias_especialidad (
        folio,
        id_consulta_origen,
        no_nomina,
        id_beneficiario,
        nombre_paciente,
        id_medico_refiere,
        nombre_medico_refiere,
        id_especialidad_solicitada,
        nombre_especialidad,
        motivo_referencia,
        estatus,
        activo
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pendiente_autorizar', true
      )
      RETURNING id_referencia, folio, creado_en
    `, [
      folio,
      body.id_consulta,
      consulta.no_nomina,
      consulta.id_beneficiario,
      consulta.nombre,
      consulta.id_medico,
      medico.nombre,
      body.id_especialidad_solicitada,
      especialidad.especialidad,
      body.motivo_referencia.trim()
    ]);

    if (!nuevaReferencia) {
      return NextResponse.json(
        {
          success: false,
          error: 'Error al crear la referencia'
        },
        { status: 500 }
      );
    }

    // Actualizar la consulta para marcar que tiene referencia
    await executeQuery(`
      UPDATE consulta
      SET tiene_referencia = true
      WHERE id_consulta = $1
    `, [body.id_consulta]);

    // 🔔 Guardar notificación en BD + disparar Pusher para notificar al Coordinador
    try {
      const notifPayload = {
        tipo: 'referencia_coordinador',
        titulo: 'Nueva Referencia por Autorizar',
        mensaje: `${consulta.nombre} ha sido referido a ${especialidad.especialidad} (Folio: ${folio})`,
        datos: {
          id_referencia: nuevaReferencia.id_referencia,
          folio: folio,
          no_nomina: consulta.no_nomina,
          nombre_paciente: consulta.nombre,
          especialidad: especialidad.especialidad,
          id_especialidad: body.id_especialidad_solicitada
        }
      };
      const dbId = await guardarNotificacion({
        tipo: notifPayload.tipo,
        titulo: notifPayload.titulo,
        mensaje: notifPayload.mensaje,
        datos: notifPayload.datos,
        permiso_requerido: 'ACCESO_NOTIFICACIONES_COORDINADOR',
      });
      await pusherServer.trigger('coordinador-channel', 'nueva-referencia', {
        ...notifPayload,
        datos: { ...notifPayload.datos, id_notificacion: dbId },
      });
      console.log('📢 Notificación de referencia enviada al Coordinador vía Pusher');
    } catch (error) {
      console.error('❌ Error enviando notificación de referencia:', error);
      // No bloqueamos el proceso si falla la notificación
    }

    const response: ReferenciaResponse = {
      success: true,
      referencia: {
        id_referencia: nuevaReferencia.id_referencia,
        folio: nuevaReferencia.folio,
        id_consulta_origen: body.id_consulta,
        id_consulta_seguimiento: null,
        no_nomina: consulta.no_nomina,
        id_beneficiario: consulta.id_beneficiario,
        nombre_paciente: consulta.nombre,
        id_medico_refiere: consulta.id_medico,
        nombre_medico_refiere: medico.nombre,
        id_especialidad_solicitada: body.id_especialidad_solicitada,
        nombre_especialidad: especialidad.especialidad,
        motivo_referencia: body.motivo_referencia.trim(),
        id_medico_asignado: null,
        fecha_cita: null,
        id_usuario_asigna: null,
        fecha_asignacion: null,
        id_coordinador_autoriza: null,
        fecha_autorizacion: null,
        observaciones_coordinador: null,
        firma_digital: null,
        id_usuario_notifica: null,
        fecha_notificacion: null,
        observaciones_notificacion: null,
        fecha_atencion: null,
        estatus: 'pendiente_autorizar',
        activo: true,
        creado_en: nuevaReferencia.creado_en,
        actualizado_en: nuevaReferencia.creado_en
      }
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Error al crear referencia:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al crear la referencia'
      },
      { status: 500 }
    );
  }
}
