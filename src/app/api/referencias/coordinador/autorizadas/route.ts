// src/app/api/referencias/coordinador/autorizadas/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { executeQuery } from '@/lib/dbPostgres';
import type { ReferenciaEspecialidad } from '@/types/referencias';

/**
 * GET - Obtener referencias autorizadas por el coordinador
 * Estatus: 'autorizada', 'notificada', 'atendida'
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📋 [Referencias Autorizadas] Buscando referencias autorizadas...');

    // Obtener el ID del coordinador logueado desde el JWT
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret) as { payload: { id: number } };
    const idCoordinador = payload.id;

    const referencias = await executeQuery<ReferenciaEspecialidad>(`
      SELECT
        r.*,
        mr.nombre as nombre_medico_refiere,
        ma.nombre as nombre_medico_asignado,
        ua.nombre as nombre_usuario_asigna,
        c.nombre as nombre_coordinador,
        tc.tipousuario as cargo_coordinador,
        un.nombre as nombre_usuario_notifica
      FROM referencias_especialidad r
      LEFT JOIN usuarios mr ON r.id_medico_refiere = mr.id_usuario
      LEFT JOIN usuarios ma ON r.id_medico_asignado = ma.id_usuario
      LEFT JOIN usuarios ua ON r.id_usuario_asigna = ua.id_usuario
      LEFT JOIN usuarios c ON r.id_coordinador_autoriza = c.id_usuario
      LEFT JOIN tiposusuarios tc ON c.id_tipousuario = tc.clavetipousuario
      LEFT JOIN usuarios un ON r.id_usuario_notifica = un.id_usuario
      WHERE
        r.id_coordinador_autoriza = $1
        AND r.estatus IN ('autorizada', 'notificada', 'atendida')
        AND r.activo = TRUE
      ORDER BY r.fecha_autorizacion DESC
    `, [idCoordinador]);

    console.log(`✅ [Referencias Autorizadas] Se encontraron ${referencias.length} referencia(s) autorizada(s)`);

    // Debug: Verificar firmas
    referencias.forEach((ref, index) => {
      if (ref.firma_digital) {
        const firmaPreview = ref.firma_digital.substring(0, 50);
        console.log(`📝 [Firma Debug] Ref #${ref.id_referencia}: "${firmaPreview}..."`);
      }
    });

    return NextResponse.json({
      success: true,
      referencias: referencias || []
    });

  } catch (error) {
    console.error('❌ [Referencias Autorizadas] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        referencias: []
      },
      { status: 500 }
    );
  }
}
