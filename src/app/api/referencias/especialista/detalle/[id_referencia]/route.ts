// src/app/api/referencias/especialista/detalle/[id_referencia]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { executeQueryOne, executeQuery } from '@/lib/dbPostgres';
import type { ReferenciaResponse } from '@/types/referencias';

/**
 * GET - Obtener detalle completo de una referencia incluyendo la consulta de origen
 * FASE 5: Médico Especialista - Para tener contexto completo antes de atender
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id_referencia: string }> }
) {
  try {
    const { id_referencia: idReferencia } = await params;

    if (!idReferencia) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID de referencia requerido'
        },
        { status: 400 }
      );
    }

    // Obtener la referencia completa con todos los datos relacionados
    const referencia = await executeQueryOne(`
      SELECT
        r.id_referencia,
        r.id_consulta_origen,
        r.id_consulta_seguimiento,
        r.no_nomina,
        r.id_beneficiario,
        r.nombre_paciente,
        r.id_medico_refiere,
        r.nombre_medico_refiere,
        r.id_especialidad_solicitada,
        r.nombre_especialidad,
        r.motivo_referencia,
        r.id_medico_asignado,
        r.fecha_cita,
        r.id_usuario_asigna,
        r.fecha_asignacion,
        r.id_coordinador_autoriza,
        r.fecha_autorizacion,
        r.observaciones_coordinador,
        r.firma_digital,
        r.id_usuario_notifica,
        r.fecha_notificacion,
        r.observaciones_notificacion,
        r.fecha_atencion,
        r.estatus,
        r.activo,
        r.creado_en,
        r.actualizado_en,
        me.nombre as nombre_medico_asignado,
        mr.nombre as nombre_medico_refiere_completo,
        mr.cedula_profesional as cedula_medico_refiere,
        co.nombre as nombre_coordinador,
        an.nombre as nombre_admin_notifica,
        -- Datos de la consulta origen
        c.folio as folio_consulta_origen,
        c.fecha_consulta,
        c.motivo_consulta,
        c.edad,
        c.sexo,
        c.departamento,
        c.sindicato,
        c.es_empleado,
        c.temperatura_c,
        c.ta_sistolica,
        c.ta_diastolica,
        c.frecuencia_cardiaca,
        c.oxigenacion,
        c.altura_cm,
        c.peso_kg,
        c.glucosa_mg_dl,
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
        -- Campos legacy para compatibilidad (tomamos el primero del json si es necesario, o null)
        c.subjetivo,
        c.objetivo,
        c.analisis,
        c.plan,
        c.pronostico
      FROM referencias_especialidad r
      INNER JOIN consulta c ON r.id_consulta_origen = c.id_consulta
      LEFT JOIN usuarios me ON r.id_medico_asignado = me.id_usuario
      LEFT JOIN usuarios mr ON r.id_medico_refiere = mr.id_usuario
      LEFT JOIN usuarios co ON r.id_coordinador_autoriza = co.id_usuario
      LEFT JOIN usuarios an ON r.id_usuario_notifica = an.id_usuario
      WHERE r.id_referencia = $1
    `, [idReferencia]);

    if (!referencia) {
      return NextResponse.json(
        {
          success: false,
          error: 'Referencia no encontrada'
        },
        { status: 404 }
      );
    }

    // Obtener datos de tratamiento de la consulta origen
    const idConsulta = referencia.id_consulta_origen;

    const [medicamentos, estudios, incapacidadArr] = await Promise.all([
      // Medicamentos recetados
      executeQuery(`
        SELECT
          m.nombre_comercial,
          m.sustancia_activa,
          dr.dosis,
          dr.cantidad_total,
          dr.duracion_tratamiento_dias,
          dr.indicaciones,
          dr.via_administracion
        FROM recetas r
        INNER JOIN detalle_receta dr ON r.id_receta = dr.id_receta
        INNER JOIN medicamentos m ON dr.id_medicamento = m.id_medicamento
        WHERE r.id_consulta = $1
        ORDER BY dr.id_detalle
      `, [idConsulta]),

      // Estudios de laboratorio
      executeQuery(`
        SELECT
          el.nombre_estudio,
          el.categoria,
          ce.motivo,
          ce.estatus
        FROM consulta_estudios ce
        INNER JOIN cat_estudios_laboratorio el ON ce.id_estudio = el.id_estudio
        WHERE ce.id_consulta = $1
        ORDER BY ce.id_solicitud
      `, [idConsulta]),

      // Incapacidad
      executeQuery(`
        SELECT
          fecha_inicio,
          fecha_fin,
          dias_sugeridos,
          dias_autorizados,
          motivo_medico,
          estatus
        FROM incapacidades
        WHERE id_consulta = $1
        LIMIT 1
      `, [idConsulta]),
    ]);

    // Estructurar la respuesta para el frontend
    const referenciaConDetalle = {
      ...referencia,
      // Datos de tratamiento para el PDF
      plan_tratamiento: referencia.plan,
      medicamentos_recetados: medicamentos.length > 0 ? medicamentos : null,
      estudios_laboratorio: estudios.length > 0 ? estudios : null,
      incapacidad: incapacidadArr.length > 0 ? incapacidadArr[0] : null,
      consulta_origen: {
        id_consulta: referencia.id_consulta_origen,
        folio: referencia.folio_consulta_origen,
        fecha: referencia.fecha_consulta,
        motivo: referencia.motivo_consulta,
        // Parsear el JSON de diagnósticos
        diagnosticos: typeof referencia.diagnosticos_json === 'string'
          ? JSON.parse(referencia.diagnosticos_json)
          : referencia.diagnosticos_json,
        // Mantener compatibilidad con string simple
        diagnostico: referencia.diagnosticos_json && (typeof referencia.diagnosticos_json === 'string' ? JSON.parse(referencia.diagnosticos_json) : referencia.diagnosticos_json).length > 0
          ? `${(typeof referencia.diagnosticos_json === 'string' ? JSON.parse(referencia.diagnosticos_json) : referencia.diagnosticos_json)[0].codigo} - ${(typeof referencia.diagnosticos_json === 'string' ? JSON.parse(referencia.diagnosticos_json) : referencia.diagnosticos_json)[0].titulo}`
          : 'Sin diagnóstico',
        subjetivo: referencia.subjetivo,
        objetivo: referencia.objetivo,
        analisis: referencia.analisis,
        plan: referencia.plan,
        signos_vitales: {
          temperatura: referencia.temperatura_c,
          presion: `${referencia.ta_sistolica}/${referencia.ta_diastolica}`,
          frecuencia_cardiaca: referencia.frecuencia_cardiaca,
          oxigenacion: referencia.oxigenacion,
          peso: referencia.peso_kg,
          altura: referencia.altura_cm
        }
      }
    };

    const response: ReferenciaResponse = {
      success: true,
      referencia: referenciaConDetalle as any
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error al obtener detalle de referencia:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
