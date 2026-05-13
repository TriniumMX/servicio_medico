import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Cliente público (anon key).
 * Respeta RLS — usar en Server Components y rutas que ya validaron el JWT.
 */
export const supabase = createClient(supabaseUrl, supabaseAnon);

/**
 * Cliente admin (service role key).
 * Bypasea RLS — usar SOLO en rutas internas del servidor (API routes, Server Actions).
 * Nunca exponer al cliente.
 */
export function getSupabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Sube un PDF a Supabase Storage.
 * Bucket esperado: 'pdfs' con estructura 'pdfs/{tenant_id}/{tipo}/{id}.pdf'
 */
export async function uploadPDF(
  tenantId: string,
  tipo: string,
  id: string,
  buffer: Buffer
): Promise<string> {
  const admin = getSupabaseAdmin();
  const path  = `${tenantId}/${tipo}/${id}.pdf`;
  const { error } = await admin.storage.from('pdfs').upload(path, buffer, {
    contentType: 'application/pdf',
    upsert: true,
  });
  if (error) throw error;
  return path;
}

/**
 * Genera una URL firmada con expiración para un archivo en Storage.
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresInSeconds = 3600
): Promise<string> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data) throw error ?? new Error('No se pudo generar URL firmada');
  return data.signedUrl;
}

/**
 * Sube el logo de una organización.
 * Path: 'logos/{tenant_id}/logo.{ext}'
 */
export async function uploadLogo(
  tenantId: string,
  buffer: Buffer,
  ext = 'png'
): Promise<string> {
  const admin = getSupabaseAdmin();
  const path  = `${tenantId}/logo.${ext}`;
  const { error } = await admin.storage.from('logos').upload(path, buffer, {
    contentType: `image/${ext}`,
    upsert: true,
  });
  if (error) throw error;
  return path;
}
