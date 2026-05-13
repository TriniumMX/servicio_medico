// src/app/api/catalogos/usuarios_y_proveedores/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { UsuariosService } from '@/services/catalogos/usuarios-proveedores.service';
import { UpdateUsuarioDTO, ApiResponse } from '@/types/catalogos/usuarios-proveedores.types';
import { executeQuery } from '@/lib/dbPostgres';

interface AgendaDia {
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
}

/**
 * GET - Obtener un usuario por ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'ID inválido'
      };
      return NextResponse.json(response, { status: 400 });
    }

    const usuario = await UsuariosService.getUsuarioById(id);

    if (!usuario) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Usuario no encontrado'
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<typeof usuario> = {
      success: true,
      data: usuario,
      message: 'Usuario obtenido exitosamente'
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error al obtener usuario:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al obtener usuario'
    };

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * PUT - Actualizar un usuario
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'ID inválido'
      };
      return NextResponse.json(response, { status: 400 });
    }

    const rawBody = await request.json();
    const { agenda, ...body } = rawBody as UpdateUsuarioDTO & { agenda?: AgendaDia[] };

    const usuarioActualizado = await UsuariosService.updateUsuario(id, body);

    // Actualizar agenda si se proporcionó (puede ser array vacío para limpiarla)
    if (Array.isArray(agenda)) {
      await executeQuery(`DELETE FROM agenda_medico WHERE id_usuario = $1`, [id]);
      for (const dia of agenda) {
        await executeQuery(
          `INSERT INTO agenda_medico (id_usuario, dia_semana, hora_inicio, hora_fin) VALUES ($1, $2, $3, $4)`,
          [id, dia.dia_semana, dia.hora_inicio, dia.hora_fin]
        );
      }
    }

    const response: ApiResponse<typeof usuarioActualizado> = {
      success: true,
      data: usuarioActualizado,
      message: 'Usuario actualizado exitosamente'
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al actualizar usuario'
    };

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * DELETE - Desactivar un usuario (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'ID inválido'
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Obtener parámetro de query para hard delete (opcional)
    const searchParams = request.nextUrl.searchParams;
    const hardDelete = searchParams.get('hard') === 'true';

    if (hardDelete) {
      await UsuariosService.hardDeleteUsuario(id);
    } else {
      await UsuariosService.deleteUsuario(id);
    }

    const response: ApiResponse<null> = {
      success: true,
      message: hardDelete
        ? 'Usuario eliminado permanentemente'
        : 'Usuario desactivado exitosamente'
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al eliminar usuario'
    };

    return NextResponse.json(response, { status: 500 });
  }
}