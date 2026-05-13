// src/components/farmacia/medicamentos/ModalMedicamento.tsx

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Pill } from 'lucide-react';
import { useTheme } from 'next-themes';
import type { Medicamento, MedicamentoForm, ClasificacionMedicamento } from '@/types/farmacia/medicamentos';
import { useUnidadesMedida } from '@/hooks/farmacia/useUnidadesMedida';
import Swal from 'sweetalert2';

interface ModalMedicamentoProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (medicamento: MedicamentoForm) => Promise<void>;
  medicamento?: Medicamento | null;
}

const clasificaciones: ClasificacionMedicamento[] = ['PATENTE', 'GENERICO', 'CONTROLADO'];

export default function ModalMedicamento({
  isOpen,
  onClose,
  onSave,
  medicamento,
}: ModalMedicamentoProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { unidades: unidadesMedida, obtenerUnidades } = useUnidadesMedida();
  const [formData, setFormData] = useState<MedicamentoForm>({
    nombre_comercial: '',
    sustancia_activa: '',
    clasificacion: 'GENERICO',
    id_medida: 0,
    codigo_ean: '',
    precio_unitario: 0,
  });
  const [guardando, setGuardando] = useState(false);

  // Cargar unidades de medida al abrir el modal
  useEffect(() => {
    if (isOpen) {
      obtenerUnidades();
    }
  }, [isOpen]);

  useEffect(() => {
    if (medicamento) {
      setFormData({
        nombre_comercial: medicamento.nombre_comercial,
        sustancia_activa: medicamento.sustancia_activa,
        clasificacion: medicamento.clasificacion,
        id_medida: medicamento.id_medida,
        codigo_ean: medicamento.codigo_ean || '',
        precio_unitario: parseFloat(medicamento.precio_unitario),
      });
    } else {
      setFormData({
        nombre_comercial: '',
        sustancia_activa: '',
        clasificacion: 'GENERICO',
        id_medida: (unidadesMedida && unidadesMedida.length > 0) ? unidadesMedida[0].id_medida : 0,
        codigo_ean: '',
        precio_unitario: 0,
      });
    }
  }, [medicamento, isOpen, unidadesMedida]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre_comercial.trim() || !formData.sustancia_activa.trim() || formData.id_medida === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor completa todos los campos obligatorios',
        confirmButtonColor: '#0f83b2',
        background: isDark ? '#0a1929' : '#ffffff',
        color: isDark ? '#ffffff' : '#000000',
      });
      return;
    }

    if (formData.precio_unitario < 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Valor inválido',
        text: 'El precio no puede ser negativo',
        confirmButtonColor: '#0f83b2',
        background: isDark ? '#0a1929' : '#ffffff',
        color: isDark ? '#ffffff' : '#000000',
      });
      return;
    }

    setGuardando(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo guardar el medicamento',
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
          className={`w-full max-w-3xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-[#0a1929]' : 'bg-white'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] px-6 py-4 rounded-t-2xl sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Pill size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  {medicamento ? 'Editar Medicamento' : 'Nuevo Medicamento'}
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
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Información Básica */}
            <div className="space-y-4">
              <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Información Básica
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre Comercial */}
                <div className="md:col-span-2">
                  <label className={`block text-sm font-bold mb-2 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    Nombre Comercial <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nombre_comercial}
                    onChange={(e) => setFormData({ ...formData, nombre_comercial: e.target.value })}
                    placeholder="Ej: Paracetamol Jarabe"
                    maxLength={150}
                    className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${
                      isDark
                        ? 'bg-[#0d1f2d] border-[#0f83b2]/30 text-white placeholder-gray-500 focus:border-[#0db1ec]'
                        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#0f83b2]'
                    }`}
                  />
                </div>

                {/* Sustancia Activa */}
                <div className="md:col-span-2">
                  <label className={`block text-sm font-bold mb-2 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    Sustancia Activa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.sustancia_activa}
                    onChange={(e) => setFormData({ ...formData, sustancia_activa: e.target.value })}
                    placeholder="Ej: Acetaminofén"
                    maxLength={150}
                    className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${
                      isDark
                        ? 'bg-[#0d1f2d] border-[#0f83b2]/30 text-white placeholder-gray-500 focus:border-[#0db1ec]'
                        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#0f83b2]'
                    }`}
                  />
                </div>

                {/* Clasificación */}
                <div>
                  <label className={`block text-sm font-bold mb-2 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    Clasificación <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.clasificacion}
                    onChange={(e) => setFormData({ ...formData, clasificacion: e.target.value as ClasificacionMedicamento })}
                    className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${
                      isDark
                        ? 'bg-[#0d1f2d] border-[#0f83b2]/30 text-white focus:border-[#0db1ec]'
                        : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-[#0f83b2]'
                    }`}
                  >
                    {clasificaciones.map((clasificacion) => (
                      <option key={clasificacion} value={clasificacion}>
                        {clasificacion}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Unidad de Medida */}
                <div>
                  <label className={`block text-sm font-bold mb-2 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    Unidad de Medida <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.id_medida}
                    onChange={(e) => setFormData({ ...formData, id_medida: parseInt(e.target.value) })}
                    className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${
                      isDark
                        ? 'bg-[#0d1f2d] border-[#0f83b2]/30 text-white focus:border-[#0db1ec]'
                        : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-[#0f83b2]'
                    }`}
                  >
                    <option value={0}>Seleccionar...</option>
                    {unidadesMedida && unidadesMedida.map((unidad) => (
                      <option key={unidad.id_medida} value={unidad.id_medida}>
                        {unidad.medida} ({unidad.abreviatura})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Precio */}
                <div>
                  <label className={`block text-sm font-bold mb-2 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    Precio Unitario <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.precio_unitario}
                    onChange={(e) => setFormData({ ...formData, precio_unitario: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${
                      isDark
                        ? 'bg-[#0d1f2d] border-[#0f83b2]/30 text-white placeholder-gray-500 focus:border-[#0db1ec]'
                        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#0f83b2]'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Códigos */}
            <div className="space-y-4">
              <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Código de Barras (Opcional)
              </h4>

              {/* Código EAN */}
              <div>
                <label className={`block text-sm font-bold mb-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Código EAN
                </label>
                <input
                  type="text"
                  value={formData.codigo_ean}
                  onChange={(e) => setFormData({ ...formData, codigo_ean: e.target.value })}
                  placeholder="Ej: 7501234567890"
                  maxLength={20}
                  className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${
                    isDark
                      ? 'bg-[#0d1f2d] border-[#0f83b2]/30 text-white placeholder-gray-500 focus:border-[#0db1ec]'
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#0f83b2]'
                  }`}
                />
              </div>
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
