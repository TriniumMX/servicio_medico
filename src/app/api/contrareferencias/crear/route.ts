// src/app/api/contrareferencias/crear/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeQueryOne } from '@/lib/dbPostgres';
import { pusherServer } from '@/lib/pusher';
import { guardarNotificacion } from '@/lib/notificaciones';
import { jwtVerify } from 'jose';
import type { CrearContrarreferencia, ContrarreferenciasResponse } from '@/types/contrareferencias';

/**
 * Genera un folio único para la contrareferencia
 * Formato: CREF-XXXXX (5 caracteres alfanuméricos)
 */
async function generarFolioContrareferencia(): Promise<string> {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const maxIntentos = 10;

  for (let intento = 0; intento < maxIntentos; intento++) {
    let codigo = '';
    for (let i = 0; i < 5; i++) {
      codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    const folio = `CREF-${codigo}`;

    const existe = await executeQueryOne<{ folio: string }>(
      'SELECT folio FROM contrareferencias WHERE folio = $1',
      [folio]
    );

    if (!existe) {
      return folio;
    }
  }

  throw new Error('No se pudo generar un folio único');
}

/**
 * POST - Crear nueva contrareferencia
 * El especialista devuelve al paciente al médico que lo refirió
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Autenticación
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret) as any;
    const idMedicoEspecialista = payload.id;

    // 2. Obtener datos del body
    const body: CrearContrarreferencia = await request.json();
    const { id_referencia, observaciones_especialista } = body;

    if (!id_referencia) {
      return NextResponse.json(
        { success: false, error: 'Falta id_referencia' },
        { status: 400 }
      );
    }

    // 3. Obtener referencia original
    const referencia = await executeQueryOne<{
      id_referencia: number;
      folio: string;
      id_consulta_origen: number;
      id_consulta_seguimiento: number;
      no_nomina: string;
      id_beneficiario: number;
      nombre_paciente: string;
      id_medico_refiere: number;
      nombre_medico_refiere: string;
      id_especialidad_solicitada: number;
      nombre_especialidad: string;
      id_medico_asignado: number;
      tiene_contrareferencia: boolean;
    }>(`
      SELECT * FROM referencias_especialidad WHERE id_referencia = $1
    `, [id_referencia]);

    if (!referencia) {
      return NextResponse.json(
        { success: false, error: 'Referencia no encontrada' },
        { status: 404 }
      );
    }

    // 4. Verificar que el médico logueado sea el asignado
    if (referencia.id_medico_asignado !== idMedicoEspecialista) {
      return NextResponse.json(
        { success: false, error: 'No autorizado para contrareferir esta referencia' },
        { status: 403 }
      );
    }

    // 5. Verificar que la referencia ya fue atendida
    if (!referencia.id_consulta_seguimiento) {
      return NextResponse.json(
        { success: false, error: 'La referencia aún no ha sido atendida' },
        { status: 400 }
      );
    }

    // 6. Verificar que no tenga ya una contrareferencia
    if (referencia.tiene_contrareferencia) {
      return NextResponse.json(
        { success: false, error: 'Esta referencia ya tiene contrareferencia' },
        { status: 400 }
      );
    }

    // 7. Obtener consulta del especialista (SOAP completo)
    const consulta = await executeQueryOne<{
      id_consulta: number;
      subjetivo: string;
      objetivo: string;
      analisis: string;
      plan: string;
      cie11_codigo: string;
      cie11_titulo: string;
    }>(`
      SELECT
        c.id_consulta,
        c.subjetivo,
        c.objetivo,
        c.analisis,
        c.plan,
        -- Diagnóstico CIE-11 (de la tabla diagnosticos_consulta)
        dc.cie11_codigo,
        dc.cie11_titulo
      FROM consulta c
      -- JOIN con diagnósticos: obtener el principal o el primero
      LEFT JOIN diagnosticos_consulta dc ON dc.id_consulta = c.id_consulta
        AND (dc.es_principal = true OR dc.orden = 1)
      WHERE c.id_consulta = $1
    `, [referencia.id_consulta_seguimiento]);

    if (!consulta) {
      return NextResponse.json(
        { success: false, error: 'Consulta de seguimiento no encontrada' },
        { status: 404 }
      );
    }

    // 8. Obtener datos del especialista
    const especialista = await executeQueryOne<{
      nombre: string;
      especialidad: string;
      claveespecialidad: number;
    }>(`
      SELECT u.nombre, e.especialidad, e.claveespecialidad
      FROM usuarios u
      INNER JOIN especialidades e ON u.id_especialidad = e.claveespecialidad
      WHERE u.id_usuario = $1
    `, [idMedicoEspecialista]);

    if (!especialista) {
      return NextResponse.json(
        { success: false, error: 'Datos del especialista no encontrados' },
        { status: 404 }
      );
    }

    // 9. Identificar médico destino (el que refirió)
    const medicoDestino = await executeQueryOne<{
      id_usuario: number;
      nombre: string;
    }>(`
      SELECT id_usuario, nombre FROM usuarios WHERE id_usuario = $1
    `, [referencia.id_medico_refiere]);

    if (!medicoDestino) {
      return NextResponse.json(
        { success: false, error: 'Médico destino no encontrado' },
        { status: 404 }
      );
    }

    // 10. Generar folio único
    const folio = await generarFolioContrareferencia();

    // 11. Insertar contrareferencia
    const contrarref = await executeQueryOne<{
      id_contrareferencia: number;
      folio: string;
    }>(`
      INSERT INTO contrareferencias (
        folio,
        id_referencia_origen,
        id_consulta_especialista,
        id_medico_contrarrefiere,
        nombre_medico_contrarrefiere,
        id_especialidad_remitente,
        nombre_especialidad_remitente,
        id_medico_destino,
        nombre_medico_destino,
        no_nomina,
        id_beneficiario,
        nombre_paciente,
        subjetivo,
        objetivo,
        analisis,
        plan_texto,
        cie11_codigo,
        cie11_titulo,
        observaciones_especialista,
        estatus,
        creado_en
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, 'pendiente', NOW()
      )
      RETURNING id_contrareferencia, folio
    `, [
      folio,
      id_referencia,
      referencia.id_consulta_seguimiento,
      idMedicoEspecialista,
      especialista.nombre,
      especialista.claveespecialidad,
      especialista.especialidad,
      referencia.id_medico_refiere,
      medicoDestino.nombre,
      referencia.no_nomina,
      referencia.id_beneficiario,
      referencia.nombre_paciente,
      consulta.subjetivo,
      consulta.objetivo,
      consulta.analisis,
      consulta.plan,
      consulta.cie11_codigo,
      consulta.cie11_titulo,
      observaciones_especialista || null
    ]);

    // Validar que se creó correctamente
    if (!contrarref) {
      return NextResponse.json(
        { success: false, error: 'Error al crear la contrareferencia' },
        { status: 500 }
      );
    }

    // 12. Actualizar referencia original
    await executeQuery(`
      UPDATE referencias_especialidad
      SET tiene_contrareferencia = true,
          id_contrareferencia = $1,
          actualizado_en = NOW()
      WHERE id_referencia = $2
    `, [contrarref.id_contrareferencia, id_referencia]);

    // 13. Guardar notificación en BD + enviar Pusher al médico destino
    try {
      const notifPayload = {
        tipo: 'contrareferencia',
        titulo: 'Nueva Contrareferencia',
        mensaje: `${especialista.nombre} (${especialista.especialidad}) te ha devuelto al paciente ${referencia.nombre_paciente}`,
        datos: {
          id_contrareferencia: contrarref.id_contrareferencia,
          folio: folio,
          id_medico_destino: referencia.id_medico_refiere,
          nombre_paciente: referencia.nombre_paciente,
          especialidad_remitente: especialista.especialidad
        }
      };
      const dbId = await guardarNotificacion({
        tipo: notifPayload.tipo,
        titulo: notifPayload.titulo,
        mensaje: notifPayload.mensaje,
        datos: notifPayload.datos,
        id_usuario_destino: referencia.id_medico_refiere,
      });
      await pusherServer.trigger('contrareferencias-channel', 'nueva-contrareferencia', {
        ...notifPayload,
        datos: { ...notifPayload.datos, id_notificacion: dbId },
      });
    } catch (error) {
      console.error('❌ Error enviando notificación de contrareferencia:', error);
    }

    return NextResponse.json({
      success: true,
      data: contrarref,
      message: 'Contrareferencia creada exitosamente'
    } as ContrarreferenciasResponse, { status: 201 });

  } catch (error) {
    console.error('Error al crear contrareferencia:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      } as ContrarreferenciasResponse,
      { status: 500 }
    );
  }
}
