// src/app/api/catalogos/usuarios_y_proveedores/tipos/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { UsuariosService } from '@/services/catalogos/usuarios-proveedores.service';
import { ApiResponse } from '@/types/catalogos/usuarios-proveedores.types';

/**
 * GET - Obtener todos los tipos de usuarios
 */
export async function GET(request: NextRequest) {
  try {
    const tiposUsuarios = await UsuariosService.getTiposUsuarios();
    
    const response: ApiResponse<typeof tiposUsuarios> = {
      success: true,
      data: tiposUsuarios,
      message: 'Tipos de usuarios obtenidos exitosamente'
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error al obtener tipos de usuarios:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al obtener tipos de usuarios'
    };

    return NextResponse.json(response, { status: 500 });
  }
}