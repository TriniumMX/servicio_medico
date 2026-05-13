// src/app/api/firmas/obtener/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { executeQueryOne } from '@/lib/dbPostgres';

/**
 * GET - Obtener firma digital guardada del usuario logueado
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener el ID del usuario logueado desde el JWT
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret) as { payload: { id: number } };
    const idUsuario = payload.id;

    const firma = await executeQueryOne<{
      id_firma: number;
      firma_base64: string;
      hash_firma: string;
      creado_en: string;
      actualizado_en: string;
    }>(`
      SELECT
        id_firma,
        firma_base64,
        hash_firma,
        creado_en,
        actualizado_en
      FROM firmas_digitales
      WHERE id_usuario = $1 AND activo = TRUE
    `, [idUsuario]);

    if (!firma) {
      return NextResponse.json({
        success: true,
        firma: null,
        message: 'No se encontró firma guardada'
      });
    }

    console.log('✅ [Firma] Firma obtenida para usuario:', idUsuario);

    return NextResponse.json({
      success: true,
      firma: {
        id_firma: firma.id_firma,
        firma_base64: firma.firma_base64,
        hash_firma: firma.hash_firma,
        creado_en: firma.creado_en,
        actualizado_en: firma.actualizado_en
      }
    });

  } catch (error) {
    console.error('❌ [Firma] Error al obtener firma:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
