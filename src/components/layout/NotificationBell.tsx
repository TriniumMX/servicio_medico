'use client';

import {
  Bell,
  X,
  CheckCheck,
  Stethoscope,
  FileText,
  CheckCircle,
  Phone,
  Info,
  Trash2,
  Clock,
  Megaphone,
  FlaskConical
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/context/NotificationsContext';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

export default function NotificationBell() {
  const { theme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { notificaciones, noLeidas, marcarComoLeida, marcarTodasComoLeidas, eliminarNotificacion } = useNotifications();
  const marcarTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, right: 0 });

  useEffect(() => setMounted(true), []);

  // Actualizar posición del botón cuando se abre el panel
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonPosition({
        top: rect.bottom + 12,
        right: window.innerWidth - rect.right
      });
    }
  }, [isOpen]);

  const isDark = mounted && theme === 'dark';

  const formatearFecha = (fecha: string) => {
    const ahora = new Date();
    const fechaNotif = new Date(fecha);
    const diff = ahora.getTime() - fechaNotif.getTime();
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);

    if (minutos < 1) return 'Ahora mismo';
    if (minutos < 60) return `${minutos} min`;
    if (horas < 24) return `${horas}h`;
    return `${dias}d`;
  };

  const getNotificationStyle = (tipo: string) => {
    switch (tipo) {
      case 'aviso':
        return {
          icon: Megaphone,
          bg: 'bg-orange-50 dark:bg-amber-900/30',
          text: 'text-orange-800 dark:text-amber-400',
          border: 'border-orange-200 dark:border-amber-800/50'
        };
      case 'incapacidad':
        return {
          icon: Stethoscope,
          bg: 'bg-rose-50 dark:bg-rose-900/30',
          text: 'text-rose-800 dark:text-rose-400',
          border: 'border-rose-200 dark:border-rose-800/50'
        };
      case 'referencia':
        return {
          icon: FileText,
          bg: 'bg-blue-50 dark:bg-blue-900/30',
          text: 'text-blue-800 dark:text-blue-400',
          border: 'border-blue-200 dark:border-blue-800/50'
        };
      case 'referencia_coordinador':
        return {
          icon: CheckCircle,
          bg: 'bg-emerald-50 dark:bg-emerald-900/30',
          text: 'text-emerald-800 dark:text-emerald-400',
          border: 'border-emerald-200 dark:border-emerald-800/50'
        };
      case 'referencia_notificador':
        return {
          icon: Phone,
          bg: 'bg-purple-50 dark:bg-violet-900/30',
          text: 'text-purple-800 dark:text-violet-400',
          border: 'border-purple-200 dark:border-violet-800/50'
        };
      case 'laboratorio':
        return {
          icon: FlaskConical,
          bg: 'bg-teal-50 dark:bg-teal-900/30',
          text: 'text-teal-800 dark:text-teal-400',
          border: 'border-teal-200 dark:border-teal-800/50'
        };
      default:
        return {
          icon: Info,
          bg: 'bg-gray-50 dark:bg-gray-800',
          text: 'text-gray-800 dark:text-gray-400',
          border: 'border-gray-200 dark:border-gray-700'
        };
    }
  };

  const handleNotificationClick = (notif: any) => {
    if (!notif.leida) {
      marcarComoLeida(notif.id);
    }
    setIsOpen(false);

    // Si la notificación trae un redirect específico, usarlo primero
    if (notif.datos?.url_redirect) {
      router.push(notif.datos.url_redirect);
      return;
    }

    // Fallback por tipo
    if (notif.tipo === 'incapacidad') {
      router.push('/dashboard/consultas/incapacidades');
    } else if (notif.tipo === 'referencia') {
      router.push('/dashboard/referencias/hospital');
    } else if (notif.tipo === 'referencia_coordinador') {
      router.push('/dashboard/referencias/coordinador');
    } else if (notif.tipo === 'referencia_notificador') {
      router.push('/dashboard/referencias/admin');
    } else if (notif.tipo === 'laboratorio') {
      router.push('/dashboard/coordinacion/laboratorio');
    } else if (notif.tipo === 'aviso') {
      router.push('/dashboard');
    }
  };

  if (!mounted) return null;

  const panelContent = (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[99998]"
          onClick={() => setIsOpen(false)}
        />
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95, rotateX: -10 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{
              position: 'fixed',
              top: `${buttonPosition.top}px`,
              // En móvil forzamos right-4 o centrado, en desktop usamos el cálculo
              right: window.innerWidth < 640 ? '16px' : `${buttonPosition.right}px`,
              left: window.innerWidth < 640 ? '16px' : 'auto', // Centrado en móvil
            }}
            className={`w-auto sm:w-[400px] rounded-3xl shadow-2xl backdrop-blur-xl z-[99999] max-h-[85vh] overflow-hidden flex flex-col origin-top-right border ${isDark
              ? 'bg-[#0f172a]/95 border-[#1e293b]'
              : 'bg-white/95 border-gray-100'
              }`}
          >
            {/* Header Creativo */}
            <div className={`p-5 border-b flex items-center justify-between sticky top-0 backdrop-blur-md z-10 ${isDark ? 'border-gray-800 bg-[#0f172a]/50' : 'border-gray-100 bg-white/50'
              }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl bg-gradient-to-br from-[#0f83b2] to-[#2dafdc] shadow-lg shadow-blue-500/20`}>
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className={`font-bold text-lg leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Notificaciones
                  </h3>
                  <p className={`text-xs mt-1 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {noLeidas} sin leer
                  </p>
                </div>
              </div>

              {noLeidas > 0 && (
                <button
                  onClick={marcarTodasComoLeidas}
                  className={`p-2 rounded-xl transition-all duration-200 group relative overflow-hidden ${isDark ? 'hover:bg-white/5 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
                    }`}
                  title="Marcar todas como leídas"
                >
                  <CheckCheck className="w-5 h-5 relative z-10" />
                  <span className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isDark ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10' : 'bg-gradient-to-r from-blue-50 to-purple-50'
                    }`} />
                </button>
              )}
            </div>

            {/* Lista de notificaciones */}
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              {notificaciones.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'
                    }`}>
                    <Bell className={`w-10 h-10 opacity-30 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
                  </div>
                  <h4 className={`text-base font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Estás al día
                  </h4>
                  <p className={`text-sm max-w-[200px] ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    No tienes notificaciones pendientes por revisar.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col p-2 space-y-2">
                  {notificaciones.map((notif, index) => {
                    const style = getNotificationStyle(notif.tipo);
                    const Icon = style.icon;

                    return (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.01 }}
                        className={`group p-4 rounded-2xl relative cursor-pointer border transition-all duration-200 ${!notif.leida
                          ? isDark
                            ? 'bg-gradient-to-r from-[#0f83b2]/10 to-transparent border-[#0f83b2]/20'
                            : 'bg-white border-blue-100 shadow-sm'
                          : isDark
                            ? 'bg-transparent border-transparent hover:bg-white/5'
                            : 'bg-transparent border-transparent hover:bg-gray-50'
                          }`}
                        onClick={() => handleNotificationClick(notif)}
                      >
                        {/* Indicador de no leído */}
                        {!notif.leida && (
                          <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-[#2dafdc] rounded-full shadow-[0_0_8px_rgba(45,175,220,0.5)] animate-pulse" />
                        )}

                        <div className="flex items-start gap-4">
                          {/* Icono con fondo */}
                          <div className={`flex-shrink-0 p-3 rounded-2xl ${style.bg} ${style.border} border`}>
                            <Icon className={`w-6 h-6 ${style.text}`} />
                          </div>

                          <div className="flex-1 min-w-0 pt-1">
                            <h4 className={`text-sm font-bold mb-1 line-clamp-1 group-hover:text-[#2dafdc] transition-colors ${isDark ? 'text-gray-200' : 'text-gray-900'
                              }`}>
                              {notif.titulo}
                            </h4>
                            <p className={`text-xs leading-relaxed line-clamp-2 mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                              {notif.mensaje}
                            </p>

                            <div className="flex items-center gap-2">
                              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium border ${isDark ? 'bg-black/20 border-white/5 text-gray-500' : 'bg-gray-100 border-gray-200 text-gray-500'
                                }`}>
                                <Clock className="w-3 h-3" />
                                {formatearFecha(notif.fecha)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Botón eliminar (hover) */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            eliminarNotificacion(notif.id);
                          }}
                          className={`absolute bottom-3 right-3 p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 ${isDark
                            ? 'hover:bg-red-500/20 text-gray-500 hover:text-red-400'
                            : 'hover:bg-red-50 text-gray-400 hover:text-red-500'
                            }`}
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer decorativo */}
            {notificaciones.length > 0 && (
              <div className={`h-1.5 w-full bg-gradient-to-r from-[#0f83b2] via-[#2dafdc] to-[#2fcbaf] opacity-50`} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  const handleBellClick = () => {
    const abriendo = !isOpen;
    setIsOpen(abriendo);

    // Al abrir el panel con notificaciones sin leer → marcarlas en BD tras 1.5s
    // (el usuario ya las vio en la lista)
    if (abriendo && noLeidas > 0) {
      if (marcarTimer.current) clearTimeout(marcarTimer.current);
      marcarTimer.current = setTimeout(() => {
        marcarTodasComoLeidas();
      }, 1500);
    } else if (!abriendo && marcarTimer.current) {
      clearTimeout(marcarTimer.current);
    }
  };

  return (
    <>
      <motion.button
        ref={buttonRef}
        onClick={handleBellClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`relative p-2.5 rounded-2xl transition-all duration-300 ${isOpen
          ? 'bg-gradient-to-br from-[#0f83b2] to-[#2dafdc] text-white shadow-lg shadow-blue-500/30'
          : isDark
            ? 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5 hover:border-white/10'
            : 'bg-white hover:bg-gray-50 text-gray-600 hover:text-[#0f83b2] border border-gray-200 hover:border-blue-100 shadow-sm hover:shadow-md'
          }`}
      >
        <Bell className={`w-5 h-5 ${isOpen ? 'fill-current' : ''}`} />
        {noLeidas > 0 && (
          <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#0a1929]" />
        )}
      </motion.button>

      {/* Portal */}
      {typeof window !== 'undefined' && createPortal(panelContent, document.body)}
    </>
  );
}
