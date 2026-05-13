// src/components/farmacia/inventario/ModalEditarInventario.tsx

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Package } from 'lucide-react';
import { useTheme } from 'next-themes';
import type { InventarioMedicamento, InventarioForm } from '@/types/farmacia/medicamentos';
import Swal from 'sweetalert2';

interface ModalEditarInventarioProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: InventarioForm) => Promise<void>;
  inventario: InventarioMedicamento;
}

export default function ModalEditarInventario({
  isOpen,
  onClose,
  onSave,
  inventario,
}: ModalEditarInventarioProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [modo, setModo] = useState<'surtir' | 'ajustar'>('surtir');
  const [formData, setFormData] = useState<InventarioForm>({
    existencia_actual: 0,
    cantidad_surtir: 0,
    fondo_fijo: 1,
    es_cuadro_basico: false,
    observaciones: '',
  });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (inventario) {
      setFormData({
        existencia_actual: inventario.existencia_actual,
        cantidad_surtir: 0,
        fondo_fijo: inventario.fondo_fijo,
        es_cuadro_basico: inventario.es_cuadro_basico,
        observaciones: inventario.observaciones || '',
      });
      setModo('surtir');
    }
  }, [inventario]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (modo === 'ajustar') {
      if (formData.existencia_actual !== undefined && formData.existencia_actual < 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Valor inválido',
          text: 'La existencia actual no puede ser negativa',
          confirmButtonColor: '#0f83b2',
          background: isDark ? '#0a1929' : '#ffffff',
          color: isDark ? '#ffffff' : '#000000',
        });
        return;
      }
    }

    if (modo === 'surtir') {
      if (!formData.cantidad_surtir || formData.cantidad_surtir <= 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Valor inválido',
          text: 'La cantidad a surtir debe ser mayor a 0',
          confirmButtonColor: '#0f83b2',
          background: isDark ? '#0a1929' : '#ffffff',
          color: isDark ? '#ffffff' : '#000000',
        });
        return;
      }
    }

    if (formData.fondo_fijo <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Valor inválido',
        text: 'El fondo fijo debe ser mayor a 0',
        confirmButtonColor: '#0f83b2',
        background: isDark ? '#0a1929' : '#ffffff',
        color: isDark ? '#ffffff' : '#000000',
      });
      return;
    }

    setGuardando(true);
    try {
      // Limpiar datos según el modo
      const dataToSend: InventarioForm = {
        fondo_fijo: formData.fondo_fijo,
        es_cuadro_basico: formData.es_cuadro_basico,
        observaciones: formData.observaciones,
      };

      if (modo === 'surtir') {
        dataToSend.cantidad_surtir = formData.cantidad_surtir;
      } else {
        dataToSend.existencia_actual = formData.existencia_actual;
      }

      await onSave(dataToSend);
      onClose();
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo actualizar el inventario',
        confirmButtonColor: '#0f83b2',
        background: isDark ? '#0a1929' : '#ffffff',
        color: isDark ? '#ffffff' : '#000000',
      });
    } finally {
      setGuardando(false);
    }
  };

  // Calcular el estado y previsualización
  const existenciaBase = inventario?.existencia_actual || 0;
  const cantidadSurtir = formData.cantidad_surtir || 0;

  // La nueva existencia depende del modo
  const nuevaExistencia = modo === 'surtir'
    ? existenciaBase + cantidadSurtir
    : (formData.existencia_actual || 0);

  const fondo = formData.fondo_fijo;
  const estaCompleto = nuevaExistencia >= fondo;
  const piezasFaltantes = estaCompleto ? 0 : fondo - nuevaExistencia;

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
          className={`w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-[#0a1929]' : 'bg-white'
            }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] px-6 py-4 rounded-t-2xl sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Package size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {modo === 'surtir' ? 'Resurtir Inventario' : 'Editar Inventario'}
                  </h3>
                  <p className="text-sm text-white/80">
                    {inventario.nombre_comercial}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-all"
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            {/* Tabs para cambiar modo */}
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => setModo('surtir')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${modo === 'surtir'
                    ? 'bg-white text-[#0f83b2]'
                    : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
              >
                Resurtir (Sumar)
              </button>
              <button
                type="button"
                onClick={() => {
                  setModo('ajustar');
                  // Al cambiar a ajustar, asegurar que existencia_actual tenga el valor real al inicio
                  setFormData(prev => ({ ...prev, existencia_actual: inventario.existencia_actual }));
                }}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${modo === 'ajustar'
                    ? 'bg-white text-[#0f83b2]'
                    : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
              >
                Ajuste Manual (Corregir)
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Información del Medicamento (Read-only) */}
            <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    Sustancia Activa
                  </p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {inventario.sustancia_activa}
                  </p>
                </div>
                <div>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    Existencia Base
                  </p>
                  <p className={`font-medium text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {inventario.existencia_actual} {inventario.abreviatura}
                  </p>
                </div>
              </div>
            </div>

            {/* Gestión segun modo */}
            <div className="space-y-4">
              <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {modo === 'surtir' ? 'Datos de Resurtimiento' : 'Datos de Ajuste'}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modo === 'surtir' ? (
                  /* Modo Surtir */
                  <div className={`p-4 rounded-xl border-2 ${isDark ? 'bg-[#0d1f2d] border-[#0db1ec]/50' : 'bg-blue-50 border-blue-300'
                    }`}>
                    <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-[#0db1ec]' : 'text-blue-700'
                      }`}>
                      Cantidad a Surtir (+)<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.cantidad_surtir || ''}
                      onChange={(e) => setFormData({ ...formData, cantidad_surtir: parseInt(e.target.value) || 0 })}
                      className={`w-full px-4 py-3 text-xl font-bold rounded-xl border-2 outline-none transition-all ${isDark
                          ? 'bg-[#0a1929] border-[#0f83b2]/30 text-white focus:border-[#0db1ec]'
                          : 'bg-white border-blue-300 text-gray-900 focus:border-blue-500'
                        }`}
                      placeholder="0"
                      autoFocus
                    />
                    <p className={`mt-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Se sumará a la existencia actual ({existenciaBase})
                    </p>
                  </div>
                ) : (
                  /* Modo Ajuste */
                  <div className={`p-4 rounded-xl border-2 ${isDark ? 'bg-[#0d1f2d] border-orange-500/50' : 'bg-orange-50 border-orange-300'
                    }`}>
                    <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-orange-400' : 'text-orange-700'
                      }`}>
                      Nueva Existencia Total <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.existencia_actual}
                      onChange={(e) => setFormData({ ...formData, existencia_actual: parseInt(e.target.value) || 0 })}
                      className={`w-full px-4 py-3 text-xl font-bold rounded-xl border-2 outline-none transition-all ${isDark
                          ? 'bg-[#0a1929] border-orange-500/30 text-white focus:border-orange-500'
                          : 'bg-white border-orange-300 text-gray-900 focus:border-orange-500'
                        }`}
                      placeholder="0"
                    />
                    <p className={`mt-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Sobreescribe el valor actual
                    </p>
                  </div>
                )}

                {/* Fondo Fijo (Comun) */}
                <div>
                  <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                    Fondo Fijo Asignado <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.fondo_fijo}
                    onChange={(e) => setFormData({ ...formData, fondo_fijo: parseInt(e.target.value) || 1 })}
                    className={`w-full px-4 py-3 text-xl font-bold rounded-xl border-2 outline-none transition-all ${isDark
                        ? 'bg-[#0d1f2d] border-[#0f83b2]/30 text-white focus:border-[#0db1ec]'
                        : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-[#0f83b2]'
                      }`}
                  />
                </div>
              </div>

              {/* Previsualización del cambio */}
              <div className={`p-4 rounded-xl border-2 ${estaCompleto
                  ? isDark ? 'bg-green-900/20 border-green-500/50' : 'bg-green-50 border-green-300'
                  : isDark ? 'bg-red-900/20 border-red-500/50' : 'bg-red-50 border-red-300'
                }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-bold ${estaCompleto ? 'text-green-600' : 'text-red-600'}`}>
                      Resultado: {estaCompleto ? 'Fondo Completo' : 'Requiere Reposición'}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Nueva Existencia: <span className="font-bold text-lg">{nuevaExistencia}</span> / {fondo}
                    </p>
                  </div>
                  {!estaCompleto && (
                    <div className="text-right">
                      <p className="text-xl font-bold text-red-600">-{piezasFaltantes}</p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        faltantes
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Cuadro Básico */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="cuadro_basico"
                  checked={formData.es_cuadro_basico}
                  onChange={(e) => setFormData({ ...formData, es_cuadro_basico: e.target.checked })}
                  className="w-5 h-5 rounded border-2 border-[#0f83b2] text-[#0db1ec] focus:ring-2 focus:ring-[#0db1ec]/20"
                />
                <label
                  htmlFor="cuadro_basico"
                  className={`text-sm font-bold cursor-pointer ${isDark ? 'text-white' : 'text-gray-900'
                    }`}
                >
                  Es parte del Cuadro Básico
                </label>
              </div>

              {/* Observaciones */}
              <div>
                <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                  Observaciones / Notas del movimiento
                </label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  rows={2}
                  placeholder={modo === 'surtir' ? "Ej. Factura A-123..." : "Motivo del ajuste..."}
                  className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all resize-none ${isDark
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
                className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all ${isDark
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
                    {modo === 'surtir' ? 'Confirmar Resurtimiento' : 'Guardar Ajuste'}
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
