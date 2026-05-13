import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeQueryOne } from '@/lib/dbPostgres';

interface TipoUsuario {
  clavetipousuario: number;
  tipousuario: string;
}

// PUT: Actualizar tipo de usuario
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clavetipousuario = parseInt(id);

    if (isNaN(clavetipousuario)) {
      return NextResponse.json({
        success: false,
        message: 'ID de tipo de usuario inválido',
      }, { status: 400 });
    }

    const body = await request.json();
    const { tipousuario } = body;

    if (!tipousuario || tipousuario.trim() === '') {
      return NextResponse.json({
        success: false,
        message: 'El nombre del tipo de usuario es requerido',
      }, { status: 400 });
    }

    // Verificar que existe
    const existe = await executeQueryOne<{ count: string }>(`
      SELECT COUNT(*) as count FROM tiposusuarios WHERE clavetipousuario = $1
    `, [clavetipousuario]);

    if (!existe || parseInt(existe.count) === 0) {
      return NextResponse.json({
        success: false,
        message: 'Tipo de usuario no encontrado',
      }, { status: 404 });
    }

    // Verificar duplicado de nombre
    const duplicado = await executeQueryOne<{ count: string }>(`
      SELECT COUNT(*) as count
      FROM tiposusuarios
      WHERE LOWER(tipousuario) = LOWER($1) AND clavetipousuario != $2
    `, [tipousuario.trim(), clavetipousuario]);

    if (duplicado && parseInt(duplicado.count) > 0) {
      return NextResponse.json({
        success: false,
        message: 'Ya existe otro tipo de usuario con ese nombre',
      }, { status: 409 });
    }

    const result = await executeQueryOne<TipoUsuario>(`
      UPDATE tiposusuarios
      SET tipousuario = $1
      WHERE clavetipousuario = $2
      RETURNING clavetipousuario, tipousuario
    `, [tipousuario.trim(), clavetipousuario]);

    return NextResponse.json({
      success: true,
      message: 'Tipo de usuario actualizado correctamente',
      data: result,
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Error al actualizar el tipo de usuario',
      error: error instanceof Error ? error.message : 'Error desconocido',
    }, { status: 500 });
  }
}

// DELETE: Eliminar tipo de usuario
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clavetipousuario = parseInt(id);

    if (isNaN(clavetipousuario)) {
      return NextResponse.json({
        success: false,
        message: 'ID de tipo de usuario inválido',
      }, { status: 400 });
    }

    // Verificar que existe
    const existe = await executeQueryOne<{ count: string }>(`
      SELECT COUNT(*) as count FROM tiposusuarios WHERE clavetipousuario = $1
    `, [clavetipousuario]);

    if (!existe || parseInt(existe.count) === 0) {
      return NextResponse.json({
        success: false,
        message: 'Tipo de usuario no encontrado',
      }, { status: 404 });
    }

    // Verificar si está en uso por usuarios
    const enUsoUsuarios = await executeQueryOne<{ count: string }>(`
      SELECT COUNT(*) as count FROM usuarios WHERE id_tipousuario = $1
    `, [clavetipousuario]);

    if (enUsoUsuarios && parseInt(enUsoUsuarios.count) > 0) {
      return NextResponse.json({
        success: false,
        message: `No se puede eliminar: hay ${enUsoUsuarios.count} usuario(s) con este tipo asignado`,
      }, { status: 409 });
    }

    // Verificar si está en uso por proveedores
    const enUsoProveedores = await executeQueryOne<{ count: string }>(`
      SELECT COUNT(*) as count FROM proveedores WHERE clavetipousuario = $1
    `, [clavetipousuario]);

    if (enUsoProveedores && parseInt(enUsoProveedores.count) > 0) {
      return NextResponse.json({
        success: false,
        message: `No se puede eliminar: hay ${enUsoProveedores.count} proveedor(es) con este tipo asignado`,
      }, { status: 409 });
    }

    await executeQuery(`
      DELETE FROM tiposusuarios WHERE clavetipousuario = $1
    `, [clavetipousuario]);

    return NextResponse.json({
      success: true,
      message: 'Tipo de usuario eliminado correctamente',
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Error al eliminar el tipo de usuario',
      error: error instanceof Error ? error.message : 'Error desconocido',
    }, { status: 500 });
  }
}
