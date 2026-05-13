import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/dbPostgres';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Construir filtro de fecha
    const dateFilter = startDate && endDate
      ? `AND fecha_consulta >= '${startDate}' AND fecha_consulta <= '${endDate} 23:59:59'`
      : ``;

    // Top 10 Diagnósticos CIE-11 más frecuentes (con filtro)
    // Ahora lee de la tabla diagnosticos_consulta
    const topDiagnosticos = await executeQuery(`
      SELECT
        dc.cie11_codigo,
        dc.cie11_titulo,
        COUNT(*) as total
      FROM diagnosticos_consulta dc
      INNER JOIN consulta c ON dc.id_consulta = c.id_consulta
      WHERE c.estatus_activo = true
        AND dc.cie11_codigo IS NOT NULL
        ${dateFilter.replace(/fecha_consulta/g, 'c.fecha_consulta')}
      GROUP BY dc.cie11_codigo, dc.cie11_titulo
      ORDER BY total DESC
      LIMIT 10
    `);

    // Top Departamentos con más consultas e INGRESOS
    const topDepartamentos = await executeQuery(`
      SELECT
        c.departamento,
        COUNT(*) as total,
        COALESCE(SUM(CAST(u.costo AS NUMERIC)), 0) as total_ingreso
      FROM consulta c
      LEFT JOIN usuarios u ON c.id_medico = u.id_usuario
      WHERE c.estatus_activo = true
        AND c.departamento IS NOT NULL
        ${dateFilter.replace(/fecha_consulta/g, 'c.fecha_consulta')}
      GROUP BY c.departamento
      ORDER BY total DESC
      LIMIT 8
    `);

    return NextResponse.json({
      success: true,
      data: {
        diagnosticos: topDiagnosticos.map((d: any) => ({
          name: `${d.cie11_codigo} - ${d.cie11_titulo?.substring(0, 30)}...`,
          codigo: d.cie11_codigo,
          full_name: d.cie11_titulo,
          value: parseInt(d.total)
        })),
        departamentos: topDepartamentos.map((d: any) => ({
          name: d.departamento,
          value: parseInt(d.total),
          ingreso: parseFloat(d.total_ingreso)
        }))
      }
    });

  } catch (error) {
    console.error('Error Diagnostics Analytics:', error);
    return NextResponse.json({ success: false, error: 'Error obteniendo estadísticas de diagnósticos' }, { status: 500 });
  }
}
