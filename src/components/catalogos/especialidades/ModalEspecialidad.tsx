// src/components/catalogos/especialidades/ModalEspecialidad.tsx

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, Stethoscope } from 'lucide-react';
import type { Especialidad } from '@/types/catalogos/especialidades';

interface ModalEspecialidadProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<boolean>;
  especialidad?: Especialidad | null;
  mode: 'create' | 'edit';
  isDark: boolean;
}

export default function ModalEspecialidad({
  isOpen,
  onClose,
  onSubmit,
  especialidad,
  mode,
  isDark = false,
}: ModalEspecialidadProps) {
  const [formData, setFormData] = useState({
    especialidad: '',
    especial: 'S', // Valor por defecto fijo
    estatus: true, // Valor por defecto fijo al crear
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && especialidad) {
      setFormData({
        especialidad: especialidad.especialidad,
        especial: especialidad.especial, // Mantenemos el que tenga
        estatus: especialidad.estatus,
      });
    } else {
      setFormData({
        especialidad: '',
        especial: 'S', // Por defecto 'S' al crear
        estatus: true,
      });
    }
  }, [mode, especialidad, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await onSubmit(formData);
    setLoading(false);
    if (success) handleClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleClose = () => {
    setFormData({ especialidad: '', especial: 'S', estatus: true });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-md overflow-hidden rounded-2xl shadow-2xl ${
                isDark ? 'bg-[#0a1929]' : 'bg-white'
              }`}
            >
              {/* Header */}
              <div className={`flex items-center justify-between p-6 border-b ${
                  isDark ? 'border-[#0f83b2]/20' : 'border-gray-200'
                }`}>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {mode === 'create' ? 'Nueva Especialidad' : 'Editar Especialidad'}
                </h2>
                <button onClick={handleClose} className={`p-2 rounded-lg transition-colors ${
                    isDark ? 'hover:bg-[#0f83b2]/10 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}>
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Nombre de la Especialidad *
                  </label>
                  <div className="relative">
                    <Stethoscope className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                      type="text"
                      name="especialidad"
                      value={formData.especialidad}
                      onChange={handleChange}
                      required
                      autoFocus
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border transition-colors ${
                        isDark
                          ? 'bg-[#0d2137] border-[#0f83b2]/30 text-white focus:border-[#0db1ec]'
                          : 'bg-white border-gray-300 text-gray-900 focus:border-[#0db1ec]'
                      } focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20`}
                      placeholder="Ej: Cardiología"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                      isDark ? 'bg-[#0d2137] text-gray-300 hover:bg-[#0f83b2]/10' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !formData.especialidad.trim()}
                    className="flex-1 px-4 py-2.5 rounded-lg font-medium bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] text-white hover:shadow-lg hover:shadow-[#0db1ec]/30 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {mode === 'create' ? 'Crear' : 'Actualizar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}