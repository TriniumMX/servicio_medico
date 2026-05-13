import { NextResponse } from 'next/server';
import { executeQuery, executeQueryOne } from '@/lib/dbPostgres';

export async function GET() {
  try {
    // 1. Distribución de estados de stock
    const stockStatus = await executeQuery(`
      SELECT
        CASE
          WHEN inv.fondo_fijo > 0 AND (inv.existencia_actual::float / inv.fondo_fijo) <= 0.10 THEN 'CRITICO'
          WHEN inv.fondo_fijo > 0 AND (inv.existencia_actual::float / inv.fondo_fijo) <= 0.30 THEN 'BAJO'
          WHEN inv.fondo_fijo > 0 AND (inv.existencia_actual::float / inv.fondo_fijo) <= 0.50 THEN 'MEDIO'
          ELSE 'NORMAL'
        END as estado,
        COUNT(*) as total
      FROM inventario_medicamentos inv
      INNER JOIN medicamentos m ON inv.id_medicamento = m.id_medicamento
      WHERE m.activo = true
      GROUP BY estado
    `);

    // 2. Top 10 medicamentos más críticos (menor % de stock)
    const criticos = await executeQuery(`
      SELECT
        m.nombre_comercial,
        m.sustancia_activa,
        m.clasificacion,
        inv.existencia_actual,
        inv.fondo_fijo,
        CASE WHEN inv.fondo_fijo > 0
          THEN ROUND((inv.existencia_actual::numeric / inv.fondo_fijo) * 100, 1)
          ELSE 0
        END as porcentaje
      FROM inventario_medicamentos inv
      INNER JOIN medicamentos m ON inv.id_medicamento = m.id_medicamento
      WHERE m.activo = true AND inv.fondo_fijo > 0
      ORDER BY (inv.existencia_actual::float / inv.fondo_fijo) ASC
      LIMIT 10
    `);

    // 3. Distribución por clasificación
    const clasificacion = await executeQuery(`
      SELECT
        m.clasificacion,
        COUNT(*) as total,
        COALESCE(SUM(inv.existencia_actual * m.precio_unitario), 0) as valor
      FROM inventario_medicamentos inv
      INNER JOIN medicamentos m ON inv.id_medicamento = m.id_medicamento
      WHERE m.activo = true
      GROUP BY m.clasificacion
    `);

    // 4. Valor total del inventario
    const valorTotal = await executeQueryOne(`
      SELECT
        COUNT(*) as total_items,
        COALESCE(SUM(inv.existencia_actual), 0) as total_piezas,
        COALESCE(SUM(inv.existencia_actual * m.precio_unitario), 0) as valor_total
      FROM inventario_medicamentos inv
      INNER JOIN medicamentos m ON inv.id_medicamento = m.id_medicamento
      WHERE m.activo = true
    `);

    const ORDER = ['CRITICO', 'BAJO', 'MEDIO', 'NORMAL'];

    return NextResponse.json({
      success: true,
      data: {
        stockStatus: ORDER.map(estado => {
          const found = stockStatus.find((s: any) => s.estado === estado);
          return { name: estado, value: found ? parseInt(found.total) : 0 };
        }),
        criticos: criticos.map((c: any) => ({
          nombre: c.nombre_comercial,
          sustancia: c.sustancia_activa,
          clasificacion: c.clasificacion,
          existencia: parseInt(c.existencia_actual),
          fondoFijo: parseInt(c.fondo_fijo),
          porcentaje: parseFloat(c.porcentaje)
        })),
        clasificacion: clasificacion.map((c: any) => ({
          name: c.clasificacion,
          total: parseInt(c.total),
          valor: parseFloat(c.valor)
        })),
        resumen: {
          totalItems: parseInt(valorTotal?.total_items) || 0,
          totalPiezas: parseInt(valorTotal?.total_piezas) || 0,
          valorTotal: parseFloat(valorTotal?.valor_total) || 0
        }
      }
    });
  } catch (error: any) {
    console.error('Error analytics inventario:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
