// src/app/api/auth/login/route.ts

import { NextResponse } from 'next/server';
// IMPORTANTE: Agregamos executeQuery para traer la lista de permisos
import { executeQueryOne, executeQuery, DatabaseError, DBErrorType } from '@/lib/dbPostgres';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

interface JwtPayload {
  id: number;
  usuario: string;
  tipoUsuario: number;
}

export async function POST(request: Request) {
  try {
    const { usuario, password } = await request.json();

    if (!usuario || !password) {
      return NextResponse.json({ message: 'Datos incompletos.' }, { status: 400 });
    }

    // 1. Buscar Usuario por username O correo
    const usuario_db = await executeQueryOne<{
      id_usuario: number;
      nombre: string;
      username: string;
      password: string;
      id_tipousuario: number;
      activo: boolean;
      firma_digital?: string;
    }>(`
      SELECT id_usuario, nombre, username, password, id_tipousuario, activo, firma_digital
      FROM usuarios WHERE username = $1 OR email = $1
    `, [usuario]);

    if (!usuario_db) {
      return NextResponse.json({ message: 'Credenciales inválidas.' }, { status: 401 });
    }

    if (!usuario_db.activo) {
      return NextResponse.json({ message: 'Usuario inactivo.' }, { status: 403 });
    }

    const passwordMatch = await bcrypt.compare(password, usuario_db.password);

    if (!passwordMatch) {
      return NextResponse.json({ message: 'Credenciales inválidas.' }, { status: 401 });
    }

    // 2. NUEVO: Obtener Permisos (Acciones) del Usuario
    // Hacemos un JOIN para obtener las claves (ej: 'VER_DASHBOARD')
    const acciones_db = await executeQuery<{ clave: string }>(`
      SELECT c.clave
      FROM usuario_acciones ua
      INNER JOIN cat_acciones c ON ua.id_accion = c.id_accion
      WHERE ua.id_usuario = $1 AND c.activo = true
    `, [usuario_db.id_usuario]);

    // Convertimos el resultado [{clave: 'A'}, {clave: 'B'}] a un array simple ['A', 'B']
    const permissions = acciones_db.map(a => a.clave);

    // 3. Generar Token
    const jwtSecret = process.env.JWT_SECRET!;
    const payload: JwtPayload = {
      id: usuario_db.id_usuario,
      usuario: usuario_db.username,
      tipoUsuario: usuario_db.id_tipousuario,
    };

    const token = jwt.sign(payload, jwtSecret, { expiresIn: '8h' });

    const serializedCookie = serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 8,
      path: '/',
    });

    // 4. Respuesta con Usuario Y Permisos
    const userResponse = {
      id_usuario: usuario_db.id_usuario,
      nombre: usuario_db.nombre,
      username: usuario_db.username,
      id_tipousuario: usuario_db.id_tipousuario,
      firma_digital: usuario_db.firma_digital,
    };

    const response = NextResponse.json(
      { 
        message: 'Login exitoso.', 
        user: userResponse,
        permissions: permissions // <--- Enviamos los permisos al frontend
      }, 
      { status: 200 }
    );

    response.headers.append('Set-Cookie', serializedCookie);

    return response;

  } catch (error: any) {
    console.error('Error en login:', error);

    // Manejo específico de errores de base de datos
    if (error instanceof DatabaseError) {
      let statusCode = 500;
      let userMessage = 'Error del servidor.';

      switch (error.type) {
        case DBErrorType.DNS_RESOLUTION_FAILED:
          userMessage = 'No se pudo conectar al servidor. Verifica tu conexión a internet.';
          statusCode = 503; // Service Unavailable
          break;

        case DBErrorType.CONNECTION_FAILED:
          userMessage = 'El servicio de base de datos no está disponible. Intenta de nuevo en unos momentos.';
          statusCode = 503; // Service Unavailable
          break;

        case DBErrorType.QUERY_TIMEOUT:
          userMessage = 'La operación tardó demasiado tiempo. Intenta de nuevo.';
          statusCode = 504; // Gateway Timeout
          break;

        case DBErrorType.QUERY_ERROR:
          userMessage = 'Error al procesar tu solicitud.';
          statusCode = 500;
          break;

        case DBErrorType.CONFIG_ERROR:
          userMessage = 'Error de configuración del servidor. Contacta al administrador.';
          statusCode = 500;
          break;

        default:
          userMessage = 'Error del servidor. Intenta de nuevo más tarde.';
          statusCode = 500;
      }

      return NextResponse.json({
        message: userMessage,
        errorType: error.type,
        // En desarrollo, incluir más detalles
        ...(process.env.NODE_ENV === 'development' && {
          details: error.message,
          isRetryable: error.isRetryable
        })
      }, { status: statusCode });
    }

    // Error genérico no clasificado
    return NextResponse.json({
      message: 'Error del servidor. Intenta de nuevo más tarde.',
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message
      })
    }, { status: 500 });
  }
}