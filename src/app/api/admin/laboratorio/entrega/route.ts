import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/dbPostgres';

// POST: Marcar como entregado
export async function POST(request: NextRequest) {
  try {
    const { ids_solicitudes, id_usuario } = await request.json();

    if (!ids_solicitudes || !Array.isArray(ids_solicitudes) || ids_solicitudes.length === 0) {
      return NextResponse.json({ success: false, error: 'No se seleccionaron estudios' }, { status: 400 });
    }

    // Generamos placeholders ($2, $3...)
    const placeholders = ids_solicitudes.map((_, i) => `$${i + 2}`).join(',');

    // Actualizamos estatus a 'ENTREGADO' (o mantenemos AUTORIZADO pero llenamos fecha_entrega)
    // Vamos a usar el campo estatus para que sea más claro en el flujo
    await executeQuery(`
      UPDATE consulta_estudios 
      SET 
        estatus = 'ENTREGADO',
        fecha_entrega = NOW(),
        entregado_por = $1
      WHERE id_solicitud IN (${placeholders})
    `, [id_usuario, ...ids_solicitudes]);

    return NextResponse.json({ success: true, message: 'Órdenes marcadas como entregadas.' });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}