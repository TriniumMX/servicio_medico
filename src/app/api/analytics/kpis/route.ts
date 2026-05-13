import { NextResponse } from 'next/server';
import { executeQueryOne } from '@/lib/dbPostgres';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Construir filtro de fecha
    const dateFilter = startDate && endDate
      ? `AND fecha_consulta >= '${startDate}' AND fecha_consulta <= '${endDate} 23:59:59'`
      : `AND date_trunc('month', fecha_consulta) = date_trunc('month', CURRENT_DATE)`;

    const dateFilterSurtimiento = startDate && endDate
      ? `AND fecha_surtimiento >= '${startDate}' AND fecha_surtimiento <= '${endDate} 23:59:59'`
      : `AND date_trunc('month', fecha_surtimiento) = date_trunc('month', CURRENT_DATE)`;

    // 1. Total Consultas y Costo (costo viene de usuarios.costo, no de consulta.costo)
    const consultasStats = await executeQueryOne(`
      SELECT
        COUNT(*) as total,
        COALESCE(SUM(u.costo::NUMERIC), 0) as total_costo
      FROM consulta c
      JOIN usuarios u ON c.id_medico = u.id_usuario
      WHERE c.estatus_activo = true ${dateFilter.replace(/fecha_consulta/g, 'c.fecha_consulta')}
    `);

    // 2. Recetas Surtidas, Parciales y No Surtidas
    const recetasStats = await executeQueryOne(`
      WITH receta_totales AS (
        SELECT 
          r.id_receta,
          SUM(dr.cantidad_total) as total_prescrito,
          COALESCE(SUM(sr.cantidad_surtida), 0) as total_surtido
        FROM recetas r
        JOIN detalle_receta dr ON r.id_receta = dr.id_receta
        LEFT JOIN surtimientos_receta sr ON dr.id_detalle = sr.id_detalle
        WHERE r.cancelado = false ${dateFilter.replace(/fecha_consulta/g, 'r.fecha_emision')}
        GROUP BY r.id_receta
      )
      SELECT 
        COUNT(*) as total_recetas,
        COUNT(*) FILTER (WHERE total_surtido >= total_prescrito) as surtidas,
        COUNT(*) FILTER (WHERE total_surtido > 0 AND total_surtido < total_prescrito) as parcialmente_surtidas,
        COUNT(*) FILTER (WHERE total_surtido = 0) as no_surtidas
      FROM receta_totales
    `);

    // 3. Gasto en Farmacia (Costo de medicamentos)
    const gastoStats = await executeQueryOne(`
      SELECT COALESCE(SUM(m.precio_unitario * sr.cantidad_surtida), 0) as total_gasto
      FROM surtimientos_receta sr
      JOIN detalle_receta dr ON sr.id_detalle = dr.id_detalle
      JOIN medicamentos m ON dr.id_medicamento = m.id_medicamento
      WHERE sr.id_surtimiento IS NOT NULL ${dateFilterSurtimiento.replace(/fecha_surtimiento/g, 'sr.fecha_surtimiento')}
    `);

    // 4. Incapacidades
    const incapacidadesStats = await executeQueryOne(`
      SELECT 
        COUNT(*) FILTER (WHERE se_asigno_incapacidad = true) as con_incapacidad,
        COUNT(*) as total_consultas
      FROM consulta
      WHERE estatus_activo = true ${dateFilter}
    `);

    // 5. Estudios de Laboratorio - Generados (todos) con costo
    const laboratorioGenerados = await executeQueryOne(`
      SELECT
        COUNT(*) as total,
        COALESCE(SUM(el.costo), 0) as total_costo
      FROM consulta_estudios ce
      JOIN consulta c ON ce.id_consulta = c.id_consulta
      JOIN cat_estudios_laboratorio el ON ce.id_estudio = el.id_estudio
      WHERE c.estatus_activo = true ${dateFilter}
    `);

    // 6. Estudios de Laboratorio - Autorizados con costo (incluye AUTORIZADO y ENTREGADO)
    const laboratorioAutorizados = await executeQueryOne(`
      SELECT
        COUNT(*) as total,
        COALESCE(SUM(el.costo), 0) as total_costo
      FROM consulta_estudios ce
      JOIN consulta c ON ce.id_consulta = c.id_consulta
      JOIN cat_estudios_laboratorio el ON ce.id_estudio = el.id_estudio
      WHERE c.estatus_activo = true
        AND ce.estatus IN ('AUTORIZADO', 'ENTREGADO')
        ${dateFilter}
    `);

    return NextResponse.json({
      success: true,
      data: {
        consultas: {
          total: parseInt(consultasStats?.total || '0'),
          costo_total: parseFloat(consultasStats?.total_costo || '0')
        },
        recetas: {
          total: parseInt(recetasStats?.total_recetas || '0'),
          surtidas: parseInt(recetasStats?.surtidas || '0'),
          parciales: parseInt(recetasStats?.parcialmente_surtidas || '0'),
          no_surtidas: parseInt(recetasStats?.no_surtidas || '0')
        },
        gasto_farmacia: parseFloat(gastoStats?.total_gasto || '0'),
        incapacidades: {
          total: parseInt(incapacidadesStats?.con_incapacidad || '0'),
          tasa: incapacidadesStats?.total_consultas > 0
            ? (parseInt(incapacidadesStats.con_incapacidad) / parseInt(incapacidadesStats.total_consultas) * 100).toFixed(1)
            : 0
        },
        estudios_laboratorio: {
          generados: {
            total: parseInt(laboratorioGenerados?.total || '0'),
            costo: parseFloat(laboratorioGenerados?.total_costo || '0')
          },
          autorizados: {
            total: parseInt(laboratorioAutorizados?.total || '0'),
            costo: parseFloat(laboratorioAutorizados?.total_costo || '0')
          }
        }
      }
    });

  } catch (error) {
    console.error('Error KPI Analytics:', error);
    return NextResponse.json({ success: false, error: 'Error obteniendo KPIs', details: error }, { status: 500 });
  }
}
