import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/dbPostgres';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estatus = searchParams.get('estatus') || 'pendiente_autorizar';

    const referencias = await executeQuery(`
      SELECT 
        r.id_referencia,
        r.id_consulta_origen,
        r.no_nomina,
        r.nombre_paciente,
        r.nombre_medico_refiere,
        r.nombre_especialidad,
        r.motivo_referencia,
        r.estatus,
        r.creado_en as fecha_solicitud,
        -- Datos administrativos
        r.lugar_atencion,
        r.medico_asignado,
        r.fecha_cita,
        r.motivo_rechazo,
        -- Datos extra del paciente
        c.departamento,
        c.folio as folio_consulta
      FROM referencias_especialidad r
      INNER JOIN consulta c ON r.id_consulta_origen = c.id_consulta
      WHERE r.estatus = $1
      ORDER BY r.creado_en DESC
    `, [estatus]);

    return NextResponse.json({ success: true, data: referencias });

  } catch (error: any) {
    console.error('Error al obtener referencias:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id_referencia, accion, datos } = body;

    if (accion === 'RECHAZAR') {
      await executeQuery(`
        UPDATE referencias_especialidad
        SET 
          estatus = 'rechazada',
          motivo_rechazo = $1,
          actualizado_en = NOW()
        WHERE id_referencia = $2
      `, [datos.motivo, id_referencia]);
    } 
    else if (accion === 'AUTORIZAR') {
      await executeQuery(`
        UPDATE referencias_especialidad
        SET 
          estatus = 'autorizada',
          lugar_atencion = $1,
          medico_asignado = $2,
          fecha_cita = $3,
          notas_admin = $4,
          actualizado_en = NOW()
        WHERE id_referencia = $5
      `, [
        datos.lugar,
        datos.medico,
        datos.fecha_cita,
        datos.notas,
        id_referencia
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}