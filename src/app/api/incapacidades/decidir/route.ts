import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeQueryOne } from '@/lib/dbPostgres';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { pusherServer } from '@/lib/pusher';
import { guardarNotificacion } from '@/lib/notificaciones';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'tu_clave_secreta');

export async function POST(request: NextRequest) {
  try {
    // Obtener el ID del usuario que autoriza desde el JWT
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    let idAutorizador: number | null = null;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        idAutorizador = payload.id as number;
      } catch (e) {
        console.error('Error verificando token:', e);
      }
    }

    const body = await request.json();
    const { id_incapacidad, accion, motivo, nuevos_datos } = body;

    if (!id_incapacidad || !accion) {
      return NextResponse.json({ success: false, error: "Datos incompletos" }, { status: 400 });
    }

    // Verificar si existe la columna id_usuario_autorizo
    const columnaAutorizador = await executeQuery(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'incapacidades' AND column_name = 'id_usuario_autorizo'
    `);
    const tieneAutorizador = columnaAutorizador.length > 0;

    if (accion === "RECHAZAR") {
      if (tieneAutorizador) {
        await executeQuery(`
          UPDATE incapacidades
          SET
            estatus = 'RECHAZADA',
            motivo_rechazo = $1,
            fecha_autorizacion = NOW(),
            id_usuario_autorizo = $3
          WHERE id_incapacidad = $2
        `, [motivo, id_incapacidad, idAutorizador]);
      } else {
        await executeQuery(`
          UPDATE incapacidades
          SET
            estatus = 'RECHAZADA',
            motivo_rechazo = $1,
            fecha_autorizacion = NOW()
          WHERE id_incapacidad = $2
        `, [motivo, id_incapacidad]);
      }
    }

    else if (accion === "AUTORIZAR") {
      if (tieneAutorizador) {
        await executeQuery(`
          UPDATE incapacidades
          SET
            estatus = 'AUTORIZADA',
            fecha_inicio = $1,
            fecha_fin = $2,
            dias_autorizados = $3,
            fecha_autorizacion = NOW(),
            id_usuario_autorizo = $5
          WHERE id_incapacidad = $4
        `, [
          nuevos_datos.fecha_inicio,
          nuevos_datos.fecha_fin,
          nuevos_datos.dias,
          id_incapacidad,
          idAutorizador
        ]);
      } else {
        await executeQuery(`
          UPDATE incapacidades
          SET
            estatus = 'AUTORIZADA',
            fecha_inicio = $1,
            fecha_fin = $2,
            dias_autorizados = $3,
            fecha_autorizacion = NOW()
          WHERE id_incapacidad = $4
        `, [
          nuevos_datos.fecha_inicio,
          nuevos_datos.fecha_fin,
          nuevos_datos.dias,
          id_incapacidad
        ]);
      }
    }

    // 🔔 Notificar a gestores cuando se AUTORIZA (ellos entregan la incapacidad)
    if (accion === 'AUTORIZAR') {
      try {
        const incap = await executeQueryOne<{ no_nomina: string; dias_autorizados: number; motivo_medico: string }>(`
          SELECT no_nomina, dias_autorizados, motivo_medico FROM incapacidades WHERE id_incapacidad = $1
        `, [id_incapacidad]);

        // Obtener el hospital del autorizador para scoping de notificaciones
        const autorizadorData = idAutorizador
          ? await executeQueryOne<{ id_hospital: number | null }>(`SELECT id_hospital FROM usuarios WHERE id_usuario = $1`, [idAutorizador])
          : null;
        const idHospital = autorizadorData?.id_hospital;

        const notifPayload = {
          tipo: 'incapacidad' as const,
          titulo: 'Incapacidad Autorizada — Pendiente de Entrega',
          mensaje: `Nómina ${incap?.no_nomina || 'N/A'}: incapacidad de ${nuevos_datos?.dias || incap?.dias_autorizados || '?'} días autorizada. Lista para entregar.`,
          datos: {
            id_incapacidad,
            no_nomina: incap?.no_nomina,
            url_redirect: '/dashboard/gestores/incapacidades',
          },
        };
        const dbId = await guardarNotificacion({
          ...notifPayload,
          permiso_requerido: 'NOTIF_GESTOR_ENTREGA',
          id_hospitales: idHospital ? [idHospital] : undefined,
        });
        const gestoresChannel = idHospital ? `gestores-hospital-${idHospital}` : 'gestores-channel';
        await pusherServer.trigger(gestoresChannel, 'incapacidad-autorizada', {
          ...notifPayload,
          datos: { ...notifPayload.datos, id_notificacion: dbId },
        });
      } catch (e) {
        console.error('❌ Error enviando notificación de incapacidad autorizada:', e);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Error al procesar decisión:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}