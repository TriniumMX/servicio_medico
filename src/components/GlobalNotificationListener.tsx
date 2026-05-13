'use client';

import { useEffect } from 'react';
import { usePusher } from '@/hooks/usePusher';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationsContext';

/**
 * Componente global que:
 * 1. Carga notificaciones pendientes de la BD al montar (offline-safe)
 * 2. Escucha canales Pusher en tiempo real según permisos del usuario
 *
 * Flujo de notificaciones:
 *   NOTIF_COORD_SOLICITUDES  → coordinador-channel  (paso 1: doctor crea)
 *   NOTIF_HOSPITAL_REFERENCIA → hospital-channel    (paso 2: coordinador autoriza referencia)
 *   NOTIF_GESTOR_ENTREGA     → gestores-channel     (paso 2/3: autorizado, listo para entregar)
 *   ACCESO_NOTIFICACIONES_AVISOS → avisos-channel   (avisos globales)
 *   ACCESO_CONTRAREFERENCIAS → contrareferencias-channel (caso especial por usuario)
 */
export default function GlobalNotificationListener() {
  const { hasPermission, user } = useAuth();
  const { cargarPendientes } = useNotifications();

  // 3 permisos limpios de notificación
  const tienePermisoCoord    = hasPermission('NOTIF_COORD_SOLICITUDES');
  const tienePermisoHospital = hasPermission('NOTIF_HOSPITAL_REFERENCIA');
  const tienePermisoGestor   = hasPermission('NOTIF_GESTOR_ENTREGA');
  // Permisos especiales que mantienen sus canales propios
  const tienePermisoAvisos           = hasPermission('ACCESO_NOTIFICACIONES_AVISOS');
  const tienePermisoContrareferencias = hasPermission('ACCESO_CONTRAREFERENCIAS');

  // ✅ CARGAR PENDIENTES DE BD al montar (caso offline)
  useEffect(() => {
    if (!user?.id_usuario) return;
    console.log('🚀 [GlobalNotif] Usuario listo, cargando pendientes de BD para:', user.id_usuario);
    cargarPendientes();
  }, [user?.id_usuario, cargarPendientes]);

  // Log de permisos activos
  useEffect(() => {
    if (tienePermisoCoord)    console.log('✅ Usuario autorizado: NOTIF_COORD_SOLICITUDES');
    if (tienePermisoHospital) console.log('✅ Usuario autorizado: NOTIF_HOSPITAL_REFERENCIA');
    if (tienePermisoGestor)   console.log('✅ Usuario autorizado: NOTIF_GESTOR_ENTREGA');
    if (tienePermisoAvisos)   console.log('✅ Usuario autorizado: ACCESO_NOTIFICACIONES_AVISOS');
  }, [tienePermisoCoord, tienePermisoHospital, tienePermisoGestor, tienePermisoAvisos]);

  // ── COORDINADOR: solicitudes del médico (incapacidades, referencias, lab) ──
  usePusher(
    'coordinador-channel',
    'nueva-incapacidad',
    tienePermisoCoord
      ? { onNotification: (data) => { console.log('📢 [Coord] Nueva incapacidad:', data); } }
      : undefined
  );

  usePusher(
    'coordinador-channel',
    'nueva-referencia',
    tienePermisoCoord
      ? { onNotification: (data) => { console.log('📢 [Coord] Nueva referencia:', data); } }
      : undefined
  );

  usePusher(
    'coordinador-channel',
    'nuevo-estudio-lab',
    tienePermisoCoord
      ? { onNotification: (data) => { console.log('📢 [Coord] Nuevo estudio lab:', data); } }
      : undefined
  );

  // ── HOSPITAL: referencia autorizada por coordinador, pendiente de asignar médico ──
  // Canal scoped por hospital — solo recibe notificaciones de referencias para su especialidad
  const hospitalChannel = user?.id_hospital ? `hospital-channel-${user.id_hospital}` : 'hospital-channel';

  usePusher(
    hospitalChannel,
    'referencia-autorizada',
    tienePermisoHospital
      ? { onNotification: (data) => { console.log('📢 [Hospital] Referencia autorizada:', data); } }
      : undefined
  );

  // ── GESTORES: listos para entregar (incapacidad / lab / referencia asignada) ──
  // Canal scoped por hospital para evitar que gestores de otros hospitales reciban notificaciones cruzadas
  const gestoresChannel = user?.id_hospital ? `gestores-hospital-${user.id_hospital}` : 'gestores-channel';

  usePusher(
    gestoresChannel,
    'incapacidad-autorizada',
    tienePermisoGestor
      ? { onNotification: (data) => { console.log('📢 [Gestor] Incapacidad lista para entregar:', data); } }
      : undefined
  );

  usePusher(
    gestoresChannel,
    'lab-autorizado',
    tienePermisoGestor
      ? { onNotification: (data) => { console.log('📢 [Gestor] Lab listo para entregar:', data); } }
      : undefined
  );

  usePusher(
    gestoresChannel,
    'referencia-asignada',
    tienePermisoGestor
      ? { onNotification: (data) => { console.log('📢 [Gestor] Referencia asignada — notificar paciente:', data); } }
      : undefined
  );

  usePusher(
    gestoresChannel,
    'referencia-reprogramada',
    tienePermisoGestor
      ? { onNotification: (data) => { console.log('📢 [Gestor] Referencia reprogramada — re-notificar paciente:', data); } }
      : undefined
  );

  // ── CONTRAREFERENCIAS: canal especial (envío por id_usuario_destino) ──
  usePusher(
    'contrareferencias-channel',
    'nueva-contrareferencia',
    tienePermisoContrareferencias
      ? { onNotification: (data) => { console.log('📢 [Contrareferencia] Nueva contrareferencia:', data); } }
      : undefined
  );

  // ── AVISOS GLOBALES ──
  usePusher(
    'avisos-channel',
    'nuevo-aviso',
    tienePermisoAvisos
      ? { onNotification: (data) => { console.log('📢 [Aviso] Nuevo aviso recibido:', data); } }
      : undefined
  );

  return null;
}
