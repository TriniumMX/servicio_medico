import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/dbPostgres';
import { pusherServer } from '@/lib/pusher';
import { guardarNotificacion } from '@/lib/notificaciones';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const query = `
      SELECT 
        a.id_aviso,
        a.titulo,
        a.mensaje,
        a.fecha_creacion,
        a.activo,
        e.id_etiqueta,
        e.nombre as etiqueta_nombre,
        e.color as etiqueta_color,
        u.nombre as creador
      FROM avisos a
      LEFT JOIN cat_etiquetas_avisos e ON a.id_etiqueta = e.id_etiqueta
      LEFT JOIN usuarios u ON a.id_usuario_creador = u.id_usuario
      WHERE a.activo = true
      ORDER BY a.fecha_creacion DESC
    `;

        const avisos = await executeQuery(query);
        return NextResponse.json(avisos);
    } catch (error: any) {
        console.error('Error fetching avisos:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { titulo, mensaje, id_etiqueta, id_usuario } = body;

        // Validación básica
        if (!titulo || !mensaje || !id_etiqueta || !id_usuario) {
            return NextResponse.json(
                { error: 'Faltan campos obligatorios (titulo, mensaje, id_etiqueta, id_usuario)' },
                { status: 400 }
            );
        }

        const query = `
      INSERT INTO avisos (titulo, mensaje, id_etiqueta, id_usuario_creador)
      VALUES ($1, $2, $3, $4)
      RETURNING id_aviso, titulo, mensaje, fecha_creacion
    `;

        const result = await executeQuery(query, [titulo, mensaje, id_etiqueta, id_usuario]);
        const newAviso = result[0];

        // Obtener detalles completos para el socket broadcast
        const fullAvisoQuery = `
      SELECT 
        a.id_aviso,
        a.titulo,
        a.mensaje,
        a.fecha_creacion,
        e.nombre as etiqueta_nombre,
        e.color as etiqueta_color,
        u.nombre as creador
      FROM avisos a
      LEFT JOIN cat_etiquetas_avisos e ON a.id_etiqueta = e.id_etiqueta
      LEFT JOIN usuarios u ON a.id_usuario_creador = u.id_usuario
      WHERE a.id_aviso = $1
    `;
        const fullAviso = await executeQuery(fullAvisoQuery, [newAviso.id_aviso]);

        // Guardar notificación en BD + notificar vía Pusher
        try {
            const avisoData = fullAviso[0];
            const notifPayload = {
                tipo: 'aviso',
                titulo: `${avisoData.etiqueta_nombre}: ${avisoData.titulo}`,
                mensaje: avisoData.mensaje,
                datos: {
                    id_aviso: avisoData.id_aviso,
                    creador: avisoData.creador,
                    fecha_creacion: avisoData.fecha_creacion,
                    etiqueta_nombre: avisoData.etiqueta_nombre,
                    etiqueta_color: avisoData.etiqueta_color
                }
            };
            const dbId = await guardarNotificacion({
                tipo: notifPayload.tipo,
                titulo: notifPayload.titulo,
                mensaje: notifPayload.mensaje,
                datos: notifPayload.datos,
                permiso_requerido: 'ACCESO_NOTIFICACIONES_AVISOS',
            });
            await pusherServer.trigger('avisos-channel', 'nuevo-aviso', {
                ...notifPayload,
                datos: { ...notifPayload.datos, id_notificacion: dbId },
            });
        } catch (pusherError) {
            console.error('Error enviando notificación Pusher:', pusherError);
            // No fallamos el request si falla pusher, solo logueamos
        }

        return NextResponse.json({ success: true, aviso: fullAviso[0] });
    } catch (error: any) {
        console.error('Error creating aviso:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
