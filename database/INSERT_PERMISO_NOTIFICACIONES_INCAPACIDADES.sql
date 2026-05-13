-- =====================================================
-- INSERTAR PERMISO: ACCESO_NOTIFICACIONES_INCAPACIDADES
-- =====================================================
-- Este permiso permite a los usuarios recibir notificaciones
-- en tiempo real cuando se crea una nueva solicitud de incapacidad
-- =====================================================

-- Insertar el nuevo permiso en la tabla de cat_acciones
INSERT INTO cat_acciones (clave, descripcion, activo)
VALUES (
    'ACCESO_NOTIFICACIONES_INCAPACIDADES',
    'Recibir notificaciones en tiempo real de nuevas solicitudes de incapacidad',
    true
)
ON CONFLICT (clave) DO NOTHING;

-- Verificar que se insertó correctamente
SELECT * FROM cat_acciones WHERE clave = 'ACCESO_NOTIFICACIONES_INCAPACIDADES';

-- =====================================================
-- ASIGNAR PERMISO A ROLES (OPCIONAL)
-- =====================================================
-- Descomenta las siguientes líneas para asignar el permiso a roles específicos
-- Ajusta los id_tipousuario según tus necesidades

-- Asignar a Administradores (ejemplo: id_tipousuario = 1)
-- INSERT INTO permisos_usuarios (id_usuario, id_accion)
-- SELECT u.id_usuario, a.id_accion
-- FROM usuarios u
-- CROSS JOIN cat_acciones a
-- WHERE u.id_tipousuario = 1
--   AND a.clave = 'ACCESO_NOTIFICACIONES_INCAPACIDADES'
--   AND NOT EXISTS (
--     SELECT 1 FROM permisos_usuarios pu
--     WHERE pu.id_usuario = u.id_usuario AND pu.id_accion = a.id_accion
--   );

-- Asignar a Coordinadores (ejemplo: id_tipousuario = 2)
-- INSERT INTO permisos_usuarios (id_usuario, id_accion)
-- SELECT u.id_usuario, a.id_accion
-- FROM usuarios u
-- CROSS JOIN cat_acciones a
-- WHERE u.id_tipousuario = 2
--   AND a.clave = 'ACCESO_NOTIFICACIONES_INCAPACIDADES'
--   AND NOT EXISTS (
--     SELECT 1 FROM permisos_usuarios pu
--     WHERE pu.id_usuario = u.id_usuario AND pu.id_accion = a.id_accion
--   );

-- =====================================================
-- NOTAS:
-- =====================================================
-- 1. Este permiso se puede asignar manualmente desde el módulo
--    de permisos en: /dashboard/admin/permisos
--
-- 2. Solo los usuarios con este permiso recibirán:
--    - Notificaciones toast emergentes
--    - Sonido de notificación
--    - Notificación en la campana del header
--    - Redirección al hacer clic en la notificación
--
-- 3. Los usuarios sin el permiso no verán ni escucharán nada
--
-- 4. El sistema funciona globalmente en todo el dashboard,
--    no solo en la página de incapacidades
-- =====================================================
