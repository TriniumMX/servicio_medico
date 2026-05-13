import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/dbPostgres';

// GET: Historial de estudios de laboratorio de un paciente (últimos 30 días)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const no_nomina = searchParams.get('no_nomina');

    if (!no_nomina) {
      return NextResponse.json(
        { success: false, error: 'Se requiere el número de nómina' },
        { status: 400 }
      );
    }

    const sql = `
      SELECT
        ce.id_solicitud,
        ce.estatus,
        ce.fecha_solicitud,
        ce.fecha_autorizacion,
        el.nombre_estudio,
        el.categoria,
        el.costo,
        c.folio as folio_consulta,
        u.nombre as medico_solicitante
      FROM consulta_estudios ce
      INNER JOIN cat_estudios_laboratorio el ON ce.id_estudio = el.id_estudio
      INNER JOIN consulta c ON ce.id_consulta = c.id_consulta
      LEFT JOIN usuarios u ON c.id_medico = u.id_usuario
      WHERE c.no_nomina = $1
        AND ce.fecha_solicitud >= NOW() - INTERVAL '30 days'
        AND ce.estatus IN ('AUTORIZADO', 'ENTREGADO')
      ORDER BY ce.fecha_solicitud DESC
    `;

    const result = await executeQuery(sql, [no_nomina]);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error al obtener historial de laboratorio:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
