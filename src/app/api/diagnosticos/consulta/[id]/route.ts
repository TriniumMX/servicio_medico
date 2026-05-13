import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/dbPostgres';

interface DiagnosticoConsulta {
  id_diagnostico: number;
  id_consulta: number;
  cie11_codigo: string;
  cie11_titulo: string;
  cie11_capitulo: string | null;
  es_principal: boolean;
  orden: number;
  creado_en: string;
}

// GET: Obtener diagnósticos de una consulta
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const id_consulta = parseInt(id);

    if (isNaN(id_consulta)) {
      return NextResponse.json(
        { success: false, error: 'ID de consulta inválido' },
        { status: 400 }
      );
    }

    const diagnosticos = await executeQuery<DiagnosticoConsulta>(`
      SELECT
        id_diagnostico,
        id_consulta,
        cie11_codigo,
        cie11_titulo,
        cie11_capitulo,
        es_principal,
        orden,
        creado_en
      FROM diagnosticos_consulta
      WHERE id_consulta = $1
      ORDER BY es_principal DESC, orden ASC
    `, [id_consulta]);

    return NextResponse.json({
      success: true,
      data: diagnosticos || [],
      total: diagnosticos?.length || 0
    });

  } catch (error: any) {
    console.error('Error obteniendo diagnósticos:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener diagnósticos', details: error.message },
      { status: 500 }
    );
  }
}
