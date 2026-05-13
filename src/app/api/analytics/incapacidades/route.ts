import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/dbPostgres';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter = startDate && endDate
      ? `AND i.created_at >= '${startDate}' AND i.created_at <= '${endDate} 23:59:59'`
      : '';

    // 1. Top 10 diagnósticos que generan incapacidad
    const topDiagnosticos = await executeQuery(`
      SELECT
        COALESCE(i.diagnostico_codigo, 'Sin código') as codigo,
        COALESCE(i.diagnostico_titulo, 'Sin diagnóstico') as titulo,
        COUNT(*) as total,
        ROUND(AVG(i.dias_autorizados), 1) as dias_promedio
      FROM incapacidades i
      WHERE 1=1 ${dateFilter}
      GROUP BY i.diagnostico_codigo, i.diagnostico_titulo
      ORDER BY total DESC
      LIMIT 10
    `);

    // 2. Días promedio sugeridos vs autorizados
    const diasPromedio = await executeQuery(`
      SELECT
        ROUND(AVG(i.dias_sugeridos), 1) as promedio_sugeridos,
        ROUND(AVG(i.dias_autorizados), 1) as promedio_autorizados,
        SUM(i.dias_sugeridos) as total_sugeridos,
        SUM(COALESCE(i.dias_autorizados, 0)) as total_autorizados,
        COUNT(*) as total_incapacidades
      FROM incapacidades i
      WHERE 1=1 ${dateFilter}
    `);

    // 3. Conteo por estatus
    const porEstatus = await executeQuery(`
      SELECT
        COALESCE(i.estatus, 'PENDIENTE') as estatus,
        COUNT(*) as total
      FROM incapacidades i
      WHERE 1=1 ${dateFilter}
      GROUP BY i.estatus
    `);

    // 4. Top departamentos con más incapacidades
    const porDepartamento = await executeQuery(`
      SELECT
        COALESCE(c.departamento, 'Sin depto') as departamento,
        COUNT(*) as total,
        SUM(COALESCE(i.dias_autorizados, i.dias_sugeridos)) as total_dias
      FROM incapacidades i
      LEFT JOIN consulta c ON i.id_consulta = c.id_consulta
      WHERE 1=1 ${dateFilter}
      GROUP BY c.departamento
      ORDER BY total DESC
      LIMIT 8
    `);

    return NextResponse.json({
      success: true,
      data: {
        topDiagnosticos: topDiagnosticos.map((d: any) => ({
          name: d.codigo !== 'Sin código' ? `${d.codigo} - ${d.titulo?.substring(0, 25)}` : d.titulo,
          codigo: d.codigo,
          titulo: d.titulo,
          total: parseInt(d.total),
          diasPromedio: parseFloat(d.dias_promedio) || 0
        })),
        resumen: {
          promedioSugeridos: parseFloat(diasPromedio[0]?.promedio_sugeridos) || 0,
          promedioAutorizados: parseFloat(diasPromedio[0]?.promedio_autorizados) || 0,
          totalSugeridos: parseInt(diasPromedio[0]?.total_sugeridos) || 0,
          totalAutorizados: parseInt(diasPromedio[0]?.total_autorizados) || 0,
          totalIncapacidades: parseInt(diasPromedio[0]?.total_incapacidades) || 0
        },
        porEstatus: porEstatus.map((e: any) => ({
          name: e.estatus,
          value: parseInt(e.total)
        })),
        porDepartamento: porDepartamento.map((d: any) => ({
          name: d.departamento,
          total: parseInt(d.total),
          dias: parseInt(d.total_dias) || 0
        }))
      }
    });
  } catch (error: any) {
    console.error('Error analytics incapacidades:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
