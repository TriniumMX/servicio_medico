// src/app/api/recetas/generar-pdf-consulta/[id_consulta]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generarRecetasConSeparacionControlados } from '@/lib/generar-receta-pdf';
import { executeQuery, executeQueryOne } from '@/lib/dbPostgres';
import { generarTokenReceta, generarUrlPublica } from '@/lib/receta-token';

/**
 * GET /api/recetas/generar-pdf-consulta/[id_consulta]
 *
 * Genera un PDF de receta usando el template Receta-general.pdf
 * a partir de una consulta en la base de datos (consulta directa sin fetch interno)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id_consulta: string }> }
) {
  try {
    const { id_consulta: id_consulta_str } = await context.params;
    const id_consulta = parseInt(id_consulta_str);

    if (isNaN(id_consulta)) {
      return NextResponse.json(
        { success: false, error: 'ID de consulta inválido' },
        { status: 400 }
      );
    }

    console.log(`📄 [Generar PDF] Generando PDF para consulta: ${id_consulta}`);

    // 1. Obtener consulta básica con signos vitales y médico
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
      nombre_medico: string | null;
      cedula_profesional: string | null;
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
        u.nombre as nombre_medico,
        u.cedula_profesional,
        p.parentesco as parentesco_desc
      FROM consulta c
      LEFT JOIN usuarios u ON c.id_usuario_crea = u.id_usuario
      LEFT JOIN parentesco p ON c.id_parentesco = p.id_parentesco
      WHERE c.id_consulta = $1
    `, [id_consulta]);

    if (!consultaData) {
      return NextResponse.json(
        { success: false, error: 'Consulta no encontrada' },
        { status: 404 }
      );
    }

    // 1.1. Obtener diagnósticos de la tabla diagnosticos_consulta
    const diagnosticosData = await executeQuery<{
      cie11_codigo: string;
      cie11_titulo: string;
      cie11_capitulo: string | null;
      es_principal: boolean;
      orden: number;
    }>(`
      SELECT cie11_codigo, cie11_titulo, cie11_capitulo, es_principal, orden
      FROM diagnosticos_consulta
      WHERE id_consulta = $1
      ORDER BY es_principal DESC, orden ASC
    `, [id_consulta]);

    // Obtener el diagnóstico principal (o el primero si no hay principal marcado)
    const diagnosticoPrincipal = diagnosticosData.find(d => d.es_principal) || diagnosticosData[0] || null;

    console.log('📌 Nómina del empleado:', consultaData.no_nomina);
    console.log('📌 Es empleado:', consultaData.es_empleado);

    // 2. SIEMPRE obtener datos del web service del EMPLEADO (con la nómina del titular)
    let fechaNacimiento = '';
    let sindicato = '';
    let secretaria = '';

    try {
      console.log('🌐 Llamando al web service con nómina:', consultaData.no_nomina);

      // Llamar al endpoint interno que usa soap
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

          // Mapear sindicato según la lógica del sistema
          sindicato = empleado.grupoNomina === 'NS'
            ? empleado.cuotaSindical === 'S' ? 'SUTSMSJR' : empleado.cuotaSindical === '' ? 'SITAM' : ''
            : '';

          // Obtener secretaría (departamento)
          secretaria = empleado.departamento || '';

          // Si es EMPLEADO, obtener su fecha de nacimiento del web service
          if (consultaData.es_empleado && empleado.fecha_nacimiento) {
            const fechaWS = empleado.fecha_nacimiento;
            const fechaMatch = fechaWS.match(/(\d{2})\/(\d{2})\/(\d{4})/);
            if (fechaMatch) {
              const [, dia, mes, anio] = fechaMatch;
              fechaNacimiento = `${dia}/${mes}/${anio}`;
            }
          }

          console.log('✅ Datos del web service obtenidos:', {
            grupoNomina: empleado.grupoNomina,
            cuotaSindical: empleado.cuotaSindical,
            sindicato,
            secretaria,
            fechaNacimiento: consultaData.es_empleado ? fechaNacimiento : '(se obtendrá de beneficiarios)'
          });
        }
      }
    } catch (error) {
      console.error('❌ Error al consultar web service:', error);
    }

    // 3. Si es BENEFICIARIO, obtener SU fecha de nacimiento de la tabla beneficiarios
    if (!consultaData.es_empleado) {
      console.log('👨‍👩‍👧 Es beneficiario, obteniendo fecha de nacimiento de la tabla...');

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

    // 4. Formatear fecha de consulta
    const fechaConsultaDate = new Date(consultaData.fecha_consulta);
    const fechaConsultaFormateada = `${fechaConsultaDate.getDate().toString().padStart(2, '0')}/${(fechaConsultaDate.getMonth() + 1).toString().padStart(2, '0')}/${fechaConsultaDate.getFullYear()}`;

    // 4.1. Obtener medicamentos de la receta (si existe)
    let medicamentos: any[] = [];
    let idReceta: number | null = null;

    try {
      const recetaResult = await executeQueryOne<{ id_receta: number }>(`
        SELECT id_receta FROM recetas WHERE id_consulta = $1
      `, [id_consulta]);

      if (recetaResult) {
        idReceta = recetaResult.id_receta;

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
            dr.indicaciones,
            dr.realizar_resurtimiento,
            dr.meses_resurtimiento,
            m.clasificacion
          FROM detalle_receta dr
          LEFT JOIN medicamentos m ON dr.id_medicamento = m.id_medicamento
          WHERE dr.id_receta = $1
          ORDER BY dr.id_detalle
        `, [recetaResult.id_receta]);

        medicamentos = medicamentosResult.map(med => ({
          nombre: med.nombre_comercial || 'N/A',
          indicaciones: med.indicaciones || med.dosis || '',
          tratamiento: med.duracion_tratamiento_dias ? `${med.duracion_tratamiento_dias} días` : '',
          piezas: med.cantidad_total,
          realizar_resurtimiento: med.realizar_resurtimiento,
          meses_resurtimiento: med.meses_resurtimiento,
          clasificacion: med.clasificacion,
        }));
      }
    } catch (error) {
      console.warn('⚠️ No se encontraron medicamentos para esta consulta:', error);
    }

    // 4.2. Obtener especialidad y triage de referencia (si existe)
    let especialidad: string | null = null;
    let nivelTriage: number | null = null;

    try {
      const referenciaResult = await executeQueryOne<{ nombre_especialidad: string; nivel_triage: number | null }>(`
        SELECT nombre_especialidad, nivel_triage
        FROM referencias_especialidad
        WHERE id_consulta_origen = $1
        ORDER BY creado_en DESC
        LIMIT 1
      `, [id_consulta]);

      if (referenciaResult) {
        especialidad = referenciaResult.nombre_especialidad;
        nivelTriage = referenciaResult.nivel_triage;
        console.log('✅ Especialidad de referencia encontrada:', especialidad, '| Triage:', nivelTriage);
      }
    } catch (error) {
      console.warn('⚠️ No se encontró referencia a especialidad para esta consulta:', error);
    }

    // 5. Generar token de acceso público y URL del QR (solo si existe receta)
    let qrUrl: string | undefined;
    if (idReceta) {
      try {
        const token = await generarTokenReceta(idReceta, 12); // Token válido por 12 meses
        qrUrl = generarUrlPublica(token);
        console.log(`🔐 Token generado: ${token}`);
        console.log(`📱 URL del QR: ${qrUrl}`);
      } catch (error) {
        console.error('⚠️ Error generando token de acceso público:', error);
        // Continuar sin QR si falla
      }
    }

    // 6. Construir datos para PDF
    const datosPDF = {
      consulta: fechaConsultaFormateada,
      nomina: consultaData.no_nomina,
      folio_consulta: consultaData.folio,
      id_receta: idReceta, // ⭐ ID de la receta para código de barras
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

      // SOAP - Diagnóstico (desde tabla diagnosticos_consulta)
      objetivo: consultaData.objetivo || '',
      cie11_codigo: diagnosticoPrincipal?.cie11_codigo || '',
      cie11_titulo: diagnosticoPrincipal?.cie11_titulo || '',
      // Todos los diagnósticos (para mostrar múltiples si es necesario)
      diagnosticos: diagnosticosData.map(d => ({
        codigo: d.cie11_codigo,
        titulo: d.cie11_titulo,
        es_principal: d.es_principal
      })),

      // Médico
      nombre_medico: consultaData.nombre_medico || '',
      cedula_medico: consultaData.cedula_profesional || undefined,

      // Especialidad (referencia si existe)
      especialidad: especialidad || undefined,

      // Triage de la referencia (si existe)
      nivel_triage: nivelTriage || undefined,

      // Medicamentos
      medicamentos: medicamentos,

      // Flag para indicar si no tiene medicamentos
      sinMedicamentos: medicamentos.length === 0,

      // URL del QR para acceso público
      qrUrl: qrUrl,
    };

    console.log('📋 Datos para PDF:', datosPDF);

    // 7. Generar PDF usando el template con separación de controlados
    const pdfBytes = await generarRecetasConSeparacionControlados(datosPDF);
    const buffer = Buffer.from(pdfBytes);

    console.log(`✅ [Generar PDF] PDF generado exitosamente para consulta ${id_consulta}`);

    // 8. Retornar PDF
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="receta-${consultaData.folio}.pdf"`,
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
