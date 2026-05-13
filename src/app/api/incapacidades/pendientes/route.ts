import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/dbPostgres';

export async function GET(request: NextRequest) {
  try {
    // Buscamos las incapacidades pendientes y hacemos JOIN con la consulta
    // para obtener el nombre del paciente, el folio y el diagnóstico.
    const pendientes = await executeQuery(`
      SELECT
        i.id_incapacidad,
        i.id_consulta,
        i.no_nomina,
        i.fecha_inicio,
        i.fecha_fin,
        i.dias_sugeridos,
        i.motivo_medico,
        i.created_at as fecha_solicitud,
        c.folio as folio_consulta,
        c.nombre as nombre_paciente,
        c.departamento,
        -- Diagnóstico: primero de incapacidades, luego de diagnosticos_consulta
        COALESCE(i.diagnostico_titulo, dc.cie11_titulo) as diagnostico,
        COALESCE(i.diagnostico_codigo, dc.cie11_codigo) as codigo_cie
      FROM incapacidades i
      INNER JOIN consulta c ON i.id_consulta = c.id_consulta
      -- JOIN con diagnósticos: obtener el principal o el primero
      LEFT JOIN diagnosticos_consulta dc ON dc.id_consulta = c.id_consulta
        AND (dc.es_principal = true OR dc.orden = 1)
      WHERE i.estatus = 'PENDIENTE'
      ORDER BY i.created_at ASC
    `);

    return NextResponse.json({
      success: true,
      data: pendientes
    });

  } catch (error: any) {
    console.error('Error al obtener incapacidades pendientes:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error al cargar el listado' 
    }, { status: 500 });
  }
}