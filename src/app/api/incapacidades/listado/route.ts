import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/dbPostgres';

export async function GET(request: NextRequest) {
  try {
    // Obtenemos el estatus de la URL (ej: ?estatus=AUTORIZADA)
    const { searchParams } = new URL(request.url);
    const estatus = searchParams.get('estatus') || 'PENDIENTE';
    const entregada = searchParams.get('entregada'); // 'true', 'false' o null

    // Construir filtro de entrega
    let filtroEntrega = '';
    if (entregada === 'true') {
      filtroEntrega = 'AND i.fecha_entrega IS NOT NULL';
    } else if (entregada === 'false') {
      filtroEntrega = 'AND i.fecha_entrega IS NULL';
    }

    // Verificar si existe la columna id_usuario_autorizo
    const columnaAutorizador = await executeQuery(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'incapacidades' AND column_name = 'id_usuario_autorizo'
    `);
    const tieneAutorizador = columnaAutorizador.length > 0;

    // Verificar si existe la columna fecha_entrega
    const columnaEntrega = await executeQuery(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'incapacidades' AND column_name = 'fecha_entrega'
    `);
    const tieneEntrega = columnaEntrega.length > 0;

    // Ajustar filtro si no existe la columna
    if (!tieneEntrega) {
      filtroEntrega = '';
    }

    const listado = await executeQuery(`
      SELECT
        i.id_incapacidad,
        i.id_consulta,
        i.no_nomina,
        i.fecha_inicio,
        i.fecha_fin,
        i.dias_sugeridos,
        i.dias_autorizados,
        i.motivo_medico,
        i.motivo_rechazo,
        i.created_at as fecha_solicitud,
        i.fecha_autorizacion,
        ${tieneEntrega ? 'i.fecha_entrega,' : 'NULL as fecha_entrega,'}
        c.folio as folio_consulta,
        c.nombre as nombre_paciente,
        c.departamento,
        COALESCE(i.diagnostico_titulo, dc.cie11_titulo) as diagnostico,
        COALESCE(i.diagnostico_codigo, dc.cie11_codigo) as codigo_cie,
        u.nombre as nombre_doctor
        ${tieneAutorizador ? ', ua.nombre as nombre_autorizador' : ', NULL as nombre_autorizador'}
      FROM incapacidades i
      INNER JOIN consulta c ON i.id_consulta = c.id_consulta
      LEFT JOIN usuarios u ON c.id_medico = u.id_usuario
      ${tieneAutorizador ? 'LEFT JOIN usuarios ua ON i.id_usuario_autorizo = ua.id_usuario' : ''}
      LEFT JOIN diagnosticos_consulta dc ON dc.id_consulta = c.id_consulta
        AND (dc.es_principal = true OR dc.orden = 1)
      WHERE i.estatus = $1
      ${filtroEntrega}
      ORDER BY i.updated_at DESC, i.created_at DESC
    `, [estatus]);

    console.log('=== LISTADO INCAPACIDADES ===', {
      tieneAutorizador,
      tieneEntrega,
      ejemploAutorizador: listado.length > 0 ? listado[0].nombre_autorizador : null
    });

    return NextResponse.json({ success: true, data: listado });

  } catch (error: any) {
    console.error('Error al obtener listado:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}