// src/app/api/consultas/atendidas/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { consulta, recetas, diagnosticosConsulta, ESTATUS_CONSULTA } from '@/db/schema';
import { eq, desc, and, gte, sql } from 'drizzle-orm';

/**
 * GET - Obtiene las consultas finalizadas del día actual o últimos días
 * Query params:
 *   - dias?: number (default 1) - Cuántos días hacia atrás buscar
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dias = parseInt(searchParams.get('dias') || '1');

    // Calcular fecha límite (hoy - N días)
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - dias);
    fechaLimite.setHours(0, 0, 0, 0);

    console.log(`📋 [Consultas Atendidas] Buscando consultas de los últimos ${dias} día(s)...`);

    // Obtener consultas finalizadas con recetas ORIGINALES solamente
    // (LEFT JOIN para incluir consultas sin receta)
    // IMPORTANTE: Solo traemos recetas con tipo_receta = 'original' para evitar duplicados
    // Una consulta puede tener múltiples recetas (original + resurtimientos)
    const consultasAtendidas = await db
      .select({
        // Datos de la consulta
        id_consulta: consulta.idConsulta,
        folio: consulta.folio,
        nombre: consulta.nombre,
        edad: consulta.edad,
        no_nomina: consulta.noNomina,
        departamento: consulta.departamento,
        es_empleado: consulta.esEmpleado,
        fecha_atencion: consulta.actualizadoEn,

        // Diagnóstico principal (desde tabla diagnosticos_consulta)
        cie11_codigo: diagnosticosConsulta.cie11Codigo,
        cie11_titulo: diagnosticosConsulta.cie11Titulo,

        // Datos de la receta (puede ser null)
        id_receta: recetas.id_receta,
        folio_receta: recetas.folio_receta,
        tiene_receta: recetas.id_receta,
      })
      .from(consulta)
      .leftJoin(
        diagnosticosConsulta,
        and(
          eq(consulta.idConsulta, diagnosticosConsulta.idConsulta),
          eq(diagnosticosConsulta.esPrincipal, true) // Solo diagnóstico principal
        )
      )
      .leftJoin(
        recetas,
        and(
          eq(consulta.idConsulta, recetas.id_consulta),
          eq(recetas.tipo_receta, 'original') // Solo recetas originales
        )
      )
      .where(
        and(
          eq(consulta.estatusConsulta, ESTATUS_CONSULTA.FINALIZADA),
          gte(consulta.actualizadoEn, fechaLimite)
        )
      )
      .orderBy(desc(consulta.actualizadoEn));

    console.log(`✅ [Consultas Atendidas] Se encontraron ${consultasAtendidas.length} consulta(s) finalizada(s)`);

    return NextResponse.json({
      success: true,
      consultas: consultasAtendidas,
      total: consultasAtendidas.length,
      dias_consultados: dias,
    });

  } catch (error: any) {
    console.error('❌ [Consultas Atendidas] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener consultas atendidas',
        details: error.message
      },
      { status: 500 }
    );
  }
}
