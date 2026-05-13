// src/app/api/consultas/hoy/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { consulta, parentesco } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estatusConsultaParam = searchParams.get('clavestatus') || searchParams.get('estatus');

    // Validar que estatus sea proporcionado
    if (!estatusConsultaParam) {
      return NextResponse.json(
        { success: false, error: "Se requiere el parámetro 'clavestatus' o 'estatus'" },
        { status: 400 }
      );
    }

    const estatusConsulta = parseInt(estatusConsultaParam);

    // Validar que solo acepte estatus 0, 1 o 2
    if (![0, 1, 2].includes(estatusConsulta)) {
      return NextResponse.json(
        { success: false, error: "El valor de 'estatus' debe ser 0, 1 o 2" },
        { status: 400 }
      );
    }

    // Obtener inicio y fin del día actual
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    // Consultar con Drizzle usando JOIN con parentesco
    const consultas = await db
      .select({
        id_consulta: consulta.idConsulta,
        folio: consulta.folio,
        no_nomina: consulta.noNomina,
        nombre: consulta.nombre,
        edad: consulta.edad,
        sexo: consulta.sexo,
        es_empleado: consulta.esEmpleado,
        id_beneficiario: consulta.idBeneficiario,
        departamento: consulta.departamento,
        sindicato: consulta.sindicato,
        fecha_consulta: consulta.fechaConsulta,
        estatus_consulta: consulta.estatusConsulta,

        // Signos vitales
        temperatura_c: consulta.temperaturaC,
        ta_sistolica: consulta.taSistolica,
        ta_diastolica: consulta.taDiastolica,
        frecuencia_cardiaca: consulta.frecuenciaCardiaca,
        oxigenacion: consulta.oxigenacion,
        altura_cm: consulta.alturaCm,
        peso_kg: consulta.pesoKg,
        glucosa_mg_dl: consulta.glucosaMgDl,

        // Parentesco
        parentesco_desc: parentesco.parentesco,
        id_parentesco: consulta.idParentesco,
      })
      .from(consulta)
      .leftJoin(parentesco, eq(consulta.idParentesco, parentesco.idParentesco))
      .where(
        and(
          eq(consulta.estatusConsulta, estatusConsulta),
          eq(consulta.estatusActivo, true),
          gte(consulta.fechaConsulta, startOfDay),
          lte(consulta.fechaConsulta, endOfDay)
        )
      )
      .orderBy(desc(consulta.idConsulta))
      .limit(100);

    // Formatear respuesta (convertir BigInt a number)
    const consultasFormateadas = consultas.map((c) => ({
      // Nuevos campos
      id_consulta: Number(c.id_consulta),
      folio: c.folio,
      no_nomina: c.no_nomina,
      nombre: c.nombre,
      edad: c.edad,
      sexo: c.sexo,
      es_empleado: c.es_empleado,
      id_beneficiario: Number(c.id_beneficiario),
      departamento: c.departamento,
      sindicato: c.sindicato,
      fecha_consulta: c.fecha_consulta,
      estatus_consulta: c.estatus_consulta,

      // Signos vitales formateados
      presion_arterial: c.ta_sistolica && c.ta_diastolica
        ? `${c.ta_sistolica}/${c.ta_diastolica}`
        : null,
      temperatura: c.temperatura_c ? parseFloat(c.temperatura_c) : null,
      frecuencia_cardiaca: c.frecuencia_cardiaca,
      oxigenacion: c.oxigenacion,
      altura: c.altura_cm ? parseFloat(c.altura_cm) : null,
      peso: c.peso_kg ? parseFloat(c.peso_kg) : null,
      glucosa: c.glucosa_mg_dl,

      // Parentesco
      parentesco_desc: c.es_empleado ? 'EMPLEADO' : (c.parentesco_desc || 'BENEFICIARIO'),
      id_parentesco: Number(c.id_parentesco),

      // Aliases para compatibilidad con código legacy
      id_signo_vital: Number(c.id_consulta),
      clavenomina: c.no_nomina,
      nombrepaciente: c.nombre,
      clavepaciente: Number(c.id_beneficiario),
      elpacienteesempleado: c.es_empleado,
      fecha_registro: c.fecha_consulta,
      clavestatus: c.estatus_consulta,
    }));

    return NextResponse.json({
      success: true,
      consultas: consultasFormateadas,
    });

  } catch (error: any) {
    console.error('❌ Error al obtener consultas del día:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener consultas del día',
        details: error.message
      },
      { status: 500 }
    );
  }
}
