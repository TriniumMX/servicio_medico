// src/components/farmacia/alertas/ModalAgregarCorreo.tsx

'use client';

import { useState, useEffect } from 'react';
import { X, Mail, User, Loader2 } from 'lucide-react';
import type { CorreoAlerta, CorreoAlertaForm } from '@/types/alertas-fondos';

interface ModalAgregarCorreoProps {
  isOpen: boolean;
  onClose: () => void;
  onGuardar: (datos: CorreoAlertaForm) => Promise<void>;
  correoEditar?: CorreoAlerta | null;
  loading?: boolean;
  isDark: boolean;
}

export function ModalAgregarCorreo({
  isOpen,
  onClose,
  onGuardar,
  correoEditar,
  loading = false,
  isDark,
}: ModalAgregarCorreoProps) {
  const [formData, setFormData] = useState<CorreoAlertaForm>({
    correo: '',
    nombre_destinatario: '',
    activo: true,
  });
  const [errors, setErrors] = useState<{ correo?: string; nombre?: string }>({});

  // Cargar datos si estamos editando
  useEffect(() => {
    if (correoEditar) {
      setFormData({
        correo: correoEditar.correo,
        nombre_destinatario: correoEditar.nombre_destinatario,
        activo: correoEditar.activo,
      });
    } else {
      setFormData({
        correo: '',
        nombre_destinatario: '',
        activo: true,
      });
    }
    setErrors({});
  }, [correoEditar, isOpen]);

  const validarFormulario = (): boolean => {
    const nuevosErrores: { correo?: string; nombre?: string } = {};

    if (!formData.correo.trim()) {
      nuevosErrores.correo = 'El correo es requerido';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.correo)) {
        nuevosErrores.correo = 'El formato del correo no es valido';
      }
    }

    if (!formData.nombre_destinatario.trim()) {
      nuevosErrores.nombre = 'El nombre es requerido';
    }

    setErrors(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    try {
      await onGuardar(formData);
      onClose();
    } catch (error) {
      // El error se maneja en el componente padre
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay con glassmorphism */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative w-full max-w-md transform rounded-2xl shadow-2xl transition-all border ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          {/* Header */}
          <div className={`flex items-center justify-between border-b px-6 py-5 ${
            isDark ? 'border-slate-800' : 'border-slate-100'
          }`}>
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {correoEditar ? 'Editar Correo' : 'Agregar Correo'}
            </h3>
            <button
              onClick={onClose}
              className={`rounded-xl p-2 text-slate-400 transition-colors ${
                isDark
                  ? 'hover:bg-slate-800 hover:text-slate-300'
                  : 'hover:bg-slate-100 hover:text-slate-600'
              }`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
            {/* Nombre */}
            <div>
              <label
                htmlFor="nombre"
                className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
              >
                Nombre del destinatario
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  id="nombre"
                  value={formData.nombre_destinatario}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre_destinatario: e.target.value })
                  }
                  className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none placeholder:text-slate-400 ${
                    isDark
                      ? 'bg-slate-800/50 text-white'
                      : 'bg-slate-50 text-slate-900'
                  } ${errors.nombre ? (isDark ? 'border-red-800' : 'border-red-300') : (isDark ? 'border-slate-700' : 'border-slate-200')}`}
                  placeholder="Ej: Dr. Juan Perez"
                />
              </div>
              {errors.nombre && (
                <p className={`mt-1.5 text-sm font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>{errors.nombre}</p>
              )}
            </div>

            {/* Correo */}
            <div>
              <label
                htmlFor="correo"
                className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
              >
                Correo electronico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  id="correo"
                  value={formData.correo}
                  onChange={(e) =>
                    setFormData({ ...formData, correo: e.target.value })
                  }
                  className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none placeholder:text-slate-400 ${
                    isDark
                      ? 'bg-slate-800/50 text-white'
                      : 'bg-slate-50 text-slate-900'
                  } ${errors.correo ? (isDark ? 'border-red-800' : 'border-red-300') : (isDark ? 'border-slate-700' : 'border-slate-200')}`}
                  placeholder="correo@ejemplo.com"
                />
              </div>
              {errors.correo && (
                <p className={`mt-1.5 text-sm font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>{errors.correo}</p>
              )}
            </div>

            {/* Estado activo */}
            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-100'
            }`}>
              <label className="flex items-center cursor-pointer select-none">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={formData.activo}
                    onChange={(e) =>
                      setFormData({ ...formData, activo: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${
                    isDark ? 'bg-slate-600' : 'bg-slate-300'
                  }`}></div>
                </div>
                <span className={`ml-3 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  Activo para recibir alertas
                </span>
              </label>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-colors border ${
                  isDark
                    ? 'text-slate-300 bg-slate-800 border-slate-700 hover:bg-slate-700'
                    : 'text-slate-700 bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 active:bg-blue-800 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all"
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {correoEditar ? 'Guardar Cambios' : 'Agregar Correo'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
