import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

type DB = NodePgDatabase<typeof schema>;

// Pool de conexión a Supabase PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Requerido por Supabase
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

export const db = drizzle(pool, { schema });

/**
 * Ejecuta `fn` dentro de una conexión donde el tenant_id está activo para RLS.
 * Usar en TODAS las rutas API que leen/escriben datos de un tenant.
 *
 * @example
 * const result = await withTenant(tenantId, (db) =>
 *   db.select().from(pacientes).where(eq(pacientes.tenantId, tenantId))
 * );
 */
export async function withTenant<T>(
  tenantId: string,
  fn: (db: DB) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('SELECT set_tenant_id($1)', [tenantId]);
    const tenantDb = drizzle(client, { schema }) as unknown as DB;
    return await fn(tenantDb);
  } finally {
    client.release();
  }
}

export async function withTenantTransaction<T>(
  tenantId: string,
  fn: (db: DB) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT set_tenant_id($1)', [tenantId]);
    const tenantDb = drizzle(client, { schema }) as unknown as DB;
    const result = await fn(tenantDb);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export { pool };
