import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/dbPostgres';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Construir filtro de fecha
    // Si hay fechas: usar el rango.
    // Si NO hay fechas: usar últimos 30 días para diario y 90 días para horas.
    const dateFilterDiario = startDate && endDate
      ? `AND fecha_consulta >= '${startDate}' AND fecha_consulta <= '${endDate} 23:59:59'`
      : `AND fecha_consulta >= CURRENT_DATE - INTERVAL '30 days'`;

    const dateFilterHora = startDate && endDate
      ? `AND fecha_consulta >= '${startDate}' AND fecha_consulta <= '${endDate} 23:59:59'`
      : `AND fecha_consulta >= CURRENT_DATE - INTERVAL '90 days'`;

    // Consultas por día (con costo)
    const consultasPorDia = await executeQuery(`
      SELECT
        to_char(date_trunc('day', c.fecha_consulta), 'DD/MM') as fecha,
        COUNT(*) as total,
        COALESCE(SUM(CAST(u.costo AS NUMERIC)), 0) as total_costo
      FROM consulta c
      LEFT JOIN usuarios u ON c.id_medico = u.id_usuario
      WHERE c.estatus_activo = true
        ${dateFilterDiario.replace(/fecha_consulta/g, 'c.fecha_consulta')}
      GROUP BY date_trunc('day', c.fecha_consulta)
      ORDER BY date_trunc('day', c.fecha_consulta) ASC
    `);

    // Consultas por hora (Mapa de calor general)
    const consultasPorHora = await executeQuery(`
      SELECT 
        extract(hour from fecha_consulta) as hora,
        COUNT(*) as total
      FROM consulta
      WHERE estatus_activo = true 
        ${dateFilterHora}
      GROUP BY extract(hour from fecha_consulta)
      ORDER BY hora ASC
    `);

    return NextResponse.json({
      success: true,
      data: {
        diario: consultasPorDia.map((d: any) => ({
          name: d.fecha,
          consultas: parseInt(d.total),
          costo: parseFloat(d.total_costo)
        })),
        porHora: consultasPorHora.map((d: any) => ({
          hora: `${d.hora}:00`,
          valor: parseInt(d.total)
        }))
      }
    });

  } catch (error) {
    console.error('Error Temporal Analytics:', error);
    return NextResponse.json({ success: false, error: 'Error obteniendo datos temporales' }, { status: 500 });
  }
}
