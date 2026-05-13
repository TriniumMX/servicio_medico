import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/dbPostgres';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = `
      SELECT
        ce.id_solicitud,
        ce.id_consulta,
        ce.motivo as motivo_clinico,
        ce.fecha_autorizacion,
        ce.estatus,
        ce.fecha_entrega,
        ce.motivo_rechazo,
        el.nombre_estudio,
        el.categoria,
        c.folio as folio_consulta,
        c.nombre as paciente_nombre,
        c.no_nomina,
        c.departamento,
        c.edad,
        -- Diagnósticos agrupados
        (
          SELECT COALESCE(JSON_AGG(json_build_object(
            'codigo', dc.cie11_codigo,
            'titulo', dc.cie11_titulo,
            'es_principal', dc.es_principal
          ) ORDER BY dc.es_principal DESC, dc.orden ASC), '[]')
          FROM diagnosticos_consulta dc
          WHERE dc.id_consulta = c.id_consulta
        ) as diagnosticos_json,
        -- Campo legacy para compatibilidad
        (
          SELECT dc.cie11_codigo || ' - ' || dc.cie11_titulo 
          FROM diagnosticos_consulta dc 
          WHERE dc.id_consulta = c.id_consulta
          ORDER BY dc.es_principal DESC, dc.orden ASC
          LIMIT 1
        ) as diagnostico_cie11_legacy,
        c.es_empleado,
        c.id_beneficiario,
        u_medico.nombre as medico_solicitante,
        u_medico.firma_digital as medico_firma,
        u_coord.nombre as coordinador_nombre,
        u_coord.firma_digital as coordinador_firma,
        u_elaboro.nombre as elaboro_nombre
      FROM consulta_estudios ce
      INNER JOIN cat_estudios_laboratorio el ON ce.id_estudio = el.id_estudio
      INNER JOIN consulta c ON ce.id_consulta = c.id_consulta
      INNER JOIN usuarios u_medico ON c.id_medico = u_medico.id_usuario
      LEFT JOIN usuarios u_coord ON ce.id_usuario_autoriza = u_coord.id_usuario
      LEFT JOIN usuarios u_elaboro ON c.id_usuario_crea = u_elaboro.id_usuario
      WHERE ce.estatus IN ('AUTORIZADO', 'ENTREGADO', 'RECHAZADO')
      ORDER BY ce.fecha_autorizacion DESC
    `;

    const result = await executeQuery(sql);
    return NextResponse.json({ success: true, data: result });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}