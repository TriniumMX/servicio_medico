import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeQueryOne } from '@/lib/dbPostgres';

interface TipoUsuario {
  clavetipousuario: number;
  tipousuario: string;
}

// GET: Listar todos los tipos de usuario
export async function GET() {
  try {
    const result = await executeQuery<TipoUsuario>(`
      SELECT clavetipousuario, tipousuario
      FROM tiposusuarios
      ORDER BY clavetipousuario ASC
    `);

    return NextResponse.json({
      success: true,
      message: 'Tipos de usuario obtenidos correctamente',
      data: result,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Error al obtener los tipos de usuario',
      error: error instanceof Error ? error.message : 'Error desconocido',
    }, { status: 500 });
  }
}

// POST: Crear un nuevo tipo de usuario
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tipousuario } = body;

    if (!tipousuario || tipousuario.trim() === '') {
      return NextResponse.json({
        success: false,
        message: 'El nombre del tipo de usuario es requerido',
      }, { status: 400 });
    }

    // Verificar duplicados
    const existe = await executeQueryOne<{ count: string }>(`
      SELECT COUNT(*) as count
      FROM tiposusuarios
      WHERE LOWER(tipousuario) = LOWER($1)
    `, [tipousuario.trim()]);

    if (existe && parseInt(existe.count) > 0) {
      return NextResponse.json({
        success: false,
        message: 'Ya existe un tipo de usuario con ese nombre',
      }, { status: 409 });
    }

    const result = await executeQueryOne<TipoUsuario>(`
      INSERT INTO tiposusuarios (tipousuario)
      VALUES ($1)
      RETURNING clavetipousuario, tipousuario
    `, [tipousuario.trim()]);

    return NextResponse.json({
      success: true,
      message: 'Tipo de usuario creado correctamente',
      data: result,
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Error al crear el tipo de usuario',
      error: error instanceof Error ? error.message : 'Error desconocido',
    }, { status: 500 });
  }
}
