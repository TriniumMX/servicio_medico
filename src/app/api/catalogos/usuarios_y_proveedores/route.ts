// src/app/api/catalogos/usuarios_y_proveedores/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { UsuariosService } from '@/services/catalogos/usuarios-proveedores.service';
import { CreateUsuarioDTO, ApiResponse } from '@/types/catalogos/usuarios-proveedores.types';
import { executeQuery } from '@/lib/dbPostgres';

interface AgendaDia {
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
}

/**
 * GET - Obtener todos los usuarios
 */
export async function GET(request: NextRequest) {
  try {
    const usuarios = await UsuariosService.getAllUsuarios();

    const response: ApiResponse<typeof usuarios> = {
      success: true,
      data: usuarios,
      message: 'Usuarios obtenidos exitosamente'
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al obtener usuarios'
    };

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * POST - Crear un nuevo usuario
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const { agenda, ...body } = rawBody as CreateUsuarioDTO & { agenda?: AgendaDia[] };

    // Validaciones básicas
    if (!body.nombre || !body.username || !body.password || !body.id_tipousuario) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Faltan campos obligatorios: nombre, username, password, id_tipousuario'
      };
      return NextResponse.json(response, { status: 400 });
    }

    const nuevoUsuario = await UsuariosService.createUsuario(body);

    // Guardar agenda si se proporcionó
    if (Array.isArray(agenda) && agenda.length > 0 && nuevoUsuario.id_usuario) {
      await executeQuery(`DELETE FROM agenda_medico WHERE id_usuario = $1`, [nuevoUsuario.id_usuario]);
      for (const dia of agenda) {
        await executeQuery(
          `INSERT INTO agenda_medico (id_usuario, dia_semana, hora_inicio, hora_fin) VALUES ($1, $2, $3, $4)`,
          [nuevoUsuario.id_usuario, dia.dia_semana, dia.hora_inicio, dia.hora_fin]
        );
      }
    }

    const response: ApiResponse<typeof nuevoUsuario> = {
      success: true,
      data: nuevoUsuario,
      message: 'Usuario creado exitosamente'
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error al crear usuario:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al crear usuario'
    };

    return NextResponse.json(response, { status: 500 });
  }
}