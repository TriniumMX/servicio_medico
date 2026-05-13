'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface Notification {
  id: string;
  tipo: 'incapacidad' | 'referencia' | 'referencia_coordinador' | 'referencia_notificador' | 'contrareferencia' | 'aviso' | 'laboratorio' | 'general';
  titulo: string;
  mensaje: string;
  fecha: string;
  leida: boolean;
  datos?: any;
  dbId?: number;    // id_notificacion en BD para persistencia offline
  esReciente?: boolean; // true → mostrar toast (Pusher en tiempo real o carga inicial de BD)
}

interface NotificationsContextType {
  notificaciones: Notification[];
  noLeidas: number;
  agregarNotificacion: (notificacion: Omit<Notification, 'id' | 'fecha' | 'leida'>) => void;
  marcarComoLeida: (id: string) => void;
  marcarTodasComoLeidas: () => void;
  eliminarNotificacion: (id: string) => void;
  limpiarNotificaciones: () => void;
  cargarPendientes: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType>({
  notificaciones: [],
  noLeidas: 0,
  agregarNotificacion: () => {},
  marcarComoLeida: () => {},
  marcarTodasComoLeidas: () => {},
  eliminarNotificacion: () => {},
  limpiarNotificaciones: () => {},
  cargarPendientes: async () => {},
});

export const useNotifications = () => useContext(NotificationsContext);

const STORAGE_KEY = 'servicio_medico_notificaciones';

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notificaciones, setNotificaciones] = useState<Notification[]>([]);
  const [mounted, setMounted] = useState(false);

  // Cargar notificaciones del localStorage al montar
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setNotificaciones(JSON.parse(stored));
      } catch (error) {
        console.error('Error cargando notificaciones:', error);
      }
    }
  }, []);

  // Guardar notificaciones en localStorage cuando cambien.
  // Se omite esReciente para que al recargar sesión no se vuelvan a mostrar toasts.
  useEffect(() => {
    if (mounted) {
      const toSave = notificaciones.map(({ esReciente, ...n }) => n);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    }
  }, [notificaciones, mounted]);

  /**
   * Carga notificaciones no leídas desde la BD.
   * Debe llamarse desde GlobalNotificationListener una vez que el usuario esté autenticado.
   * Filtra duplicados por dbId para no duplicar notificaciones ya recibidas por Pusher.
   */
  const cargarPendientes = useCallback(async () => {
    try {
      console.log('🔔 [Notif] Cargando pendientes de BD...');
      const res = await fetch('/api/notificaciones/pendientes');
      console.log('📡 [Notif] /pendientes status:', res.status);

      if (!res.ok) {
        console.warn('⚠️ [Notif] API respondió error:', res.status);
        return;
      }

      const json = await res.json();
      console.log('📦 [Notif] Respuesta API:', json);

      if (!json.success || !Array.isArray(json.data)) {
        console.warn('⚠️ [Notif] Respuesta inesperada:', json);
        return;
      }

      if (json.data.length === 0) {
        console.log('ℹ️ [Notif] Sin pendientes para este usuario');
        return;
      }

      setNotificaciones(prev => {
        // dbIds ya presentes en estado (de Pusher en esta sesión)
        const dbIdsExistentes = new Set(
          prev.filter(n => n.dbId != null).map(n => n.dbId!)
        );

        const nuevasPendientes: Notification[] = json.data
          .filter((n: any) => !dbIdsExistentes.has(n.id_notificacion))
          .map((n: any) => ({
            id: `db-${n.id_notificacion}`,
            tipo: n.tipo as Notification['tipo'],
            titulo: n.titulo,
            mensaje: n.mensaje,
            fecha: n.creado_en,
            leida: false,
            datos: n.datos,
            dbId: n.id_notificacion,
            esReciente: true, // Carga inicial de BD → mostrar toast al usuario
          }));

        console.log(`✅ [Notif] Agregando ${nuevasPendientes.length} al bell (filtradas ${json.data.length - nuevasPendientes.length} duplicadas)`);

        if (nuevasPendientes.length === 0) return prev;
        return [...nuevasPendientes, ...prev];
      });
    } catch (error) {
      console.error('❌ [Notif] Error en cargarPendientes:', error);
    }
  }, []);

  const agregarNotificacion = (notificacion: Omit<Notification, 'id' | 'fecha' | 'leida'>) => {
    const dbId = notificacion.datos?.id_notificacion as number | undefined;
    const nueva: Notification = {
      ...notificacion,
      id: Date.now().toString(),
      fecha: new Date().toISOString(),
      leida: false,
      dbId,
      esReciente: true, // Pusher en tiempo real → siempre mostrar toast
    };
    setNotificaciones(prev => [nueva, ...prev]);
  };

  const marcarComoLeida = async (id: string) => {
    const notif = notificaciones.find(n => n.id === id);
    const dbId = notif?.dbId;

    setNotificaciones(prev =>
      prev.map(n => (n.id === id ? { ...n, leida: true } : n))
    );

    if (dbId) {
      try {
        await fetch(`/api/notificaciones/${dbId}/leer`, { method: 'PATCH' });
      } catch (error) {
        console.error('Error marcando notificación como leída en BD:', error);
      }
    }
  };

  const marcarTodasComoLeidas = async () => {
    const dbIds = notificaciones
      .filter(n => !n.leida && n.dbId != null)
      .map(n => n.dbId!);

    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));

    for (const dbId of dbIds) {
      try {
        await fetch(`/api/notificaciones/${dbId}/leer`, { method: 'PATCH' });
      } catch (error) {
        console.error(`Error marcando notificación ${dbId} como leída:`, error);
      }
    }
  };

  const eliminarNotificacion = (id: string) => {
    setNotificaciones(prev => prev.filter(n => n.id !== id));
  };

  const limpiarNotificaciones = () => {
    setNotificaciones([]);
  };

  const noLeidas = notificaciones.filter(n => !n.leida).length;

  return (
    <NotificationsContext.Provider
      value={{
        notificaciones,
        noLeidas,
        agregarNotificacion,
        marcarComoLeida,
        marcarTodasComoLeidas,
        eliminarNotificacion,
        limpiarNotificaciones,
        cargarPendientes,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}
