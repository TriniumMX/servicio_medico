// src/app/api/firmas/guardar/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { executeQuery, executeQueryOne } from '@/lib/dbPostgres';
import crypto from 'crypto';

interface GuardarFirmaRequest {
  firma_base64: string;
}

/**
 * POST - Guardar o actualizar firma digital del usuario logueado
 */
export async function POST(request: NextRequest) {
  try {
    const body: GuardarFirmaRequest = await request.json();

    // Validación
    if (!body.firma_base64) {
      return NextResponse.json(
        {
          success: false,
          error: 'La firma es requerida'
        },
        { status: 400 }
      );
    }

    // Obtener el ID del usuario logueado desde el JWT
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret) as { payload: { id: number } };
    const idUsuario = payload.id;

    // Generar hash SHA-256 de la firma para identificación única
    const hashFirma = crypto
      .createHash('sha256')
      .update(body.firma_base64)
      .digest('hex');

    // Verificar si el usuario ya tiene una firma guardada
    const firmaExistente = await executeQueryOne<{ id_firma: number }>(`
      SELECT id_firma
      FROM firmas_digitales
      WHERE id_usuario = $1 AND activo = TRUE
    `, [idUsuario]);

    let resultado;

    if (firmaExistente) {
      // Actualizar firma existente
      resultado = await executeQueryOne<{
        id_firma: number;
        hash_firma: string;
        actualizado_en: string;
      }>(`
        UPDATE firmas_digitales
        SET
          firma_base64 = $1,
          hash_firma = $2,
          actualizado_en = NOW()
        WHERE id_usuario = $3 AND activo = TRUE
        RETURNING id_firma, hash_firma, actualizado_en
      `, [body.firma_base64, hashFirma, idUsuario]);

      console.log('✅ [Firma] Firma actualizada para usuario:', idUsuario);
    } else {
      // Insertar nueva firma
      resultado = await executeQueryOne<{
        id_firma: number;
        hash_firma: string;
        creado_en: string;
      }>(`
        INSERT INTO firmas_digitales (
          id_usuario,
          firma_base64,
          hash_firma
        ) VALUES ($1, $2, $3)
        RETURNING id_firma, hash_firma, creado_en
      `, [idUsuario, body.firma_base64, hashFirma]);

      console.log('✅ [Firma] Nueva firma guardada para usuario:', idUsuario);
    }

    if (!resultado) {
      return NextResponse.json(
        {
          success: false,
          error: 'Error al guardar la firma'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: firmaExistente ? 'Firma actualizada exitosamente' : 'Firma guardada exitosamente',
      data: {
        id_firma: resultado.id_firma,
        hash_firma: resultado.hash_firma
      }
    });

  } catch (error) {
    console.error('❌ [Firma] Error al guardar firma:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
