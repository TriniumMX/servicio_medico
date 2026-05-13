// src/app/api/alertas-fondos/verificar/route.ts

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { inventarioMedicamentos, medicamentos, unidadesMedida } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { MedicamentoAlerta, ResumenAlertas } from '@/types/alertas-fondos';
import { calcularEstadoAlerta, calcularPorcentaje, calcularFaltante, UMBRALES_ALERTA } from '@/types/alertas-fondos';

// GET: Verificar niveles de inventario y obtener alertas
export async function GET() {
  try {
    // Obtener inventario completo con datos de medicamentos
    const inventario = await db
      .select({
        id_inventario: inventarioMedicamentos.id_inventario,
        id_medicamento: inventarioMedicamentos.id_medicamento,
        existencia_actual: inventarioMedicamentos.existencia_actual,
        fondo_fijo: inventarioMedicamentos.fondo_fijo,
        nombre_comercial: medicamentos.nombre_comercial,
        sustancia_activa: medicamentos.sustancia_activa,
        clasificacion: medicamentos.clasificacion,
        medida: unidadesMedida.medida,
      })
      .from(inventarioMedicamentos)
      .innerJoin(medicamentos, eq(inventarioMedicamentos.id_medicamento, medicamentos.id_medicamento))
      .leftJoin(unidadesMedida, eq(medicamentos.id_medida, unidadesMedida.id_medida))
      .where(eq(medicamentos.activo, true));

    // Procesar y clasificar medicamentos
    const medicamentosConAlerta: MedicamentoAlerta[] = [];
    let criticos = 0;
    let bajos = 0;
    let medios = 0;
    let normales = 0;

    for (const item of inventario) {
      const estado = calcularEstadoAlerta(item.existencia_actual, item.fondo_fijo);
      const porcentaje = calcularPorcentaje(item.existencia_actual, item.fondo_fijo);
      const faltante = calcularFaltante(item.existencia_actual, item.fondo_fijo);

      // Contar por estado
      switch (estado) {
        case 'CRITICO':
          criticos++;
          break;
        case 'BAJO':
          bajos++;
          break;
        case 'MEDIO':
          medios++;
          break;
        case 'NORMAL':
          normales++;
          break;
      }

      // Solo agregar a la lista si tiene alerta (no es NORMAL)
      if (estado !== 'NORMAL') {
        medicamentosConAlerta.push({
          id_inventario: item.id_inventario,
          id_medicamento: item.id_medicamento,
          nombre_comercial: item.nombre_comercial,
          sustancia_activa: item.sustancia_activa,
          existencia_actual: item.existencia_actual,
          fondo_fijo: item.fondo_fijo,
          faltante,
          porcentaje,
          estado,
          clasificacion: item.clasificacion,
          medida: item.medida || undefined,
        });
      }
    }

    // Ordenar por prioridad (criticos primero, luego por porcentaje ascendente)
    medicamentosConAlerta.sort((a, b) => {
      const prioridad = { CRITICO: 1, BAJO: 2, MEDIO: 3 };
      const prioA = prioridad[a.estado as keyof typeof prioridad];
      const prioB = prioridad[b.estado as keyof typeof prioridad];

      if (prioA !== prioB) return prioA - prioB;
      return a.porcentaje - b.porcentaje;
    });

    const resumen: ResumenAlertas = {
      total_medicamentos: inventario.length,
      total_alertas: medicamentosConAlerta.length,
      criticos,
      bajos,
      medios,
      normales,
    };

    return NextResponse.json({
      success: true,
      hayAlertas: medicamentosConAlerta.length > 0,
      resumen,
      medicamentos: medicamentosConAlerta,
    });
  } catch (error: any) {
    console.error('Error al verificar niveles de inventario:', error);
    return NextResponse.json(
      { success: false, error: 'Error al verificar niveles de inventario' },
      { status: 500 }
    );
  }
}
