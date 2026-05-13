import { NextResponse } from 'next/server';
import { executeQuery, executeQueryOne } from '@/lib/dbPostgres';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter = startDate && endDate
      ? `AND r.fecha_emision >= '${startDate}' AND r.fecha_emision <= '${endDate} 23:59:59'`
      : `AND date_trunc('month', r.fecha_emision) = date_trunc('month', CURRENT_DATE)`;

    const dateFilterSurtimiento = startDate && endDate
      ? `AND sr.fecha_surtimiento >= '${startDate}' AND sr.fecha_surtimiento <= '${endDate} 23:59:59'`
      : `AND date_trunc('month', sr.fecha_surtimiento) = date_trunc('month', CURRENT_DATE)`;

    // 1. Tendencia mensual: surtidas / parciales / no_surtidas + gasto
    const tendenciaMensual = await executeQuery(`
      WITH receta_estados AS (
        SELECT
          r.id_receta,
          TO_CHAR(r.fecha_emision AT TIME ZONE 'America/Mexico_City', 'YYYY-MM') as mes,
          TO_CHAR(r.fecha_emision AT TIME ZONE 'America/Mexico_City', 'Mon YY') as mes_label,
          SUM(dr.cantidad_total) as total_prescrito,
          COALESCE(SUM(sr.cantidad_surtida), 0) as total_surtido
        FROM recetas r
        JOIN detalle_receta dr ON r.id_receta = dr.id_receta
        LEFT JOIN surtimientos_receta sr ON dr.id_detalle = sr.id_detalle
        WHERE r.cancelado = false ${dateFilter}
        GROUP BY r.id_receta, TO_CHAR(r.fecha_emision AT TIME ZONE 'America/Mexico_City', 'YYYY-MM'), TO_CHAR(r.fecha_emision AT TIME ZONE 'America/Mexico_City', 'Mon YY')
      )
      SELECT
        mes,
        mes_label,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE total_surtido >= total_prescrito) as surtidas,
        COUNT(*) FILTER (WHERE total_surtido > 0 AND total_surtido < total_prescrito) as parciales,
        COUNT(*) FILTER (WHERE total_surtido = 0) as no_surtidas
      FROM receta_estados
      GROUP BY mes, mes_label
      ORDER BY mes
    `);

    // 2. Gasto mensual farmacia
    const gastoMensual = await executeQuery(`
      SELECT
        TO_CHAR(sr.fecha_surtimiento AT TIME ZONE 'America/Mexico_City', 'YYYY-MM') as mes,
        COALESCE(SUM(m.precio_unitario * sr.cantidad_surtida), 0) as gasto
      FROM surtimientos_receta sr
      JOIN detalle_receta dr ON sr.id_detalle = dr.id_detalle
      JOIN medicamentos m ON dr.id_medicamento = m.id_medicamento
      WHERE sr.cantidad_surtida > 0 ${dateFilterSurtimiento}
      GROUP BY TO_CHAR(sr.fecha_surtimiento AT TIME ZONE 'America/Mexico_City', 'YYYY-MM')
      ORDER BY mes
    `);

    // 3. Top 10 medicamentos más prescritos
    const topMedicamentos = await executeQuery(`
      SELECT
        m.nombre_comercial as name,
        COUNT(DISTINCT dr.id_receta) as recetas,
        SUM(dr.cantidad_total) as total_prescrito,
        COALESCE(SUM(sr.cantidad_surtida), 0) as total_surtido
      FROM detalle_receta dr
      JOIN recetas r ON dr.id_receta = r.id_receta
      JOIN medicamentos m ON dr.id_medicamento = m.id_medicamento
      LEFT JOIN surtimientos_receta sr ON dr.id_detalle = sr.id_detalle
      WHERE r.cancelado = false ${dateFilter}
      GROUP BY m.id_medicamento, m.nombre_comercial
      ORDER BY recetas DESC
      LIMIT 10
    `);

    // 4. Resumen distribución (para donut)
    const distribucion = await executeQueryOne(`
      WITH receta_estados AS (
        SELECT
          r.id_receta,
          SUM(dr.cantidad_total) as total_prescrito,
          COALESCE(SUM(sr.cantidad_surtida), 0) as total_surtido
        FROM recetas r
        JOIN detalle_receta dr ON r.id_receta = dr.id_receta
        LEFT JOIN surtimientos_receta sr ON dr.id_detalle = sr.id_detalle
        WHERE r.cancelado = false ${dateFilter}
        GROUP BY r.id_receta
      )
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE total_surtido >= total_prescrito) as surtidas,
        COUNT(*) FILTER (WHERE total_surtido > 0 AND total_surtido < total_prescrito) as parciales,
        COUNT(*) FILTER (WHERE total_surtido = 0) as no_surtidas
      FROM receta_estados
    `);

    // Merge gasto into tendencia by mes key
    const gastoMap: Record<string, number> = {};
    for (const row of gastoMensual) {
      gastoMap[row.mes] = parseFloat(row.gasto);
    }

    const temporal = tendenciaMensual.map((row: any) => ({
      mes: row.mes_label,
      total: parseInt(row.total),
      surtidas: parseInt(row.surtidas),
      parciales: parseInt(row.parciales),
      no_surtidas: parseInt(row.no_surtidas),
      gasto: gastoMap[row.mes] || 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        temporal,
        distribucion: [
          { name: 'Surtidas', value: parseInt(distribucion?.surtidas || '0') },
          { name: 'Parciales', value: parseInt(distribucion?.parciales || '0') },
          { name: 'No Surtidas', value: parseInt(distribucion?.no_surtidas || '0') },
        ],
        resumen: {
          total: parseInt(distribucion?.total || '0'),
          surtidas: parseInt(distribucion?.surtidas || '0'),
          parciales: parseInt(distribucion?.parciales || '0'),
          no_surtidas: parseInt(distribucion?.no_surtidas || '0'),
        },
        topMedicamentos: topMedicamentos.map((row: any) => ({
          name: row.name,
          recetas: parseInt(row.recetas),
          total_prescrito: parseInt(row.total_prescrito),
          total_surtido: parseInt(row.total_surtido),
        })),
      }
    });

  } catch (error) {
    console.error('Error Recetas Analytics:', error);
    return NextResponse.json({ success: false, error: 'Error obteniendo analytics de recetas', details: error }, { status: 500 });
  }
}
