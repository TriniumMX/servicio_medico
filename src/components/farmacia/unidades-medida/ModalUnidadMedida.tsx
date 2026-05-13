// src/components/farmacia/unidades-medida/ModalUnidadMedida.tsx

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Ruler } from 'lucide-react';
import type { UnidadMedida, UnidadMedidaForm } from '@/types/farmacia/unidades-medida';
import Swal from 'sweetalert2';

interface ModalUnidadMedidaProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (unidad: UnidadMedidaForm) => Promise<void>;
  unidadEditar?: UnidadMedida | null;
  isDark: boolean;
}

export default function ModalUnidadMedida({
  isOpen,
  onClose,
  onSubmit,
  unidadEditar,
  isDark,
}: ModalUnidadMedidaProps) {
  const [formData, setFormData] = useState<UnidadMedidaForm>({
    medida: '',
    abreviatura: '',
  });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (unidadEditar) {
      setFormData({
        medida: unidadEditar.medida,
        abreviatura: unidadEditar.abreviatura,
      });
    } else {
      setFormData({
        medida: '',
        abreviatura: '',
      });
    }
  }, [unidadEditar, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.medida.trim() || !formData.abreviatura.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor completa todos los campos',
        confirmButtonColor: '#0f83b2',
        background: isDark ? '#0a1929' : '#ffffff',
        color: isDark ? '#ffffff' : '#000000',
      });
      return;
    }

    setGuardando(true);
    try {
      await onSubmit(formData);
      onClose();
      setFormData({ medida: '', abreviatura: '' });
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo guardar la unidad de medida',
        confirmButtonColor: '#0f83b2',
        background: isDark ? '#0a1929' : '#ffffff',
        color: isDark ? '#ffffff' : '#000000',
      });
    } finally {
      setGuardando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-md rounded-2xl shadow-2xl ${
            isDark ? 'bg-[#0a1929]' : 'bg-white'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] px-6 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Ruler size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  {unidadEditar ? 'Editar Unidad de Medida' : 'Nueva Unidad de Medida'}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-all"
              >
                <X size={20} className="text-white" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Medida */}
            <div>
              <label className={`block text-sm font-bold mb-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Nombre de la Medida <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.medida}
                onChange={(e) => setFormData({ ...formData, medida: e.target.value })}
                placeholder="Ej: Tableta, Cápsula, Mililitro"
                maxLength={50}
                className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${
                  isDark
                    ? 'bg-[#0d1f2d] border-[#0f83b2]/30 text-white placeholder-gray-500 focus:border-[#0db1ec]'
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#0f83b2]'
                }`}
              />
            </div>

            {/* Abreviatura */}
            <div>
              <label className={`block text-sm font-bold mb-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Abreviatura <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.abreviatura}
                onChange={(e) => setFormData({ ...formData, abreviatura: e.target.value.toUpperCase() })}
                placeholder="Ej: TAB, CAP, ML"
                maxLength={10}
                className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all uppercase ${
                  isDark
                    ? 'bg-[#0d1f2d] border-[#0f83b2]/30 text-white placeholder-gray-500 focus:border-[#0db1ec]'
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#0f83b2]'
                }`}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all ${
                  isDark
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {guardando ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Guardar
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
