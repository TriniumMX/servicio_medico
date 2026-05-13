// src/lib/receta-token.ts
import { executeQueryOne, executeQuery } from './dbPostgres';

/**
 * Interfaz para el token de acceso público
 */
export interface RecetaToken {
  id: number;
  id_receta: number;
  token: string;
  fecha_creacion: Date;
  fecha_expiracion: Date;
  activo: boolean;
  visitas: number;
  ultima_visita: Date | null;
}

/**
 * Genera un token de acceso público para una receta
 * Si ya existe uno activo, lo retorna
 *
 * @param id_receta ID de la receta
 * @param meses_validez Meses de validez del token (por defecto 12 meses)
 * @returns Token generado
 */
export async function generarTokenReceta(
  id_receta: number,
  meses_validez: number = 12
): Promise<string> {
  try {
    // 1. Verificar si ya existe un token activo para esta receta
    const tokenExistente = await executeQueryOne<{ token: string }>(`
      SELECT token
      FROM recetas_acceso_publico
      WHERE id_receta = $1
        AND activo = true
        AND fecha_expiracion > NOW()
      ORDER BY fecha_creacion DESC
      LIMIT 1
    `, [id_receta]);

    if (tokenExistente) {
      console.log(`♻️ Token existente encontrado para receta ${id_receta}`);
      return tokenExistente.token;
    }

    // 2. Generar nuevo token con expiración
    const result = await executeQueryOne<{ token: string }>(`
      INSERT INTO recetas_acceso_publico (
        id_receta,
        fecha_expiracion
      ) VALUES (
        $1,
        NOW() + INTERVAL '${meses_validez} months'
      )
      RETURNING token
    `, [id_receta]);

    if (!result) {
      throw new Error('No se pudo generar el token');
    }

    console.log(`✅ Token generado para receta ${id_receta}: ${result.token}`);
    return result.token;
  } catch (error) {
    console.error('❌ Error generando token:', error);
    throw error;
  }
}

/**
 * Obtiene los datos de una receta usando su token público
 * Incrementa el contador de visitas
 *
 * @param token Token UUID
 * @returns Datos completos de la receta o null si no existe/expiró
 */
export async function obtenerRecetaPorToken(token: string) {
  try {
    // 1. Validar token y obtener id_receta
    const tokenData = await executeQueryOne<RecetaToken>(`
      SELECT *
      FROM recetas_acceso_publico
      WHERE token = $1
        AND activo = true
        AND fecha_expiracion > NOW()
    `, [token]);

    if (!tokenData) {
      console.log(`⚠️ Token inválido o expirado: ${token}`);
      return null;
    }

    // 2. Incrementar contador de visitas
    await executeQuery(`
      UPDATE recetas_acceso_publico
      SET visitas = visitas + 1,
          ultima_visita = NOW()
      WHERE token = $1
    `, [token]);

    // 3. Obtener datos completos de la receta
    const recetaData = await executeQueryOne<{
      id_receta: number;
      id_consulta: number;
      folio_receta: string;
      tipo_receta: string;
      fecha_emision: Date;
      vigencia_dias: number;
      observaciones_generales: string | null;
    }>(`
      SELECT
        id_receta,
        id_consulta,
        folio_receta,
        tipo_receta,
        fecha_emision,
        vigencia_dias,
        observaciones_generales
      FROM recetas
      WHERE id_receta = $1
    `, [tokenData.id_receta]);

    if (!recetaData) {
      console.log(`⚠️ Receta no encontrada para token: ${token}`);
      return null;
    }

    // 4. Obtener datos de la consulta (paciente, médico, diagnóstico)
    const consultaData = await executeQueryOne<{
      folio: string;
      no_nomina: string;
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
      subjetivo: string | null;
      analisis: string | null;
      plan: string | null; // Corregido: nombre real de columna es 'plan'
      nombre_medico: string | null;
    }>(`
      SELECT
        c.folio,
        c.no_nomina,
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
        dc.cie11_titulo,
        c.subjetivo,
        c.analisis,
        c.plan,
        u.nombre as nombre_medico
      FROM consulta c
      LEFT JOIN usuarios u ON c.id_usuario_crea = u.id_usuario
      -- JOIN con diagnósticos: obtener el principal o el primero
      LEFT JOIN diagnosticos_consulta dc ON dc.id_consulta = c.id_consulta
        AND (dc.es_principal = true OR dc.orden = 1)
      WHERE c.id_consulta = $1
    `, [recetaData.id_consulta]);

    if (!consultaData) {
      console.log(`⚠️ Consulta no encontrada para receta: ${recetaData.id_receta}`);
      return null;
    }

    // 5. Obtener medicamentos
    const medicamentos = await executeQuery<{
      id_detalle: number;
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
        dr.id_detalle,
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
    `, [recetaData.id_receta]);

    // 6. Para cada medicamento con resurtimiento, obtener surtimientos
    const medicamentosConSurtimientos = await Promise.all(
      medicamentos.map(async (med) => {
        // Calcular total surtido (para todos los medicamentos)
        const surtidoData = await executeQueryOne<{ total: number }>(`
          SELECT COALESCE(SUM(cantidad_surtida), 0) as total
          FROM surtimientos_receta
          WHERE id_detalle = $1
        `, [med.id_detalle]);
        const totalSurtido = surtidoData?.total || 0;

        let surtimientos: any[] = [];
        let proximoResurtimiento = null;
        let mesesResurtimiento = med.meses_resurtimiento || 0;
        let surtimientosRealizados = 0;

        if (med.realizar_resurtimiento) {
          // Obtener surtimientos del medicamento (solo si aplica resurtimiento)
          surtimientos = await executeQuery<{
            id_surtimiento: number;
            cantidad_surtida: number;
            fecha_surtimiento: Date;
            observaciones: string | null;
            mes_resurtimiento: number;
          }>(`
            SELECT
              cr.id_control as id_surtimiento,
              COALESCE(s.cantidad_surtida, 0) as cantidad_surtida,
              cr.fecha_surtido as fecha_surtimiento,
              cr.observaciones,
              cr.numero_resurtimiento as mes_resurtimiento
            FROM control_resurtimientos cr
            LEFT JOIN surtimientos_receta s ON cr.id_surtimiento = s.id_surtimiento
            WHERE cr.id_detalle = $1
              AND cr.estatus = 'surtido'
            ORDER BY cr.numero_resurtimiento
          `, [med.id_detalle]);

          // Calcular próximo resurtimiento pendiente
          surtimientosRealizados = surtimientos.length;
          const proximoMes = surtimientosRealizados + 1;

          if (proximoMes <= mesesResurtimiento) {
            // Calcular fecha aproximada del próximo resurtimiento
            const fechaEmision = new Date(recetaData.fecha_emision);
            const proximaFecha = new Date(fechaEmision);
            proximaFecha.setMonth(proximaFecha.getMonth() + proximoMes);
            proximoResurtimiento = {
              mes: proximoMes,
              fecha_aproximada: proximaFecha,
            };
          }
        }

        return {
          ...med,
          surtimientos,
          proximoResurtimiento,
          totalMeses: mesesResurtimiento,
          mesesCompletados: surtimientosRealizados,
          totalSurtido, // Nuevo campo
        };
      })
    );

    // 7.1 Obtener incapacidades (se muestran todas, el estatus indica si está pendiente o autorizada)
    const incapacidadData = await executeQueryOne<{
      fecha_inicio: Date;
      fecha_fin: Date;
      dias_sugeridos: number;
      dias_autorizados: number | null;
      motivo: string;
      motivo_rechazo: string | null;
      creado_en: Date;
      estatus: string;
    }>(`
      SELECT
        fecha_inicio,
        fecha_fin,
        dias_sugeridos,
        dias_autorizados,
        motivo_medico AS motivo,
        motivo_rechazo,
        created_at AS creado_en,
        estatus
      FROM incapacidades
      WHERE id_consulta = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [recetaData.id_consulta]);

    // 7.2 Obtener estudios de laboratorio (se muestran todos con su estatus)
    const estudiosLaboratorio = await executeQuery<{
      nombre_estudio: string;
      motivo: string;
      creado_en: Date;
      estatus: string;
      motivo_rechazo: string | null;
    }>(`
      SELECT
        cel.nombre_estudio,
        ces.motivo,
        ces.fecha_solicitud AS creado_en,
        ces.estatus,
        ces.motivo_rechazo
      FROM consulta_estudios ces
      LEFT JOIN cat_estudios_laboratorio cel ON ces.id_estudio = cel.id_estudio
      WHERE ces.id_consulta = $1
      ORDER BY ces.fecha_solicitud
    `, [recetaData.id_consulta]);

    // 7.3 Obtener referencia NORMAL a especialidad (excluye seguimientos)
    const referenciaData = await executeQueryOne<{
      id_referencia: number;
      folio: string;
      nombre_especialidad: string;
      motivo_referencia: string;
      estatus: string;
      creado_en: Date;
      fecha_cita: Date | null;
      nombre_medico_asignado: string | null;
      reprogramada: boolean;
      fecha_reprogramacion: Date | null;
      email_notificacion: string | null;
    }>(`
      SELECT
        re.id_referencia,
        re.folio,
        re.nombre_especialidad,
        re.motivo_referencia,
        re.estatus,
        re.creado_en,
        re.fecha_cita,
        u.nombre AS nombre_medico_asignado,
        re.reprogramada,
        re.fecha_reprogramacion,
        re.email_notificacion
      FROM referencias_especialidad re
      LEFT JOIN usuarios u ON re.id_medico_asignado = u.id_usuario
      WHERE re.id_consulta_origen = $1
        AND (re.tipo_referencia IS NULL OR re.tipo_referencia = 'normal')
      ORDER BY re.creado_en DESC
      LIMIT 1
    `, [recetaData.id_consulta]);

    // 7.4 Obtener seguimiento generado desde ESTA consulta (si el especialista solicitó uno)
    const seguimientoData = await executeQueryOne<{
      id_referencia: number;
      folio: string;
      nombre_especialidad: string;
      motivo_referencia: string;
      estatus: string;
      creado_en: Date;
      fecha_sugerida_seguimiento: Date | null;
      fecha_autorizacion: Date | null;
      fecha_asignacion: Date | null;
      fecha_notificacion: Date | null;
      fecha_cita: Date | null;
      nombre_medico_sugerido: string | null;
      nombre_medico_asignado: string | null;
    }>(`
      SELECT
        re.id_referencia,
        re.folio,
        re.nombre_especialidad,
        re.motivo_referencia,
        re.estatus,
        re.creado_en,
        re.fecha_sugerida_seguimiento,
        re.fecha_autorizacion,
        re.fecha_asignacion,
        re.fecha_notificacion,
        re.fecha_cita,
        ms.nombre AS nombre_medico_sugerido,
        ma.nombre AS nombre_medico_asignado
      FROM referencias_especialidad re
      LEFT JOIN usuarios ms ON re.id_medico_sugerido  = ms.id_usuario
      LEFT JOIN usuarios ma ON re.id_medico_asignado   = ma.id_usuario
      WHERE re.id_consulta_origen = $1
        AND re.tipo_referencia = 'seguimiento'
        AND re.activo = true
      ORDER BY re.creado_en DESC
      LIMIT 1
    `, [recetaData.id_consulta]);

    // 7. Retornar datos completos
    return {
      receta: recetaData,
      consulta: consultaData,
      medicamentos: medicamentosConSurtimientos,
      incapacidad: incapacidadData,
      estudiosLaboratorio,
      referencia: referenciaData,
      seguimiento: seguimientoData ?? null,
      tokenInfo: {
        visitas: tokenData.visitas + 1, // +1 porque ya incrementamos
        fecha_expiracion: tokenData.fecha_expiracion,
      },
    };
  } catch (error) {
    console.error('❌ Error obteniendo receta por token:', error);
    throw error;
  }
}

/**
 * Desactiva un token de acceso público
 * @param token Token UUID a desactivar
 */
export async function desactivarToken(token: string): Promise<boolean> {
  try {
    const result = await executeQuery(`
      UPDATE recetas_acceso_publico
      SET activo = false
      WHERE token = $1
    `, [token]);

    return true;
  } catch (error) {
    console.error('❌ Error desactivando token:', error);
    return false;
  }
}

/**
 * Genera la URL pública para acceder a una receta
 * @param token Token UUID
 * @returns URL completa
 */
export function generarUrlPublica(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/r/${token}`;
}
