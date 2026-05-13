import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/dbPostgres';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. OBTENER USUARIOS (CORREGIDO: id_tipousuario)
    const usuarios = await executeQuery(`
      SELECT 
        u.id_usuario, 
        u.nombre, 
        u.username, 
        u.id_tipousuario, -- <--- AQUÍ ESTABA EL ERROR
        t.tipousuario as nombre_rol
      FROM usuarios u
      LEFT JOIN tiposusuarios t ON u.id_tipousuario = t.clavetipousuario
      WHERE u.activo = true
      ORDER BY u.nombre ASC
    `);

    // 2. OBTENER ROLES
    const roles = await executeQuery(`
      SELECT clavetipousuario, tipousuario 
      FROM tiposusuarios 
      ORDER BY tipousuario ASC
    `);

    // 3. OBTENER ACCIONES (Las nuevas opciones del menú)
    const acciones = await executeQuery(`
      SELECT id_accion, clave, descripcion 
      FROM cat_acciones 
      WHERE activo = true 
      ORDER BY clave ASC
    `);

    // 4. OBTENER PERMISOS ACTUALES
    const permisosAsignados = await executeQuery(`
      SELECT id_usuario, id_accion FROM usuario_acciones
    `);

    return NextResponse.json({
      success: true,
      usuarios,
      roles,
      acciones,
      permisosAsignados
    });

  } catch (error: any) {
    console.error('Error fetching permisos:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { id_usuario, acciones_ids } = await request.json();

    if (!id_usuario) {
      return NextResponse.json({ success: false, error: 'Usuario requerido' }, { status: 400 });
    }

    // 1. Limpiar permisos anteriores
    await executeQuery('DELETE FROM usuario_acciones WHERE id_usuario = $1', [id_usuario]);

    // 2. Insertar nuevos
    if (acciones_ids && acciones_ids.length > 0) {
      const values = acciones_ids.map((id_accion: number) => `(${id_usuario}, ${id_accion})`).join(',');
      await executeQuery(`INSERT INTO usuario_acciones (id_usuario, id_accion) VALUES ${values}`);
    }

    return NextResponse.json({ success: true, message: 'Permisos actualizados correctamente' });
  } catch (error: any) {
    console.error('Error saving permisos:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}