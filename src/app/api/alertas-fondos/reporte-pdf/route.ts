// src/app/api/alertas-fondos/reporte-pdf/route.ts

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { inventarioMedicamentos, medicamentos, unidadesMedida } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { MedicamentoAlerta, ResumenAlertas } from '@/types/alertas-fondos';
import { calcularEstadoAlerta, calcularPorcentaje, calcularFaltante } from '@/types/alertas-fondos';
import { generarReporteFondosPDF } from '@/lib/generar-reporte-fondos-pdf';

// GET: Generar y descargar PDF de alertas
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

    // Ordenar por prioridad
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

    // Generar PDF
    const pdfBytes = await generarReporteFondosPDF(medicamentosConAlerta, resumen);

    // Nombre del archivo con fecha
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `reporte-alertas-inventario-${fecha}.pdf`;

    // Retornar PDF
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
        'Content-Length': pdfBytes.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('Error al generar reporte PDF:', error);
    return NextResponse.json(
      { success: false, error: 'Error al generar reporte PDF' },
      { status: 500 }
    );
  }
}
