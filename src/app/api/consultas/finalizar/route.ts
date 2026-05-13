import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeQueryOne } from '@/lib/dbPostgres';
import { pusherServer } from '@/lib/pusher';
import { guardarNotificacion } from '@/lib/notificaciones';
import { jwtVerify } from 'jose';

interface JwtPayload {
  id: number;
  usuario: string;
  tipoUsuario: number;
}

// Helper para generar el folio de receta
async function generarFolioReceta() {
  const anio = new Date().getFullYear();
  const patron = `R-${anio}-%`;

  const ultimo = await executeQueryOne<{ folio_receta: string }>(`
    SELECT folio_receta
    FROM recetas
    WHERE folio_receta LIKE $1
    ORDER BY id_receta DESC
    LIMIT 1
  `, [patron]);

  let consecutivo = 1;
  if (ultimo && ultimo.folio_receta) {
    const partes = ultimo.folio_receta.split('-');
    if (partes.length === 3) {
      consecutivo = parseInt(partes[2]) + 1;
    }
  }

  return `R-${anio}-${consecutivo.toString().padStart(6, '0')}`;
}

// Helper para generar folio único de referencia
async function generarFolioUnicoReferencia(): Promise<string> {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const maxIntentos = 10;

  for (let intento = 0; intento < maxIntentos; intento++) {
    // Generar código alfanumérico de 5 caracteres
    let codigo = '';
    for (let i = 0; i < 5; i++) {
      codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    const folio = `REF-${codigo}`;

    // Verificar que no exista
    const existe = await executeQueryOne<{ folio: string }>(
      'SELECT folio FROM referencias_especialidad WHERE folio = $1',
      [folio]
    );

    if (!existe) {
      return folio; // Folio único encontrado
    }
  }

  throw new Error('No se pudo generar un folio único después de varios intentos');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id_consulta, datos_soap, datos_plan } = body;

    // 0. Obtener el ID del médico que atiende desde el JWT
    let idMedicoAtiende: number | null = null;
    const token = request.cookies.get('token')?.value;
    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret) as { payload: JwtPayload };
        idMedicoAtiende = payload.id;
      } catch {
        // Token inválido: se deja id_medico sin cambios
      }
    }

    // 1. Validaciones
    if (!id_consulta) {
      return NextResponse.json({ success: false, error: 'Falta el ID de la consulta' }, { status: 400 });
    }
    if (!datos_soap) {
      return NextResponse.json({ success: false, error: 'Faltan datos del SOAP' }, { status: 400 });
    }

    // 2. Validar consulta (CORREGIDO: Agregamos no_nomina al SELECT)
    const consultaDb = await executeQueryOne<{ estatus_consulta: number; id_referencia_origen: number; no_nomina: string }>(`
      SELECT estatus_consulta, id_referencia_origen, no_nomina 
      FROM consulta 
      WHERE id_consulta = $1
    `, [id_consulta]);

    if (!consultaDb) {
      return NextResponse.json({ success: false, error: 'Consulta no encontrada' }, { status: 404 });
    }
    if (consultaDb.estatus_consulta === 2) {
      return NextResponse.json({ success: false, error: 'La consulta ya fue finalizada' }, { status: 400 });
    }

    // 2.1. Variable para el ID de referencia origen
    const idReferenciaOrigen = consultaDb.id_referencia_origen;

    // 3. Preparar datos
    const diagnosticos = datos_soap.diagnosticos || []; // Ahora es un array
    const opciones = datos_plan?.opciones || {};
    const planJson = datos_plan ? JSON.stringify(datos_plan) : null;

    // 4. ACTUALIZAR CONSULTA (sin campos CIE-11, ahora van en tabla separada)
    // id_medico se sobreescribe con el ID del médico que realmente atendió
    // (reemplaza el ID de la enfermera que tomó signos vitales)
    await executeQuery(`
      UPDATE consulta SET
        subjetivo = $1,
        objetivo = $2,
        analisis = $3,
        plan = $4,
        se_asigno_incapacidad = $5,
        tiene_referencia = $6,
        tiene_estudios_laboratorio = $7,
        estatus_consulta = 2,
        id_medico = COALESCE($9, id_medico)
      WHERE id_consulta = $8
    `, [
      datos_soap.subjetivo || null,
      datos_soap.objetivo || null,
      datos_soap.analisis || null,
      planJson,
      opciones.incapacidad || false,
      opciones.especialidad || false,
      opciones.laboratorio || false,
      id_consulta,
      idMedicoAtiende
    ]);

    // 4.1. GUARDAR DIAGNÓSTICOS CIE-11 (en tabla diagnosticos_consulta)
    if (Array.isArray(diagnosticos) && diagnosticos.length > 0) {
      for (let i = 0; i < diagnosticos.length; i++) {
        const diag = diagnosticos[i];
        await executeQuery(`
          INSERT INTO diagnosticos_consulta (
            id_consulta, cie11_codigo, cie11_titulo, cie11_capitulo, es_principal, orden
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          id_consulta,
          diag.codigo || null,
          diag.titulo || null,
          diag.capitulo || null,
          diag.es_principal || (i === 0), // El primero es principal por defecto
          diag.orden || (i + 1)
        ]);
      }
      console.log(`✅ ${diagnosticos.length} diagnóstico(s) guardado(s) para consulta ${id_consulta}`);
    }

    // 5. GUARDAR LABORATORIO
    const estudiosLab = datos_plan?.laboratorio?.estudios;
    if (opciones.laboratorio && Array.isArray(estudiosLab) && estudiosLab.length > 0) {
      for (const estudio of estudiosLab) {
        await executeQuery(`
          INSERT INTO consulta_estudios (id_consulta, id_estudio, motivo, estatus, fecha_solicitud)
          VALUES ($1, $2, $3, 'PENDIENTE', NOW())
        `, [id_consulta, estudio.id_estudio, estudio.motivo]);
      }

      // 🔔 Notificación de estudios de laboratorio al Coordinador
      try {
        const pacienteInfoLab = await executeQueryOne<{ nombre: string; folio: string }>(`
          SELECT nombre, folio FROM consulta WHERE id_consulta = $1
        `, [id_consulta]);

        const notifPayloadLab = {
          tipo: 'laboratorio' as const,
          titulo: 'Nuevos Estudios de Laboratorio',
          mensaje: `${pacienteInfoLab?.nombre || 'Paciente'} requiere ${estudiosLab.length} estudio(s) de laboratorio (Folio: ${pacienteInfoLab?.folio || 'N/A'})`,
          datos: {
            id_consulta,
            no_nomina: consultaDb.no_nomina,
            cantidad_estudios: estudiosLab.length,
            folio_consulta: pacienteInfoLab?.folio,
          },
        };
        const dbIdLab = await guardarNotificacion({
          tipo: notifPayloadLab.tipo,
          titulo: notifPayloadLab.titulo,
          mensaje: notifPayloadLab.mensaje,
          datos: notifPayloadLab.datos,
          permiso_requerido: 'NOTIF_COORD_SOLICITUDES',
        });
        await pusherServer.trigger('coordinador-channel', 'nuevo-estudio-lab', {
          ...notifPayloadLab,
          datos: { ...notifPayloadLab.datos, id_notificacion: dbIdLab },
        });
        console.log('📢 Notificación de laboratorio enviada al Coordinador vía Pusher');
      } catch (error) {
        console.error('❌ Error enviando notificación de laboratorio:', error);
      }
    }

    // ============================================================
    // 5.2. GUARDAR INCAPACIDAD (ESTO FALTABA)
    // ============================================================
    const datosIncapacidad = datos_plan?.incapacidad;
    if (opciones.incapacidad && datosIncapacidad) {
      // Construir motivo_medico combinando diagnóstico CIE-11 + observaciones
      let motivoMedicoCompleto = '';
      if (datosIncapacidad.diagnostico_codigo && datosIncapacidad.diagnostico_titulo) {
        motivoMedicoCompleto = `[${datosIncapacidad.diagnostico_codigo}] ${datosIncapacidad.diagnostico_titulo}`;
      }
      if (datosIncapacidad.motivo) {
        motivoMedicoCompleto += motivoMedicoCompleto ? ` - ${datosIncapacidad.motivo}` : datosIncapacidad.motivo;
      }

      await executeQuery(`
        INSERT INTO incapacidades (
          id_consulta,
          no_nomina,
          fecha_inicio,
          fecha_fin,
          dias_sugeridos,
          motivo_medico,
          diagnostico_codigo,
          diagnostico_titulo,
          estatus,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDIENTE', NOW())
      `, [
        id_consulta,
        consultaDb.no_nomina, // Dato seguro de la BD
        datosIncapacidad.fecha_inicio,
        datosIncapacidad.fecha_fin,
        datosIncapacidad.dias, // Viene del frontend como 'dias'
        motivoMedicoCompleto || null,
        datosIncapacidad.diagnostico_codigo || null,
        datosIncapacidad.diagnostico_titulo || null,
      ]);
      console.log("✅ Incapacidad guardada correctamente con diagnóstico CIE-11");

      // Obtener datos del paciente para la notificación
      const pacienteInfo = await executeQueryOne<{ nombre: string, folio: string }>(`
        SELECT nombre, folio FROM consulta WHERE id_consulta = $1
      `, [id_consulta]);

      // Guardar notificación en BD + enviar en tiempo real con Pusher
      try {
        const notifPayload = {
          tipo: 'incapacidad',
          titulo: 'Nueva Solicitud de Incapacidad',
          mensaje: `${pacienteInfo?.nombre || 'Paciente'} ha solicitado ${datosIncapacidad.dias} días de incapacidad (Folio: ${pacienteInfo?.folio || 'N/A'})`,
          datos: {
            id_consulta,
            no_nomina: consultaDb.no_nomina,
            dias: datosIncapacidad.dias,
            folio_consulta: pacienteInfo?.folio
          }
        };
        const dbId = await guardarNotificacion({
          tipo: notifPayload.tipo,
          titulo: notifPayload.titulo,
          mensaje: notifPayload.mensaje,
          datos: notifPayload.datos,
          permiso_requerido: 'NOTIF_COORD_SOLICITUDES',
        });
        await pusherServer.trigger('coordinador-channel', 'nueva-incapacidad', {
          ...notifPayload,
          datos: { ...notifPayload.datos, id_notificacion: dbId },
        });
        console.log("📢 Notificación de incapacidad enviada vía Pusher");
      } catch (error) {
        console.error("❌ Error enviando notificación de Pusher:", error);
        // No bloqueamos el proceso si falla la notificación
      }
    }

    // 5.5. CREAR REFERENCIA A ESPECIALIDAD
    let referenciaGenerada = null;
    const datosReferencia = datos_plan?.referencia_especialidad;

    if (opciones.especialidad && datosReferencia) {
      // Obtener datos completos de la consulta
      const consultaCompleta = await executeQueryOne<{
        no_nomina: string;
        id_beneficiario: number;
        nombre: string;
        id_medico: number;
      }>(`
        SELECT no_nomina, id_beneficiario, nombre, id_medico
        FROM consulta
        WHERE id_consulta = $1
      `, [id_consulta]);

      if (!consultaCompleta) {
        return NextResponse.json({
          success: false,
          error: 'No se encontraron datos de la consulta para crear la referencia'
        }, { status: 404 });
      }

      // Obtener nombre del médico que refiere
      const medicoRefiere = await executeQueryOne<{ nombre: string }>(`
        SELECT nombre FROM usuarios WHERE id_usuario = $1
      `, [consultaCompleta.id_medico]);

      // Obtener nombre de la especialidad
      const especialidad = await executeQueryOne<{ especialidad: string }>(`
        SELECT especialidad FROM especialidades WHERE claveespecialidad = $1
      `, [datosReferencia.id_especialidad_solicitada]);

      // Generar folio único para la referencia
      const folioReferencia = await generarFolioUnicoReferencia();

      // Crear la referencia (telefono y email se dejan NULL por ahora)
      const nuevaReferencia = await executeQueryOne<{ id_referencia: number; folio: string }>(`
        INSERT INTO referencias_especialidad (
          folio,
          id_consulta_origen,
          no_nomina,
          id_beneficiario,
          nombre_paciente,
          id_medico_refiere,
          nombre_medico_refiere,
          id_especialidad_solicitada,
          nombre_especialidad,
          motivo_referencia,
          nivel_triage,
          estatus,
          creado_en
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pendiente_autorizar', NOW())
        RETURNING id_referencia, folio
      `, [
        folioReferencia,
        id_consulta,
        consultaCompleta.no_nomina,
        consultaCompleta.id_beneficiario,
        consultaCompleta.nombre,
        consultaCompleta.id_medico,
        medicoRefiere?.nombre || 'Médico General',
        datosReferencia.id_especialidad_solicitada,
        especialidad?.especialidad || 'Especialidad',
        datosReferencia.motivo_referencia,
        datosReferencia.nivel_triage ?? null
      ]);

      if (nuevaReferencia) {
        referenciaGenerada = {
          id_referencia: nuevaReferencia.id_referencia,
          folio: nuevaReferencia.folio,
          especialidad: especialidad?.especialidad || 'Especialidad',
          motivo: datosReferencia.motivo_referencia,
          estatus: 'pendiente_autorizar'
        };

        // 🔔 Guardar notificación en BD + disparar Pusher al Coordinador
        try {
          const notifPayload = {
            tipo: 'referencia_coordinador',
            titulo: 'Nueva Referencia por Autorizar',
            mensaje: `${consultaCompleta.nombre} ha sido referido a ${especialidad?.especialidad || 'Especialidad'} (Folio: ${nuevaReferencia.folio})`,
            datos: {
              id_referencia: nuevaReferencia.id_referencia,
              folio: nuevaReferencia.folio,
              no_nomina: consultaCompleta.no_nomina,
              nombre_paciente: consultaCompleta.nombre,
              especialidad: especialidad?.especialidad || 'Especialidad',
              id_especialidad: datosReferencia.id_especialidad_solicitada
            }
          };
          const dbId = await guardarNotificacion({
            tipo: notifPayload.tipo,
            titulo: notifPayload.titulo,
            mensaje: notifPayload.mensaje,
            datos: notifPayload.datos,
            permiso_requerido: 'NOTIF_COORD_SOLICITUDES',
          });
          await pusherServer.trigger('coordinador-channel', 'nueva-referencia', {
            ...notifPayload,
            datos: { ...notifPayload.datos, id_notificacion: dbId },
          });
          console.log('📢 Notificación de referencia enviada al Coordinador vía Pusher (desde finalizar consulta)');
        } catch (error) {
          console.error('❌ Error enviando notificación de referencia:', error);
          // No bloqueamos el proceso si falla la notificación
        }
      }
    }

    // 6. ACTUALIZAR ESTATUS DE REFERENCIA ORIGEN (Cierre del ciclo)
    if (idReferenciaOrigen) {
      await executeQuery(`
        UPDATE referencias_especialidad
        SET 
          estatus = 'atendida',
          fecha_atencion = NOW(),
          id_consulta_seguimiento = $1,
          actualizado_en = NOW()
        WHERE id_referencia = $2
      `, [id_consulta, idReferenciaOrigen]);
    }

    // 7. GENERAR RECETA (siempre se genera, con o sin medicamentos)
    let recetaGenerada = null;
    const medicamentos = datos_plan?.medicamentos?.medicamentos;
    const tieneMedicamentos = opciones.medicamentos && Array.isArray(medicamentos) && medicamentos.length > 0;

    // Siempre generar receta para tener registro del SOAP
    const folioReceta = await generarFolioReceta();

    const nuevaReceta = await executeQueryOne<{ id_receta: number, fecha_emision: Date }>(`
      INSERT INTO recetas (id_consulta, folio_receta, vigencia_dias, observaciones_generales, fecha_emision)
      VALUES ($1, $2, 30, $3, NOW())
      RETURNING id_receta, fecha_emision
    `, [id_consulta, folioReceta, tieneMedicamentos ? (datos_plan?.medicamentos?.observaciones_generales || null) : null]);

    if (nuevaReceta) {
      const medicamentosCompletos = [];

      // Solo insertar detalles si hay medicamentos
      if (tieneMedicamentos) {
        for (const med of medicamentos) {
          await executeQuery(`
            INSERT INTO detalle_receta (
              id_receta, id_medicamento, cantidad_total, dosis,
              duracion_tratamiento_dias, indicaciones, realizar_resurtimiento, meses_resurtimiento
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [
            nuevaReceta.id_receta, med.clavemedicamento, med.piezas, med.indicaciones,
            med.tratamiento_dias, med.indicaciones, med.realizar_resurtimiento || false, med.meses_resurtimiento || null
          ]);

          const medicamentoDb = await executeQueryOne<{
            nombre_comercial: string;
            sustancia_activa: string;
          }>(`
            SELECT nombre_comercial, sustancia_activa
            FROM medicamentos
            WHERE id_medicamento = $1
          `, [med.clavemedicamento]);

          medicamentosCompletos.push({
            nombre_comercial: medicamentoDb?.nombre_comercial || med.nombre_medicamento || 'N/A',
            sustancia_activa: medicamentoDb?.sustancia_activa || 'N/A',
            dosis: med.indicaciones,
            duracion_tratamiento_dias: med.tratamiento_dias,
            cantidad_total: med.piezas,
            indicaciones: med.indicaciones,
            realizar_resurtimiento: med.realizar_resurtimiento || false,
            meses_resurtimiento: med.meses_resurtimiento || undefined,
          });
        }
      }

      // Obtener diagnóstico principal (primer elemento o el marcado como principal)
      const diagnosticoPrincipal = diagnosticos.find((d: any) => d.es_principal) || diagnosticos[0];

      recetaGenerada = {
        id_receta: nuevaReceta.id_receta,
        folio_receta: folioReceta,
        fecha_emision: nuevaReceta.fecha_emision,
        medicamentos: medicamentosCompletos, // Array vacío si no hay medicamentos
        sinMedicamentos: !tieneMedicamentos, // Flag para indicar que no tiene medicamentos
        diagnostico: diagnosticoPrincipal?.codigo ? {
          codigo: diagnosticoPrincipal.codigo,
          titulo: diagnosticoPrincipal.titulo,
        } : undefined,
        diagnosticos: diagnosticos, // Incluir todos los diagnósticos
      };
    }

    // 8. Obtener datos finales para la respuesta
    const consultaFinal = await executeQueryOne(`
      SELECT folio, nombre, edad, no_nomina, departamento, es_empleado
      FROM consulta
      WHERE id_consulta = $1
    `, [id_consulta]);

    // Construir respuesta
    const responseData: any = {
      id_consulta,
      folio: consultaFinal?.folio,
      // Agregamos banderas para que el frontend sepa qué se generó
      modulos_plan: {
        incapacidad: opciones.incapacidad,
        laboratorio: opciones.laboratorio,
        especialidad: opciones.especialidad
      },
      paciente: consultaFinal ? {
        nombre: consultaFinal.nombre,
        edad: consultaFinal.edad,
        no_nomina: consultaFinal.no_nomina,
        departamento: consultaFinal.departamento,
        es_empleado: consultaFinal.es_empleado
      } : null
    };

    if (recetaGenerada) {
      responseData.receta = {
        ...recetaGenerada,
        folio_consulta: consultaFinal?.folio || 'N/A',
        medico: {
          nombre: 'Dr. Sistema Médico', 
          cedula: '',
        },
      };
    }

    if (referenciaGenerada) {
      responseData.referencia = referenciaGenerada;
    }

    return NextResponse.json({
      success: true,
      message: 'Consulta finalizada exitosamente',
      data: responseData
    });

  } catch (error: any) {
    console.error('❌ Error al finalizar:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al finalizar la consulta',
      details: error.message
    }, { status: 500 });
  }
}