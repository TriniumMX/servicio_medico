// src/app/api/referencias/admin/notificadas/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { executeQuery, executeQueryOne } from '@/lib/dbPostgres';
import { obtenerDatosContactoPaciente } from '@/lib/obtenerDatosContacto';
import type { ReferenciaEspecialidad } from '@/types/referencias';

interface JwtPayload { id: number; usuario: string; tipoUsuario: number; }

/**
 * GET - Obtener referencias ya notificadas
 * Estatus: 'notificada', 'atendida'
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📋 [Referencias Notificadas] Buscando referencias notificadas...');

    // Obtener hospital del usuario en sesión
    const token = request.cookies.get('token')?.value;
    let idHospitalUsuario: number | null = null;
    if (token) {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret) as { payload: JwtPayload };
      const usuarioDb = await executeQueryOne<{ id_hospital: number | null }>(
        `SELECT id_hospital FROM usuarios WHERE id_usuario = $1`,
        [payload.id]
      );
      idHospitalUsuario = usuarioDb?.id_hospital ?? null;
    }

    const referencias = await executeQuery<ReferenciaEspecialidad>(`
      SELECT
        r.*,
        (
          SELECT COUNT(*)::int
          FROM referencias_especialidad r2
          WHERE r2.no_nomina = r.no_nomina
            AND r2.id_especialidad_solicitada = r.id_especialidad_solicitada
            AND r2.activo = true
            AND r2.creado_en <= r.creado_en
        ) AS numero_consulta,
        mr.nombre as nombre_medico_refiere,
        ma.nombre as nombre_medico_asignado,
        ua.nombre as nombre_usuario_asigna,
        c.nombre as nombre_coordinador,
        tc.tipousuario as cargo_coordinador,
        un.nombre as nombre_usuario_notifica,
        co.edad,
        co.sexo,
        co.departamento,
        co.es_empleado,
        -- Datos SOAP de la consulta origen
        co.subjetivo,
        co.objetivo,
        co.analisis,
        co.plan as plan_tratamiento,
        -- Diagnóstico CIE-11 (de la tabla diagnosticos_consulta)
        dc.cie11_codigo,
        dc.cie11_titulo,
        dc.cie11_capitulo,
        -- Flags de tratamiento
        co.se_asigno_incapacidad,
        co.tiene_estudios_laboratorio,
        -- Signos vitales
        co.temperatura_c,
        co.ta_sistolica,
        co.ta_diastolica,
        co.frecuencia_cardiaca,
        co.oxigenacion,
        co.altura_cm,
        co.peso_kg,
        co.glucosa_mg_dl
      FROM referencias_especialidad r
      INNER JOIN consulta co ON r.id_consulta_origen = co.id_consulta
      LEFT JOIN usuarios mr ON r.id_medico_refiere = mr.id_usuario
      LEFT JOIN usuarios ma ON r.id_medico_asignado = ma.id_usuario
      LEFT JOIN usuarios ua ON r.id_usuario_asigna = ua.id_usuario
      LEFT JOIN usuarios c ON r.id_coordinador_autoriza = c.id_usuario
      LEFT JOIN tiposusuarios tc ON c.id_tipousuario = tc.clavetipousuario
      LEFT JOIN usuarios un ON r.id_usuario_notifica = un.id_usuario
      -- JOIN con diagnósticos: obtener el principal o el primero
      LEFT JOIN diagnosticos_consulta dc ON dc.id_consulta = co.id_consulta
        AND (dc.es_principal = true OR dc.orden = 1)
      WHERE
        r.estatus IN ('notificada', 'atendida')
        AND r.activo = TRUE
        AND r.fecha_autorizacion IS NOT NULL
        ${idHospitalUsuario !== null ? 'AND ma.id_hospital = ' + idHospitalUsuario : ''}
      ORDER BY r.fecha_notificacion DESC
    `);

    console.log(`✅ [Referencias Notificadas] Se encontraron ${referencias.length} referencia(s) notificada(s)`);

    // Obtener datos completos para cada referencia (SOAP, Contacto, Tratamiento)
    const referenciasCompletas = await Promise.all(
      referencias.map(async (referencia) => {
        // Datos de contacto
        const datosContacto = await obtenerDatosContactoPaciente(referencia.id_consulta_origen);

        // Obtener medicamentos recetados en la consulta
        const medicamentos = await executeQuery<{
          nombre_comercial: string;
          sustancia_activa: string;
          dosis: string;
          cantidad_total: number;
          duracion_tratamiento_dias: number;
          indicaciones: string;
          via_administracion: string;
        }>(`
          SELECT
            m.nombre_comercial,
            m.sustancia_activa,
            dr.dosis,
            dr.cantidad_total,
            dr.duracion_tratamiento_dias,
            dr.indicaciones,
            dr.via_administracion
          FROM recetas r
          INNER JOIN detalle_receta dr ON r.id_receta = dr.id_receta
          INNER JOIN medicamentos m ON dr.id_medicamento = m.id_medicamento
          WHERE r.id_consulta = $1
          ORDER BY dr.id_detalle
        `, [referencia.id_consulta_origen]);

        // Obtener estudios de laboratorio solicitados
        const estudios = await executeQuery<{
          nombre_estudio: string;
          categoria: string;
          motivo: string;
          estatus: string;
        }>(`
          SELECT
            el.nombre_estudio,
            el.categoria,
            ce.motivo,
            ce.estatus
          FROM consulta_estudios ce
          INNER JOIN cat_estudios_laboratorio el ON ce.id_estudio = el.id_estudio
          WHERE ce.id_consulta = $1
          ORDER BY ce.id_solicitud
        `, [referencia.id_consulta_origen]);

        // Obtener incapacidad si existe
        const incapacidad = await executeQuery<{
          fecha_inicio: string;
          fecha_fin: string;
          dias_sugeridos: number;
          dias_autorizados: number | null;
          motivo_medico: string;
          estatus: string;
        }>(`
          SELECT
            fecha_inicio,
            fecha_fin,
            dias_sugeridos,
            dias_autorizados,
            motivo_medico,
            estatus
          FROM incapacidades
          WHERE id_consulta = $1
          LIMIT 1
        `, [referencia.id_consulta_origen]);

        // Obtener TODOS los diagnósticos de la consulta
        const diagnosticos = await executeQuery<{
          cie11_codigo: string;
          cie11_titulo: string;
          cie11_capitulo: string;
          es_principal: boolean;
          orden: number;
        }>(`
          SELECT
            cie11_codigo,
            cie11_titulo,
            cie11_capitulo,
            es_principal,
            orden
          FROM diagnosticos_consulta
          WHERE id_consulta = $1
          ORDER BY es_principal DESC, orden ASC
        `, [referencia.id_consulta_origen]);

        return {
          ...referencia,
          telefono: datosContacto.telefono,
          email: datosContacto.correo,
          // Agregar datos de tratamiento y diagnósticos completos
          medicamentos_recetados: medicamentos.length > 0 ? medicamentos : null,
          estudios_laboratorio: estudios.length > 0 ? estudios : null,
          incapacidad: incapacidad.length > 0 ? incapacidad[0] : null,
          diagnosticos: diagnosticos.length > 0 ? diagnosticos : null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      referencias: referenciasCompletas || []
    });

  } catch (error) {
    console.error('❌ [Referencias Notificadas] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        referencias: []
      },
      { status: 500 }
    );
  }
}
