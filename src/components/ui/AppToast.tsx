'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export type ToastData = { type: 'success' | 'error' | 'info'; message: string } | null;

interface Props {
  toast: ToastData;
  isDark: boolean;
  onClose?: () => void;
}

const ICONS = {
  success: CheckCircle,
  error:   XCircle,
  info:    AlertCircle,
};

const STYLES = {
  success: {
    dark:  'bg-[#0a1929] border-green-500/40 text-green-300',
    light: 'bg-white border-green-200 text-green-800',
    icon:  'text-green-500',
  },
  error: {
    dark:  'bg-[#0a1929] border-red-500/40 text-red-300',
    light: 'bg-white border-red-200 text-red-700',
    icon:  'text-red-500',
  },
  info: {
    dark:  'bg-[#0a1929] border-blue-500/40 text-blue-300',
    light: 'bg-white border-blue-200 text-blue-700',
    icon:  'text-[#0db1ec]',
  },
};

export default function AppToast({ toast, isDark, onClose }: Props) {
  if (!toast) return null;

  const Icon   = ICONS[toast.type];
  const styles = STYLES[toast.type];
  const cls    = isDark ? styles.dark : styles.light;

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.message}
          initial={{ opacity: 0, y: -18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -18, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className={`fixed top-5 right-5 z-[70] flex items-center gap-3
            px-4 py-3 rounded-2xl shadow-xl border text-sm font-semibold
            max-w-sm ${cls}`}
        >
          <Icon size={17} className={`shrink-0 ${styles.icon}`} />
          <span className="flex-1">{toast.message}</span>
          {onClose && (
            <button
              onClick={onClose}
              className="shrink-0 p-0.5 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook para manejar el estado del toast fácilmente
export function useToast() {
  const [toast, setToast] = useState<ToastData>(null);

  const showToast = (type: NonNullable<ToastData>['type'], message: string, ms = 3500) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), ms);
  };

  return { toast, showToast, clearToast: () => setToast(null) };
}

// Necesario para el hook
import { useState } from 'react';
