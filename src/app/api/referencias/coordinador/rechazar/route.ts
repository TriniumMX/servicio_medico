// src/app/api/referencias/coordinador/rechazar/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { executeQueryOne } from '@/lib/dbPostgres';
import type {
  RechazarReferenciaRequest,
  ApiResponse
} from '@/types/referencias';

/**
 * POST - Rechazar una referencia
 * FASE 2: Coordinador (primera etapa tras la creación)
 */
export async function POST(request: NextRequest) {
  try {
    const body: RechazarReferenciaRequest = await request.json();

    // Validación de campos requeridos
    if (!body.id_referencia || !body.motivo_rechazo) {
      return NextResponse.json(
        {
          success: false,
          error: 'El ID de referencia y el motivo de rechazo son requeridos'
        },
        { status: 400 }
      );
    }

    // Validar que el motivo no esté vacío
    if (body.motivo_rechazo.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'El motivo de rechazo no puede estar vacío'
        },
        { status: 400 }
      );
    }

    // Verificar que la referencia existe y está en estatus correcto
    const referencia = await executeQueryOne<{
      estatus: string;
    }>(`
      SELECT estatus
      FROM referencias_especialidad
      WHERE id_referencia = $1
    `, [body.id_referencia]);

    if (!referencia) {
      return NextResponse.json(
        {
          success: false,
          error: 'Referencia no encontrada'
        },
        { status: 404 }
      );
    }

    if (referencia.estatus !== 'pendiente_autorizar') {
      return NextResponse.json(
        {
          success: false,
          error: `La referencia no puede ser rechazada. Estatus actual: ${referencia.estatus}`
        },
        { status: 400 }
      );
    }

    // Obtener el ID del coordinador logueado desde el JWT
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret) as { payload: { id: number } };
    const idCoordinador = payload.id;

    // Actualizar la referencia
    const referenciaActualizada = await executeQueryOne<{
      id_referencia: number;
    }>(`
      UPDATE referencias_especialidad
      SET
        id_coordinador_autoriza = $1,
        fecha_autorizacion = NOW(),
        observaciones_coordinador = $2,
        estatus = 'cancelada',
        actualizado_en = NOW()
      WHERE id_referencia = $3
      RETURNING id_referencia
    `, [
      idCoordinador,
      body.motivo_rechazo.trim(),
      body.id_referencia
    ]);

    if (!referenciaActualizada) {
      return NextResponse.json(
        {
          success: false,
          error: 'Error al rechazar la referencia'
        },
        { status: 500 }
      );
    }

    const response: ApiResponse<null> = {
      success: true,
      message: 'Referencia rechazada exitosamente'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error al rechazar referencia:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
