import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/db';
import { usuarios, organizaciones } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getTenantFromRequest } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const jwt = await getTenantFromRequest(request);
    if (!jwt) {
      return NextResponse.json({ message: 'No autorizado.' }, { status: 401 });
    }

    const [row] = await db
      .select({
        id: usuarios.id,
        email: usuarios.email,
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
      .where(eq(usuarios.id, jwt.id))
      .limit(1);

    if (!row || !row.activo) {
      return NextResponse.json({ message: 'Usuario no encontrado.' }, { status: 404 });
    }

    return NextResponse.json({
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
    });

  } catch (error) {
    console.error('Error al obtener datos del usuario:', error);
    return NextResponse.json({ message: 'No autorizado.' }, { status: 401 });
  }
}
