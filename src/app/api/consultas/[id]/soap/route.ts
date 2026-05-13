// src/app/api/consultas/[id]/soap/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { executeQueryOne, executeQuery } from '@/lib/dbPostgres';

/**
 * GET /api/consultas/[id]/soap
 * Devuelve el SOAP completo de una consulta: nota, diagnósticos, plan
 * (medicamentos, incapacidad, signos vitales).
 * Usado por el modal del coordinador al revisar seguimientos.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idConsulta = parseInt(id);
    if (isNaN(idConsulta)) {
      return NextResponse.json({ success: false, error: 'ID de consulta inválido' }, { status: 400 });
    }

    // ── Consulta base + médico
    const consulta = await executeQueryOne<{
      id_consulta: number;
      folio: string;
      nombre: string;
      fecha_consulta: string;
      nombre_medico: string;
      // SOAP
      subjetivo: string | null;
      objetivo: string | null;
      analisis: string | null;
      plan: string | null;
      // Signos vitales
      temperatura_c: number | null;
      ta_sistolica: number | null;
      ta_diastolica: number | null;
      frecuencia_cardiaca: number | null;
      oxigenacion: number | null;
      altura_cm: number | null;
      peso_kg: number | null;
      glucosa_mg_dl: number | null;
      // Flags
      se_asigno_incapacidad: boolean;
      tiene_referencia: boolean;
      tiene_estudios_laboratorio: boolean;
    }>(`
      SELECT
        c.id_consulta,
        c.folio,
        c.nombre,
        c.fecha_consulta,
        u.nombre AS nombre_medico,
        c.subjetivo,
        c.objetivo,
        c.analisis,
        c.plan,
        c.temperatura_c,
        c.ta_sistolica,
        c.ta_diastolica,
        c.frecuencia_cardiaca,
        c.oxigenacion,
        c.altura_cm,
        c.peso_kg,
        c.glucosa_mg_dl,
        c.se_asigno_incapacidad,
        c.tiene_referencia,
        c.tiene_estudios_laboratorio
      FROM consulta c
      LEFT JOIN usuarios u ON c.id_medico = u.id_usuario
      WHERE c.id_consulta = $1
        AND c.estatus_activo = true
    `, [idConsulta]);

    if (!consulta) {
      return NextResponse.json({ success: false, error: 'Consulta no encontrada' }, { status: 404 });
    }

    // ── Diagnósticos CIE-11
    const diagnosticos = await executeQuery<{
      cie11_codigo: string;
      cie11_titulo: string;
      cie11_capitulo: string | null;
      es_principal: boolean;
      orden: number;
    }>(`
      SELECT
        cie11_codigo,
        cie11_titulo,
        cie11_capitulo,
        es_principal,
        orden
      FROM diagnosticos_consulta
      WHERE id_consulta = $1
      ORDER BY orden ASC
    `, [idConsulta]);

    // ── Medicamentos recetados (si hay receta)
    const medicamentos = await executeQuery<{
      nombre_comercial: string;
      sustancia_activa: string;
      dosis: string;
      cantidad_total: number;
      duracion_tratamiento_dias: number;
      indicaciones: string | null;
    }>(`
      SELECT
        m.nombre_comercial,
        m.sustancia_activa,
        dr.dosis,
        dr.cantidad_total,
        dr.duracion_tratamiento_dias,
        dr.indicaciones
      FROM recetas r
      INNER JOIN detalle_receta dr ON dr.id_receta = r.id_receta
      INNER JOIN medicamentos m   ON m.id_medicamento = dr.id_medicamento
      WHERE r.id_consulta = $1
      ORDER BY dr.id_detalle ASC
    `, [idConsulta]);

    // ── Incapacidad (si tiene)
    const incapacidad = await executeQueryOne<{
      fecha_inicio: string;
      fecha_fin: string;
      dias_sugeridos: number;
      diagnostico_titulo: string | null;
    }>(`
      SELECT
        fecha_inicio,
        fecha_fin,
        dias_sugeridos,
        diagnostico_titulo
      FROM incapacidades
      WHERE id_consulta = $1
      LIMIT 1
    `, [idConsulta]);

    // ── Estudios de laboratorio solicitados
    const estudios = await executeQuery<{
      nombre_estudio: string;
      motivo: string | null;
      estatus: string;
    }>(`
      SELECT
        el.nombre_estudio,
        ce.motivo,
        ce.estatus
      FROM consulta_estudios ce
      INNER JOIN cat_estudios_laboratorio el ON el.id_estudio = ce.id_estudio
      WHERE ce.id_consulta = $1
      ORDER BY ce.fecha_solicitud ASC
    `, [idConsulta]);

    // ── Referencia a otro especialista emitida en esta consulta
    const referencia = await executeQueryOne<{
      folio: string;
      nombre_especialidad: string;
      motivo_referencia: string;
      estatus: string;
    }>(`
      SELECT
        folio,
        nombre_especialidad,
        motivo_referencia,
        estatus
      FROM referencias_especialidad
      WHERE id_consulta_origen = $1
        AND (tipo_referencia IS NULL OR tipo_referencia = 'normal')
        AND activo = true
      ORDER BY creado_en DESC
      LIMIT 1
    `, [idConsulta]);

    return NextResponse.json({
      success: true,
      soap: {
        ...consulta,
        diagnosticos,
        medicamentos,
        incapacidad: incapacidad ?? null,
        estudios,
        referencia: referencia ?? null,
      },
    });

  } catch (error) {
    console.error('Error al obtener SOAP de consulta:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
