// src/app/api/referencias/admin/pendientes/route.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { executeQuery, executeQueryOne } from '@/lib/dbPostgres';
import { obtenerDatosContactoDirecto } from '@/lib/obtenerDatosContacto';
import type {
  ReferenciaEspecialidad,
  ReferenciasResponse
} from '@/types/referencias';

interface JwtPayload { id: number; usuario: string; tipoUsuario: number; }

/**
 * GET - Obtener referencias autorizadas pendientes de notificación al paciente
 * FASE 4: Admin Referencias
 * Filtra por hospital del usuario en sesión cuando aplica.
 */
export async function GET(request: NextRequest) {
  try {
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
        r.id_referencia,
        r.folio,
        r.id_consulta_origen,
        r.id_consulta_seguimiento,
        r.no_nomina,
        r.id_beneficiario,
        r.nombre_paciente,
        r.id_medico_refiere,
        r.nombre_medico_refiere,
        r.id_especialidad_solicitada,
        r.nombre_especialidad,
        r.motivo_referencia,
        r.id_medico_asignado,
        r.fecha_cita,
        r.id_usuario_asigna,
        r.fecha_asignacion,
        r.id_coordinador_autoriza,
        r.fecha_autorizacion,
        r.observaciones_coordinador,
        r.firma_digital,
        r.id_usuario_notifica,
        r.fecha_notificacion,
        r.observaciones_notificacion,
        r.fecha_atencion,
        r.nivel_triage,
        r.estatus,
        r.activo,
        r.creado_en,
        r.actualizado_en,
        r.tipo_referencia,
        r.fecha_sugerida_seguimiento,
        r.id_medico_sugerido,
        (
          SELECT COUNT(*)::int
          FROM referencias_especialidad r2
          WHERE r2.no_nomina = r.no_nomina
            AND r2.id_especialidad_solicitada = r.id_especialidad_solicitada
            AND r2.activo = true
            AND r2.creado_en <= r.creado_en
        ) AS numero_consulta,
        me.nombre as nombre_medico_asignado,
        me.cedula_profesional,
        ua.nombre as nombre_usuario_asigna,
        co.nombre as nombre_coordinador,
        tco.tipousuario as cargo_coordinador,
        c.edad,
        c.sexo,
        c.departamento,
        c.es_empleado,
        -- Datos SOAP de la consulta origen
        c.subjetivo,
        c.objetivo,
        c.analisis,
        c.plan as plan_tratamiento,
        -- Diagnóstico CIE-11 (de la tabla diagnosticos_consulta)
        dc.cie11_codigo,
        dc.cie11_titulo,
        dc.cie11_capitulo,
        -- Flags de tratamiento
        c.se_asigno_incapacidad,
        c.tiene_estudios_laboratorio,
        -- Signos vitales
        c.temperatura_c,
        c.ta_sistolica,
        c.ta_diastolica,
        c.frecuencia_cardiaca,
        c.oxigenacion,
        c.altura_cm,
        c.peso_kg,
        c.glucosa_mg_dl
      FROM referencias_especialidad r
      INNER JOIN consulta c ON r.id_consulta_origen = c.id_consulta
      LEFT JOIN usuarios me ON r.id_medico_asignado = me.id_usuario
      LEFT JOIN usuarios ua ON r.id_usuario_asigna = ua.id_usuario
      LEFT JOIN usuarios co ON r.id_coordinador_autoriza = co.id_usuario
      LEFT JOIN tiposusuarios tco ON co.id_tipousuario = tco.clavetipousuario
      -- JOIN con diagnósticos: obtener el principal o el primero
      LEFT JOIN diagnosticos_consulta dc ON dc.id_consulta = c.id_consulta
        AND (dc.es_principal = true OR dc.orden = 1)
      WHERE r.estatus = 'asignada'
        AND r.activo = true
        AND r.fecha_autorizacion IS NOT NULL
        ${idHospitalUsuario !== null ? 'AND me.id_hospital = ' + idHospitalUsuario : ''}
      ORDER BY r.fecha_asignacion ASC
    `);

    if (referencias.length === 0) {
      return NextResponse.json({ success: true, referencias: [], total: 0 });
    }

    // Recopilar IDs únicos de consultas para queries batch
    const idsConsulta = referencias.map((r) => r.id_consulta_origen);

    // 4 queries batch en paralelo en lugar de N×4 queries secuenciales
    const [medicamentosBatch, estudiosBatch, incapacidadesBatch, diagnosticosBatch] = await Promise.all([
      executeQuery<{
        id_consulta: number;
        nombre_comercial: string;
        sustancia_activa: string;
        dosis: string;
        cantidad_total: number;
        duracion_tratamiento_dias: number;
        indicaciones: string;
        via_administracion: string;
      }>(`
        SELECT
          r.id_consulta,
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
        WHERE r.id_consulta = ANY($1::int[])
        ORDER BY r.id_consulta, dr.id_detalle
      `, [idsConsulta]),

      executeQuery<{
        id_consulta: number;
        nombre_estudio: string;
        categoria: string;
        motivo: string;
        estatus: string;
      }>(`
        SELECT
          ce.id_consulta,
          el.nombre_estudio,
          el.categoria,
          ce.motivo,
          ce.estatus
        FROM consulta_estudios ce
        INNER JOIN cat_estudios_laboratorio el ON ce.id_estudio = el.id_estudio
        WHERE ce.id_consulta = ANY($1::int[])
        ORDER BY ce.id_consulta, ce.id_solicitud
      `, [idsConsulta]),

      executeQuery<{
        id_consulta: number;
        fecha_inicio: string;
        fecha_fin: string;
        dias_sugeridos: number;
        dias_autorizados: number | null;
        motivo_medico: string;
        estatus: string;
      }>(`
        SELECT DISTINCT ON (id_consulta)
          id_consulta,
          fecha_inicio,
          fecha_fin,
          dias_sugeridos,
          dias_autorizados,
          motivo_medico,
          estatus
        FROM incapacidades
        WHERE id_consulta = ANY($1::int[])
        ORDER BY id_consulta, id_incapacidad
      `, [idsConsulta]),

      executeQuery<{
        id_consulta: number;
        cie11_codigo: string;
        cie11_titulo: string;
        cie11_capitulo: string;
        es_principal: boolean;
        orden: number;
      }>(`
        SELECT
          id_consulta,
          cie11_codigo,
          cie11_titulo,
          cie11_capitulo,
          es_principal,
          orden
        FROM diagnosticos_consulta
        WHERE id_consulta = ANY($1::int[])
        ORDER BY id_consulta, es_principal DESC, orden ASC
      `, [idsConsulta]),
    ]);

    // Indexar resultados batch por id_consulta para lookup O(1)
    const medMap = new Map<number, typeof medicamentosBatch>();
    for (const m of medicamentosBatch) {
      const arr = medMap.get(m.id_consulta) ?? [];
      arr.push(m);
      medMap.set(m.id_consulta, arr);
    }

    const estMap = new Map<number, typeof estudiosBatch>();
    for (const e of estudiosBatch) {
      const arr = estMap.get(e.id_consulta) ?? [];
      arr.push(e);
      estMap.set(e.id_consulta, arr);
    }

    const incMap = new Map<number, (typeof incapacidadesBatch)[0]>();
    for (const i of incapacidadesBatch) {
      if (!incMap.has(i.id_consulta)) incMap.set(i.id_consulta, i);
    }

    const diagMap = new Map<number, typeof diagnosticosBatch>();
    for (const d of diagnosticosBatch) {
      const arr = diagMap.get(d.id_consulta) ?? [];
      arr.push(d);
      diagMap.set(d.id_consulta, arr);
    }

    // Datos de contacto en paralelo (llamadas al WS externo, no usan el pool DB)
    const contactosMap = new Map<number, { telefono: string | null; correo: string | null }>();
    await Promise.all(
      referencias.map(async (ref) => {
        const contacto = await obtenerDatosContactoDirecto(
          ref.es_empleado ?? false,
          ref.no_nomina,
          ref.id_beneficiario
        );
        contactosMap.set(ref.id_consulta_origen, contacto);
      })
    );

    const referenciasCompletas = referencias.map((referencia) => {
      const id = referencia.id_consulta_origen;
      const meds = medMap.get(id) ?? [];
      const ests = estMap.get(id) ?? [];
      const inc = incMap.get(id) ?? null;
      const diags = diagMap.get(id) ?? [];
      const contacto = contactosMap.get(id) ?? { telefono: null, correo: null };

      return {
        ...referencia,
        telefono: contacto.telefono,
        email: contacto.correo,
        medicamentos_recetados: meds.length > 0 ? meds : null,
        estudios_laboratorio: ests.length > 0 ? ests : null,
        incapacidad: inc,
        diagnosticos: diags.length > 0 ? diags : null,
      };
    });

    const response: ReferenciasResponse = {
      success: true,
      referencias: referenciasCompletas,
      total: referenciasCompletas.length
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error al obtener referencias autorizadas:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
