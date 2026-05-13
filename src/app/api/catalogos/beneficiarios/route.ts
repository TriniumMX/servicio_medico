// src/app/api/catalogos/beneficiarios/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/dbPostgres';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

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

    const result = await executeQuery(`
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
        p.parentesco AS "PARENTESCO_NOMBRE"
      FROM beneficiarios b
      LEFT JOIN parentesco p ON b.parentesco = p.id_parentesco
      WHERE b.no_nomina = $1 AND b.activo = 'A'
      ORDER BY b.id_beneficiario
    `, [num_nom]);

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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extraer datos
    const data = {
      NO_NOMINA: formData.get('NO_NOMINA') as string,
      PARENTESCO: parseInt(formData.get('PARENTESCO') as string),
      NOMBRE: formData.get('NOMBRE') as string,
      A_PATERNO: formData.get('A_PATERNO') as string,
      A_MATERNO: formData.get('A_MATERNO') as string,
      SEXO: formData.get('SEXO') as string,
      F_NACIMIENTO: formData.get('F_NACIMIENTO') as string,
      CURP: formData.get('CURP') as string,
      SANGRE: formData.get('SANGRE') as string,
      ALERGIAS: formData.get('ALERGIAS') as string || null,
      TEL_EMERGENCIA: formData.get('TEL_EMERGENCIA') as string || null,
      NOMBRE_EMERGENCIA: formData.get('NOMBRE_EMERGENCIA') as string || null,
      TELEFONO: formData.get('TELEFONO') as string || null,
      CORREO: formData.get('CORREO') as string || null,
      ESDISCAPACITADO: formData.get('ESDISCAPACITADO') === 'true',
      ESESTUDIANTE: formData.get('ESESTUDIANTE') === 'true',
      VIGENCIA_ESTUDIOS: formData.get('VIGENCIA_ESTUDIOS') as string || null,
      PARENTESCO_NOMBRE: formData.get('PARENTESCO_NOMBRE') as string,
    };

    // Validaciones
    if (!data.NOMBRE || !data.A_PATERNO || !data.A_MATERNO) {
      return NextResponse.json(
        { success: false, error: 'Nombre completo es requerido' },
        { status: 400 }
      );
    }

    if (!data.CURP || data.CURP.length !== 18) {
      return NextResponse.json(
        { success: false, error: 'CURP debe tener 18 caracteres' },
        { status: 400 }
      );
    }

    if (data.TEL_EMERGENCIA && data.TEL_EMERGENCIA.length > 10) {
      return NextResponse.json(
        { success: false, error: 'Teléfono no puede exceder 10 dígitos' },
        { status: 400 }
      );
    }

    // Construir nombre de carpeta (sanitizar caracteres especiales)
    const sanitizarNombre = (str: string) => str.replace(/[()]/g, '').replace(/\s+/g, '_');
    const nombreCarpeta = `${data.NOMBRE}_${data.A_PATERNO}_${data.A_MATERNO}`.toUpperCase().replace(/\s+/g, '_');
    const parentescoSanitizado = sanitizarNombre(data.PARENTESCO_NOMBRE);

    // Procesar archivos
    const archivos: any = {};

    // Guardar foto
    const foto = formData.get('foto') as File;
    if (foto && foto.size > 0) {
      const fotoDir = path.join(process.cwd(), 'public', 'Beneficiarios', 'Fotos', data.NO_NOMINA, parentescoSanitizado, nombreCarpeta);
      await mkdir(fotoDir, { recursive: true });

      const fotoExt = foto.name.split('.').pop();
      const fotoNombre = `foto_${Date.now()}.${fotoExt}`;
      const fotoPath = path.join(fotoDir, fotoNombre);

      const bytes = await foto.arrayBuffer();
      await writeFile(fotoPath, Buffer.from(bytes));

      archivos.FOTO_URL = `/Beneficiarios/Fotos/${data.NO_NOMINA}/${parentescoSanitizado}/${nombreCarpeta}/${fotoNombre}`;
    }

    // Guardar documentos
    const documentos = [
      { key: 'curp', campo: 'URL_CURP', carpeta: 'Curps' },
      { key: 'acta_nac', campo: 'URL_ACTA_NAC', carpeta: 'ActasNacimiento' },
      { key: 'ine', campo: 'URL_INE', carpeta: 'INEs' },
      { key: 'constancia', campo: 'URL_CONSTANCIA', carpeta: 'Constancias' },
      { key: 'concubinato', campo: 'URL_CONCUBINATO', carpeta: 'Concubinatos' },
      { key: 'acta_matrimonio', campo: 'URL_ACTAMATRIMONIO', carpeta: 'ActasMatrimonio' },
      { key: 'no_isste', campo: 'URL_NOISSTE', carpeta: 'NoISSTEs' },
      { key: 'incapacidad', campo: 'URL_INCAP', carpeta: 'Incapacidades' },
      { key: 'dep_economica', campo: 'URL_ACTADEPENDENCIAECONOMICA', carpeta: 'DependenciasEconomicas' },
    ];

    for (const doc of documentos) {
      const archivo = formData.get(doc.key) as File;
      if (archivo && archivo.size > 0) {
        const docDir = path.join(process.cwd(), 'public', 'Beneficiarios', 'Documentos', doc.carpeta, data.NO_NOMINA, parentescoSanitizado, nombreCarpeta);
        await mkdir(docDir, { recursive: true });

        const ext = archivo.name.split('.').pop();
        const nombre = `${doc.key}_${Date.now()}.${ext}`;
        const filePath = path.join(docDir, nombre);

        const bytes = await archivo.arrayBuffer();
        await writeFile(filePath, Buffer.from(bytes));

        archivos[doc.campo] = `/Beneficiarios/Documentos/${doc.carpeta}/${data.NO_NOMINA}/${parentescoSanitizado}/${nombreCarpeta}/${nombre}`;
      }
    }

    // Insertar beneficiario
    await executeQuery(`
      INSERT INTO beneficiarios (
        no_nomina, parentesco, nombre, a_paterno, a_materno,
        sexo, f_nacimiento, curp, sangre, alergias,
        tel_emergencia, nombre_emergencia, telefono, correo,
        esdiscapacitado, esestudiante, vigencia_estudios, activo,
        foto_url, url_curp, url_acta_nac, url_ine,
        url_constancia, url_concubinato, url_actamatrimonio,
        url_noisste, url_incap, url_actadependenciaeconomica
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14,
        $15, $16, $17, 'A',
        $18, $19, $20, $21,
        $22, $23, $24,
        $25, $26, $27
      )
    `, [
      data.NO_NOMINA, data.PARENTESCO, data.NOMBRE, data.A_PATERNO, data.A_MATERNO,
      data.SEXO, data.F_NACIMIENTO, data.CURP, data.SANGRE, data.ALERGIAS,
      data.TEL_EMERGENCIA, data.NOMBRE_EMERGENCIA, data.TELEFONO, data.CORREO,
      data.ESDISCAPACITADO, data.ESESTUDIANTE, data.VIGENCIA_ESTUDIOS,
      archivos.FOTO_URL || null, archivos.URL_CURP || null, archivos.URL_ACTA_NAC || null, archivos.URL_INE || null,
      archivos.URL_CONSTANCIA || null, archivos.URL_CONCUBINATO || null, archivos.URL_ACTAMATRIMONIO || null,
      archivos.URL_NOISSTE || null, archivos.URL_INCAP || null, archivos.URL_ACTADEPENDENCIAECONOMICA || null
    ]);

    return NextResponse.json({
      success: true,
      message: 'Beneficiario registrado exitosamente',
    });

  } catch (error: any) {
    console.error('❌ Error al registrar beneficiario:', error);
    return NextResponse.json(
      { success: false, error: 'Error al registrar beneficiario' },
      { status: 500 }
    );
  }
}