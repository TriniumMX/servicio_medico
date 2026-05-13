// src/app/api/catalogos/beneficiarios/get/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/dbPostgres';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const num_nom = searchParams.get('num_nom');

    if (!num_nom) {
      return NextResponse.json(
        { success: false, error: 'El número de nómina es requerido' },
        { status: 400 }
      );
    }

    const query = `
      SELECT
        b.id_beneficiario AS "ID_BENEFICIARIO",
        b.no_nomina AS "NO_NOMINA",
        b.parentesco AS "PARENTESCO",
        b.nombre AS "NOMBRE",
        b.a_paterno AS "A_PATERNO",
        b.a_materno AS "A_MATERNO",
        b.sexo AS "SEXO",
        b.escolaridad AS "ESCOLARIDAD",
        b.f_nacimiento AS "F_NACIMIENTO",
        b.activo AS "ACTIVO",
        b.alergias AS "ALERGIAS",
        b.sangre AS "SANGRE",
        b.tel_emergencia AS "TEL_EMERGENCIA",
        b.nombre_emergencia AS "NOMBRE_EMERGENCIA",
        b.telefono AS "TELEFONO",
        b.correo AS "CORREO",
        b.esdiscapacitado AS "ESDISCAPACITADO",
        b.esestudiante AS "ESESTUDIANTE",
        b.vigencia_estudios AS "VIGENCIA_ESTUDIOS",
        b.foto_url AS "FOTO_URL",
        b.curp AS "CURP",
        b.url_constancia AS "URL_CONSTANCIA",
        b.url_curp AS "URL_CURP",
        b.url_acta_nac AS "URL_ACTA_NAC",
        b.url_ine AS "URL_INE",
        b.url_concubinato AS "URL_CONCUBINATO",
        b.url_actamatrimonio AS "URL_ACTAMATRIMONIO",
        b.url_noisste AS "URL_NOISSTE",
        b.url_incap AS "URL_INCAP",
        b.url_actadependenciaeconomica AS "URL_ACTADEPENDENCIAECONOMICA",
        b.descriptor_facial AS "DESCRIPTOR_FACIAL",
        b.firma AS "FIRMA",
        b.motivo AS "MOTIVO",
        p.parentesco AS "PARENTESCO_NOMBRE"
      FROM
        beneficiarios b
      LEFT JOIN
        parentesco p ON b.parentesco = p.id_parentesco
      WHERE
        b.no_nomina = $1 AND b.activo = 'A'
      ORDER BY
        b.id_beneficiario
    `;

    const result = await executeQuery(query, [num_nom]);

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error: any) {
    console.error('❌ Error al obtener beneficiarios:', error);
    return NextResponse.json(
      { success: false, error: 'Error al consultar beneficiarios' },
      { status: 500 }
    );
  }
}