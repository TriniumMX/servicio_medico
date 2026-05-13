// src/app/api/alertas-fondos/correos/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { alertasFondosCorreos } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Obtener un correo por ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const idCorreo = parseInt(id);

    if (isNaN(idCorreo)) {
      return NextResponse.json(
        { success: false, error: 'ID de correo inválido' },
        { status: 400 }
      );
    }

    const [correo] = await db
      .select()
      .from(alertasFondosCorreos)
      .where(eq(alertasFondosCorreos.id_correo, idCorreo))
      .limit(1);

    if (!correo) {
      return NextResponse.json(
        { success: false, error: 'Correo no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: correo,
    });
  } catch (error: any) {
    console.error('Error al obtener correo:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener correo' },
      { status: 500 }
    );
  }
}

// PATCH: Actualizar correo (editar o cambiar estado activo/inactivo)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const idCorreo = parseInt(id);

    if (isNaN(idCorreo)) {
      return NextResponse.json(
        { success: false, error: 'ID de correo inválido' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Verificar que el correo existe
    const [correoExistente] = await db
      .select()
      .from(alertasFondosCorreos)
      .where(eq(alertasFondosCorreos.id_correo, idCorreo))
      .limit(1);

    if (!correoExistente) {
      return NextResponse.json(
        { success: false, error: 'Correo no encontrado' },
        { status: 404 }
      );
    }

    // Preparar datos para actualizar
    const datosActualizar: Partial<{
      correo: string;
      nombre_destinatario: string;
      activo: boolean;
      updated_at: Date;
    }> = {
      updated_at: new Date(),
    };

    // Validar y agregar correo si se proporciona
    if (body.correo !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.correo)) {
        return NextResponse.json(
          { success: false, error: 'El formato del correo electrónico no es válido' },
          { status: 400 }
        );
      }

      // Verificar que no exista otro correo con el mismo email
      const [otroCorreo] = await db
        .select()
        .from(alertasFondosCorreos)
        .where(eq(alertasFondosCorreos.correo, body.correo.toLowerCase()))
        .limit(1);

      if (otroCorreo && otroCorreo.id_correo !== idCorreo) {
        return NextResponse.json(
          { success: false, error: 'Ya existe otro registro con este correo electrónico' },
          { status: 409 }
        );
      }

      datosActualizar.correo = body.correo.toLowerCase();
    }

    // Agregar nombre si se proporciona
    if (body.nombre_destinatario !== undefined) {
      if (!body.nombre_destinatario.trim()) {
        return NextResponse.json(
          { success: false, error: 'El nombre del destinatario no puede estar vacío' },
          { status: 400 }
        );
      }
      datosActualizar.nombre_destinatario = body.nombre_destinatario.trim();
    }

    // Agregar estado activo si se proporciona
    if (body.activo !== undefined) {
      datosActualizar.activo = Boolean(body.activo);
    }

    // Actualizar el correo
    const [correoActualizado] = await db
      .update(alertasFondosCorreos)
      .set(datosActualizar)
      .where(eq(alertasFondosCorreos.id_correo, idCorreo))
      .returning();

    return NextResponse.json({
      success: true,
      data: correoActualizado,
      message: 'Correo actualizado correctamente',
    });
  } catch (error: any) {
    console.error('Error al actualizar correo:', error);

    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'Ya existe otro registro con este correo electrónico' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error al actualizar correo' },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar correo
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const idCorreo = parseInt(id);

    if (isNaN(idCorreo)) {
      return NextResponse.json(
        { success: false, error: 'ID de correo inválido' },
        { status: 400 }
      );
    }

    // Verificar que el correo existe
    const [correoExistente] = await db
      .select()
      .from(alertasFondosCorreos)
      .where(eq(alertasFondosCorreos.id_correo, idCorreo))
      .limit(1);

    if (!correoExistente) {
      return NextResponse.json(
        { success: false, error: 'Correo no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar el correo
    await db
      .delete(alertasFondosCorreos)
      .where(eq(alertasFondosCorreos.id_correo, idCorreo));

    return NextResponse.json({
      success: true,
      message: 'Correo eliminado correctamente',
    });
  } catch (error: any) {
    console.error('Error al eliminar correo:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar correo' },
      { status: 500 }
    );
  }
}
