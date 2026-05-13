// src/app/api/recetas/generar-pdf/[id_receta]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generarRecetasConSeparacionControlados } from '@/lib/generar-receta-pdf';
import { executeQuery, executeQueryOne } from '@/lib/dbPostgres';
import { generarTokenReceta, generarUrlPublica } from '@/lib/receta-token';

/**
 * GET /api/recetas/generar-pdf/[id_receta]
 *
 * Genera un PDF de receta a partir del ID de la receta
 * Funciona tanto para recetas ORIGINALES como para RESURTIMIENTOS
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id_receta: string }> }
) {
  try {
    const { id_receta: id_receta_str } = await context.params;
    const id_receta = parseInt(id_receta_str);

    if (isNaN(id_receta)) {
      return NextResponse.json(
        { success: false, error: 'ID de receta inválido' },
        { status: 400 }
      );
    }

    console.log(`📄 [Generar PDF] Generando PDF para receta: ${id_receta}`);

    // 1. Obtener receta
    const recetaData = await executeQueryOne<{
      id_receta: number;
      id_consulta: number;
      folio_receta: string;
      tipo_receta: string;
      fecha_emision: Date;
      id_receta_original: number | null;
    }>(`
      SELECT
        id_receta,
        id_consulta,
        folio_receta,
        tipo_receta,
        fecha_emision,
        id_receta_original
      FROM recetas
      WHERE id_receta = $1
    `, [id_receta]);

    if (!recetaData) {
      return NextResponse.json(
        { success: false, error: 'Receta no encontrada' },
        { status: 404 }
      );
    }

    console.log(`📋 Receta encontrada: ${recetaData.folio_receta} (${recetaData.tipo_receta})`);

    // 2. Obtener consulta asociada (incluye datos del paciente)
    const consultaData = await executeQueryOne<{
      folio: string;
      no_nomina: string;
      es_empleado: boolean;
      id_beneficiario: number;
      fecha_consulta: Date;
      nombre: string;
      edad: number | null;
      temperatura_c: string | null;
      ta_sistolica: number | null;
      ta_diastolica: number | null;
      frecuencia_cardiaca: number | null;
      oxigenacion: number | null;
      altura_cm: string | null;
      peso_kg: string | null;
      glucosa_mg_dl: number | null;
      objetivo: string | null;
      cie11_codigo: string | null;
      cie11_titulo: string | null;
      nombre_medico: string | null;
      parentesco_desc: string | null;
    }>(`
      SELECT
        c.folio,
        c.no_nomina,
        c.es_empleado,
        c.id_beneficiario,
        c.fecha_consulta,
        c.nombre,
        c.edad,
        c.temperatura_c,
        c.ta_sistolica,
        c.ta_diastolica,
        c.frecuencia_cardiaca,
        c.oxigenacion,
        c.altura_cm,
        c.peso_kg,
        c.glucosa_mg_dl,
        c.objetivo,
        -- Diagnóstico CIE-11 (de la tabla diagnosticos_consulta)
        dc.cie11_codigo,
        dc.cie11_codigo,
        dc.cie11_titulo,
        u.nombre as nombre_medico,
        p.parentesco as parentesco_desc
      FROM consulta c
      LEFT JOIN usuarios u ON c.id_medico = u.id_usuario
      LEFT JOIN parentesco p ON c.id_parentesco = p.id_parentesco
      -- JOIN con diagnósticos: obtener el principal o el primero
      LEFT JOIN diagnosticos_consulta dc ON dc.id_consulta = c.id_consulta
        AND (dc.es_principal = true OR dc.orden = 1)
      WHERE c.id_consulta = $1
    `, [recetaData.id_consulta]);

    if (!consultaData) {
      return NextResponse.json(
        { success: false, error: 'Consulta no encontrada' },
        { status: 404 }
      );
    }

    console.log('📌 Nómina del empleado:', consultaData.no_nomina);
    console.log('📌 Es empleado:', consultaData.es_empleado);

    // 3. Obtener datos del web service del EMPLEADO (titular)
    let fechaNacimiento = '';
    let sindicato = '';
    let secretaria = '';

    try {
      console.log('🌐 Llamando al web service con nómina:', consultaData.no_nomina);

      const wsResponse = await fetch(`http://localhost:${process.env.PORT || 3000}/api/webService/empleado`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ num_nom: consultaData.no_nomina })
      });

      if (wsResponse.ok) {
        const data = await wsResponse.json();

        if (data.success && data.data) {
          const empleado = data.data;

          // Mapear sindicato
          sindicato = empleado.grupoNomina === 'NS'
            ? empleado.cuotaSindical === 'S' ? 'SUTSMSJR' : empleado.cuotaSindical === '' ? 'SITAM' : ''
            : '';

          // Obtener secretaría
          secretaria = empleado.departamento || '';

          // Si es EMPLEADO, obtener su fecha de nacimiento
          if (consultaData.es_empleado && empleado.fecha_nacimiento) {
            const fechaWS = empleado.fecha_nacimiento;
            const fechaMatch = fechaWS.match(/(\d{2})\/(\d{2})\/(\d{4})/);
            if (fechaMatch) {
              const [, dia, mes, anio] = fechaMatch;
              fechaNacimiento = `${dia}/${mes}/${anio}`;
            }
          }

          console.log('✅ Datos del web service obtenidos:', {
            sindicato,
            secretaria,
            fechaNacimiento: consultaData.es_empleado ? fechaNacimiento : '(se obtendrá de beneficiarios)'
          });
        }
      }
    } catch (error) {
      console.error('❌ Error al consultar web service:', error);
    }

    // 4. Si es BENEFICIARIO, obtener SU fecha de nacimiento
    if (!consultaData.es_empleado) {
      console.log('👨‍👩‍👧 Es beneficiario, obteniendo fecha de nacimiento...');

      const beneficiarioData = await executeQueryOne<{
        f_nacimiento: Date;
      }>(`
        SELECT f_nacimiento
        FROM beneficiarios
        WHERE id_beneficiario = $1
      `, [consultaData.id_beneficiario]);

      if (beneficiarioData && beneficiarioData.f_nacimiento) {
        const fecha = new Date(beneficiarioData.f_nacimiento);
        const dia = fecha.getDate().toString().padStart(2, '0');
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const anio = fecha.getFullYear();
        fechaNacimiento = `${dia}/${mes}/${anio}`;
        console.log('✅ Fecha de nacimiento del beneficiario:', fechaNacimiento);
      }
    }

    // 5. Formatear fecha de emisión de la receta
    const fechaEmisionDate = new Date(recetaData.fecha_emision);
    const fechaEmisionFormateada = `${fechaEmisionDate.getDate().toString().padStart(2, '0')}/${(fechaEmisionDate.getMonth() + 1).toString().padStart(2, '0')}/${fechaEmisionDate.getFullYear()}`;

    // 6. Obtener medicamentos de la receta
    let medicamentos: any[] = [];
    try {
      const medicamentosResult = await executeQuery<{
        nombre_comercial: string;
        sustancia_activa: string;
        dosis: string;
        duracion_tratamiento_dias: number;
        cantidad_total: number;
        indicaciones: string | null;
        realizar_resurtimiento: boolean;
        meses_resurtimiento: number | null;
        clasificacion: string;
      }>(`
        SELECT
          m.nombre_comercial,
          m.sustancia_activa,
          dr.dosis,
          dr.duracion_tratamiento_dias,
          dr.cantidad_total,
          -- Para resurtimientos: usar las indicaciones de la receta original
          COALESCE(orig_dr.indicaciones, dr.indicaciones) AS indicaciones,
          dr.realizar_resurtimiento,
          dr.meses_resurtimiento,
          m.clasificacion
        FROM detalle_receta dr
        LEFT JOIN medicamentos m ON dr.id_medicamento = m.id_medicamento
        LEFT JOIN recetas r ON r.id_receta = dr.id_receta
        LEFT JOIN detalle_receta orig_dr
          ON orig_dr.id_receta = r.id_receta_original
          AND orig_dr.id_medicamento = dr.id_medicamento
        WHERE dr.id_receta = $1
        ORDER BY dr.id_detalle
      `, [id_receta]);

      medicamentos = medicamentosResult.map(med => ({
        nombre: med.nombre_comercial || 'N/A',
        indicaciones: med.indicaciones || med.dosis || '',
        tratamiento: med.duracion_tratamiento_dias ? `${med.duracion_tratamiento_dias} días` : '',
        piezas: med.cantidad_total,
        realizar_resurtimiento: med.realizar_resurtimiento,
        meses_resurtimiento: med.meses_resurtimiento,
        clasificacion: med.clasificacion,
      }));

      console.log(`📦 Medicamentos obtenidos: ${medicamentos.length}`);
    } catch (error) {
      console.warn('⚠️ No se encontraron medicamentos para esta receta:', error);
    }

    // 7. Generar token de acceso público y URL del QR
    let qrUrl: string | undefined;
    try {
      const token = await generarTokenReceta(id_receta, 12); // Token válido por 12 meses
      qrUrl = generarUrlPublica(token);
      console.log(`🔐 Token generado: ${token}`);
      console.log(`📱 URL del QR: ${qrUrl}`);
    } catch (error) {
      console.error('⚠️ Error generando token de acceso público:', error);
      // Continuar sin QR si falla
    }

    // 8. Construir datos para PDF
    const datosPDF = {
      consulta: fechaEmisionFormateada, // Fecha de emisión de la receta
      nomina: consultaData.no_nomina,
      folio_consulta: consultaData.folio,
      id_receta: id_receta, // ⭐ ID de la receta para código de barras
      sindicato: sindicato,
      fecha_nac: fechaNacimiento,
      secretaria: secretaria,
      parentesco: consultaData.parentesco_desc || '', // Nuevo campo
      nombre_paciente: consultaData.nombre,
      edad: consultaData.edad?.toString() || '',

      // Signos vitales
      ta_sistolica: consultaData.ta_sistolica?.toString() || '',
      ta_diastolica: consultaData.ta_diastolica?.toString() || '',
      temperatura: consultaData.temperatura_c || '',
      fc: consultaData.frecuencia_cardiaca?.toString() || '',
      oxigenacion: consultaData.oxigenacion?.toString() || '',
      altura: consultaData.altura_cm || '',
      peso: consultaData.peso_kg || '',
      glucosa: consultaData.glucosa_mg_dl?.toString() || '',

      // SOAP - Diagnóstico
      objetivo: consultaData.objetivo || '',
      cie11_codigo: consultaData.cie11_codigo || '',
      cie11_titulo: consultaData.cie11_titulo || '',

      // Médico
      nombre_medico: consultaData.nombre_medico || '',

      // Medicamentos
      medicamentos: medicamentos,

      // URL del QR para acceso público
      qrUrl: qrUrl,
    };

    console.log('📋 Datos para PDF preparados');

    // 9. Generar PDF con separación de controlados
    // Si es resurtimiento, NO incluir copia para paciente (solo hojas de farmacia)
    const esResurtimiento = recetaData.tipo_receta === 'resurtimiento';
    const incluirCopiaPaciente = !esResurtimiento;

    console.log(`📄 Tipo de receta: ${recetaData.tipo_receta}`);
    console.log(`👤 Incluir copia para paciente: ${incluirCopiaPaciente}`);

    const pdfBytes = await generarRecetasConSeparacionControlados(datosPDF, incluirCopiaPaciente);
    const buffer = Buffer.from(pdfBytes);

    console.log(`✅ [Generar PDF] PDF generado exitosamente para receta ${id_receta}`);

    // 10. Retornar PDF
    const tipoReceta = recetaData.tipo_receta === 'resurtimiento' ? 'resurtimiento' : 'receta';
    const nombreArchivo = `${tipoReceta}-${recetaData.folio_receta}.pdf`;

    const esPreview = new URL(request.url).searchParams.get('preview') === 'true';
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${esPreview ? 'inline' : 'attachment'}; filename="${nombreArchivo}"`,
      },
    });
  } catch (error) {
    console.error('❌ Error generando PDF:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al generar el PDF de la receta',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
