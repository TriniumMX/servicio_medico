// src/app/api/referencias/hospital/reporte/exportar-excel/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { executeQuery, executeQueryOne } from '@/lib/dbPostgres';
import ExcelJS from 'exceljs';

// ── Paleta de colores por sección ────────────────────────────────────────────
// Título / portada
const TITULO_BG   = 'FF0F172A'; // slate-950
const TITULO_SUB  = 'FFE2E8F0'; // slate-200
const TITULO_STXT = 'FF334155'; // slate-700

// Sección 1 — Identificación (cols 1-5)
const S1_LABEL = 'FF334155'; // slate-700
const S1_HDR   = 'FF475569'; // slate-600
const S1_EVEN  = 'FFF8FAFC'; // slate-50
const S1_BRD   = 'FFE2E8F0'; // slate-200

// Sección 2 — Clínico (cols 6-8)
const S2_LABEL = 'FF4C1D95'; // violet-900
const S2_HDR   = 'FF6D28D9'; // violet-700
const S2_EVEN  = 'FFFAF5FF'; // violet-50
const S2_BRD   = 'FFEDE9FE'; // violet-100

// Sección 3 — Gestión (cols 9-11)
const S3_LABEL = 'FF0F766E'; // teal-700
const S3_HDR   = 'FF0D9488'; // teal-600
const S3_EVEN  = 'FFF0FDFA'; // teal-50
const S3_BRD   = 'FFCCFBF1'; // teal-100

// Fila de totales
const TOTAL_BG  = 'FFF1F5F9'; // slate-100
const TOTAL_TXT = 'FF0F172A'; // slate-950

function seccion(col: number): 1 | 2 | 3 {
  if (col <= 5) return 1;
  if (col <= 8) return 2;
  return 3;
}

function hdrColor(col: number) {
  return [S1_HDR, S2_HDR, S3_HDR][seccion(col) - 1];
}

function labelColor(col: number) {
  return [S1_LABEL, S2_LABEL, S3_LABEL][seccion(col) - 1];
}

function evenColor(col: number) {
  return [S1_EVEN, S2_EVEN, S3_EVEN][seccion(col) - 1];
}

function brdColor(col: number): Partial<ExcelJS.Border> {
  const c = [S1_BRD, S2_BRD, S3_BRD][seccion(col) - 1];
  return { style: 'thin', color: { argb: c } };
}

function borders(col: number) {
  const b = brdColor(col);
  return { top: b, bottom: b, left: b, right: b };
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret) as { payload: { id: number } };

    const usuarioData = await executeQueryOne<{ id_hospital: number | null }>(
      `SELECT id_hospital FROM usuarios WHERE id_usuario = $1`, [payload.id]
    );
    const idHospital = usuarioData?.id_hospital;
    if (!idHospital) return NextResponse.json({ success: false, error: 'Sin hospital asignado' }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate   = searchParams.get('endDate');
    const dateFilter = startDate && endDate
      ? `AND r.creado_en >= '${startDate}' AND r.creado_en <= '${endDate} 23:59:59'` : '';

    const hospitalData = await executeQueryOne<{ nombre_hospital: string }>(
      `SELECT nombre_hospital FROM hospitales WHERE id_hospital = $1`, [idHospital]
    );
    const nombreHospital = hospitalData?.nombre_hospital ?? 'Hospital';

    // ── Datos ────────────────────────────────────────────────────────────────
    const rows = await executeQuery<any>(`
      SELECT
        r.no_nomina,
        COALESCE(c.departamento, 'Sin área')            AS area,
        COALESCE(c.nombre, r.nombre_paciente)           AS trabajador,
        r.nombre_paciente                               AS paciente,
        CASE WHEN r.id_beneficiario > 0 THEN 'Beneficiario' ELSE 'Empleado' END AS tipo_paciente,
        COALESCE(
          (SELECT dc.cie11_titulo FROM diagnosticos_consulta dc
           WHERE dc.id_consulta = c.id_consulta AND dc.es_principal = TRUE LIMIT 1),
          c.motivo_consulta, 'Sin diagnóstico'
        )                                               AS diagnostico,
        COALESCE(me.nombre, r.nombre_medico_refiere)    AS medico_tratante,
        r.nombre_especialidad                           AS especialidad,
        TO_CHAR(r.creado_en, 'DD/MM/YYYY')              AS fecha_ingreso,
        COALESCE(me.costo, 0)                           AS costo,
        r.estatus
      FROM referencias_especialidad r
      INNER JOIN consulta c  ON r.id_consulta_origen = c.id_consulta
      INNER JOIN usuarios me ON r.id_medico_asignado  = me.id_usuario AND me.id_hospital = $1
      WHERE r.activo = true AND r.estatus IN ('asignada','notificada','atendida') ${dateFilter}
      ORDER BY r.creado_en DESC
    `, [idHospital]);

    // Agrupar especialidades únicas por nómina
    const espMap = new Map<string, Set<string>>();
    for (const r of rows) {
      const s = espMap.get(r.no_nomina) ?? new Set<string>();
      s.add(r.especialidad);
      espMap.set(r.no_nomina, s);
    }

    const resumen = await executeQuery<{ especialidad: string; total: string }>(`
      SELECT r.nombre_especialidad AS especialidad, COUNT(*) AS total
      FROM referencias_especialidad r
      INNER JOIN usuarios me ON r.id_medico_asignado = me.id_usuario AND me.id_hospital = $1
      WHERE r.activo = true AND r.estatus IN ('asignada','notificada','atendida') ${dateFilter}
      GROUP BY r.nombre_especialidad ORDER BY total DESC
    `, [idHospital]);

    // ── Workbook ─────────────────────────────────────────────────────────────
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Servicio Médico';
    wb.created = new Date();

    // ═══════════════════════ HOJA 1: DETALLE ════════════════════════════════
    const ws = wb.addWorksheet('Detalle de Consultas', {
      pageSetup: { fitToPage: true, fitToWidth: 1, orientation: 'landscape' },
    });

    // ── Fila 1: Título principal ──────────────────────────────────────────
    ws.mergeCells('A1:K1');
    const titulo = ws.getCell('A1');
    titulo.value     = `REPORTE DE CONSULTAS DE ESPECIALIDAD — ${nombreHospital.toUpperCase()}`;
    titulo.font      = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titulo.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: TITULO_BG } };
    titulo.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 38;

    // ── Fila 2: Subtítulo ─────────────────────────────────────────────────
    ws.mergeCells('A2:K2');
    const sub = ws.getCell('A2');
    sub.value     = startDate && endDate
      ? `Período: ${startDate}  al  ${endDate}`
      : `Generado: ${new Date().toLocaleDateString('es-MX', { dateStyle: 'long' })}`;
    sub.font      = { name: 'Calibri', size: 10, italic: true, color: { argb: TITULO_STXT } };
    sub.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: TITULO_SUB } };
    sub.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(2).height = 20;

    // ── Fila 3: Etiquetas de sección ──────────────────────────────────────
    ws.mergeCells('A3:E3');
    ws.mergeCells('F3:H3');
    ws.mergeCells('I3:K3');
    const applyLabel = (addr: string, text: string, col: number) => {
      const cell = ws.getCell(addr);
      cell.value     = text;
      cell.font      = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FFFFFFFF' }, italic: true };
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: labelColor(col) } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    };
    applyLabel('A3', 'IDENTIFICACIÓN', 1);
    applyLabel('F3', 'INFORMACIÓN CLÍNICA', 6);
    applyLabel('I3', 'GESTIÓN', 9);
    ws.getRow(3).height = 16;

    // ── Fila 4: Encabezados ───────────────────────────────────────────────
    const headers = [
      'NÚM. NÓMINA', 'ÁREA', 'TRABAJADOR', 'PACIENTE', 'TIPO PACIENTE',
      'DIAGNÓSTICO', 'MÉDICO TRATANTE', 'ESPECIALIDAD',
      'FECHA INGRESO', 'SERVICIOS OTORGADOS', 'SUBTOTAL ($)',
    ];
    const headerRow = ws.addRow(headers); // fila 4
    headerRow.height = 28;
    headerRow.eachCell((cell, col) => {
      cell.font      = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: hdrColor(col) } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border    = borders(col);
    });

    // ── Filas de datos ────────────────────────────────────────────────────
    let totalSubtotal = 0;
    rows.forEach((r: any, idx: number) => {
      const servicios = [...(espMap.get(r.no_nomina) ?? [])].sort().join(', ');
      const subtotal  = Number(r.costo);
      totalSubtotal  += subtotal;

      const dataRow = ws.addRow([
        r.no_nomina, r.area, r.trabajador, r.paciente, r.tipo_paciente,
        r.diagnostico, r.medico_tratante, r.especialidad,
        r.fecha_ingreso, servicios, subtotal,
      ]);
      dataRow.height = 20;

      dataRow.eachCell((cell, col) => {
        const fillArgb = idx % 2 === 0 ? evenColor(col) : 'FFFFFFFF';
        cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillArgb } };
        cell.font   = { name: 'Calibri', size: 9 };
        cell.border = borders(col);
        cell.alignment = { vertical: 'middle', wrapText: col === 6 };

        if (col === 11) {
          cell.numFmt    = '"$"#,##0.00';
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }
        if (col === 10) cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
        if (col === 1 || col === 5 || col === 9)
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });
    });

    // ── Fila de totales ───────────────────────────────────────────────────
    const totalRow = ws.addRow([
      '', '', '', '', '', '', '', 'TOTAL',
      `${rows.length} registros`, '', totalSubtotal,
    ]);
    totalRow.height = 26;
    totalRow.eachCell((cell, col) => {
      cell.font   = { name: 'Calibri', size: 10, bold: true, color: { argb: TOTAL_TXT } };
      cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_BG } };
      cell.border = borders(col);
      cell.alignment = { vertical: 'middle' };
      if (col === 8) cell.alignment = { horizontal: 'right', vertical: 'middle' };
      if (col === 9) cell.alignment = { horizontal: 'center', vertical: 'middle' };
      if (col === 11) {
        cell.numFmt    = '"$"#,##0.00';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }
    });

    // ── Anchos de columna ─────────────────────────────────────────────────
    ws.columns = [
      { key: 'A', width: 14 }, { key: 'B', width: 22 },
      { key: 'C', width: 28 }, { key: 'D', width: 28 },
      { key: 'E', width: 14 }, { key: 'F', width: 35 },
      { key: 'G', width: 28 }, { key: 'H', width: 20 },
      { key: 'I', width: 14 }, { key: 'J', width: 36 },
      { key: 'K', width: 14 },
    ];

    // ═══════════════════════ HOJA 2: RESUMEN POR ESPECIALIDAD ════════════════
    const ws2 = wb.addWorksheet('Resumen por Especialidad');

    ws2.mergeCells('A1:C1');
    const t2 = ws2.getCell('A1');
    t2.value     = 'CONSULTAS POR ESPECIALIDAD';
    t2.font      = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
    t2.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: TITULO_BG } };
    t2.alignment = { horizontal: 'center', vertical: 'middle' };
    ws2.getRow(1).height = 34;

    // Subtítulo hoja 2
    ws2.mergeCells('A2:C2');
    const s2 = ws2.getCell('A2');
    s2.value     = nombreHospital;
    s2.font      = { name: 'Calibri', size: 10, italic: true, color: { argb: TITULO_STXT } };
    s2.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: TITULO_SUB } };
    s2.alignment = { horizontal: 'center', vertical: 'middle' };
    ws2.getRow(2).height = 18;

    const h2 = ws2.addRow(['ESPECIALIDAD', 'TOTAL CONSULTAS', '% DEL TOTAL']);
    h2.height = 26;
    h2.eachCell((cell, col) => {
      cell.font      = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: S2_HDR } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border    = { top: brdColor(6), bottom: brdColor(6), left: brdColor(6), right: brdColor(6) };
    });

    const totalConsultas = resumen.reduce((a, r) => a + parseInt(r.total), 0);
    resumen.forEach((r, idx) => {
      const tot = parseInt(r.total);
      const pct = totalConsultas > 0 ? (tot / totalConsultas * 100).toFixed(1) : '0.0';
      const row = ws2.addRow([r.especialidad, tot, parseFloat(pct) / 100]);
      row.height = 20;
      const fillArgb = idx % 2 === 0 ? S2_EVEN : 'FFFFFFFF';
      row.eachCell((cell, col) => {
        cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillArgb } };
        cell.font      = { name: 'Calibri', size: 10 };
        cell.border    = { top: brdColor(6), bottom: brdColor(6), left: brdColor(6), right: brdColor(6) };
        cell.alignment = { horizontal: col === 1 ? 'left' : 'center', vertical: 'middle' };
        if (col === 3) cell.numFmt = '0.0%';
      });
    });

    const tr2 = ws2.addRow(['TOTAL', totalConsultas, 1]);
    tr2.height = 24;
    tr2.eachCell((cell, col) => {
      cell.font      = { name: 'Calibri', size: 10, bold: true, color: { argb: TOTAL_TXT } };
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_BG } };
      cell.border    = { top: brdColor(6), bottom: brdColor(6), left: brdColor(6), right: brdColor(6) };
      cell.alignment = { horizontal: col === 1 ? 'left' : 'center', vertical: 'middle' };
      if (col === 3) cell.numFmt = '0.0%';
    });

    ws2.columns = [
      { key: 'A', width: 34 }, { key: 'B', width: 18 }, { key: 'C', width: 14 },
    ];

    // ── Generar buffer ───────────────────────────────────────────────────────
    const buffer = await wb.xlsx.writeBuffer();
    const fecha  = new Date().toISOString().split('T')[0];

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="reporte_hospital_${fecha}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Error al exportar Excel:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
