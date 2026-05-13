import { NextResponse } from 'next/server';
import { db } from '@/db';
import { usuarios, organizaciones } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { serialize } from 'cookie';
import { signJwt } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Datos incompletos.' }, { status: 400 });
    }

    const [row] = await db
      .select({
        id: usuarios.id,
        email: usuarios.email,
        passwordHash: usuarios.passwordHash,
        nombre: usuarios.nombre,
        apellidoPaterno: usuarios.apellidoPaterno,
        role: usuarios.role,
        activo: usuarios.activo,
        tenantId: usuarios.tenantId,
        nombreOrganizacion: organizaciones.nombre,
        colorPrimario: organizaciones.colorPrimario,
        colorSecundario: organizaciones.colorSecundario,
        logoUrl: organizaciones.logoUrl,
      })
      .from(usuarios)
      .innerJoin(organizaciones, eq(usuarios.tenantId, organizaciones.id))
      .where(eq(usuarios.email, email))
      .limit(1);

    if (!row) {
      return NextResponse.json({ message: 'Credenciales inválidas.' }, { status: 401 });
    }

    if (!row.activo) {
      return NextResponse.json({ message: 'Usuario inactivo.' }, { status: 403 });
    }

    const passwordMatch = await bcrypt.compare(password, row.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json({ message: 'Credenciales inválidas.' }, { status: 401 });
    }

    const token = await signJwt({
      id: row.id,
      email: row.email,
      role: row.role,
      tenant_id: row.tenantId,
      nombre_organizacion: row.nombreOrganizacion,
    });

    const serializedCookie = serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 8,
      path: '/',
    });

    const response = NextResponse.json(
      {
        message: 'Login exitoso.',
        user: {
          id: row.id,
          email: row.email,
          nombre: row.nombre,
          apellidoPaterno: row.apellidoPaterno,
          role: row.role,
          tenant_id: row.tenantId,
          nombre_organizacion: row.nombreOrganizacion,
          colorPrimario: row.colorPrimario,
          colorSecundario: row.colorSecundario,
          logoUrl: row.logoUrl,
        },
      },
      { status: 200 }
    );
    response.headers.append('Set-Cookie', serializedCookie);
    return response;

  } catch (error: unknown) {
    console.error('Error en login:', error);
    return NextResponse.json(
      {
        message: 'Error del servidor.',
        ...(process.env.NODE_ENV === 'development' && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}
