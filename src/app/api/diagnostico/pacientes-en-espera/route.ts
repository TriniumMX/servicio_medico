// src/app/api/diagnostico/pacientes-en-espera/route.ts

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { consulta, parentesco } from '@/db/schema';
import { eq, and, gte, lte, asc } from 'drizzle-orm';
import type { PacienteEnEspera } from '@/types/consultas';

/**
 * GET - Obtiene pacientes que ya pasaron a signos vitales y están listos para diagnóstico
 * estatus_consulta = 1 significa que ya tienen signos vitales tomados
 */
export async function GET() {
  try {
    // Obtener inicio y fin del día actual
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    // Ejecutar la consulta con Drizzle
    const pacientesRaw = await db
      .select({
        id_consulta: consulta.idConsulta,
        folio: consulta.folio,
        no_nomina: consulta.noNomina,
        id_beneficiario: consulta.idBeneficiario,
        nombre: consulta.nombre,
        edad: consulta.edad,
        sexo: consulta.sexo,
        departamento: consulta.departamento,
        sindicato: consulta.sindicato,
        es_empleado: consulta.esEmpleado,
        id_parentesco: consulta.idParentesco,
        parentesco_desc: parentesco.parentesco,

        // Signos vitales
        ta_sistolica: consulta.taSistolica,
        ta_diastolica: consulta.taDiastolica,
        temperatura: consulta.temperaturaC,
        frecuencia_cardiaca: consulta.frecuenciaCardiaca,
        oxigenacion: consulta.oxigenacion,
        altura: consulta.alturaCm,
        peso: consulta.pesoKg,
        glucosa: consulta.glucosaMgDl,

        fecha_consulta: consulta.fechaConsulta,
        estatus_consulta: consulta.estatusConsulta,
      })
      .from(consulta)
      .leftJoin(parentesco, eq(consulta.idParentesco, parentesco.idParentesco))
      .where(
        and(
          eq(consulta.estatusConsulta, 1),
          eq(consulta.estatusActivo, true),
          gte(consulta.fechaConsulta, startOfDay),
          lte(consulta.fechaConsulta, endOfDay)
        )
      )
      .orderBy(asc(consulta.fechaConsulta));

    // Formatear respuesta
    const pacientes: PacienteEnEspera[] = pacientesRaw.map((p) => ({
      id_consulta: Number(p.id_consulta),
      folio: p.folio,
      no_nomina: p.no_nomina,
      id_beneficiario: p.id_beneficiario ? Number(p.id_beneficiario) : undefined,
      nombre: p.nombre,
      edad: p.edad || undefined,
      sexo: p.sexo || undefined,
      departamento: p.departamento || undefined,
      sindicato: p.sindicato || undefined,
      es_empleado: p.es_empleado,
      id_parentesco: Number(p.id_parentesco),
      parentesco_desc: p.es_empleado ? 'EMPLEADO' : (p.parentesco_desc || 'BENEFICIARIO'),

      // Signos vitales formateados
      presion_arterial: p.ta_sistolica && p.ta_diastolica
        ? `${p.ta_sistolica}/${p.ta_diastolica}`
        : 'N/A',
      temperatura: p.temperatura ? parseFloat(p.temperatura) : 0,
      frecuencia_cardiaca: p.frecuencia_cardiaca || 0,
      oxigenacion: p.oxigenacion || undefined,
      altura: p.altura ? parseFloat(p.altura) : undefined,
      peso: p.peso ? parseFloat(p.peso) : undefined,
      glucosa: p.glucosa || undefined,

      fecha_consulta: p.fecha_consulta?.toISOString() || new Date().toISOString(),
      estatus_consulta: p.estatus_consulta,

      // Alias para compatibilidad
      id_signo_vital: Number(p.id_consulta),
      clavenomina: p.no_nomina,
      nombrepaciente: p.nombre,
      elpacienteesempleado: p.es_empleado,
      fecha_registro: p.fecha_consulta?.toISOString() || new Date().toISOString(),
      clavestatus: p.estatus_consulta,
    }));

    return NextResponse.json({
      success: true,
      pacientes,
      total: pacientes.length,
    });

  } catch (error: any) {
    console.error('❌ Error al obtener pacientes en espera:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener pacientes en espera para diagnóstico' },
      { status: 500 }
    );
  }
}
