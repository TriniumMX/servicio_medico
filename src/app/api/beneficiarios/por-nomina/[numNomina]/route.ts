// src/app/api/beneficiarios/por-nomina/[numNomina]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/dbPostgres';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ numNomina: string }> }
) {
  try {
    const { numNomina } = await params;

    if (!numNomina) {
      return NextResponse.json(
        { success: false, error: 'Número de nómina es requerido' },
        { status: 400 }
      );
    }

    // Consultar beneficiarios en PostgreSQL
    const beneficiarios = await executeQuery<{
      ID_BENEFICIARIO: number;
      NO_NOMINA: string;
      PARENTESCO: number;
      PARENTESCO_DESC: string;
      NOMBRE: string;
      A_PATERNO: string;
      A_MATERNO: string;
      SEXO: string;
      ESCOLARIDAD: string;
      F_NACIMIENTO: string;
      ACTIVO: string;
      ALERGIAS: string;
      SANGRE: string;
      TEL_EMERGENCIA: string;
      NOMBRE_EMERGENCIA: string;
      ESDISCAPACITADO: string;
      ESESTUDIANTE: string;
      VIGENCIA_ESTUDIOS: string;
      FOTO_URL: string;
      CURP: string;
      URL_CONSTANCIA: string;
      URL_CURP: string;
      URL_ACTA_NAC: string;
      URL_INE: string;
      URL_CONCUBINATO: string;
      URL_ACTAMATRIMONIO: string;
      URL_NOISSTE: string;
      URL_INCAP: string;
      DESCRIPTOR_FACIAL: string;
      FIRMA: string;
      MOTIVO: string;
      URL_ACTADEPENDENCIAECONOMICA: string;
    }>(`
      SELECT
        b.id_beneficiario AS "ID_BENEFICIARIO",
        b.no_nomina AS "NO_NOMINA",
        b.parentesco AS "PARENTESCO",
        p.parentesco AS "PARENTESCO_DESC",
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
        b.descriptor_facial AS "DESCRIPTOR_FACIAL",
        b.firma AS "FIRMA",
        b.motivo AS "MOTIVO",
        b.url_actadependenciaeconomica AS "URL_ACTADEPENDENCIAECONOMICA"
      FROM beneficiarios b
      LEFT JOIN parentesco p ON b.parentesco = p.id_parentesco
      WHERE b.no_nomina = $1
        AND b.activo = 'A'
      ORDER BY b.nombre, b.a_paterno, b.a_materno
    `, [numNomina]);

    return NextResponse.json({
      success: true,
      beneficiarios,
    });

  } catch (error: any) {
    console.error('❌ Error al obtener beneficiarios:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener beneficiarios' },
      { status: 500 }
    );
  }
}
