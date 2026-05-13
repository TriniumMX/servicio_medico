// src/app/api/alertas-fondos/correos/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { alertasFondosCorreos } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { CorreoAlertaForm } from '@/types/alertas-fondos';

// GET: Obtener todos los correos configurados
export async function GET() {
  try {
    const correos = await db
      .select()
      .from(alertasFondosCorreos)
      .orderBy(alertasFondosCorreos.nombre_destinatario);

    return NextResponse.json({
      success: true,
      data: correos,
    });
  } catch (error: any) {
    console.error('Error al obtener correos de alertas:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener correos de alertas' },
      { status: 500 }
    );
  }
}

// POST: Agregar nuevo correo
export async function POST(request: NextRequest) {
  try {
    const body: CorreoAlertaForm = await request.json();

    // Validaciones
    if (!body.correo || !body.nombre_destinatario) {
      return NextResponse.json(
        { success: false, error: 'El correo y nombre del destinatario son requeridos' },
        { status: 400 }
      );
    }

    // Validar formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.correo)) {
      return NextResponse.json(
        { success: false, error: 'El formato del correo electrónico no es válido' },
        { status: 400 }
      );
    }

    // Verificar si el correo ya existe
    const correoExistente = await db
      .select()
      .from(alertasFondosCorreos)
      .where(eq(alertasFondosCorreos.correo, body.correo.toLowerCase()))
      .limit(1);

    if (correoExistente.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Este correo electrónico ya está registrado' },
        { status: 409 }
      );
    }

    // Insertar nuevo correo
    const [nuevoCorreo] = await db
      .insert(alertasFondosCorreos)
      .values({
        correo: body.correo.toLowerCase(),
        nombre_destinatario: body.nombre_destinatario.trim(),
        activo: body.activo !== undefined ? body.activo : true,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: nuevoCorreo,
      message: 'Correo agregado correctamente',
    });
  } catch (error: any) {
    console.error('Error al agregar correo de alerta:', error);

    // Error de unicidad (correo duplicado)
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'Este correo electrónico ya está registrado' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error al agregar correo de alerta' },
      { status: 500 }
    );
  }
}
