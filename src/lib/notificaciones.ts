// src/lib/notificaciones.ts
// Helper para guardar notificaciones persistentes en la BD

import { executeQuery, executeQueryOne } from '@/lib/dbPostgres';

interface GuardarNotificacionParams {
  tipo: string;
  titulo: string;
  mensaje: string;
  datos?: Record<string, any>;
  permiso_requerido?: string;
  id_usuario_destino?: number;
  /**
   * Cuando se pasa junto con permiso_requerido, restringe los destinatarios
   * a usuarios que pertenezcan a alguno de estos hospitales.
   * Evita que notificaciones de un hospital lleguen a usuarios de otro.
   */
  id_hospitales?: number[];
}

/**
 * Inserta una notificación en la BD y pre-computa sus destinatarios.
 *
 * - Si viene con permiso_requerido + id_hospitales: solo usuarios con ese
 *   permiso que pertenezcan a alguno de esos hospitales.
 * - Si viene con permiso_requerido (sin id_hospitales): todos los usuarios
 *   activos con ese permiso (comportamiento global, ej: coordinadores).
 * - Si viene con id_usuario_destino: inserta solo ese usuario.
 *
 * Nunca bloquea el flujo principal (try/catch silencioso).
 */
export async function guardarNotificacion({
  tipo,
  titulo,
  mensaje,
  datos,
  permiso_requerido,
  id_usuario_destino,
  id_hospitales,
}: GuardarNotificacionParams): Promise<number | null> {
  try {
    // 1. Insertar la notificación
    const result = await executeQueryOne<{ id_notificacion: number }>(`
      INSERT INTO notificaciones (tipo, titulo, mensaje, datos, permiso_requerido, id_usuario_destino)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id_notificacion
    `, [
      tipo,
      titulo,
      mensaje,
      datos ? JSON.stringify(datos) : null,
      permiso_requerido ?? null,
      id_usuario_destino ?? null,
    ]);

    const id = result?.id_notificacion;
    if (!id) return null;

    // 2. Poblar destinatarios
    if (id_usuario_destino) {
      // Destinatario único
      await executeQuery(`
        INSERT INTO notificaciones_destinatarios (id_notificacion, id_usuario)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [id, id_usuario_destino]);

    } else if (permiso_requerido) {
      if (id_hospitales && id_hospitales.length > 0) {
        // Solo usuarios con el permiso en los hospitales especificados
        const placeholders = id_hospitales.map((_, i) => `$${i + 3}`).join(',');
        await executeQuery(`
          INSERT INTO notificaciones_destinatarios (id_notificacion, id_usuario)
          SELECT $1, ua.id_usuario
          FROM usuario_acciones ua
          JOIN cat_acciones ca ON ua.id_accion = ca.id_accion
          JOIN usuarios u ON u.id_usuario = ua.id_usuario
          WHERE ca.clave = $2
            AND u.activo = true
            AND u.id_hospital IN (${placeholders})
          ON CONFLICT DO NOTHING
        `, [id, permiso_requerido, ...id_hospitales]);
      } else {
        // Sin restricción de hospital — notificación global (coordinadores, avisos, etc.)
        await executeQuery(`
          INSERT INTO notificaciones_destinatarios (id_notificacion, id_usuario)
          SELECT $1, ua.id_usuario
          FROM usuario_acciones ua
          JOIN cat_acciones ca ON ua.id_accion = ca.id_accion
          JOIN usuarios u ON u.id_usuario = ua.id_usuario
          WHERE ca.clave = $2
            AND u.activo = true
          ON CONFLICT DO NOTHING
        `, [id, permiso_requerido]);
      }
    }

    return id;
  } catch (error) {
    console.error('❌ Error guardando notificación en BD:', error);
    return null;
  }
}
