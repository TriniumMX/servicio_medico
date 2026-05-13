import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/dbPostgres';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter = startDate && endDate
      ? `AND r.creado_en >= '${startDate}' AND r.creado_en <= '${endDate} 23:59:59'`
      : '';

    // 1. Embudo: conteo por estatus
    const embudo = await executeQuery(`
      SELECT
        r.estatus,
        COUNT(*) as total
      FROM referencias_especialidad r
      WHERE r.activo = true ${dateFilter}
      GROUP BY r.estatus
      ORDER BY
        CASE r.estatus
          WHEN 'pendiente_autorizar' THEN 1
          WHEN 'pendiente_asignar' THEN 2
          WHEN 'autorizada' THEN 3
          WHEN 'asignada' THEN 4
          WHEN 'notificada' THEN 5
          WHEN 'atendida' THEN 6
          WHEN 'cancelada' THEN 7
        END
    `);

    // 2. Tiempos promedio entre fases (en días) - Flujo: Crear → Autorizar → Asignar → Notificar → Atender
    const tiempos = await executeQuery(`
      SELECT
        ROUND(AVG(EXTRACT(EPOCH FROM (r.fecha_autorizacion - r.creado_en)) / 86400), 1) as dias_autorizacion,
        ROUND(AVG(EXTRACT(EPOCH FROM (r.fecha_asignacion - r.fecha_autorizacion)) / 86400), 1) as dias_asignacion,
        ROUND(AVG(EXTRACT(EPOCH FROM (r.fecha_notificacion - r.fecha_asignacion)) / 86400), 1) as dias_notificacion,
        ROUND(AVG(EXTRACT(EPOCH FROM (r.fecha_atencion - r.fecha_notificacion)) / 86400), 1) as dias_atencion,
        ROUND(AVG(EXTRACT(EPOCH FROM (
          COALESCE(r.fecha_atencion, NOW()) - r.creado_en
        )) / 86400), 1) as dias_total
      FROM referencias_especialidad r
      WHERE r.activo = true ${dateFilter}
    `);

    // 3. Top especialidades más demandadas
    const especialidades = await executeQuery(`
      SELECT
        COALESCE(r.nombre_especialidad, 'Sin especialidad') as especialidad,
        COUNT(*) as total,
        COUNT(CASE WHEN r.estatus = 'atendida' THEN 1 END) as atendidas,
        COUNT(CASE WHEN r.estatus = 'cancelada' THEN 1 END) as canceladas
      FROM referencias_especialidad r
      WHERE r.activo = true ${dateFilter}
      GROUP BY r.nombre_especialidad
      ORDER BY total DESC
      LIMIT 10
    `);

    const LABELS: Record<string, string> = {
      pendiente_autorizar: 'Pendiente Autorizar',
      pendiente_asignar: 'Pendiente Asignar (Legacy)',
      autorizada: 'Autorizada',
      asignada: 'Asignada',
      notificada: 'Notificada',
      atendida: 'Atendida',
      cancelada: 'Cancelada'
    };

    const t = tiempos[0] || {};

    return NextResponse.json({
      success: true,
      data: {
        embudo: embudo.map((e: any) => ({
          name: LABELS[e.estatus] || e.estatus,
          estatus: e.estatus,
          value: parseInt(e.total)
        })),
        tiempos: [
          { name: 'Creación → Autorización', dias: parseFloat(t.dias_autorizacion) || 0 },
          { name: 'Autorización → Asignación', dias: parseFloat(t.dias_asignacion) || 0 },
          { name: 'Asignación → Notificación', dias: parseFloat(t.dias_notificacion) || 0 },
          { name: 'Notificación → Atención', dias: parseFloat(t.dias_atencion) || 0 },
        ],
        tiempoTotal: parseFloat(t.dias_total) || 0,
        especialidades: especialidades.map((e: any) => ({
          name: e.especialidad,
          total: parseInt(e.total),
          atendidas: parseInt(e.atendidas),
          canceladas: parseInt(e.canceladas)
        }))
      }
    });
  } catch (error: any) {
    console.error('Error analytics referencias:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
