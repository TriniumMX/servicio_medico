import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { executeQuery, executeQueryOne } from '@/lib/dbPostgres';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilterIncap = startDate && endDate
      ? `AND i.created_at >= '${startDate}' AND i.created_at <= '${endDate} 23:59:59'`
      : '';

    const dateFilterRef = startDate && endDate
      ? `AND r.creado_en >= '${startDate}' AND r.creado_en <= '${endDate} 23:59:59'`
      : '';

    // ========== INCAPACIDADES ==========
    const incapacidades = await executeQuery(`
      SELECT
        COALESCE(i.diagnostico_codigo, 'Sin código') as codigo,
        COALESCE(i.diagnostico_titulo, 'Sin diagnóstico') as titulo,
        COALESCE(i.estatus, 'PENDIENTE') as estatus,
        i.dias_sugeridos,
        COALESCE(i.dias_autorizados, 0) as dias_autorizados,
        TO_CHAR(i.created_at, 'DD/MM/YYYY') as fecha
      FROM incapacidades i
      WHERE 1=1 ${dateFilterIncap}
      ORDER BY i.created_at DESC
    `);

    // ========== REFERENCIAS ==========
    const referencias = await executeQuery(`
      SELECT
        COALESCE(r.nombre_especialidad, 'Sin especialidad') as especialidad,
        r.estatus,
        TO_CHAR(r.creado_en, 'DD/MM/YYYY') as fecha_creacion,
        TO_CHAR(r.fecha_asignacion, 'DD/MM/YYYY') as fecha_asignacion,
        TO_CHAR(r.fecha_autorizacion, 'DD/MM/YYYY') as fecha_autorizacion,
        TO_CHAR(r.fecha_notificacion, 'DD/MM/YYYY') as fecha_notificacion,
        TO_CHAR(r.fecha_atencion, 'DD/MM/YYYY') as fecha_atencion
      FROM referencias_especialidad r
      WHERE r.activo = true ${dateFilterRef}
      ORDER BY r.creado_en DESC
    `);

    // ========== INVENTARIO ==========
    const inventario = await executeQuery(`
      SELECT
        m.nombre_comercial,
        m.sustancia_activa,
        m.clasificacion,
        inv.existencia_actual,
        inv.fondo_fijo,
        CASE WHEN inv.fondo_fijo > 0
          THEN ROUND((inv.existencia_actual::numeric / inv.fondo_fijo) * 100, 1)
          ELSE 0
        END as porcentaje,
        CASE
          WHEN inv.fondo_fijo > 0 AND (inv.existencia_actual::float / inv.fondo_fijo) <= 0.10 THEN 'CRITICO'
          WHEN inv.fondo_fijo > 0 AND (inv.existencia_actual::float / inv.fondo_fijo) <= 0.30 THEN 'BAJO'
          WHEN inv.fondo_fijo > 0 AND (inv.existencia_actual::float / inv.fondo_fijo) <= 0.50 THEN 'MEDIO'
          ELSE 'NORMAL'
        END as estado,
        m.precio_unitario
      FROM inventario_medicamentos inv
      INNER JOIN medicamentos m ON inv.id_medicamento = m.id_medicamento
      WHERE m.activo = true
      ORDER BY (CASE WHEN inv.fondo_fijo > 0 THEN inv.existencia_actual::float / inv.fondo_fijo ELSE 999 END) ASC
    `);

    // Crear workbook
    const wb = XLSX.utils.book_new();

    // Hoja 1: Incapacidades
    const wsIncap = XLSX.utils.json_to_sheet(
      incapacidades.map((i: any) => ({
        'Código Diagnóstico': i.codigo,
        'Diagnóstico': i.titulo,
        'Estatus': i.estatus,
        'Días Sugeridos': parseInt(i.dias_sugeridos) || 0,
        'Días Autorizados': parseInt(i.dias_autorizados) || 0,
        'Fecha': i.fecha
      }))
    );
    XLSX.utils.book_append_sheet(wb, wsIncap, 'Incapacidades');

    // Hoja 2: Referencias
    const wsRef = XLSX.utils.json_to_sheet(
      referencias.map((r: any) => ({
        'Especialidad': r.especialidad,
        'Estatus': r.estatus,
        'Fecha Creación': r.fecha_creacion || '',
        'Fecha Asignación': r.fecha_asignacion || '',
        'Fecha Autorización': r.fecha_autorizacion || '',
        'Fecha Notificación': r.fecha_notificacion || '',
        'Fecha Atención': r.fecha_atencion || ''
      }))
    );
    XLSX.utils.book_append_sheet(wb, wsRef, 'Referencias');

    // Hoja 3: Inventario
    const wsInv = XLSX.utils.json_to_sheet(
      inventario.map((inv: any) => ({
        'Medicamento': inv.nombre_comercial,
        'Sustancia Activa': inv.sustancia_activa,
        'Clasificación': inv.clasificacion,
        'Existencia': parseInt(inv.existencia_actual),
        'Fondo Fijo': parseInt(inv.fondo_fijo),
        '% Stock': parseFloat(inv.porcentaje),
        'Estado': inv.estado,
        'Precio Unitario': parseFloat(inv.precio_unitario) || 0
      }))
    );
    XLSX.utils.book_append_sheet(wb, wsInv, 'Inventario');

    // Generar buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="analytics_${startDate || 'all'}_${endDate || 'all'}.xlsx"`,
      }
    });
  } catch (error: any) {
    console.error('Error exportar excel:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
