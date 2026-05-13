-- =============================================
-- Script: INSERT_PERMISO_contrareferencias.sql
-- Descripción: Crea permiso para acceso a módulo de contrareferencias
-- Base de datos: PostgreSQL
-- Fecha: 2026-01-13
-- =============================================

-- 1. Insertar nuevo permiso en cat_acciones (si no existe)
INSERT INTO cat_acciones (clave, descripcion, activo)
VALUES (
    'ACCESO_CONTRAREFERENCIAS',
    'Permite recibir y gestionar contrareferencias de especialistas',
    true
)
ON CONFLICT (clave) DO NOTHING;

-- 2. Verificar que se insertó correctamente
SELECT
    id_accion,
    clave,
    descripcion,
    activo
FROM cat_acciones
WHERE clave = 'ACCESO_CONTRAREFERENCIAS';

-- 3. INSTRUCCIONES PARA ASIGNAR EL PERMISO A USUARIOS
-- =====================================================
-- Este permiso debe asignarse manualmente a los usuarios que lo necesiten
-- desde la interfaz de administración de permisos en:
-- /dashboard/admin/permisos
--
-- Usuarios que necesitan este permiso:
-- - Médicos Generales (para recibir contrareferencias)
-- - Médicos Especialistas (para crear y recibir contrareferencias)
--
-- Si necesitas asignarlo manualmente por SQL, usa este query de ejemplo:
--
-- INSERT INTO usuario_acciones (id_usuario, id_accion)
-- SELECT
--     u.id_usuario,
--     a.id_accion
-- FROM usuarios u
-- CROSS JOIN cat_acciones a
-- WHERE a.clave = 'ACCESO_CONTRAREFERENCIAS'
--   AND u.id_tipousuario IN (2, 3) -- 2=Medico General, 3=Medico Especialista
--   AND u.activo = true
--   AND NOT EXISTS (
--       SELECT 1
--       FROM usuario_acciones ua
--       WHERE ua.id_usuario = u.id_usuario
--         AND ua.id_accion = a.id_accion
--   );

-- 4. Comentario en la tabla
COMMENT ON COLUMN cat_acciones.clave IS
    'Clave única de la acción - ACCESO_CONTRAREFERENCIAS permite gestionar contrareferencias';
