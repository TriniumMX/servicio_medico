// src/lib/dbPostgres.ts
import { Pool, PoolClient, PoolConfig } from 'pg';
import { dbLogger, logDbConnection, logCircuitBreaker } from './logger';

// =============================================
// TIPOS DE ERROR PERSONALIZADOS
// =============================================
export enum DBErrorType {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  DNS_RESOLUTION_FAILED = 'DNS_RESOLUTION_FAILED',
  QUERY_TIMEOUT = 'QUERY_TIMEOUT',
  QUERY_ERROR = 'QUERY_ERROR',
  TRANSACTION_ERROR = 'TRANSACTION_ERROR',
  CONFIG_ERROR = 'CONFIG_ERROR',
  CIRCUIT_OPEN = 'CIRCUIT_OPEN',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class DatabaseError extends Error {
  type: DBErrorType;
  originalError?: any;
  isRetryable: boolean;

  constructor(message: string, type: DBErrorType, originalError?: any, isRetryable = false) {
    super(message);
    this.name = 'DatabaseError';
    this.type = type;
    this.originalError = originalError;
    this.isRetryable = isRetryable;
  }
}

// =============================================
// CIRCUIT BREAKER - Protección contra servidor caído
// =============================================
interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
  nextRetryTime: number;
}

const CIRCUIT_BREAKER_CONFIG = {
  failureThreshold: 5,        // Después de 5 fallos consecutivos, abrir circuito
  resetTimeoutMs: 30000,      // Esperar 30 segundos antes de reintentar
  halfOpenMaxAttempts: 2,     // En estado half-open, permitir 2 intentos
};

// Estado global del circuit breaker
let circuitBreaker: CircuitBreakerState = {
  failures: 0,
  lastFailure: 0,
  isOpen: false,
  nextRetryTime: 0,
};

/**
 * Verifica si el circuit breaker permite la operación
 */
const checkCircuitBreaker = (): void => {
  const now = Date.now();

  if (circuitBreaker.isOpen) {
    // Verificar si es tiempo de reintentar (half-open)
    if (now >= circuitBreaker.nextRetryTime) {
      logCircuitBreaker('half-open');
      // Permitir el intento (estado half-open)
      return;
    }

    const waitTime = Math.ceil((circuitBreaker.nextRetryTime - now) / 1000);
    throw new DatabaseError(
      `Servidor de base de datos no disponible. Reintentando en ${waitTime} segundos.`,
      DBErrorType.CIRCUIT_OPEN,
      null,
      false
    );
  }
};

/**
 * Registra un fallo en el circuit breaker
 */
const recordFailure = (): void => {
  const now = Date.now();
  circuitBreaker.failures++;
  circuitBreaker.lastFailure = now;

  if (circuitBreaker.failures >= CIRCUIT_BREAKER_CONFIG.failureThreshold) {
    circuitBreaker.isOpen = true;
    circuitBreaker.nextRetryTime = now + CIRCUIT_BREAKER_CONFIG.resetTimeoutMs;
    logCircuitBreaker('open', circuitBreaker.failures);
  }
};

/**
 * Registra un éxito y resetea el circuit breaker
 */
const recordSuccess = (): void => {
  if (circuitBreaker.failures > 0 || circuitBreaker.isOpen) {
    logCircuitBreaker('close');
  }
  circuitBreaker.failures = 0;
  circuitBreaker.isOpen = false;
  circuitBreaker.nextRetryTime = 0;
};

/**
 * Obtiene el estado actual del circuit breaker (para monitoreo)
 */
export const getCircuitBreakerStatus = (): {
  isOpen: boolean;
  failures: number;
  nextRetryIn: number | null;
} => {
  const now = Date.now();
  return {
    isOpen: circuitBreaker.isOpen,
    failures: circuitBreaker.failures,
    nextRetryIn: circuitBreaker.isOpen ? Math.max(0, circuitBreaker.nextRetryTime - now) : null,
  };
};

// =============================================
// VALIDACIÓN DE CONFIGURACIÓN
// =============================================
const validateDBConfig = (): void => {
  const requiredVars = ['PGHOST', 'PGUSER', 'PGPASSWORD', 'PGDATABASE'];
  const missing = requiredVars.filter(v => !process.env[v]);

  if (missing.length > 0) {
    throw new DatabaseError(
      `Faltan variables de entorno de base de datos: ${missing.join(', ')}`,
      DBErrorType.CONFIG_ERROR,
      null,
      false
    );
  }
};

// =============================================
// CONFIGURACIÓN OPTIMIZADA DEL POOL
// =============================================
const dbConfig: PoolConfig = {
  host: process.env.PGHOST,
  port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432'),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,

  // Pool sizing optimizado para servidor remoto (aumentado para evitar pool exhaustion)
  max: 50,                              // Aumentado de 25 a 50
  min: 5,                               // Mantener en 5 conexiones listas

  // Timeouts ajustados: reducimos idle para liberar conexiones inactivas más rápido
  idleTimeoutMillis: 30000,             // 30 segundos (antes 5 minutos) - para liberar recursos
  connectionTimeoutMillis: 30000,       // 30 segundos
  query_timeout: 120000,                // 2 minutos

  // SSL controlado por variable de entorno (DB_SSL=true para activar)
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,

  // Keep-alive optimizado
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,   // 10s para mantener la conexión activa, pero idleTimeoutMillis las cerrará

  // Configuración adicional
  allowExitOnIdle: true,                // Permitir cerrar conexiones inactivas para liberar memoria
};

// =============================================
// SINGLETON GLOBAL DEL POOL
// =============================================
declare global {
  var pgPool: Pool | null;
  var pgPoolMonitorInterval: NodeJS.Timeout | null;
}

let pool: Pool | null = null;

// =============================================
// CONFIGURACIÓN DE REINTENTOS
// =============================================
interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 4,              // Aumentado de 3 a 4
  initialDelayMs: 1000,       // 1 segundo inicial
  maxDelayMs: 15000,          // Máximo 15 segundos (antes 10s)
  backoffMultiplier: 2,
};

/**
 * Función de utilidad para esperar
 */
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

// =============================================
// CLASIFICACIÓN DE ERRORES
// =============================================
const classifyError = (error: any): DatabaseError => {
  const errorCode = error.code;
  const errorMessage = error.message || '';

  // Errores de DNS
  if (errorCode === 'ENOTFOUND' || errorCode === 'EAI_AGAIN') {
    return new DatabaseError(
      `No se pudo resolver el nombre del servidor de base de datos. Verifica tu conexión a internet y la configuración del host.`,
      DBErrorType.DNS_RESOLUTION_FAILED,
      error,
      true
    );
  }

  // Errores de conexión
  if (
    errorCode === 'ECONNREFUSED' ||
    errorCode === 'ECONNRESET' ||
    errorCode === 'ETIMEDOUT' ||
    errorCode === 'EPIPE' ||
    errorCode === 'EHOSTUNREACH' ||
    errorMessage.includes('Connection terminated') ||
    errorMessage.includes('Connection refused') ||
    errorMessage.includes('getaddrinfo')
  ) {
    return new DatabaseError(
      `No se pudo conectar al servidor de base de datos. El servidor puede estar inactivo o inaccesible.`,
      DBErrorType.CONNECTION_FAILED,
      error,
      true
    );
  }

  // Timeout de query
  if (
    errorMessage.includes('timeout') ||
    errorMessage.includes('timed out') ||
    errorCode === 'ETIMEDOUT'
  ) {
    return new DatabaseError(
      `La consulta a la base de datos excedió el tiempo límite.`,
      DBErrorType.QUERY_TIMEOUT,
      error,
      true
    );
  }

  // Error de query SQL (código PostgreSQL de 5 caracteres)
  if (errorCode && errorCode.match(/^[0-9A-Z]{5}$/)) {
    return new DatabaseError(
      `Error en la consulta SQL: ${errorMessage}`,
      DBErrorType.QUERY_ERROR,
      error,
      false // No es reintentable (error de lógica)
    );
  }

  // Error desconocido
  return new DatabaseError(
    `Error desconocido de base de datos: ${errorMessage}`,
    DBErrorType.UNKNOWN_ERROR,
    error,
    true // Reintentar por si es transitorio
  );
};

// =============================================
// RETRY CON CIRCUIT BREAKER
// =============================================
async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  operationName = 'operación de base de datos'
): Promise<T> {
  // Verificar circuit breaker primero
  checkCircuitBreaker();

  let lastError: DatabaseError | null = null;
  let delayMs = config.initialDelayMs;

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      const result = await operation();
      recordSuccess(); // Éxito - resetear circuit breaker
      return result;
    } catch (error: any) {
      lastError = error instanceof DatabaseError ? error : classifyError(error);

      // Si el error no es reintentable, lanzarlo inmediatamente
      if (!lastError.isRetryable) {
        dbLogger.error(`Error no reintentable en ${operationName}`, { error: lastError.message, type: lastError.type });
        throw lastError;
      }

      // Registrar fallo en circuit breaker
      recordFailure();

      // Si es el último intento, lanzar el error
      if (attempt === config.maxRetries) {
        dbLogger.error(`Falló ${operationName} después de ${config.maxRetries} intentos`, { error: lastError.message, type: lastError.type });
        throw lastError;
      }

      // Log del reintento
      dbLogger.warn(`Intento ${attempt}/${config.maxRetries} falló para ${operationName}. Reintentando en ${delayMs}ms`);

      // Esperar antes del siguiente intento
      await sleep(delayMs);

      // Incrementar el delay con backoff exponencial
      delayMs = Math.min(delayMs * config.backoffMultiplier, config.maxDelayMs);
    }
  }

  throw lastError || new DatabaseError('Error desconocido', DBErrorType.UNKNOWN_ERROR, null, false);
}

// =============================================
// MONITOREO DEL POOL
// =============================================
const startPoolMonitoring = (pool: Pool): void => {
  // Evitar múltiples intervalos
  if (global.pgPoolMonitorInterval) {
    return;
  }

  // Log inicial
  dbLogger.info('Iniciando monitoreo del pool de conexiones');

  // Monitorear cada 60 segundos
  global.pgPoolMonitorInterval = setInterval(() => {
    if (global.pgPool) {
      const status = {
        total: global.pgPool.totalCount,
        idle: global.pgPool.idleCount,
        waiting: global.pgPool.waitingCount,
        circuitBreaker: getCircuitBreakerStatus(),
      };

      // Solo loguear si hay algo interesante
      if (status.waiting > 0 || status.idle === 0 || status.circuitBreaker.isOpen) {
        dbLogger.info('Estado del Pool PostgreSQL', status);
      }

      // Alerta si el pool está bajo presión
      if (status.waiting > 5) {
        dbLogger.warn(`ALERTA: ${status.waiting} queries esperando conexión disponible`);
      }

      if (status.idle === 0 && status.total >= dbConfig.max!) {
        dbLogger.error('CRÍTICO: Pool de conexiones agotado!');
      }
    }
  }, 60000); // Cada 60 segundos
};

// =============================================
// OBTENER POOL DE CONEXIONES
// =============================================
export const getPostgresPool = (): Pool => {
  // Validar configuración
  try {
    validateDBConfig();
  } catch (error) {
    dbLogger.error('Error en configuración de base de datos', { error: (error as Error).message });
    throw error;
  }

  // Crear pool si no existe
  if (!global.pgPool) {
    dbLogger.info('Inicializando pool de PostgreSQL optimizado');
    dbLogger.info('Conectando a PostgreSQL', { host: process.env.PGHOST, port: process.env.DB_PORT || process.env.PGPORT || '5432', database: process.env.PGDATABASE });
    dbLogger.info('Configuración del pool', { min: dbConfig.min, max: dbConfig.max, idleTimeoutMs: dbConfig.idleTimeoutMillis });

    global.pgPool = new Pool(dbConfig);

    // Event handlers mejorados
    global.pgPool.on('error', (err, client) => {
      const dbError = classifyError(err);

      // Silenciar errores comunes de conexiones cerradas
      if (
        err.message?.includes('Connection terminated') ||
        err.message?.includes('Connection closed') ||
        err.message?.includes('unexpected response')
      ) {
        // Estos son normales cuando el servidor cierra conexiones idle
        dbLogger.debug('Conexión idle cerrada por el servidor');
      } else {
        dbLogger.error('Error en el pool de PostgreSQL', { error: dbError.message, type: dbError.type });
        recordFailure();
      }
    });

    global.pgPool.on('connect', (client) => {
      logDbConnection('connect');

      // Configurar timeout a nivel de conexión
      client.query('SET statement_timeout = 120000'); // 2 minutos
    });

    global.pgPool.on('acquire', () => {
      // Conexión adquirida del pool (opcional para debug)
    });

    global.pgPool.on('remove', () => {
      dbLogger.debug('Conexión removida del pool');
    });

    // Iniciar monitoreo
    startPoolMonitoring(global.pgPool);
  }

  return global.pgPool;
};

// =============================================
// HEALTH CHECK MEJORADO
// =============================================
export const healthCheck = async (): Promise<{
  status: 'healthy' | 'unhealthy' | 'degraded';
  message: string;
  latencyMs?: number;
  poolStatus?: {
    total: number;
    idle: number;
    waiting: number;
  };
  circuitBreaker?: {
    isOpen: boolean;
    failures: number;
  };
}> => {
  const startTime = Date.now();

  // Verificar circuit breaker
  const cbStatus = getCircuitBreakerStatus();
  if (cbStatus.isOpen) {
    return {
      status: 'unhealthy',
      message: `Circuit breaker abierto. Próximo reintento en ${Math.ceil((cbStatus.nextRetryIn || 0) / 1000)}s`,
      circuitBreaker: {
        isOpen: cbStatus.isOpen,
        failures: cbStatus.failures,
      },
    };
  }

  try {
    await withRetry(
      async () => {
        const pool = getPostgresPool();
        const client = await pool.connect();
        try {
          await client.query('SELECT 1');
        } finally {
          client.release();
        }
      },
      { maxRetries: 2, initialDelayMs: 500, maxDelayMs: 2000, backoffMultiplier: 2 },
      'health check'
    );

    const latencyMs = Date.now() - startTime;
    const pool = getPostgresPool();

    const result: any = {
      status: latencyMs > 5000 ? 'degraded' : 'healthy',
      message: latencyMs > 5000 ? 'Conexión lenta pero funcional' : 'Conexión a base de datos exitosa',
      latencyMs,
      poolStatus: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount,
      },
      circuitBreaker: {
        isOpen: false,
        failures: circuitBreaker.failures,
      },
    };

    return result;
  } catch (error: any) {
    const dbError = error instanceof DatabaseError ? error : classifyError(error);

    return {
      status: 'unhealthy',
      message: dbError.message,
      circuitBreaker: {
        isOpen: circuitBreaker.isOpen,
        failures: circuitBreaker.failures,
      },
    };
  }
};

// =============================================
// OBTENER CONEXIÓN CON VALIDACIÓN
// =============================================
export const getPostgresConnection = async (): Promise<PoolClient> => {
  // Verificar circuit breaker
  checkCircuitBreaker();

  return withRetry(
    async () => {
      const pool = getPostgresPool();
      const client = await pool.connect();

      // Validar que la conexión esté viva
      try {
        await client.query('SELECT 1');
        return client;
      } catch (error) {
        client.release(true); // Release con destroy
        throw error;
      }
    },
    DEFAULT_RETRY_CONFIG,
    'obtener conexión'
  );
};

// =============================================
// EJECUTAR QUERY CON PROTECCIÓN COMPLETA
// =============================================
export const executeQuery = async <T = any>(
  query: string,
  params: any[] = [],
  retryConfig?: Partial<RetryConfig>
): Promise<T[]> => {
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };

  return withRetry(
    async () => {
      let client: PoolClient | null = null;
      try {
        const pool = getPostgresPool();
        client = await pool.connect();

        // Ejecutar query
        const result = await client.query(query, params);
        return result.rows as T[];
      } catch (error: any) {
        const dbError = classifyError(error);

        // Solo loguear errores que no sean de conexión (evitar spam)
        if (dbError.type === DBErrorType.QUERY_ERROR) {
          dbLogger.error('Error en query SQL', { error: dbError.message, query: query.substring(0, 200) });
        }

        throw dbError;
      } finally {
        if (client) {
          client.release();
        }
      }
    },
    config,
    'ejecutar query'
  );
};

// =============================================
// EJECUTAR QUERY QUE RETORNA UN RESULTADO
// =============================================
export const executeQueryOne = async <T = any>(
  query: string,
  params: any[] = [],
  retryConfig?: Partial<RetryConfig>
): Promise<T | null> => {
  const results = await executeQuery<T>(query, params, retryConfig);
  return results.length > 0 ? results[0] : null;
};

// =============================================
// EJECUTAR TRANSACCIÓN
// =============================================
export const executeTransaction = async (
  queries: Array<{ query: string; params: any[] }>,
  retryConfig?: Partial<RetryConfig>
): Promise<void> => {
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };

  return withRetry(
    async () => {
      const client = await getPostgresConnection();

      try {
        await client.query('BEGIN');

        for (const { query, params } of queries) {
          await client.query(query, params);
        }

        await client.query('COMMIT');
      } catch (error: any) {
        await client.query('ROLLBACK').catch(() => {}); // Ignorar error de rollback

        const dbError = classifyError(error);
        dbLogger.error('Error en transacción, rollback ejecutado', { error: dbError.message });

        throw new DatabaseError(
          `Error en transacción: ${dbError.message}`,
          DBErrorType.TRANSACTION_ERROR,
          error,
          dbError.isRetryable
        );
      } finally {
        client.release();
      }
    },
    config,
    'ejecutar transacción'
  );
};

// =============================================
// CERRAR POOL (para shutdown)
// =============================================
export const closePool = async (): Promise<void> => {
  // Detener monitoreo
  if (global.pgPoolMonitorInterval) {
    clearInterval(global.pgPoolMonitorInterval);
    global.pgPoolMonitorInterval = null;
  }

  if (pool) {
    await pool.end();
    pool = null;
  }
  if (global.pgPool) {
    dbLogger.info('Cerrando pool de PostgreSQL');
    await global.pgPool.end();
    global.pgPool = null;
  }
};

// =============================================
// RESETEAR CIRCUIT BREAKER (para testing/admin)
// =============================================
export const resetCircuitBreaker = (): void => {
  dbLogger.info('Reseteando circuit breaker manualmente');
  circuitBreaker = {
    failures: 0,
    lastFailure: 0,
    isOpen: false,
    nextRetryTime: 0,
  };
};

// =============================================
// OBTENER ESTADO DEL POOL (para monitoreo externo)
// =============================================
export const getPoolStatus = (): {
  total: number;
  idle: number;
  waiting: number;
  config: {
    min: number;
    max: number;
    idleTimeoutMs: number;
  };
} | null => {
  if (!global.pgPool) return null;

  return {
    total: global.pgPool.totalCount,
    idle: global.pgPool.idleCount,
    waiting: global.pgPool.waitingCount,
    config: {
      min: dbConfig.min!,
      max: dbConfig.max!,
      idleTimeoutMs: dbConfig.idleTimeoutMillis!,
    },
  };
};

// Exportar pool para casos específicos
export { pool };
