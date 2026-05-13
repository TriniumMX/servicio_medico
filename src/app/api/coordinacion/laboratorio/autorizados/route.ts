import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/dbPostgres';
export const dynamic = 'force-dynamic';

// GET: Estudios autorizados y entregados (últimos 60 días por defecto)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dias = parseInt(searchParams.get('dias') || '60', 10);

    const sql = `
      SELECT
        ce.id_solicitud,
        ce.id_consulta,
        ce.motivo          AS motivo_clinico,
        ce.fecha_solicitud,
        ce.fecha_autorizacion,
        ce.estatus,
        el.nombre_estudio,
        el.categoria,
        el.costo,
        c.folio            AS folio_consulta,
        c.nombre           AS paciente_nombre,
        c.no_nomina,
        c.departamento,
        u_med.nombre       AS medico_solicitante,
        u_coord.nombre     AS coordinador_nombre
      FROM consulta_estudios ce
      INNER JOIN cat_estudios_laboratorio el ON ce.id_estudio = el.id_estudio
      INNER JOIN consulta c                  ON ce.id_consulta = c.id_consulta
      INNER JOIN usuarios u_med              ON c.id_medico = u_med.id_usuario
      LEFT  JOIN usuarios u_coord            ON ce.id_usuario_autoriza = u_coord.id_usuario
      WHERE ce.estatus IN ('AUTORIZADO', 'ENTREGADO')
        AND ce.fecha_autorizacion >= NOW() - ($1 || ' days')::INTERVAL
      ORDER BY ce.fecha_autorizacion DESC
    `;

    const result = await executeQuery(sql, [dias]);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
