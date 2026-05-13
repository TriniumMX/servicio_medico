// src/app/api/notificaciones/[id]/leer/route.ts
// PATCH - Marca una notificación como leída para el usuario autenticado (idempotente)

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { executeQuery } from '@/lib/dbPostgres';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret) as { payload: { id: number } };
    const userId = payload.id;

    const { id } = await params;
    const idNotificacion = parseInt(id, 10);
    if (isNaN(idNotificacion)) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }

    await executeQuery(`
      INSERT INTO notificaciones_leidas (id_notificacion, id_usuario)
      VALUES ($1, $2)
      ON CONFLICT (id_notificacion, id_usuario) DO NOTHING
    `, [idNotificacion, userId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marcando notificación como leída:', error);
    return NextResponse.json(
      { success: false, error: 'Error al marcar notificación' },
      { status: 500 }
    );
  }
}
