import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/dbPostgres';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id_incapacidad } = body;

    if (!id_incapacidad) {
      return NextResponse.json({ success: false, error: "ID de incapacidad requerido" }, { status: 400 });
    }

    // Verificar si existe la columna fecha_entrega
    const columnaEntrega = await executeQuery(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'incapacidades' AND column_name = 'fecha_entrega'
    `);

    if (columnaEntrega.length === 0) {
      return NextResponse.json({
        success: false,
        error: "La columna fecha_entrega no existe. Ejecuta: ALTER TABLE incapacidades ADD COLUMN fecha_entrega TIMESTAMP NULL;"
      }, { status: 400 });
    }

    // Marcar como entregada con la fecha actual
    await executeQuery(`
      UPDATE incapacidades
      SET fecha_entrega = NOW()
      WHERE id_incapacidad = $1
        AND estatus = 'AUTORIZADA'
        AND fecha_entrega IS NULL
    `, [id_incapacidad]);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Error al marcar entrega:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
