
import { NextResponse } from 'next/server';
import { executeQueryOne } from '@/lib/dbPostgres';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Consultas Hoy (Total de consultas generadas hoy, sin importar estatus)
    const consultasHoyStats = await executeQueryOne(`
      SELECT COUNT(*) as total
      FROM consulta
      WHERE estatus_activo = true 
      AND date_trunc('day', fecha_consulta) = CURRENT_DATE
    `);

    // 2. Citas Agendadas (Sumatoria de Consultas Agendadas + Referencias Asignadas HOY)

    // 2.1 Consultas de Agenda (General)
    const citasAgendaStats = await executeQueryOne(`
      SELECT COUNT(*) as total
      FROM consulta
      WHERE estatus_activo = true 
      AND fecha_cita IS NOT NULL
      AND estatus_consulta != 0
      AND date_trunc('day', fecha_cita) = CURRENT_DATE
    `);

    // 2.2 Referencias Asignadas (Especialista)
    const citasReferenciasStats = await executeQueryOne(`
      SELECT COUNT(*) as total
      FROM referencias_especialidad
      WHERE activo = true
      AND estatus IN ('asignada', 'autorizada', 'notificada')
      AND date_trunc('day', fecha_cita) = CURRENT_DATE
    `);

    const totalCitasAgendadas = parseInt(citasAgendaStats?.total || '0') + parseInt(citasReferenciasStats?.total || '0');

    // 3. Pacientes en Espera (Estatus 1)
    const enEsperaStats = await executeQueryOne(`
      SELECT COUNT(*) as total
      FROM consulta
      WHERE estatus_activo = true 
      AND estatus_consulta = 1
      AND date_trunc('day', fecha_consulta) = CURRENT_DATE
    `);

    // 4. Recetas Surtidas (Hoy) - Usando surtimientos_receta
    // Nota: Verificamos si la tabla permite consulta directa
    // Si falla, el bloque catch lo manejará
    const recetasStats = await executeQueryOne(`
      SELECT COUNT(*) as total
      FROM surtimientos_receta
      WHERE date_trunc('day', fecha_surtimiento) = CURRENT_DATE
    `);

    return NextResponse.json({
      consultasHoy: parseInt(consultasHoyStats?.total || '0'),
      citasAgendadas: totalCitasAgendadas,
      pacientesEnEspera: parseInt(enEsperaStats?.total || '0'),
      recetasSurtidas: parseInt(recetasStats?.total || '0')
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas del dashboard' },
      { status: 500 }
    );
  }
}
