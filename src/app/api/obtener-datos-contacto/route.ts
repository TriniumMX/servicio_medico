import { NextRequest, NextResponse } from 'next/server';
import { obtenerDatosContactoDirecto } from '@/lib/obtenerDatosContacto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { es_empleado, no_nomina, id_beneficiario } = body;

    // Validar que tengamos los datos necesarios
    if (es_empleado && !no_nomina) {
      return NextResponse.json(
        { success: false, error: 'Falta el número de nómina para el empleado' },
        { status: 400 }
      );
    }

    if (!es_empleado && !id_beneficiario) {
      return NextResponse.json(
        { success: false, error: 'Falta el ID del beneficiario' },
        { status: 400 }
      );
    }

    // Obtener los datos de contacto
    const datosContacto = await obtenerDatosContactoDirecto(
      es_empleado,
      no_nomina,
      id_beneficiario
    );

    // Si no hay teléfono ni correo, consideramos que no hay datos
    if (!datosContacto.telefono && !datosContacto.correo) {
      return NextResponse.json({
        success: false,
        telefono: null,
        correo: null,
      });
    }

    return NextResponse.json({
      success: true,
      telefono: datosContacto.telefono,
      correo: datosContacto.correo,
    });
  } catch (error: any) {
    console.error('Error al obtener datos de contacto:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener datos de contacto' },
      { status: 500 }
    );
  }
}
