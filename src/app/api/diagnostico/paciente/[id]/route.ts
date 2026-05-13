// src/app/api/diagnostico/paciente/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { consulta } from '@/db/schema';
import { parentesco } from '@/db/schema/parentesco';
import { eq } from 'drizzle-orm';
import type { PacienteEnEspera } from '@/types/consultas';

/**
 * GET - Obtiene los datos completos de un paciente por su id_consulta
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Ejecutar consulta en PostgreSQL usando Drizzle ORM
    const resultado = await db
      .select({
        id_consulta: consulta.idConsulta,
        folio: consulta.folio,
        no_nomina: consulta.noNomina,
        id_referencia_origen: consulta.idReferenciaOrigen, // <--- Seleccionar nuevo campo
        id_beneficiario: consulta.idBeneficiario,
        nombre: consulta.nombre,
        edad: consulta.edad,
        sexo: consulta.sexo,
        departamento: consulta.departamento,
        sindicato: consulta.sindicato,
        es_empleado: consulta.esEmpleado,
        id_parentesco: consulta.idParentesco,
        parentesco_desc: parentesco.parentesco,
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
      .where(eq(consulta.idConsulta, id))
      .limit(1);

    if (!resultado || resultado.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Paciente no encontrado' },
        { status: 404 }
      );
    }

    const datos = resultado[0];

    // Formatear presión arterial como string "120/80"
    const presionArterial = datos.ta_sistolica && datos.ta_diastolica
      ? `${datos.ta_sistolica}/${datos.ta_diastolica}`
      : 'N/A';

    // Construir respuesta compatible con PacienteEnEspera
    const paciente: PacienteEnEspera = {
      id_consulta: Number(datos.id_consulta),
      folio: datos.folio,
      no_nomina: datos.no_nomina,
      id_referencia_origen: datos.id_referencia_origen ? Number(datos.id_referencia_origen) : null, // <--- Mapear campo
      id_beneficiario: datos.id_beneficiario ? Number(datos.id_beneficiario) : undefined,
      nombre: datos.nombre,
      edad: datos.edad ?? undefined,
      sexo: datos.sexo ?? undefined,
      departamento: datos.departamento ?? undefined,
      sindicato: datos.sindicato ?? undefined,
      es_empleado: datos.es_empleado,
      id_parentesco: Number(datos.id_parentesco),
      parentesco_desc: datos.parentesco_desc ?? 'EMPLEADO',
      presion_arterial: presionArterial,
      temperatura: datos.temperatura ? Number(datos.temperatura) : 0,
      frecuencia_cardiaca: datos.frecuencia_cardiaca ?? 0,
      oxigenacion: datos.oxigenacion ?? undefined,
      altura: datos.altura ? Number(datos.altura) : undefined,
      peso: datos.peso ? Number(datos.peso) : undefined,
      glucosa: datos.glucosa ?? undefined,
      fecha_consulta: datos.fecha_consulta?.toISOString() ?? new Date().toISOString(),
      estatus_consulta: datos.estatus_consulta ?? 1,

      // Alias para compatibilidad con código legacy
      id_signo_vital: Number(datos.id_consulta),
      clavenomina: datos.no_nomina,
      nombrepaciente: datos.nombre,
      elpacienteesempleado: datos.es_empleado,
      fecha_registro: datos.fecha_consulta?.toISOString() ?? new Date().toISOString(),
      clavestatus: datos.estatus_consulta ?? 1,
    };

    return NextResponse.json({
      success: true,
      paciente,
    });

  } catch (error: any) {
    console.error('❌ Error al obtener datos del paciente:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener datos del paciente' },
      { status: 500 }
    );
  }
}
