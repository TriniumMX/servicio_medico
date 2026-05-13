// src/app/api/consultas/[id]/signos-vitales/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { consulta, parentesco } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idConsulta = parseInt(id);

    if (isNaN(idConsulta)) {
      return NextResponse.json(
        { success: false, error: 'ID de consulta inválido' },
        { status: 400 }
      );
    }

    // Obtener consulta por ID con Drizzle
    const consultaResult = await db
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
        estatus_consulta: consulta.estatusConsulta,
        es_empleado: consulta.esEmpleado,

        // Signos vitales
        temperatura_c: consulta.temperaturaC,
        ta_sistolica: consulta.taSistolica,
        ta_diastolica: consulta.taDiastolica,
        frecuencia_cardiaca: consulta.frecuenciaCardiaca,
        oxigenacion: consulta.oxigenacion,
        altura_cm: consulta.alturaCm,
        peso_kg: consulta.pesoKg,
        glucosa_mg_dl: consulta.glucosaMgDl,

        fecha_consulta: consulta.fechaConsulta,
        id_usuario_crea: consulta.idUsuarioCrea,

        // Parentesco
        parentesco_desc: parentesco.parentesco,
        id_parentesco: consulta.idParentesco,
      })
      .from(consulta)
      .leftJoin(parentesco, eq(consulta.idParentesco, parentesco.idParentesco))
      .where(
        and(
          eq(consulta.idConsulta, idConsulta),
          eq(consulta.estatusActivo, true)
        )
      )
      .limit(1);

    if (consultaResult.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No se encontró la consulta',
      }, { status: 404 });
    }

    const c = consultaResult[0];

    // Formatear respuesta
    const consultaFormateada = {
      id_consulta: Number(c.id_consulta),
      folio: c.folio,
      no_nomina: c.no_nomina,
      id_beneficiario: Number(c.id_beneficiario),
      nombre: c.nombre,
      edad: c.edad,
      sexo: c.sexo,
      departamento: c.departamento,
      sindicato: c.sindicato,
      estatus_consulta: c.estatus_consulta,
      es_empleado: c.es_empleado,

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

      fecha_registro: c.fecha_consulta,
      id_usuario_registro: c.id_usuario_crea ? Number(c.id_usuario_crea) : null,

      // Parentesco
      parentesco_desc: c.es_empleado ? 'EMPLEADO' : (c.parentesco_desc || 'BENEFICIARIO'),
      id_parentesco: Number(c.id_parentesco),
    };

    return NextResponse.json({
      success: true,
      data: consultaFormateada,
    });

  } catch (error: any) {
    console.error('❌ Error al obtener consulta:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener la consulta',
        details: error.message
      },
      { status: 500 }
    );
  }
}
