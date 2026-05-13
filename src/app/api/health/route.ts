// src/app/api/health/route.ts

import { NextResponse } from 'next/server';
import { healthCheck, getPoolStatus, getCircuitBreakerStatus } from '@/lib/dbPostgres';

/**
 * Endpoint de health check mejorado para verificar el estado del sistema
 * GET /api/health
 *
 * Respuesta incluye:
 * - Estado de la base de datos
 * - Latencia de conexión
 * - Estado del pool de conexiones
 * - Estado del circuit breaker
 */
export async function GET() {
  try {
    const dbHealth = await healthCheck();
    const poolStatus = getPoolStatus();
    const circuitBreaker = getCircuitBreakerStatus();

    const response = {
      status: dbHealth.status === 'healthy' ? 'ok' : (dbHealth.status === 'degraded' ? 'degraded' : 'error'),
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: dbHealth.status,
        message: dbHealth.message,
        ...(dbHealth.latencyMs && { latencyMs: dbHealth.latencyMs }),
      },
      pool: poolStatus ? {
        total: poolStatus.total,
        idle: poolStatus.idle,
        waiting: poolStatus.waiting,
        utilizationPercent: poolStatus.total > 0
          ? Math.round(((poolStatus.total - poolStatus.idle) / poolStatus.config.max) * 100)
          : 0,
        config: poolStatus.config,
      } : null,
      circuitBreaker: {
        isOpen: circuitBreaker.isOpen,
        failures: circuitBreaker.failures,
        ...(circuitBreaker.nextRetryIn && { nextRetryInSeconds: Math.ceil(circuitBreaker.nextRetryIn / 1000) }),
      },
      environment: process.env.NODE_ENV || 'development',
    };

    // Determinar código de estado HTTP
    let statusCode = 200;
    if (dbHealth.status === 'unhealthy' || circuitBreaker.isOpen) {
      statusCode = 503; // Service Unavailable
    } else if (dbHealth.status === 'degraded' || (poolStatus && poolStatus.waiting > 5)) {
      statusCode = 200; // OK pero degradado
    }

    return NextResponse.json(response, { status: statusCode });

  } catch (error: any) {
    console.error('Error en health check:', error);

    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: {
        status: 'unhealthy',
        message: 'Error al verificar el estado de la base de datos',
        error: error.message,
      },
      circuitBreaker: getCircuitBreakerStatus(),
    }, { status: 503 });
  }
}
