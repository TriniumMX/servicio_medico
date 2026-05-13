// src/app/api/auth/me/route.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
// IMPORTANTE: Agregamos executeQuery para traer la lista de permisos
import { executeQueryOne, executeQuery } from '@/lib/dbPostgres';

interface JwtPayload {
  id: number;
  usuario: string;
  tipoUsuario: number;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'No autorizado: Token no proporcionado.' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret) as { payload: JwtPayload };

    // 1. Obtener datos del Usuario
    const user = await executeQueryOne<{
      id_usuario: number;
      nombre: string;
      username: string;
      id_tipousuario: number;
      firma_digital?: string;
      id_hospital?: number | null;
      nombre_hospital?: string | null;
    }>(`
      SELECT
        u.id_usuario,
        u.nombre,
        u.username,
        u.id_tipousuario,
        u.firma_digital,
        u.id_hospital,
        h.nombre_hospital
      FROM usuarios u
      LEFT JOIN hospitales h ON u.id_hospital = h.id_hospital
      WHERE u.id_usuario = $1
    `, [payload.id]);

    if (!user) {
      return NextResponse.json({ message: 'Usuario no encontrado.' }, { status: 404 });
    }

    // 2. NUEVO: Obtener Permisos (Acciones) del Usuario
    // Hacemos un JOIN para obtener las claves (ej: 'VER_DASHBOARD')
    const acciones_db = await executeQuery<{ clave: string }>(`
      SELECT c.clave
      FROM usuario_acciones ua
      INNER JOIN cat_acciones c ON ua.id_accion = c.id_accion
      WHERE ua.id_usuario = $1 AND c.activo = true
    `, [payload.id]);

    // Convertimos el resultado [{clave: 'A'}, {clave: 'B'}] a un array simple ['A', 'B']
    const permissions = acciones_db.map(a => a.clave);

    // 3. Retornar Usuario + Permisos
    // Esto permite que el AuthContext restaure el menú correcto al recargar la página
    return NextResponse.json({ user, permissions }, { status: 200 });

  } catch (error) {
    console.error('Error al obtener datos del usuario:', error);
    return NextResponse.json({ message: 'No autorizado: Token inválido.' }, { status: 401 });
  }
}