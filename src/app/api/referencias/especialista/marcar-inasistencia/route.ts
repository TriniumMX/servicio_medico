// src/app/api/referencias/especialista/marcar-inasistencia/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { executeQuery, executeQueryOne } from '@/lib/dbPostgres';

export async function POST(request: NextRequest) {
  try {
    // Autenticación
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret) as any;
    const idUsuario = payload.id;

    if (!idUsuario) {
      return NextResponse.json({ success: false, error: 'ID de usuario no válido en token' }, { status: 401 });
    }

    const body = await request.json();
    const { id_referencia, motivo_inasistencia } = body;

    // Validar datos requeridos
    if (!id_referencia) {
      return NextResponse.json({ success: false, error: 'El ID de la referencia es obligatorio' }, { status: 400 });
    }

    if (!motivo_inasistencia || motivo_inasistencia.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: 'El motivo de inasistencia debe tener al menos 10 caracteres' },
        { status: 400 }
      );
    }

    // Verificar que la referencia existe y está en estado pendiente
    const referencia = await executeQueryOne<{ id_referencia: number; estatus: string; fecha_cita: string | null; id_medico_asignado: number }>(
      `SELECT id_referencia, estatus, fecha_cita, id_medico_asignado
       FROM referencias_especialidad
       WHERE id_referencia = $1 AND activo = true`,
      [id_referencia]
    );

    if (!referencia) {
      return NextResponse.json({ success: false, error: 'Referencia no encontrada' }, { status: 404 });
    }

    // Solo se puede marcar inasistencia en referencias pendientes
    if (referencia.estatus !== 'notificada' && referencia.estatus !== 'asignada') {
      return NextResponse.json(
        { success: false, error: `No se puede marcar inasistencia. Estatus actual: ${referencia.estatus}` },
        { status: 400 }
      );
    }

    // Verificar que el médico que solicita es el asignado a la referencia
    if (referencia.id_medico_asignado !== idUsuario) {
      return NextResponse.json(
        { success: false, error: 'No tiene permiso para modificar esta referencia' },
        { status: 403 }
      );
    }

    const ahora = new Date();

    // Actualizar la referencia
    await executeQuery(
      `UPDATE referencias_especialidad
       SET estatus = 'inasistencia',
           motivo_inasistencia = $1,
           id_usuario_inasistencia = $2,
           fecha_inasistencia = $3,
           actualizado_en = $3
       WHERE id_referencia = $4`,
      [motivo_inasistencia.trim(), idUsuario, ahora, id_referencia]
    );

    // Obtener nombre del especialista que emite el documento
    const usuario = await executeQueryOne<{ nombre: string }>(
      `SELECT nombre FROM usuarios WHERE id_usuario = $1`,
      [idUsuario]
    );

    return NextResponse.json({
      success: true,
      message: 'Referencia marcada como inasistencia exitosamente',
      data: {
        fecha_inasistencia: ahora.toISOString(),
        nombre_usuario_inasistencia: usuario?.nombre || 'Médico Especialista',
      },
    });
  } catch (error) {
    console.error('Error al marcar inasistencia:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
