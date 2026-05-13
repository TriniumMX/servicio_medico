// src/app/api/recetas/generar-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generarRecetaPDF } from '@/lib/generar-receta-pdf';

/**
 * POST /api/recetas/generar-pdf
 *
 * Genera un PDF de receta médica con los datos proporcionados
 *
 * Body esperado:
 * {
 *   consulta: string,
 *   folio_consulta: string,
 *   fecha_nac: string,
 *   nomina: string,
 *   sindicato: string,
 *   secretaria: string,
 *   nombre_paciente: string,
 *   edad: string,
 *   ta: string,
 *   temperatura: string,
 *   fc: string,
 *   oxigenacion: string,
 *   altura: string,
 *   peso: string,
 *   glucosa: string,
 *   diagnostico: string,
 *   medicamentos: [
 *     {
 *       nombre: string,
 *       indicaciones: string,
 *       tratamiento: string,
 *       piezas: number
 *     }
 *   ],
 *   incapacidad: string,
 *   incapacidad_inicio: string,
 *   incapacidad_fin: string,
 *   especialidad: string,
 *   nombre_medico: string,
 *   firma_medico: string
 * }
 *
 * @returns PDF buffer
 */
export async function POST(request: NextRequest) {
  try {
    const datos = await request.json();

    // Validar que al menos tenga datos mínimos
    if (!datos.folio_consulta || !datos.nombre_paciente) {
      return NextResponse.json(
        {
          success: false,
          error: 'Faltan datos requeridos: folio_consulta y nombre_paciente son obligatorios',
        },
        { status: 400 }
      );
    }

    // Generar PDF
    const pdfBytes = await generarRecetaPDF(datos);

    // Convertir Uint8Array a Buffer para NextResponse
    const buffer = Buffer.from(pdfBytes);

    // Retornar PDF
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="receta-${datos.folio_consulta}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generando PDF de receta:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error generando el PDF de la receta',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/recetas/generar-pdf?id_receta=123
 *
 * Genera un PDF de receta a partir del ID de receta en la base de datos
 *
 * @param id_receta ID de la receta en la base de datos
 * @returns PDF buffer
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const idReceta = searchParams.get('id_receta');

    if (!idReceta) {
      return NextResponse.json(
        {
          success: false,
          error: 'Falta el parámetro id_receta',
        },
        { status: 400 }
      );
    }

    // TODO: Aquí deberías consultar la base de datos para obtener los datos de la receta
    // Por ahora retorno un error indicando que esta funcionalidad está pendiente

    return NextResponse.json(
      {
        success: false,
        error: 'Funcionalidad de generación desde BD pendiente de implementación',
        message: 'Por ahora usa el método POST con los datos completos',
      },
      { status: 501 }
    );

    // EJEMPLO de cómo debería funcionar:
    // const receta = await obtenerRecetaPorId(parseInt(idReceta));
    // const pdfBytes = await generarRecetaPDF(receta);
    // return new NextResponse(pdfBytes, { ... });

  } catch (error) {
    console.error('Error generando PDF de receta:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error generando el PDF de la receta',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
