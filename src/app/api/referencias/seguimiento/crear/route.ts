// src/app/api/referencias/seguimiento/crear/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { executeQuery, executeQueryOne } from '@/lib/dbPostgres';
import { pusherServer } from '@/lib/pusher';
import { guardarNotificacion } from '@/lib/notificaciones';

/**
 * Genera un folio único para la referencia de seguimiento
 * Formato: SEG-XXXXX (5 caracteres alfanuméricos)
 */
async function generarFolioSeguimiento(): Promise<string> {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  for (let intento = 0; intento < 10; intento++) {
    let codigo = '';
    for (let i = 0; i < 5; i++) {
      codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    const folio = `SEG-${codigo}`;

    const existe = await executeQueryOne<{ folio: string }>(
      'SELECT folio FROM referencias_especialidad WHERE folio = $1',
      [folio]
    );

    if (!existe) return folio;
  }

  throw new Error('No se pudo generar un folio de seguimiento único');
}

/**
 * POST - Crear referencia de seguimiento
 * El especialista la crea al finalizar una consulta de referencia.
 *
 * Body: {
 *   id_referencia_origen: number    // Referencia original que generó la consulta
 *   id_consulta_especialista: number // Consulta recién finalizada por el especialista (para SOAP)
 *   fecha_sugerida_seguimiento: string // ISO 8601
 *   motivo_seguimiento?: string     // Opcional
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Autenticar especialista
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret) as { payload: { id: number } };
    const idEspecialista = payload.id;

    const body = await request.json();
    const { id_referencia_origen, id_consulta_especialista, fecha_sugerida_seguimiento, motivo_seguimiento } = body;

    // Validar campos requeridos
    if (!id_referencia_origen || !id_consulta_especialista || !fecha_sugerida_seguimiento) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos: id_referencia_origen, id_consulta_especialista, fecha_sugerida_seguimiento' },
        { status: 400 }
      );
    }

    // Validar que la fecha sugerida sea al menos 7 días en el futuro
    const fechaSugerida = new Date(fecha_sugerida_seguimiento);
    const minFecha = new Date();
    minFecha.setDate(minFecha.getDate() + 6); // 7 días mínimo

    if (fechaSugerida < minFecha) {
      return NextResponse.json(
        { success: false, error: 'La fecha sugerida debe ser al menos 7 días desde hoy' },
        { status: 400 }
      );
    }

    // Obtener la referencia original
    const referenciaOrigen = await executeQueryOne<{
      id_referencia: number;
      no_nomina: string;
      id_beneficiario: number;
      nombre_paciente: string;
      id_especialidad_solicitada: number;
      nombre_especialidad: string;
      estatus: string;
    }>(`
      SELECT
        id_referencia, no_nomina, id_beneficiario, nombre_paciente,
        id_especialidad_solicitada, nombre_especialidad, estatus
      FROM referencias_especialidad
      WHERE id_referencia = $1 AND activo = true
    `, [id_referencia_origen]);

    if (!referenciaOrigen) {
      return NextResponse.json(
        { success: false, error: 'Referencia de origen no encontrada' },
        { status: 404 }
      );
    }

    // Solo se puede crear seguimiento si la referencia está en estado atendida o notificada
    if (!['atendida', 'notificada', 'asignada'].includes(referenciaOrigen.estatus)) {
      return NextResponse.json(
        { success: false, error: 'Solo se puede crear seguimiento para referencias atendidas' },
        { status: 400 }
      );
    }

    // Verificar que no exista ya un seguimiento activo para esta referencia
    const seguimientoExistente = await executeQueryOne<{ id_referencia: number }>(`
      SELECT id_referencia
      FROM referencias_especialidad
      WHERE id_consulta_origen = $1
        AND tipo_referencia = 'seguimiento'
        AND estatus NOT IN ('cancelada')
        AND activo = true
    `, [id_consulta_especialista]);

    if (seguimientoExistente) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un seguimiento activo para esta consulta' },
        { status: 409 }
      );
    }

    // Obtener nombre del especialista
    const especialista = await executeQueryOne<{ nombre: string }>(`
      SELECT nombre FROM usuarios WHERE id_usuario = $1
    `, [idEspecialista]);

    if (!especialista) {
      return NextResponse.json(
        { success: false, error: 'Especialista no encontrado' },
        { status: 404 }
      );
    }

    // Generar folio único
    const folio = await generarFolioSeguimiento();

    const motivo = motivo_seguimiento?.trim() ||
      `Seguimiento de ${referenciaOrigen.nombre_especialidad}`;

    // Crear la referencia de seguimiento
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
        tipo_referencia,
        fecha_sugerida_seguimiento,
        id_medico_sugerido,
        estatus,
        activo
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        'seguimiento', $11, $12,
        'pendiente_autorizar', true
      )
      RETURNING id_referencia, folio, creado_en
    `, [
      folio,
      id_consulta_especialista,
      referenciaOrigen.no_nomina,
      referenciaOrigen.id_beneficiario,
      referenciaOrigen.nombre_paciente,
      idEspecialista,
      especialista.nombre,
      referenciaOrigen.id_especialidad_solicitada,
      referenciaOrigen.nombre_especialidad,
      motivo,
      new Date(fecha_sugerida_seguimiento).toISOString(),
      idEspecialista,
    ]);

    if (!nuevaReferencia) {
      return NextResponse.json(
        { success: false, error: 'Error al crear el seguimiento' },
        { status: 500 }
      );
    }

    // Notificar al coordinador vía Pusher
    try {
      const notifPayload = {
        tipo: 'referencia_coordinador',
        titulo: 'Nuevo Seguimiento por Autorizar',
        mensaje: `${referenciaOrigen.nombre_paciente} - Seguimiento de ${referenciaOrigen.nombre_especialidad} (Folio: ${folio})`,
        datos: {
          id_referencia: nuevaReferencia.id_referencia,
          folio,
          tipo_referencia: 'seguimiento',
          nombre_paciente: referenciaOrigen.nombre_paciente,
          especialidad: referenciaOrigen.nombre_especialidad,
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
    } catch (error) {
      console.error('Error enviando notificación de seguimiento:', error);
      // No bloquea el flujo
    }

    return NextResponse.json({
      success: true,
      seguimiento: {
        id_referencia: nuevaReferencia.id_referencia,
        folio: nuevaReferencia.folio,
        creado_en: nuevaReferencia.creado_en,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error al crear seguimiento:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
