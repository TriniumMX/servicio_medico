// src/app/api/contrareferencias/mis-contrareferencias/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/dbPostgres';
import { jwtVerify } from 'jose';
import type { ContrarreferenciasListResponse, FiltroContrareferencias } from '@/types/contrareferencias';

/**
 * GET - Obtener contrareferencias recibidas por el médico logueado
 * Query params:
 * - filtro: 'pendientes' | 'vistas' | 'todas' (default: 'pendientes')
 */
export async function GET(request: NextRequest) {
  try {
    // Autenticación
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' } as ContrarreferenciasListResponse,
        { status: 401 }
      );
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret) as any;
    const idMedico = payload.id;

    // Obtener parámetros de query
    const { searchParams } = new URL(request.url);
    const filtro = (searchParams.get('filtro') || 'pendientes') as FiltroContrareferencias;

    // Construir condición de estatus
    let condicionEstatus = '';
    if (filtro === 'pendientes') {
      condicionEstatus = "AND c.estatus = 'pendiente'";
    } else if (filtro === 'vistas') {
      condicionEstatus = "AND c.estatus = 'vista'";
    }
    // Si es 'todas', no se agrega condición adicional

    // Consultar contrareferencias
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
      cedula_especialista: string;
    }>(`
      SELECT
        c.*,
        r.folio as folio_referencia_origen,
        u.cedula_profesional as cedula_especialista
      FROM contrareferencias c
      INNER JOIN referencias_especialidad r ON c.id_referencia_origen = r.id_referencia
      LEFT JOIN usuarios u ON c.id_medico_contrarrefiere = u.id_usuario
      WHERE c.id_medico_destino = $1
        AND c.activo = true
        ${condicionEstatus}
      ORDER BY c.creado_en DESC
    `, [idMedico]);

    return NextResponse.json({
      success: true,
      contrareferencias,
      total: contrareferencias.length
    } as ContrarreferenciasListResponse);

  } catch (error) {
    console.error('Error al obtener contrareferencias:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      } as ContrarreferenciasListResponse,
      { status: 500 }
    );
  }
}
