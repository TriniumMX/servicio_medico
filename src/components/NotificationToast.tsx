'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useNotifications } from '@/context/NotificationsContext';

interface ToastNotification {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: 'incapacidad' | 'referencia' | 'referencia_coordinador' | 'referencia_notificador' | 'contrareferencia' | 'aviso' | 'laboratorio' | 'general';
}

export default function NotificationToast() {
  const { notificaciones } = useNotifications();
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  // Registro de IDs ya mostrados para no repetir toasts
  const mostradosRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Buscar notificaciones recientes que aún no han tenido toast
    const nuevas = notificaciones.filter(
      n => n.esReciente && !n.leida && !mostradosRef.current.has(n.id)
    );

    if (nuevas.length === 0) return;

    const nuevosToasts: ToastNotification[] = nuevas.slice(0, 3).map(n => ({
      id: n.id,
      titulo: n.titulo,
      mensaje: n.mensaje,
      tipo: n.tipo,
    }));

    // Marcar como mostrados para no repetirlos
    nuevosToasts.forEach(t => mostradosRef.current.add(t.id));

    setToasts(prev => [...nuevosToasts, ...prev].slice(0, 3));

    // Auto-remover cada toast después de 10 segundos
    nuevosToasts.forEach(t => {
      setTimeout(() => {
        setToasts(prev => prev.filter(x => x.id !== t.id));
      }, 10000);
    });
  }, [notificaciones]);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const getEstiloTipo = (tipo: string) => {
    if (tipo === 'laboratorio') return { gradient: 'from-[#060d0d] to-[#0d9488]/40', border: 'border-teal-500/40' };
    if (tipo === 'incapacidad') return { gradient: 'from-[#0d0608] to-[#e11d48]/40', border: 'border-rose-500/40' };
    if (tipo === 'aviso')       return { gradient: 'from-[#0d0a06] to-[#d97706]/40', border: 'border-amber-500/40' };
    return { gradient: 'from-[#060b10] to-[#0f83b2]/40', border: 'border-blue-500/40' };
  };

  const getIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'incapacidad':            return '🏥';
      case 'referencia':             return '📋';
      case 'referencia_coordinador': return '✅';
      case 'referencia_notificador': return '📞';
      case 'aviso':                  return '📢';
      case 'laboratorio':            return '🔬';
      default:                       return '🔔';
    }
  };

  return (
    <div className="fixed top-20 left-4 right-4 md:left-auto md:right-4 z-[9999] space-y-2 pointer-events-none flex flex-col items-center md:items-end">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            className={`pointer-events-auto w-full max-w-sm md:w-96 bg-gradient-to-br ${getEstiloTipo(toast.tipo).gradient} text-white rounded-2xl shadow-2xl p-4 backdrop-blur-md border ${getEstiloTipo(toast.tipo).border}`}
          >
            <div className="flex items-start gap-3">
              <div className="text-3xl flex-shrink-0 mt-1">
                {getIconoTipo(toast.tipo)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <h4 className="font-bold text-white pr-2">
                    {toast.titulo}
                  </h4>
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="p-1 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-white/90">
                  {toast.mensaje}
                </p>
              </div>
            </div>

            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 10, ease: 'linear' }}
              className="h-1 bg-white/30 rounded-full mt-3"
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
