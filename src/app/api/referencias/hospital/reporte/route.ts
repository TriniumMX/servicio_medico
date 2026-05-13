// src/app/api/referencias/hospital/reporte/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { executeQuery, executeQueryOne } from '@/lib/dbPostgres';

export interface FilaReporte {
  no_nomina:          string;
  area:               string;
  trabajador:         string;
  paciente:           string;
  es_beneficiario:    boolean;
  diagnostico:        string;
  medico_tratante:    string;
  especialidad:       string;
  fecha_ingreso:      string;
  servicios_otorgados: string;
  subtotal:           number;
  estatus:            string;
}

export interface ResumenEspecialidad {
  especialidad: string;
  total:        number;
}

export interface ResumenMes {
  mes:   string;
  total: number;
}

/**
 * GET /api/referencias/hospital/reporte
 * Mini-dashboard + tabla de consultas de especialidad del hospital del usuario.
 * Query params opcionales: startDate (YYYY-MM-DD), endDate (YYYY-MM-DD)
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const secret   = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret) as { payload: { id: number } };

    const usuarioData = await executeQueryOne<{ id_hospital: number | null; nombre: string }>(
      `SELECT id_hospital, nombre FROM usuarios WHERE id_usuario = $1`,
      [payload.id]
    );

    const idHospital = usuarioData?.id_hospital;
    if (!idHospital) {
      return NextResponse.json({ success: true, filas: [], resumenEspecialidad: [], resumenMes: [], nombreHospital: '' });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate   = searchParams.get('endDate');

    const dateFilter = startDate && endDate
      ? `AND r.creado_en >= '${startDate}' AND r.creado_en <= '${endDate} 23:59:59'`
      : '';

    // ── Tabla principal ──────────────────────────────────────────────────────
    const rows = await executeQuery<{
      no_nomina:       string;
      nombre_paciente: string;
      id_beneficiario: number;
      diagnostico:     string;
      medico_tratante: string;
      especialidad:    string;
      fecha_ingreso:   string;
      costo:           number;
      departamento:    string;
      nombre_consulta: string;
      estatus:         string;
    }>(`
      SELECT
        r.no_nomina,
        r.nombre_paciente,
        r.id_beneficiario,
        COALESCE(
          (SELECT dc.cie11_titulo
           FROM diagnosticos_consulta dc
           WHERE dc.id_consulta = c.id_consulta AND dc.es_principal = TRUE
           LIMIT 1),
          c.motivo_consulta,
          'Sin diagnóstico'
        )                                               AS diagnostico,
        COALESCE(me.nombre, r.nombre_medico_refiere)    AS medico_tratante,
        r.nombre_especialidad                           AS especialidad,
        TO_CHAR(r.creado_en, 'DD/MM/YYYY')              AS fecha_ingreso,
        COALESCE(me.costo, 0)                           AS costo,
        COALESCE(c.departamento, 'Sin área')            AS departamento,
        COALESCE(c.nombre, r.nombre_paciente)           AS nombre_consulta,
        r.estatus
      FROM referencias_especialidad r
      INNER JOIN consulta c       ON r.id_consulta_origen = c.id_consulta
      INNER JOIN usuarios me      ON r.id_medico_asignado  = me.id_usuario
                                 AND me.id_hospital        = $1
      WHERE r.activo = true
        AND r.estatus IN ('asignada', 'notificada', 'atendida')
        ${dateFilter}
      ORDER BY r.creado_en DESC
    `, [idHospital]);

    // Agrupar especialidades únicas por nómina
    const espMap = new Map<string, Set<string>>();
    for (const r of rows) {
      const s = espMap.get(r.no_nomina) ?? new Set<string>();
      s.add(r.especialidad);
      espMap.set(r.no_nomina, s);
    }

    const filas: FilaReporte[] = rows.map(r => ({
      no_nomina:           r.no_nomina,
      area:                r.departamento,
      trabajador:          r.nombre_consulta,
      paciente:            r.nombre_paciente,
      es_beneficiario:     r.id_beneficiario > 0,
      diagnostico:         r.diagnostico,
      medico_tratante:     r.medico_tratante,
      especialidad:        r.especialidad,
      fecha_ingreso:       r.fecha_ingreso,
      servicios_otorgados: [...(espMap.get(r.no_nomina) ?? [])].sort().join(', '),
      subtotal:            Number(r.costo),
      estatus:             r.estatus,
    }));

    // ── Resumen por especialidad ─────────────────────────────────────────────
    const resumenEspecialidad: ResumenEspecialidad[] = await executeQuery(`
      SELECT
        r.nombre_especialidad AS especialidad,
        COUNT(*)              AS total
      FROM referencias_especialidad r
      INNER JOIN usuarios me ON r.id_medico_asignado = me.id_usuario
                             AND me.id_hospital = $1
      WHERE r.activo = true AND r.estatus IN ('asignada','notificada','atendida')
        ${dateFilter}
      GROUP BY r.nombre_especialidad
      ORDER BY total DESC
    `, [idHospital]);

    // ── Resumen por mes ──────────────────────────────────────────────────────
    const resumenMes: ResumenMes[] = await executeQuery(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', r.creado_en), 'Mon YYYY') AS mes,
        COUNT(*) AS total
      FROM referencias_especialidad r
      INNER JOIN usuarios me ON r.id_medico_asignado = me.id_usuario
                             AND me.id_hospital = $1
      WHERE r.activo = true AND r.estatus IN ('asignada','notificada','atendida')
      GROUP BY DATE_TRUNC('month', r.creado_en)
      ORDER BY DATE_TRUNC('month', r.creado_en) ASC
    `, [idHospital]);

    const hospitalData = await executeQueryOne<{ nombre_hospital: string }>(
      `SELECT nombre_hospital FROM hospitales WHERE id_hospital = $1`, [idHospital]
    );

    return NextResponse.json({
      success: true,
      filas,
      resumenEspecialidad,
      resumenMes,
      nombreHospital: hospitalData?.nombre_hospital ?? '',
      total: filas.length,
    });
  } catch (error) {
    console.error('Error en reporte hospital:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
