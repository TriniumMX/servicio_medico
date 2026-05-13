// src/db/index.ts
// =============================================
// IMPORTANTE: Este archivo usa el pool UNIFICADO de dbPostgres.ts
// NO crear pools duplicados para evitar "Connection pool exhausted"
// =============================================

import { drizzle } from 'drizzle-orm/node-postgres';
import { getPostgresPool } from '@/lib/dbPostgres';
import * as schema from './schema';

// Usar el pool unificado de dbPostgres.ts
// Esto garantiza que toda la aplicación use el mismo pool
// con circuit breaker, monitoreo y reconexión automática

// Instancia de Drizzle usando el pool unificado
export const db = drizzle(getPostgresPool(), { schema });

// Exportar el pool unificado para casos específicos
export const pool = getPostgresPool();

// Re-exportar utilidades de dbPostgres para conveniencia
export {
  executeQuery,
  executeQueryOne,
  executeTransaction,
  healthCheck,
  getPoolStatus,
  getCircuitBreakerStatus,
  resetCircuitBreaker,
  DBErrorType,
  DatabaseError,
} from '@/lib/dbPostgres';
