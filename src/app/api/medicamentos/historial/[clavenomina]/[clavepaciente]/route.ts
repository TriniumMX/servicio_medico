// src/app/api/medicamentos/historial/[clavenomina]/[clavepaciente]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDatabasePool } from '@/lib/dbConection';

/**
 * Formatea la fecha con día de la semana
 */
function formatearFecha(fecha: Date): string {
  const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const diaSemana = diasSemana[fecha.getDay()];
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const año = fecha.getFullYear();
  const horas = fecha.getHours();
  const minutos = String(fecha.getMinutes()).padStart(2, '0');
  const periodo = horas >= 12 ? 'p.m.' : 'a.m.';
  const horas12 = horas % 12 === 0 ? 12 : horas % 12;

  return `${diaSemana}, ${dia}/${mes}/${año}, ${horas12}:${minutos} ${periodo}`;
}

/**
 * GET - Obtiene el historial de medicamentos del paciente (último mes)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clavenomina: string; clavepaciente: string }> }
) {
  try {
    const { clavenomina, clavepaciente } = await params;

    if (!clavenomina || !clavepaciente) {
      return NextResponse.json(
        { success: false, error: 'Faltan parámetros: clavenomina y/o clavepaciente' },
        { status: 400 }
      );
    }

    const pool = await getDatabasePool();

    // Obtener registros del último mes
    const result = await pool.request()
      .input('clavenomina', clavenomina)
      .input('clavepaciente', clavepaciente)
      .query(`
        SELECT
          s.FECHA_EMISION,
          s.CLAVEMEDICO,
          p.nombreproveedor,
          d.indicaciones,
          d.cantidad,
          d.piezas,
          m.medicamento
        FROM SURTIMIENTOS s
        JOIN detalleSurtimientos d ON s.FOLIO_SURTIMIENTO = d.folioSurtimiento
        JOIN MEDICAMENTOS m ON d.claveMedicamento = m.clavemedicamento
        JOIN PROVEEDORES p ON s.CLAVEMEDICO = p.claveproveedor
        WHERE s.NOMINA = @clavenomina
          AND s.CLAVE_PACIENTE = @clavepaciente
          AND d.estatus = 2
          AND s.FECHA_EMISION >= DATEADD(MONTH, -1, GETDATE())
        ORDER BY s.FECHA_EMISION DESC
      `);

    const historial = result.recordset.map((item: any) => ({
      medicamento: item.medicamento,
      indicaciones: item.indicaciones,
      tratamiento: item.cantidad,
      piezas: item.piezas,
      nombreproveedor: item.nombreproveedor,
      fechaemision: formatearFecha(new Date(item.FECHA_EMISION)),
    }));

    return NextResponse.json({
      success: true,
      historial,
      total: historial.length,
    });

  } catch (error: any) {
    console.error('❌ Error al obtener historial de medicamentos:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener historial de medicamentos' },
      { status: 500 }
    );
  }
}
