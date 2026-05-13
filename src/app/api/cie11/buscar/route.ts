// src/app/api/cie11/buscar/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const token = searchParams.get('token');

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Se requiere un término de búsqueda' },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Se requiere un token de autenticación' },
        { status: 400 }
      );
    }

    // API de búsqueda de CIE-11
    const searchEndpoint = `https://id.who.int/icd/release/11/2024-01/mms/search?q=${encodeURIComponent(query)}`;

    const response = await fetch(searchEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'API-Version': 'v2',
        'Accept-Language': 'es',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error API CIE-11 [${response.status}]: ${response.statusText}`, errorText);

      return NextResponse.json(
        {
          success: false,
          error: `Error API CIE-11: ${response.statusText}`,
          details: errorText,
          status: response.status
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      resultados: data.destinationEntities || [],
      total: data.destinationEntities?.length || 0,
    });

  } catch (error: any) {
    console.error('❌ Error interno al buscar en CIE-11:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor al realizar la búsqueda', details: error.message },
      { status: 500 }
    );
  }
}
