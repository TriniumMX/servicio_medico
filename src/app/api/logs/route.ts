// src/app/api/logs/route.ts
// =============================================
// ENDPOINT PARA VER LOGS DEL SISTEMA
// =============================================
// IMPORTANTE: Este endpoint debe estar protegido en producción
// Solo usuarios administradores deberían poder acceder

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const LOG_DIR = process.env.LOG_DIR || 'logs';

// Tipos de logs disponibles
type LogType = 'error' | 'combined' | 'database' | 'auth';

/**
 * GET /api/logs
 *
 * Query params:
 * - type: 'error' | 'combined' | 'database' | 'auth' (default: 'error')
 * - lines: número de líneas a mostrar (default: 100, max: 500)
 * - date: fecha específica YYYY-MM-DD (default: hoy)
 *
 * Ejemplo: /api/logs?type=error&lines=50&date=2026-01-14
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener parámetros
    const searchParams = request.nextUrl.searchParams;
    const type = (searchParams.get('type') || 'error') as LogType;
    const lines = Math.min(parseInt(searchParams.get('lines') || '100'), 500);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Validar tipo de log
    const validTypes: LogType[] = ['error', 'combined', 'database', 'auth'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Tipo de log inválido. Usar: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Construir nombre del archivo
    const filename = `${type}-${date}.log`;
    const filepath = path.join(process.cwd(), LOG_DIR, filename);

    // Verificar si el archivo existe
    try {
      await fs.access(filepath);
    } catch {
      return NextResponse.json({
        success: true,
        message: `No hay logs de tipo '${type}' para la fecha ${date}`,
        logs: [],
        file: filename,
      });
    }

    // Leer el archivo
    const content = await fs.readFile(filepath, 'utf-8');

    // Dividir en líneas y tomar las últimas N
    const allLines = content.split('\n').filter(line => line.trim());
    const lastLines = allLines.slice(-lines);

    // Parsear las líneas en objetos (si es posible)
    const parsedLogs = lastLines.map(line => {
      // Intentar extraer timestamp y nivel
      const match = line.match(/^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3})\] \[(\w+)\] (.+)$/);
      if (match) {
        return {
          timestamp: match[1],
          level: match[2],
          message: match[3],
          raw: line,
        };
      }
      return { raw: line };
    });

    return NextResponse.json({
      success: true,
      file: filename,
      totalLines: allLines.length,
      showing: lastLines.length,
      logs: parsedLogs,
    });

  } catch (error: any) {
    console.error('Error leyendo logs:', error);
    return NextResponse.json(
      { success: false, error: 'Error al leer logs: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/logs/files
 *
 * Lista todos los archivos de log disponibles
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Si es una petición para listar archivos
    if (body.action === 'list-files') {
      const logDir = path.join(process.cwd(), LOG_DIR);

      try {
        const files = await fs.readdir(logDir);
        const logFiles = files
          .filter(f => f.endsWith('.log') || f.endsWith('.log.gz'))
          .map(f => {
            const match = f.match(/^(\w+)-(\d{4}-\d{2}-\d{2})\.log(\.gz)?$/);
            return {
              filename: f,
              type: match ? match[1] : 'unknown',
              date: match ? match[2] : 'unknown',
              compressed: f.endsWith('.gz'),
            };
          })
          .sort((a, b) => b.date.localeCompare(a.date)); // Más recientes primero

        return NextResponse.json({
          success: true,
          directory: LOG_DIR,
          files: logFiles,
          total: logFiles.length,
        });
      } catch {
        return NextResponse.json({
          success: true,
          message: 'No existe el directorio de logs',
          files: [],
        });
      }
    }

    // Si es una petición para buscar en logs
    if (body.action === 'search') {
      const { type = 'error', date, search, limit = 50 } = body;

      const filename = `${type}-${date || new Date().toISOString().split('T')[0]}.log`;
      const filepath = path.join(process.cwd(), LOG_DIR, filename);

      try {
        const content = await fs.readFile(filepath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());

        // Filtrar por búsqueda
        const matches = search
          ? lines.filter(line => line.toLowerCase().includes(search.toLowerCase()))
          : lines;

        return NextResponse.json({
          success: true,
          file: filename,
          search: search || null,
          totalMatches: matches.length,
          showing: Math.min(matches.length, limit),
          logs: matches.slice(-limit),
        });
      } catch {
        return NextResponse.json({
          success: true,
          message: `No se encontró el archivo ${filename}`,
          logs: [],
        });
      }
    }

    return NextResponse.json(
      { success: false, error: 'Acción no válida' },
      { status: 400 }
    );

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
