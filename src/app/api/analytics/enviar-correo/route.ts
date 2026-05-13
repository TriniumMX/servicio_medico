import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { executeQuery, executeQueryOne } from '@/lib/dbPostgres';
import { enviarCorreo } from '@/lib/nodemailer';
import { generarEmailAnalytics } from '@/lib/templates/analytics-email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { destinatarios, startDate, endDate } = body;

    if (!destinatarios || !Array.isArray(destinatarios) || destinatarios.length === 0) {
      return NextResponse.json({ success: false, error: 'Se requiere al menos un destinatario' }, { status: 400 });
    }

    const dateFilterIncap = startDate && endDate
      ? `AND i.created_at >= '${startDate}' AND i.created_at <= '${endDate} 23:59:59'`
      : '';

    const dateFilterRef = startDate && endDate
      ? `AND r.creado_en >= '${startDate}' AND r.creado_en <= '${endDate} 23:59:59'`
      : '';

    // ========== Datos para Excel ==========
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

    // ========== Resúmenes para el email ==========
    const resIncap = await executeQueryOne(`
      SELECT
        COUNT(*) as total,
        ROUND(AVG(i.dias_sugeridos), 1) as prom_sug,
        ROUND(AVG(i.dias_autorizados), 1) as prom_aut
      FROM incapacidades i
      WHERE 1=1 ${dateFilterIncap}
    `);

    const resRef = await executeQuery(`
      SELECT
        COUNT(*) as total,
        ROUND(AVG(EXTRACT(EPOCH FROM (COALESCE(r.fecha_atencion, NOW()) - r.creado_en)) / 86400), 1) as dias_total
      FROM referencias_especialidad r
      WHERE r.activo = true ${dateFilterRef}
    `);

    const resInv = await executeQueryOne(`
      SELECT
        COUNT(*) as total_items,
        COALESCE(SUM(inv.existencia_actual * m.precio_unitario), 0) as valor_total
      FROM inventario_medicamentos inv
      INNER JOIN medicamentos m ON inv.id_medicamento = m.id_medicamento
      WHERE m.activo = true
    `);

    const stockCounts = await executeQuery(`
      SELECT
        CASE
          WHEN inv.fondo_fijo > 0 AND (inv.existencia_actual::float / inv.fondo_fijo) <= 0.10 THEN 'CRITICO'
          WHEN inv.fondo_fijo > 0 AND (inv.existencia_actual::float / inv.fondo_fijo) <= 0.30 THEN 'BAJO'
          ELSE 'OTRO'
        END as estado,
        COUNT(*) as total
      FROM inventario_medicamentos inv
      INNER JOIN medicamentos m ON inv.id_medicamento = m.id_medicamento
      WHERE m.activo = true
      GROUP BY estado
    `);

    const criticos = parseInt(stockCounts.find((s: any) => s.estado === 'CRITICO')?.total) || 0;
    const bajos = parseInt(stockCounts.find((s: any) => s.estado === 'BAJO')?.total) || 0;

    // ========== Generar Excel ==========
    const wb = XLSX.utils.book_new();

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

    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `analytics_${startDate || 'all'}_${endDate || 'all'}.xlsx`;

    // ========== Logo ==========
    const logoPath = path.join(process.cwd(), 'public', 'logo_pandora.png');
    let logoAttachment = null;
    try {
      if (fs.existsSync(logoPath)) {
        logoAttachment = {
          filename: 'logo_pandora.png',
          content: fs.readFileSync(logoPath),
          cid: 'logo_pandora'
        };
      }
    } catch (e) {
      console.error('Error al leer el logo:', e);
    }

    // ========== Enviar correos ==========
    let enviados = 0;
    const errores: string[] = [];

    for (const correo of destinatarios) {
      const htmlCorreo = generarEmailAnalytics({
        destinatario: correo,
        fechaGeneracion: new Date().toLocaleDateString('es-MX', {
          year: 'numeric', month: 'long', day: 'numeric',
          hour: '2-digit', minute: '2-digit'
        }),
        periodo: {
          desde: startDate || 'Todo',
          hasta: endDate || 'Todo'
        },
        resumenIncapacidades: {
          total: parseInt(resIncap?.total) || 0,
          promedioSugeridos: parseFloat(resIncap?.prom_sug) || 0,
          promedioAutorizados: parseFloat(resIncap?.prom_aut) || 0,
        },
        resumenReferencias: {
          total: parseInt(resRef[0]?.total) || 0,
          tiempoPromedio: parseFloat(resRef[0]?.dias_total) || 0,
        },
        resumenInventario: {
          totalItems: parseInt(resInv?.total_items) || 0,
          criticos,
          bajos,
          valorTotal: parseFloat(resInv?.valor_total) || 0,
        }
      });

      const attachments: any[] = [
        {
          filename: nombreArchivo,
          content: Buffer.from(excelBuffer),
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }
      ];
      if (logoAttachment) attachments.push(logoAttachment);

      const resultado = await enviarCorreo({
        to: correo,
        subject: `Reporte de Analytics - Servicio Medico (${startDate || ''} a ${endDate || ''})`,
        html: htmlCorreo,
        attachments,
      });

      if (resultado.success) {
        enviados++;
      } else {
        errores.push(`${correo}: ${resultado.error}`);
      }
    }

    if (enviados === 0) {
      return NextResponse.json({
        success: false,
        error: 'No se pudo enviar ningun correo',
        errores,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Reporte enviado a ${enviados} destinatario(s)`,
      enviados,
      ...(errores.length > 0 && { errores }),
    });
  } catch (error: any) {
    console.error('Error enviar correo analytics:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
