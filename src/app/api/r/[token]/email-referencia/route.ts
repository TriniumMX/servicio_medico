// src/app/api/r/[token]/email-referencia/route.ts
// Endpoint público (sin auth) — el token del QR es la "llave" de acceso

import { NextRequest, NextResponse } from 'next/server';
import { executeQueryOne } from '@/lib/dbPostgres';

interface Params {
  params: Promise<{ token: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, error: 'Email requerido' }, { status: 400 });
    }

    // Validación básica de formato email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: 'Formato de email inválido' }, { status: 400 });
    }

    // Verificar que el token es válido y obtener id_consulta
    const tokenData = await executeQueryOne<{ id_receta: number }>(`
      SELECT id_receta
      FROM recetas_acceso_publico
      WHERE token = $1
        AND activo = true
        AND fecha_expiracion > NOW()
    `, [token]);

    if (!tokenData) {
      return NextResponse.json({ success: false, error: 'Token inválido o expirado' }, { status: 404 });
    }

    // Obtener id_consulta de la receta
    const receta = await executeQueryOne<{ id_consulta: number }>(`
      SELECT id_consulta FROM recetas WHERE id_receta = $1
    `, [tokenData.id_receta]);

    if (!receta) {
      return NextResponse.json({ success: false, error: 'Receta no encontrada' }, { status: 404 });
    }

    // Buscar la referencia activa ligada a esa consulta
    const referencia = await executeQueryOne<{ id_referencia: number }>(`
      SELECT id_referencia
      FROM referencias_especialidad
      WHERE id_consulta_origen = $1
        AND activo = true
      ORDER BY creado_en DESC
      LIMIT 1
    `, [receta.id_consulta]);

    if (!referencia) {
      return NextResponse.json({ success: false, error: 'No hay referencia activa para esta receta' }, { status: 404 });
    }

    // Guardar el email
    await executeQueryOne(`
      UPDATE referencias_especialidad
      SET email_notificacion = $1,
          actualizado_en = NOW()
      WHERE id_referencia = $2
    `, [email.toLowerCase().trim(), referencia.id_referencia]);

    return NextResponse.json({ success: true, message: 'Email registrado correctamente' });

  } catch (error) {
    console.error('Error guardando email de referencia:', error);
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}
