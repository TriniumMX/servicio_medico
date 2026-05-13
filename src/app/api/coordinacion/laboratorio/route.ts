import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeQueryOne } from '@/lib/dbPostgres';
import { pusherServer } from '@/lib/pusher';
import { guardarNotificacion } from '@/lib/notificaciones';

// GET: Obtener pendientes
export async function GET() {
  try {
    const sql = `
      SELECT 
        ce.id_solicitud,
        ce.id_consulta,
        ce.motivo as motivo_clinico,
        ce.fecha_solicitud,
        el.nombre_estudio,
        el.categoria,
        el.costo,
        c.folio as folio_consulta,
        c.nombre as paciente_nombre,
        c.no_nomina,
        c.departamento,
        u.nombre as medico_solicitante
      FROM consulta_estudios ce
      INNER JOIN cat_estudios_laboratorio el ON ce.id_estudio = el.id_estudio
      INNER JOIN consulta c ON ce.id_consulta = c.id_consulta
      INNER JOIN usuarios u ON c.id_medico = u.id_usuario
      WHERE ce.estatus = 'PENDIENTE'
      ORDER BY ce.fecha_solicitud ASC
    `;
    const result = await executeQuery(sql);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Autorizar o Rechazar Lote
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids_solicitudes, accion, id_usuario, firma_base64, motivo_rechazo } = body;

    console.log('📥 [Coordinación] Recibido:', { 
      ids: ids_solicitudes?.length, 
      accion, 
      usuario: id_usuario,
      tieneFirma: !!firma_base64 
    });

    // 1. Validaciones Básicas
    if (!ids_solicitudes || !Array.isArray(ids_solicitudes) || ids_solicitudes.length === 0) {
      console.error('❌ Error: No se enviaron IDs de solicitudes');
      return NextResponse.json({ success: false, error: 'No se seleccionaron estudios' }, { status: 400 });
    }

    if (!id_usuario) {
      console.error('❌ Error: Falta ID de usuario');
      return NextResponse.json({ success: false, error: 'Usuario no identificado' }, { status: 400 });
    }

    // 2. Lógica de AUTORIZACIÓN
    if (accion === 'AUTORIZAR') {
      // A. Verificar si el usuario ya tiene firma en BD
      const usuario = await executeQueryOne<{ firma_digital: string }>(
        `SELECT firma_digital FROM usuarios WHERE id_usuario = $1`, 
        [id_usuario]
      );

      // B. Si no tiene firma guardada Y no envió una nueva ahora
      if (!usuario?.firma_digital && !firma_base64) {
        console.warn('⚠️ Usuario sin firma digital. Solicitando firma...');
        // Retornamos 400 pero con un código específico para que el Front abra el modal
        return NextResponse.json({ 
          success: false, 
          error: 'Firma requerida', 
          code: 'NO_SIGNATURE' 
        }, { status: 400 });
      }

      // C. Si envió una firma nueva, la guardamos (Actualizar perfil)
      if (firma_base64) {
        await executeQuery(
          `UPDATE usuarios SET firma_digital = $1 WHERE id_usuario = $2`,
          [firma_base64, id_usuario]
        );
        console.log('✅ Firma digital guardada para el usuario', id_usuario);
      }

      // D. Actualizar los estudios a AUTORIZADO
      // Generamos placeholders dinámicos ($2, $3...)
      const placeholders = ids_solicitudes.map((_, i) => `$${i + 2}`).join(',');
      
      await executeQuery(`
        UPDATE consulta_estudios 
        SET 
          estatus = 'AUTORIZADO', 
          id_usuario_autoriza = $1, 
          fecha_autorizacion = NOW()
        WHERE id_solicitud IN (${placeholders})
      `, [id_usuario, ...ids_solicitudes]);

      console.log(`✅ ${ids_solicitudes.length} estudios autorizados.`);

      // 🔔 Notificar a gestores que hay estudios listos para entregar
      try {
        // Obtener datos del paciente del primer estudio autorizado
        const infoEstudio = await executeQueryOne<{ paciente_nombre: string; no_nomina: string; folio_consulta: string }>(`
          SELECT c.nombre as paciente_nombre, c.no_nomina, c.folio as folio_consulta
          FROM consulta_estudios ce
          JOIN consulta c ON ce.id_consulta = c.id_consulta
          WHERE ce.id_solicitud = $1
        `, [ids_solicitudes[0]]);

        // Obtener hospital del autorizador para scoping de notificaciones
        const autorizadorData = await executeQueryOne<{ id_hospital: number | null }>(`
          SELECT id_hospital FROM usuarios WHERE id_usuario = $1
        `, [id_usuario]);
        const idHospital = autorizadorData?.id_hospital;

        const notifPayload = {
          tipo: 'laboratorio' as const,
          titulo: 'Estudios de Lab Autorizados — Pendiente de Entrega',
          mensaje: `${infoEstudio?.paciente_nombre || 'Paciente'} (${infoEstudio?.no_nomina || 'N/A'}): ${ids_solicitudes.length} estudio(s) autorizado(s). Listos para entregar.`,
          datos: {
            ids_solicitudes,
            no_nomina: infoEstudio?.no_nomina,
            folio_consulta: infoEstudio?.folio_consulta,
            url_redirect: '/dashboard/admin/laboratorios',
          },
        };
        const dbId = await guardarNotificacion({
          ...notifPayload,
          permiso_requerido: 'NOTIF_GESTOR_ENTREGA',
          id_hospitales: idHospital ? [idHospital] : undefined,
        });
        const gestoresChannel = idHospital ? `gestores-hospital-${idHospital}` : 'gestores-channel';
        await pusherServer.trigger(gestoresChannel, 'lab-autorizado', {
          ...notifPayload,
          datos: { ...notifPayload.datos, id_notificacion: dbId },
        });
      } catch (e) {
        console.error('❌ Error enviando notificación de lab autorizado:', e);
      }

      return NextResponse.json({ success: true, message: 'Estudios autorizados correctamente.' });
    }

    // 3. Lógica de RECHAZO
    if (accion === 'RECHAZAR') {
      if (!motivo_rechazo) {
        return NextResponse.json({ success: false, error: 'Motivo requerido' }, { status: 400 });
      }

      const placeholders = ids_solicitudes.map((_, i) => `$${i + 3}`).join(',');

      await executeQuery(`
        UPDATE consulta_estudios 
        SET 
          estatus = 'RECHAZADO', 
          id_usuario_autoriza = $1, 
          fecha_autorizacion = NOW(), 
          motivo_rechazo = $2
        WHERE id_solicitud IN (${placeholders})
      `, [id_usuario, motivo_rechazo, ...ids_solicitudes]);

      console.log(`⛔ ${ids_solicitudes.length} estudios rechazados.`);
      return NextResponse.json({ success: true, message: 'Estudios rechazados.' });
    }

    return NextResponse.json({ success: false, error: 'Acción no válida' }, { status: 400 });

  } catch (error: any) {
    console.error('❌ Error en API Coordinación:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}