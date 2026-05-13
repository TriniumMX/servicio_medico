// src/app/api/auth/logout/route.ts

import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // 1. Crear una respuesta para poder manipular las cookies
    const response = NextResponse.json(
      { message: 'Cierre de sesión exitoso.' },
      { status: 200 }
    );

    // 2. "Borrar" la cookie del token
    // Le decimos al navegador que la cookie 'token' está vacía y que expiró en el pasado.
    response.cookies.set('token', '', {
      httpOnly: true,
      path: '/',
      expires: new Date(0), // Fecha en el pasado para que expire inmediatamente
    });

    return response;

  } catch (error) {
    console.error('Error en el logout:', error);
    return NextResponse.json(
      { message: 'Ocurrió un error en el servidor.' },
      { status: 500 }
    );
  }
}