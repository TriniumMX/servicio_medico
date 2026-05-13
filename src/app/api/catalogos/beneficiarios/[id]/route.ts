// src/app/api/catalogos/beneficiarios/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/dbPostgres';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
        b.id_beneficiario = $1
    `;
    const result = await executeQuery(query, [id]);

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Beneficiario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error: any) {
    console.error('❌ Error al obtener el beneficiario:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Actualizar datos básicos
    await executeQuery(`
      UPDATE beneficiarios SET
        parentesco = $1,
        nombre = $2,
        a_paterno = $3,
        a_materno = $4,
        sexo = $5,
        f_nacimiento = $6,
        curp = $7,
        sangre = $8,
        alergias = $9,
        tel_emergencia = $10,
        nombre_emergencia = $11,
        telefono = $12,
        correo = $13,
        esdiscapacitado = $14,
        esestudiante = $15,
        vigencia_estudios = $16
      WHERE id_beneficiario = $17
    `, [
      data.PARENTESCO, data.NOMBRE, data.A_PATERNO, data.A_MATERNO,
      data.SEXO, data.F_NACIMIENTO, data.CURP, data.SANGRE, data.ALERGIAS,
      data.TEL_EMERGENCIA, data.NOMBRE_EMERGENCIA, data.TELEFONO, data.CORREO,
      data.ESDISCAPACITADO, data.ESESTUDIANTE, data.VIGENCIA_ESTUDIOS, parseInt(id)
    ]);

    // Construir nombre de carpeta
    const nombreCarpeta = `${data.NOMBRE}_${data.A_PATERNO}_${data.A_MATERNO}`.toUpperCase().replace(/\s+/g, '_');
    
    // Procesar archivos (solo si se suben nuevos)
    const archivos: any = {};

    // Guardar foto
    const foto = formData.get('foto') as File;
    if (foto && foto.size > 0) {
      const fotoDir = path.join(process.cwd(), 'public', 'Beneficiarios', 'Fotos', data.NO_NOMINA, data.PARENTESCO_NOMBRE, nombreCarpeta);
      await mkdir(fotoDir, { recursive: true });

      const fotoExt = foto.name.split('.').pop();
      const fotoNombre = `foto_${Date.now()}.${fotoExt}`;
      const fotoPath = path.join(fotoDir, fotoNombre);

      const bytes = await foto.arrayBuffer();
      await writeFile(fotoPath, Buffer.from(bytes));

      archivos.FOTO_URL = `/Beneficiarios/Fotos/${data.NO_NOMINA}/${data.PARENTESCO_NOMBRE}/${nombreCarpeta}/${fotoNombre}`;
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
        const docDir = path.join(process.cwd(), 'public', 'Beneficiarios', 'Documentos', doc.carpeta, data.NO_NOMINA, data.PARENTESCO_NOMBRE, nombreCarpeta);
        await mkdir(docDir, { recursive: true });

        const ext = archivo.name.split('.').pop();
        const nombre = `${doc.key}_${Date.now()}.${ext}`;
        const filePath = path.join(docDir, nombre);

        const bytes = await archivo.arrayBuffer();
        await writeFile(filePath, Buffer.from(bytes));

        archivos[doc.campo] = `/Beneficiarios/Documentos/${doc.carpeta}/${data.NO_NOMINA}/${data.PARENTESCO_NOMBRE}/${nombreCarpeta}/${nombre}`;
      }
    }

    // Actualizar URLs solo si hay archivos nuevos
    if (Object.keys(archivos).length > 0) {
      const keys = Object.keys(archivos);
      const setClause = keys.map((key, idx) => `${key.toLowerCase()} = $${idx + 1}`).join(', ');
      const values = Object.values(archivos);

      await executeQuery(
        `UPDATE beneficiarios SET ${setClause} WHERE id_beneficiario = $${keys.length + 1}`,
        [...values, parseInt(id)]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Beneficiario actualizado exitosamente',
    });

  } catch (error: any) {
    console.error('❌ Error al actualizar beneficiario:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar beneficiario' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { motivo } = await request.json();

    if (!motivo) {
      return NextResponse.json(
        { success: false, error: 'El motivo es requerido' },
        { status: 400 }
      );
    }

    await executeQuery(`
      UPDATE beneficiarios
      SET activo = 'I', motivo = $1
      WHERE id_beneficiario = $2
    `, [motivo, parseInt(id)]);

    return NextResponse.json({
      success: true,
      message: 'Beneficiario marcado como inactivo',
    });

  } catch (error: any) {
    console.error('❌ Error al eliminar beneficiario:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar beneficiario' },
      { status: 500 }
    );
  }
}