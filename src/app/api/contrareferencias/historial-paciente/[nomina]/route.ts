// src/app/api/contrareferencias/historial-paciente/[nomina]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/dbPostgres';
import { jwtVerify } from 'jose';
import type { ContrarreferenciasListResponse } from '@/types/contrareferencias';

/**
 * GET - Obtener historial de contrareferencias de un paciente
 * Útil para ver todas las contrareferencias de un paciente específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nomina: string }> }
) {
  try {
    const { nomina } = await params;

    if (!nomina) {
      return NextResponse.json(
        { success: false, error: 'Falta número de nómina' } as ContrarreferenciasListResponse,
        { status: 400 }
      );
    }

    // Autenticación
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' } as ContrarreferenciasListResponse,
        { status: 401 }
      );
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify(token, secret);

    // Consultar todas las contrareferencias del paciente
    const contrareferencias = await executeQuery<{
      id_contrareferencia: number;
      folio: string;
      id_referencia_origen: number;
      id_consulta_especialista: number;
      id_medico_contrarrefiere: number;
      nombre_medico_contrarrefiere: string;
      id_especialidad_remitente: number;
      nombre_especialidad_remitente: string;
      id_medico_destino: number;
      nombre_medico_destino: string;
      no_nomina: string;
      id_beneficiario: number;
      nombre_paciente: string;
      subjetivo: string;
      objetivo: string;
      analisis: string;
      plan_texto: string;
      cie11_codigo: string;
      cie11_titulo: string;
      observaciones_especialista: string;
      es_parte_cascada: boolean;
      id_contrareferencia_padre: number;
      nivel_cascada: number;
      estatus: string;
      fecha_vista: string;
      activo: boolean;
      creado_en: string;
      actualizado_en: string;
      folio_referencia_origen: string;
      motivo_referencia_original: string;
    }>(`
      SELECT
        c.*,
        r.folio as folio_referencia_origen,
        r.motivo_referencia as motivo_referencia_original
      FROM contrareferencias c
      INNER JOIN referencias_especialidad r ON c.id_referencia_origen = r.id_referencia
      WHERE c.no_nomina = $1
        AND c.activo = true
      ORDER BY c.creado_en DESC
    `, [nomina]);

    return NextResponse.json({
      success: true,
      contrareferencias,
      total: contrareferencias.length
    } as ContrarreferenciasListResponse);

  } catch (error) {
    console.error('Error al obtener historial de contrareferencias:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      } as ContrarreferenciasListResponse,
      { status: 500 }
    );
  }
}
