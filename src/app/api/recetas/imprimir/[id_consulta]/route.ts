// src/app/api/recetas/imprimir/[id_consulta]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeQueryOne } from '@/lib/dbPostgres';

/**
 * GET - Obtener receta completa para impresión
 * Incluye todos los datos necesarios: paciente, médico, diagnóstico, medicamentos
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id_consulta: string }> }
) {
  try {
    const { id_consulta: id_consulta_str } = await context.params;
    const id_consulta = parseInt(id_consulta_str);

    if (isNaN(id_consulta)) {
      return NextResponse.json(
        { success: false, error: 'ID de consulta inválido' },
        { status: 400 }
      );
    }

    console.log(`📄 [Imprimir Receta] Obteniendo datos para consulta: ${id_consulta}`);

    // 1. Obtener consulta completa (incluye snapshot de datos del paciente)
    const consultaData = await executeQueryOne<{
      folio: string;
      cie11_codigo: string | null;
      cie11_titulo: string | null;
      nombre: string;
      edad: number | null;
      no_nomina: string;
      departamento: string | null;
      sindicato: string | null;
      es_empleado: boolean;
      fecha_consulta: Date;
      temperatura_c: number | null;
      ta_sistolica: number | null;
      ta_diastolica: number | null;
      frecuencia_cardiaca: number | null;
      oxigenacion: number | null;
      altura_cm: number | null;
      peso_kg: number | null;
      glucosa_mg_dl: number | null;
      id_medico: number;
    }>(`
      SELECT
        folio,

        nombre,
        edad,
        no_nomina,
        departamento,
        sindicato,
        es_empleado,
        fecha_consulta,
        temperatura_c,
        ta_sistolica,
        ta_diastolica,
        frecuencia_cardiaca,
        oxigenacion,
        altura_cm,
        peso_kg,
        glucosa_mg_dl,
        id_medico
      FROM consulta
      WHERE id_consulta = $1
    `, [id_consulta]);

    if (!consultaData) {
      return NextResponse.json(
        { success: false, error: 'Consulta no encontrada' },
        { status: 404 }
      );
    }

    const recetaData = await executeQueryOne<{
      id_receta: number;
      folio_receta: string;
      fecha_emision: Date;
    }>(`
      SELECT id_receta, folio_receta, fecha_emision
      FROM recetas
      WHERE id_consulta = $1
    `, [id_consulta]);

    if (!recetaData) {
      return NextResponse.json(
        { success: false, error: 'No se encontró receta para esta consulta' },
        { status: 404 }
      );
    }

    // 2. Preparar datos del paciente (snapshot de la consulta)
    const pacienteData = {
      nombre: consultaData.nombre,
      edad: consultaData.edad,
      no_nomina: consultaData.no_nomina,
      departamento: consultaData.departamento,
      sindicato: consultaData.sindicato,
      es_empleado: consultaData.es_empleado,
    };

    // 3. Obtener datos del médico
    const medicoData = await executeQueryOne<{
      nombre: string;
      cedula_profesional: string | null;
    }>(`
      SELECT nombre, cedula_profesional
      FROM usuarios
      WHERE id_usuario = $1
    `, [consultaData.id_medico]);

    const nombreMedico = medicoData
      ? (medicoData.nombre.startsWith('Dr.') ? medicoData.nombre : `Dr. ${medicoData.nombre}`)
      : 'Dr. Sistema Médico';

    // 4. Obtener medicamentos
    const medicamentosData = await executeQuery<{
      nombre_comercial: string;
      sustancia_activa: string;
      dosis: string;
      duracion_tratamiento_dias: number;
      cantidad_total: number;
      indicaciones: string | null;
      realizar_resurtimiento: boolean;
      meses_resurtimiento: number | null;
    }>(`
      SELECT
        m.nombre_comercial,
        m.sustancia_activa,
        dr.dosis,
        dr.duracion_tratamiento_dias,
        dr.cantidad_total,
        dr.indicaciones,
        dr.realizar_resurtimiento,
        dr.meses_resurtimiento
      FROM detalle_receta dr
      LEFT JOIN medicamentos m ON dr.id_medicamento = m.id_medicamento
      WHERE dr.id_receta = $1
      ORDER BY dr.id_detalle
    `, [recetaData.id_receta]);

    // 4.5 Obtener diagnóstico principal
    const diagnosticoData = await executeQueryOne<{
      cie11_codigo: string;
      cie11_titulo: string;
    }>(`
      SELECT cie11_codigo, cie11_titulo
      FROM diagnosticos_consulta
      WHERE id_consulta = $1 AND es_principal = true
    `, [id_consulta]);

    // 5. Construir respuesta con estructura ANIDADA (para RecetaImprimible)
    const recetaCompleta = {
      // IDs y folios
      id_consulta: id_consulta, // Para poder generar PDF desde el modal
      folio_receta: recetaData.folio_receta,
      folio_consulta: consultaData.folio,
      fecha_emision: recetaData.fecha_emision.toISOString(),

      // Paciente (OBJETO ANIDADO)
      paciente: {
        nombre: consultaData.nombre,
        edad: consultaData.edad || undefined,
        no_nomina: consultaData.no_nomina,
        departamento: consultaData.departamento || undefined,
        es_empleado: consultaData.es_empleado,
      },

      // Médico (OBJETO ANIDADO)
      medico: {
        nombre: nombreMedico,
        cedula: medicoData?.cedula_profesional || undefined,
      },

      // Medicamentos (ESTRUCTURA COMPLETA)
      medicamentos: medicamentosData.map((med) => ({
        nombre_comercial: med.nombre_comercial || 'N/A',
        sustancia_activa: med.sustancia_activa || '',
        dosis: med.dosis,
        duracion_tratamiento_dias: med.duracion_tratamiento_dias,
        cantidad_total: med.cantidad_total,
        indicaciones: med.indicaciones || undefined,
        realizar_resurtimiento: med.realizar_resurtimiento,
        meses_resurtimiento: med.meses_resurtimiento || undefined,
      })),

      // Diagnóstico (OBJETO ANIDADO)
      diagnostico: diagnosticoData
        ? {
          codigo: diagnosticoData.cie11_codigo,
          titulo: diagnosticoData.cie11_titulo,
        }
        : undefined,
    };

    console.log(`✅ [Imprimir Receta] Datos obtenidos correctamente`);

    return NextResponse.json({
      success: true,
      data: recetaCompleta,
    });
  } catch (error: any) {
    console.error('❌ Error al obtener datos para impresión:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener datos para impresión',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
