// src/app/api/referencias/especialista/historial-paciente/[nomina]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/dbPostgres';
import type { HistorialPaciente } from '@/types/referencias';

/**
 * GET - Obtener historial completo del paciente (consultas, referencias, recetas)
 * FASE 5: Médico Especialista - Para tener contexto antes de atender
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nomina: string }> }
) {
  try {
    const { nomina } = await params;
    const { searchParams } = new URL(request.url);
    const idBeneficiario = searchParams.get('idBeneficiario');

    if (!nomina) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nómina requerida'
        },
        { status: 400 }
      );
    }

    // Construir condición de beneficiario
    const conditionBeneficiario = idBeneficiario
      ? `AND id_beneficiario = ${idBeneficiario}`
      : `AND (id_beneficiario = 0 OR id_beneficiario IS NULL)`;

    // Obtener información básica del paciente
    const paciente = await executeQuery<{
      no_nomina: string;
      nombre: string;
      edad: number;
      sexo: string;
      departamento: string;
    }>(`
      SELECT
        no_nomina,
        nombre,
        edad,
        sexo,
        departamento
      FROM consulta
      WHERE no_nomina = $1 ${conditionBeneficiario}
      ORDER BY fecha_consulta DESC
      LIMIT 1
    `, [nomina]);

    if (!paciente || paciente.length === 0) {
      // Intentamos buscar sin filtro estricto si no encontramos nada, por si acaso
      // pero para historial es mejor ser estricto. Retornamos vacío o 404.
      // Si es la primera consulta, puede que no tenga historial.
    }

    // Obtener consultas anteriores
    const consultas = await executeQuery(`
      SELECT
        c.id_consulta,
        c.folio,
        c.fecha_consulta,
        c.motivo_consulta,
        c.id_medico,
        c.temperatura_c,
        c.ta_sistolica,
        c.ta_diastolica,
        c.frecuencia_cardiaca,
        c.oxigenacion,
        c.altura_cm,
        c.peso_kg,
        c.glucosa_mg_dl,
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
        -- Campos legacy (opcional, para mantener compatibilidad si algo lo usa)
        (
          SELECT dc.cie11_titulo 
          FROM diagnosticos_consulta dc 
          WHERE dc.id_consulta = c.id_consulta 
          ORDER BY dc.es_principal DESC, dc.orden ASC 
          LIMIT 1
        ) as cie11_titulo,
        (
          SELECT dc.cie11_codigo 
          FROM diagnosticos_consulta dc 
          WHERE dc.id_consulta = c.id_consulta 
          ORDER BY dc.es_principal DESC, dc.orden ASC 
          LIMIT 1
        ) as cie11_codigo,
        c.subjetivo,
        c.objetivo,
        c.analisis,
        c.plan,
        c.pronostico,
        c.estatus_consulta
      FROM consulta c
      WHERE TRIM(c.no_nomina) = TRIM($1) ${conditionBeneficiario.replace(/id_beneficiario/g, 'c.id_beneficiario')}
      ORDER BY c.fecha_consulta DESC
      LIMIT 10
    `, [nomina]);

    // Obtener referencias anteriores
    const referencias = await executeQuery(`
      SELECT
        id_referencia,
        id_consulta_origen,
        nombre_especialidad,
        motivo_referencia,
        estatus,
        fecha_cita,
        fecha_atencion,
        creado_en
      FROM referencias_especialidad
      WHERE TRIM(no_nomina) = TRIM($1) ${conditionBeneficiario}
      ORDER BY creado_en DESC
    `, [nomina]);

    // Obtener recetas anteriores
    // Nota: Recetas se une con consulta, aplicamos filtro a la consulta 'c'
    const conditionBeneficiarioConsulta = idBeneficiario
      ? `AND c.id_beneficiario = ${idBeneficiario}`
      : `AND (c.id_beneficiario = 0 OR c.id_beneficiario IS NULL)`;

    const recetas = await executeQuery(`
      SELECT
        r.id_receta,
        r.folio_receta,
        r.tipo_receta,
        r.fecha_emision,
        c.id_medico,
        u.nombre as nombre_medico,
        -- Diagnóstico CIE-11 (de la tabla diagnosticos_consulta)
        (
          SELECT dc.cie11_titulo 
          FROM diagnosticos_consulta dc 
          WHERE dc.id_consulta = c.id_consulta 
          ORDER BY dc.es_principal DESC, dc.orden ASC 
          LIMIT 1
        ) as diagnostico,
        COUNT(dr.id_detalle) as cantidad_medicamentos
      FROM recetas r
      INNER JOIN consulta c ON r.id_consulta = c.id_consulta
      LEFT JOIN usuarios u ON c.id_medico = u.id_usuario
      LEFT JOIN detalle_receta dr ON r.id_receta = dr.id_receta
      WHERE TRIM(c.no_nomina) = TRIM($1) ${conditionBeneficiarioConsulta}
      GROUP BY r.id_receta, c.id_medico, u.nombre, c.id_consulta
      ORDER BY r.fecha_emision DESC
      LIMIT 10
    `, [nomina]);

    const historial: HistorialPaciente = {
      paciente: paciente[0],
      consultas: consultas,
      referencias: referencias,
      recetas: recetas
    };

    return NextResponse.json({
      success: true,
      data: historial
    });

  } catch (error) {
    console.error('Error al obtener historial del paciente:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
