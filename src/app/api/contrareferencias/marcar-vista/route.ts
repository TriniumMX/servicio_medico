// src/app/api/contrareferencias/marcar-vista/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeQueryOne } from '@/lib/dbPostgres';
import { jwtVerify } from 'jose';
import type { MarcarVistaResponse } from '@/types/contrareferencias';

/**
 * POST - Marcar contrareferencia como vista
 * Solo el médico destino puede marcarla como vista
 */
export async function POST(request: NextRequest) {
  try {
    // Autenticación
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' } as MarcarVistaResponse,
        { status: 401 }
      );
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret) as any;
    const idMedico = payload.id;

    // Obtener datos del body
    const body = await request.json();
    const { id_contrareferencia } = body;

    if (!id_contrareferencia) {
      return NextResponse.json(
        { success: false, error: 'Falta id_contrareferencia' } as MarcarVistaResponse,
        { status: 400 }
      );
    }

    // Verificar que la contrareferencia existe y pertenece al médico
    const contrarref = await executeQueryOne<{
      id_contrareferencia: number;
      id_medico_destino: number;
      estatus: string;
    }>(`
      SELECT id_contrareferencia, id_medico_destino, estatus
      FROM contrareferencias
      WHERE id_contrareferencia = $1
    `, [id_contrareferencia]);

    if (!contrarref) {
      return NextResponse.json(
        { success: false, error: 'Contrareferencia no encontrada' } as MarcarVistaResponse,
        { status: 404 }
      );
    }

    // Verificar que el médico logueado sea el destino
    if (contrarref.id_medico_destino !== idMedico) {
      return NextResponse.json(
        { success: false, error: 'No autorizado para marcar esta contrareferencia' } as MarcarVistaResponse,
        { status: 403 }
      );
    }

    // Marcar como vista solo si está pendiente
    if (contrarref.estatus === 'pendiente') {
      await executeQuery(`
        UPDATE contrareferencias
        SET estatus = 'vista',
            fecha_vista = NOW(),
            actualizado_en = NOW()
        WHERE id_contrareferencia = $1
      `, [id_contrareferencia]);
    }

    return NextResponse.json({
      success: true,
      message: 'Contrareferencia marcada como vista'
    } as MarcarVistaResponse);

  } catch (error) {
    console.error('Error al marcar contrareferencia:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      } as MarcarVistaResponse,
      { status: 500 }
    );
  }
}
