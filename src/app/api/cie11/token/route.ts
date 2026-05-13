// src/app/api/cie11/token/route.ts

import { NextResponse } from 'next/server';

// Credenciales de CIE-11
const CLIENT_ID = 'a0aced8b-5a81-446f-b829-75f9ef542bdd_d0f092b0-49fc-4f2e-b879-4b0d4da8f66f';
const CLIENT_SECRET = '180q4evFUYQQ/c6FR0LqA4fF85DI48bUT/mjEbmQoeg=';

export async function GET() {
  try {
    const tokenEndpoint = 'https://icdaccessmanagement.who.int/connect/token';

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope: 'icdapi_access',
      }),
    });

    if (!response.ok) {
      throw new Error('Error al obtener token de CIE-11');
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      token: data.access_token,
      expires_in: data.expires_in,
    });

  } catch (error: any) {
    console.error('❌ Error al obtener token CIE-11:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener token de autenticación' },
      { status: 500 }
    );
  }
}
