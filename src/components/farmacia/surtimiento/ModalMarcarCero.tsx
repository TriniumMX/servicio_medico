// src/components/farmacia/surtimiento/ModalMarcarCero.tsx
'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface ModalMarcarCeroProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (motivo: string, observaciones: string) => void;
  folioReceta: string;
  isDark: boolean;
  isLoading?: boolean;
}

const MOTIVOS_PREDEFINIDOS = [
  'Sin stock',
  'Medicamento agotado',
  'Medicamento descontinuado',
  'Otro (especificar en observaciones)',
];

export default function ModalMarcarCero({
  isOpen,
  onClose,
  onConfirm,
  folioReceta,
  isDark,
  isLoading = false,
}: ModalMarcarCeroProps) {
  const [motivoSeleccionado, setMotivoSeleccionado] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const handleConfirm = () => {
    if (!motivoSeleccionado) {
      alert('Debe seleccionar un motivo');
      return;
    }

    if (motivoSeleccionado === 'Otro (especificar en observaciones)' && !observaciones.trim()) {
      alert('Debe especificar el motivo en observaciones');
      return;
    }

    onConfirm(motivoSeleccionado, observaciones);
  };

  const handleClose = () => {
    if (!isLoading) {
      setMotivoSeleccionado('');
      setObservaciones('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className={`relative w-full max-w-2xl mx-4 rounded-lg shadow-2xl ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              ⚠️ Registrar Visita sin Entrega
            </h2>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Receta: <strong>{folioReceta}</strong>
            </p>
          </div>
          {!isLoading && (
            <button
              onClick={handleClose}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
              }`}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Advertencia */}
          <div
            className={`p-4 rounded-lg border-l-4 ${
              isDark
                ? 'bg-yellow-900/20 border-yellow-600 text-yellow-300'
                : 'bg-yellow-50 border-yellow-500 text-yellow-800'
            }`}
          >
            <p className="text-sm font-medium">
              <strong>Importante:</strong> Esta acción registrará que el paciente acudió a
              farmacia pero <strong>NO recibió medicamentos</strong> por falta de stock.
            </p>
            <ul className="mt-2 text-xs list-disc list-inside space-y-1">
              <li>Se creará un surtimiento con cantidad = 0 para todos los medicamentos</li>
              <li>El Mes 1 se marcará como "surtido" pero con 0 unidades entregadas</li>
              <li>Los meses siguientes continuarán su calendario normal</li>
              <li>El paciente puede regresar cuando haya stock disponible</li>
            </ul>
          </div>

          {/* Selección de motivo */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Motivo <span className="text-red-500">*</span>
            </label>
            <select
              value={motivoSeleccionado}
              onChange={(e) => setMotivoSeleccionado(e.target.value)}
              disabled={isLoading}
              className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50`}
            >
              <option value="">Seleccione un motivo...</option>
              {MOTIVOS_PREDEFINIDOS.map((motivo) => (
                <option key={motivo} value={motivo}>
                  {motivo}
                </option>
              ))}
            </select>
          </div>

          {/* Observaciones */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Observaciones adicionales{' '}
              {motivoSeleccionado === 'Otro (especificar en observaciones)' && (
                <span className="text-red-500">*</span>
              )}
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              disabled={isLoading}
              rows={3}
              placeholder="Detalles adicionales sobre la visita..."
              className={`w-full px-4 py-2 rounded-lg border transition-colors resize-none ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50`}
            />
          </div>

          {/* Resumen */}
          <div
            className={`p-4 rounded-lg ${
              isDark ? 'bg-gray-700/50' : 'bg-gray-50'
            }`}
          >
            <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              📋 Resumen de la acción:
            </p>
            <ul className={`text-xs space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <li>✓ Se registrará la visita del paciente</li>
              <li>✓ Cantidad entregada: <strong>0 unidades</strong> de todos los medicamentos</li>
              <li>✓ Motivo: <strong>{motivoSeleccionado || '(pendiente)'}</strong></li>
              <li>✓ El paciente podrá volver cuando haya disponibilidad</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`flex items-center justify-end gap-3 p-6 border-t ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <button
            onClick={handleClose}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isDark
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } disabled:opacity-50`}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || !motivoSeleccionado}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              isDark
                ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                : 'bg-yellow-500 text-white hover:bg-yellow-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? '⏳ Procesando...' : '✓ Confirmar Registro'}
          </button>
        </div>
      </div>
    </div>
  );
}
