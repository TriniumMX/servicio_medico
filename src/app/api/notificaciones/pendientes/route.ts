// src/app/api/notificaciones/pendientes/route.ts
// GET - Devuelve notificaciones no leídas para el usuario autenticado

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { executeQuery } from '@/lib/dbPostgres';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret) as { payload: { id: number } };
    const userId = payload.id;

    // JOIN directo a notificaciones_destinatarios — sin resolver permisos en runtime
    const notificaciones = await executeQuery<{
      id_notificacion: number;
      tipo: string;
      titulo: string;
      mensaje: string;
      datos: any;
      creado_en: string;
    }>(`
      SELECT n.id_notificacion, n.tipo, n.titulo, n.mensaje, n.datos, n.creado_en
      FROM notificaciones n
      JOIN notificaciones_destinatarios nd
        ON nd.id_notificacion = n.id_notificacion
        AND nd.id_usuario = $1
      WHERE n.activo = true
        AND n.creado_en > NOW() - INTERVAL '30 days'
        AND NOT EXISTS (
          SELECT 1 FROM notificaciones_leidas nl
          WHERE nl.id_notificacion = n.id_notificacion
            AND nl.id_usuario = $1
        )
      ORDER BY n.creado_en DESC
      LIMIT 50
    `, [userId]);

    return NextResponse.json({ success: true, data: notificaciones });
  } catch (error) {
    console.error('Error obteniendo notificaciones pendientes:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener notificaciones' },
      { status: 500 }
    );
  }
}
