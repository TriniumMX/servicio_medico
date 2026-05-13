// src/lib/logger.ts
// =============================================
// SISTEMA DE LOGGING PROFESIONAL CON WINSTON
// =============================================
// Características:
// - Logs en archivos con rotación diaria
// - Separación de logs por nivel (error, combined)
// - Formato estructurado con timestamps
// - Contexto adicional (userId, requestId, etc.)
// - Retención automática de logs (14 días)
// =============================================

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// =============================================
// CONFIGURACIÓN
// =============================================
const LOG_DIR = process.env.LOG_DIR || 'logs';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LOG_MAX_SIZE = '20m'; // Máximo 20MB por archivo
const LOG_MAX_FILES = '14d'; // Retener 14 días

// =============================================
// FORMATO PERSONALIZADO
// =============================================
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS',
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    // Formato: [TIMESTAMP] [LEVEL] MESSAGE {metadata}
    let log = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    // Agregar metadata si existe
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }

    // Agregar stack trace si es error
    if (stack) {
      log += `\n${stack}`;
    }

    return log;
  })
);

// Formato JSON para análisis programático
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// =============================================
// TRANSPORTES (DESTINOS DE LOGS)
// =============================================

// Transport para errores (solo nivel error)
const errorFileTransport = new DailyRotateFile({
  filename: path.join(LOG_DIR, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: LOG_MAX_SIZE,
  maxFiles: LOG_MAX_FILES,
  format: customFormat,
  zippedArchive: true, // Comprimir logs antiguos
});

// Transport para todos los logs (combined)
const combinedFileTransport = new DailyRotateFile({
  filename: path.join(LOG_DIR, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: LOG_MAX_SIZE,
  maxFiles: LOG_MAX_FILES,
  format: customFormat,
  zippedArchive: true,
});

// Transport para logs de base de datos
const databaseFileTransport = new DailyRotateFile({
  filename: path.join(LOG_DIR, 'database-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: LOG_MAX_SIZE,
  maxFiles: LOG_MAX_FILES,
  format: customFormat,
  zippedArchive: true,
});

// Transport para logs de autenticación
const authFileTransport = new DailyRotateFile({
  filename: path.join(LOG_DIR, 'auth-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: LOG_MAX_SIZE,
  maxFiles: LOG_MAX_FILES,
  format: customFormat,
  zippedArchive: true,
});

// Transport para consola (solo en desarrollo)
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      let log = `[${timestamp}] ${level}: ${message}`;
      if (Object.keys(meta).length > 0 && process.env.NODE_ENV === 'development') {
        log += ` ${JSON.stringify(meta)}`;
      }
      return log;
    })
  ),
});

// =============================================
// LOGGER PRINCIPAL
// =============================================
const logger = winston.createLogger({
  level: LOG_LEVEL,
  defaultMeta: {
    service: 'servicio-medico',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    errorFileTransport,
    combinedFileTransport,
  ],
  // No salir en errores no capturados
  exitOnError: false,
});

// Agregar consola solo en desarrollo
if (process.env.NODE_ENV !== 'production') {
  logger.add(consoleTransport);
}

// =============================================
// LOGGERS ESPECIALIZADOS
// =============================================

// Logger para base de datos
export const dbLogger = winston.createLogger({
  level: LOG_LEVEL,
  defaultMeta: { service: 'database' },
  transports: [
    databaseFileTransport,
    errorFileTransport, // También guardar errores de DB en archivo de errores
  ],
});

if (process.env.NODE_ENV !== 'production') {
  dbLogger.add(consoleTransport);
}

// Logger para autenticación
export const authLogger = winston.createLogger({
  level: LOG_LEVEL,
  defaultMeta: { service: 'auth' },
  transports: [
    authFileTransport,
    errorFileTransport,
  ],
});

if (process.env.NODE_ENV !== 'production') {
  authLogger.add(consoleTransport);
}

// =============================================
// FUNCIONES DE UTILIDAD
// =============================================

/**
 * Crea un logger con contexto adicional (útil para request tracking)
 */
export const createContextLogger = (context: Record<string, any>) => {
  return logger.child(context);
};

/**
 * Log de información general
 */
export const logInfo = (message: string, meta?: Record<string, any>) => {
  logger.info(message, meta);
};

/**
 * Log de advertencia
 */
export const logWarn = (message: string, meta?: Record<string, any>) => {
  logger.warn(message, meta);
};

/**
 * Log de error
 */
export const logError = (message: string, error?: Error | any, meta?: Record<string, any>) => {
  if (error instanceof Error) {
    logger.error(message, {
      ...meta,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    });
  } else if (error) {
    logger.error(message, { ...meta, error });
  } else {
    logger.error(message, meta);
  }
};

/**
 * Log de debug (solo se muestra si LOG_LEVEL=debug)
 */
export const logDebug = (message: string, meta?: Record<string, any>) => {
  logger.debug(message, meta);
};

// =============================================
// LOGS ESPECÍFICOS DE BASE DE DATOS
// =============================================

/**
 * Log de conexión a base de datos
 */
export const logDbConnection = (action: 'connect' | 'disconnect' | 'error', meta?: Record<string, any>) => {
  const messages = {
    connect: '✅ Conexión establecida con PostgreSQL',
    disconnect: '🔌 Conexión cerrada con PostgreSQL',
    error: '❌ Error de conexión con PostgreSQL',
  };

  if (action === 'error') {
    dbLogger.error(messages[action], meta);
  } else {
    dbLogger.info(messages[action], meta);
  }
};

/**
 * Log de query ejecutada
 */
export const logDbQuery = (query: string, params: any[], durationMs: number, success: boolean) => {
  const truncatedQuery = query.length > 200 ? query.substring(0, 200) + '...' : query;

  if (success) {
    dbLogger.info('Query ejecutada', {
      query: truncatedQuery,
      paramsCount: params.length,
      durationMs,
    });
  } else {
    dbLogger.error('Query fallida', {
      query: truncatedQuery,
      paramsCount: params.length,
      durationMs,
    });
  }
};

/**
 * Log de circuit breaker
 */
export const logCircuitBreaker = (action: 'open' | 'close' | 'half-open', failures?: number) => {
  const messages = {
    open: `🔴 Circuit breaker ABIERTO después de ${failures} fallos`,
    close: '🟢 Circuit breaker CERRADO - conexión restaurada',
    'half-open': '🟡 Circuit breaker HALF-OPEN - probando conexión',
  };

  if (action === 'open') {
    dbLogger.error(messages[action], { failures });
  } else {
    dbLogger.info(messages[action]);
  }
};

// =============================================
// LOGS ESPECÍFICOS DE AUTENTICACIÓN
// =============================================

/**
 * Log de intento de login
 */
export const logLoginAttempt = (username: string, success: boolean, ip?: string, reason?: string) => {
  if (success) {
    authLogger.info('Login exitoso', { username, ip });
  } else {
    authLogger.warn('Login fallido', { username, ip, reason });
  }
};

/**
 * Log de logout
 */
export const logLogout = (username: string, userId?: number) => {
  authLogger.info('Logout', { username, userId });
};

/**
 * Log de acceso no autorizado
 */
export const logUnauthorizedAccess = (path: string, ip?: string, userId?: number) => {
  authLogger.warn('Acceso no autorizado', { path, ip, userId });
};

// =============================================
// LOGS DE API
// =============================================

/**
 * Log de request HTTP
 */
export const logApiRequest = (
  method: string,
  path: string,
  statusCode: number,
  durationMs: number,
  userId?: number
) => {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

  logger.log(level, `${method} ${path} ${statusCode}`, {
    method,
    path,
    statusCode,
    durationMs,
    userId,
  });
};

/**
 * Log de error de API
 */
export const logApiError = (
  method: string,
  path: string,
  error: Error | any,
  userId?: number
) => {
  logger.error(`Error en ${method} ${path}`, {
    method,
    path,
    userId,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
  });
};

// =============================================
// EXPORTAR LOGGER PRINCIPAL
// =============================================
export default logger;

// =============================================
// INFORMACIÓN DE ARCHIVOS DE LOG
// =============================================
/**
 * ARCHIVOS GENERADOS:
 *
 * logs/
 * ├── error-2026-01-14.log      <- Solo errores (todos los servicios)
 * ├── combined-2026-01-14.log   <- Todos los logs generales
 * ├── database-2026-01-14.log   <- Logs de base de datos
 * └── auth-2026-01-14.log       <- Logs de autenticación
 *
 * Los archivos se rotan diariamente y se comprimen después de 1 día.
 * Se mantienen por 14 días automáticamente.
 *
 * NIVELES DE LOG (de mayor a menor prioridad):
 * - error: Errores críticos
 * - warn: Advertencias
 * - info: Información general (default)
 * - debug: Información detallada para debugging
 *
 * CONFIGURACIÓN VÍA VARIABLES DE ENTORNO:
 * - LOG_DIR: Directorio de logs (default: 'logs')
 * - LOG_LEVEL: Nivel mínimo de log (default: 'info')
 */
