import { jwtVerify, SignJWT } from 'jose';
import type { NextRequest } from 'next/server';
import type { RoleUsuario } from '@/db/schema/usuarios';

export interface JwtPayload {
  id: string;
  email: string;
  role: RoleUsuario;
  tenant_id: string;
  nombre_organizacion: string;
}

const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET!);

export async function signJwt(payload: JwtPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .sign(getSecret());
}

export async function verifyJwt(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, getSecret());
  return payload as unknown as JwtPayload;
}

export async function getTenantFromRequest(req: NextRequest): Promise<JwtPayload | null> {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  try {
    return await verifyJwt(token);
  } catch {
    return null;
  }
}
