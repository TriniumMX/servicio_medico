'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, XCircle, AlertTriangle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => void;
  cantidadEstudios: number;
  isDark: boolean;
  motivo: string;
  onMotivoChange: (v: string) => void;
}

export default function ModalRechazarOrden({
  isOpen,
  onClose,
  onConfirm,
  cantidadEstudios,
  isDark,
  motivo,
  onMotivoChange,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (!motivo.trim()) return;
    onConfirm(motivo.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onKeyDown={handleKeyDown}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.18 }}
            className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col
              ${isDark
                ? 'bg-[#0a1929] border border-gray-700'
                : 'bg-white border border-gray-200'}`}
          >
            {/* Header */}
            <div className={`px-6 py-4 flex items-start justify-between border-b
              ${isDark ? 'border-gray-700 bg-[#0d2137]' : 'border-red-100 bg-red-50'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isDark ? 'bg-red-900/40 text-red-400' : 'bg-red-100 text-red-600'}`}>
                  <XCircle size={20} />
                </div>
                <div>
                  <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Denegar Solicitud
                  </h2>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {cantidadEstudios === 1
                      ? '1 estudio será rechazado'
                      : `${cantidadEstudios} estudios serán rechazados`}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className={`p-1.5 rounded-lg transition-colors
                  ${isDark ? 'text-gray-400 hover:bg-white/5 hover:text-gray-200' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Aviso */}
              <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border
                ${isDark
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                  : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed">
                  Esta acción notificará al médico solicitante. Escriba un motivo claro y suficiente para el rechazo.
                </p>
              </div>

              {/* Textarea */}
              <div className="space-y-1.5">
                <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Motivo del rechazo <span className="text-red-500">*</span>
                </label>
                <textarea
                  ref={textareaRef}
                  value={motivo}
                  onChange={e => onMotivoChange(e.target.value)}
                  placeholder="Escriba la razón del rechazo..."
                  rows={4}
                  className={`w-full px-4 py-3 rounded-xl border text-sm resize-none transition-colors outline-none
                    focus:ring-2 focus:ring-red-500/40
                    ${isDark
                      ? 'bg-[#0d2137] border-gray-600 text-gray-200 placeholder:text-gray-600 focus:border-red-500'
                      : 'bg-white border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-red-400'}`}
                />
                {motivo.trim() === '' && (
                  <p className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    El motivo es obligatorio para continuar.
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className={`px-6 py-4 flex justify-end gap-3 border-t
              ${isDark ? 'border-gray-700 bg-[#0d2137]' : 'border-gray-100 bg-gray-50'}`}>
              <button
                onClick={onClose}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors
                  ${isDark
                    ? 'text-gray-300 hover:bg-white/5'
                    : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={!motivo.trim()}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2
                  ${!motivo.trim()
                    ? 'opacity-40 cursor-not-allowed bg-red-500 text-white'
                    : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow shadow-red-500/20 active:scale-95'}`}
              >
                <XCircle size={15} />
                Rechazar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
