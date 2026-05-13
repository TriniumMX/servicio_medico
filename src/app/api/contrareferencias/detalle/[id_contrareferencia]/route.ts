// src/app/api/contrareferencias/detalle/[id_contrareferencia]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { executeQueryOne, executeQuery } from '@/lib/dbPostgres';
import { jwtVerify } from 'jose';
import type { ContrarreferenciasDetalle, InfoCascada } from '@/types/contrareferencias';

/**
 * Verifica si el médico destino debe crear una contrareferencia en cascada
 */
async function verificarCascada(id_referencia_origen: number): Promise<InfoCascada> {
  // 1. Obtener la referencia que originó la contrareferencia
  const referenciaActual = await executeQueryOne<{
    id_referencia: number;
    id_consulta_origen: number;
    id_medico_refiere: number;
    nombre_medico_refiere: string;
  }>(`
    SELECT id_referencia, id_consulta_origen, id_medico_refiere, nombre_medico_refiere
    FROM referencias_especialidad
    WHERE id_referencia = $1
  `, [id_referencia_origen]);

  if (!referenciaActual) {
    return { debe_continuar_cascada: false };
  }

  // 2. Verificar si la consulta origen de esta referencia tiene id_referencia_origen
  // Esto indica que el médico que refirió también fue referido por otro médico
  const consultaOrigen = await executeQueryOne<{
    id_consulta: number;
    id_referencia_origen: number;
  }>(`
    SELECT id_consulta, id_referencia_origen
    FROM consulta
    WHERE id_consulta = $1
  `, [referenciaActual.id_consulta_origen]);

  if (!consultaOrigen || !consultaOrigen.id_referencia_origen) {
    // No hay cascada, el médico destino es el origen (típicamente MG)
    return {
      debe_continuar_cascada: false,
      es_medico_general: true
    };
  }

  // 3. Hay cascada, obtener información del siguiente médico en la cadena
  const referenciaAnterior = await executeQueryOne<{
    id_referencia: number;
    id_medico_refiere: number;
    nombre_medico_refiere: string;
  }>(`
    SELECT id_referencia, id_medico_refiere, nombre_medico_refiere
    FROM referencias_especialidad
    WHERE id_referencia = $1
  `, [consultaOrigen.id_referencia_origen]);

  if (!referenciaAnterior) {
    return { debe_continuar_cascada: false };
  }

  return {
    debe_continuar_cascada: true,
    id_referencia_siguiente: referenciaAnterior.id_referencia,
    nombre_medico_siguiente: referenciaAnterior.nombre_medico_refiere,
    es_medico_general: false
  };
}

/**
 * GET - Obtener detalle completo de contrareferencia
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id_contrareferencia: string }> }
) {
  try {
    const { id_contrareferencia } = await params;
    const idContrareferencia = parseInt(id_contrareferencia);

    if (isNaN(idContrareferencia)) {
      return NextResponse.json(
        { success: false, error: 'ID de contrareferencia inválido' },
        { status: 400 }
      );
    }

    // Autenticación
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret) as any;
    const idMedico = payload.id;

    // Obtener contrareferencia con datos extendidos
    const contrarref = await executeQueryOne<ContrarreferenciasDetalle>(`
      SELECT
        c.*,
        r.folio as folio_referencia_origen,
        r.motivo_referencia as motivo_referencia_original,
        u.cedula_profesional as cedula_especialista,
        u.email as email_especialista,
        (
            SELECT COALESCE(JSON_AGG(json_build_object(
                'codigo', dc.cie11_codigo,
                'titulo', dc.cie11_titulo,
                'es_principal', dc.es_principal
            ) ORDER BY dc.es_principal DESC, dc.orden ASC), '[]')
            FROM diagnosticos_consulta dc
            WHERE dc.id_consulta = c.id_consulta_especialista
        ) as diagnosticos_json
      FROM contrareferencias c
      INNER JOIN referencias_especialidad r ON c.id_referencia_origen = r.id_referencia
      LEFT JOIN usuarios u ON c.id_medico_contrarrefiere = u.id_usuario
      WHERE c.id_contrareferencia = $1
    `, [idContrareferencia]);

    if (!contrarref) {
      return NextResponse.json(
        { success: false, error: 'Contrareferencia no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que el médico logueado sea el destino o el remitente
    if (contrarref.id_medico_destino !== idMedico && contrarref.id_medico_contrarrefiere !== idMedico) {
      return NextResponse.json(
        { success: false, error: 'No autorizado para ver esta contrareferencia' },
        { status: 403 }
      );
    }

    // Verificar si hay cascada (solo para el médico destino)
    let infoCascada: InfoCascada | null = null;
    if (contrarref.id_medico_destino === idMedico) {
      infoCascada = await verificarCascada(contrarref.id_referencia_origen);
    }

    // Obtener contrareferencias relacionadas en la cascada (si es parte de una)
    if (contrarref.es_parte_cascada && contrarref.id_contrareferencia_padre) {
      const relacionadas = await executeQuery<any>(`
        SELECT
          id_contrareferencia,
          folio,
          nombre_medico_contrarrefiere,
          nombre_especialidad_remitente,
          nivel_cascada,
          creado_en
        FROM contrareferencias
        WHERE id_contrareferencia_padre = $1
           OR id_contrareferencia = $2
        ORDER BY nivel_cascada ASC, creado_en ASC
      `, [contrarref.id_contrareferencia_padre, contrarref.id_contrareferencia_padre]);

      contrarref.contrareferencias_relacionadas = relacionadas;
    }

    return NextResponse.json({
      success: true,
      contrareferencia: contrarref,
      infoCascada: infoCascada
    });

  } catch (error) {
    console.error('Error al obtener detalle de contrareferencia:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
