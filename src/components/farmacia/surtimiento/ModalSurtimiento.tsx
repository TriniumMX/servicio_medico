// src/components/farmacia/surtimiento/ModalSurtimiento.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MedicamentoReceta,
  BuscarEANResponse,
  SurtimientoRequest,
  SurtimientoResponse,
} from '@/types/farmacia/surtimiento';
import { X, ScanBarcode, CheckCircle, AlertTriangle, Package, Search, ArrowLeft, Loader2 } from 'lucide-react';

interface ModalSurtimientoProps {
  medicamento: MedicamentoReceta;
  isDark: boolean;
  onClose: () => void;
  onSurtimientoExitoso: () => void;
}

export default function ModalSurtimiento({
  medicamento,
  isDark,
  onClose,
  onSurtimientoExitoso,
}: ModalSurtimientoProps) {
  const [paso, setPaso] = useState<'escanear' | 'confirmar'>('escanear');
  const [eanInput, setEanInput] = useState('');
  const [medicamentoEscaneado, setMedicamentoEscaneado] = useState<BuscarEANResponse['data'] | null>(null);
  const [cantidadASurtir, setCantidadASurtir] = useState(medicamento.surtimientos.pendiente_surtir);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const inputEanRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (paso === 'escanear' && inputEanRef.current) {
      inputEanRef.current.focus();
    }
  }, [paso]);

  const buscarMedicamentoPorEAN = async () => {
    if (!eanInput.trim()) {
      setError('Debe escanear o ingresar el código EAN');
      return;
    }

    setCargando(true);
    setError(null);

    try {
      const response = await fetch(`/api/farmacia/medicamentos/buscar-ean?ean=${eanInput.trim()}`);
      const data: BuscarEANResponse = await response.json();

      if (!data.success || !data.data) {
        setError(data.error || 'Medicamento no encontrado');
        return;
      }

      if (data.data.medicamento.id_medicamento !== medicamento.medicamento.id_medicamento) {
        setError(
          `⚠️ Medicamento incorrecto. Se esperaba "${medicamento.medicamento.nombre_comercial}" pero se escaneó "${data.data.medicamento.nombre_comercial}"`
        );
        return;
      }

      if (data.data.alertas.sin_stock) {
        setError('⛔ Este medicamento está agotado en inventario');
        return;
      }

      if (data.data.inventario.existencia_actual < cantidadASurtir) {
        setCantidadASurtir(data.data.inventario.existencia_actual);
      }

      setMedicamentoEscaneado(data.data);
      setPaso('confirmar');
    } catch (err) {
      console.error('Error al buscar medicamento:', err);
      setError('Error al buscar medicamento');
    } finally {
      setCargando(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') buscarMedicamentoPorEAN();
  };

  const registrarSurtimiento = async () => {
    if (!medicamentoEscaneado) return;

    setCargando(true);
    setError(null);

    try {
      const body: SurtimientoRequest = {
        id_detalle: medicamento.id_detalle,
        cantidad_surtida: cantidadASurtir,
        observaciones: 'Surtimiento desde módulo de farmacia',
      };

      const response = await fetch('/api/recetas/surtir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data: SurtimientoResponse = await response.json();

      if (!data.success) {
        setError(data.error || 'Error al registrar surtimiento');
        return;
      }

      setExito(data.message || 'Surtimiento registrado exitosamente');

      if (data.data?.inventario.alertas.stock_critico || data.data?.inventario.alertas.stock_bajo) {
        setTimeout(() => {
          alert(`⚠️ ${data.data?.inventario.alertas.mensaje}\n\nStock actual: ${data.data?.inventario.stock_actual} piezas`);
        }, 500);
      }

      setTimeout(() => {
        onSurtimientoExitoso();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error al registrar surtimiento:', err);
      setError('Error al registrar surtimiento');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className={`relative w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden
           ${isDark ? 'bg-[#0f2438] border border-gray-700' : 'bg-white'}
        `}
      >
        {/* Header */}
        <div className={`p-6 flex items-center justify-between border-b
           ${isDark ? 'border-gray-800 bg-[#0a1929]' : 'border-gray-100 bg-gray-50/50'}
        `}>
          <h2 className={`text-xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
              <Package size={20} />
            </div>
            Surtir Medicamento
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors
                 ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}
              `}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Info Medicamento */}
          <div className={`p-5 rounded-2xl flex gap-4
              ${isDark ? 'bg-blue-900/10 border border-blue-900/30' : 'bg-blue-50 border border-blue-100'}
           `}>
            <div className="shrink-0">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center
                    ${isDark ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white'}
                 `}>
                <Package size={24} />
              </div>
            </div>
            <div>
              <p className={`text-sm font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                Medicamento Prescrito
              </p>
              <h3 className={`text-lg font-bold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {medicamento.medicamento.nombre_comercial}
              </h3>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {medicamento.medicamento.sustancia_activa}
              </p>
            </div>
          </div>

          {/* Step 1: Scan */}
          {paso === 'escanear' && (
            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-bold mb-3 ml-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Escanee el código EAN del empaque
                </label>
                <div className="relative">
                  <input
                    ref={inputEanRef}
                    type="text"
                    value={eanInput}
                    onChange={(e) => setEanInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escanee aquí..."
                    className={`w-full pl-12 pr-4 py-4 rounded-xl border-2 text-lg font-mono outline-none transition-all
                             ${isDark
                        ? 'bg-gray-900/50 border-gray-700 text-white focus:border-blue-500 placeholder:text-gray-600'
                        : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500 placeholder:text-gray-400'
                      }
                          `}
                    autoComplete="off"
                  />
                  <ScanBarcode className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
              </div>

              <button
                onClick={buscarMedicamentoPorEAN}
                disabled={cargando || !eanInput.trim()}
                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95
                       ${isDark
                    ? 'bg-blue-600 hover:bg-blue-500 text-white disabled:bg-gray-800 disabled:text-gray-600'
                    : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-200 disabled:text-gray-400'
                  }
                    `}
              >
                {cargando ? <Loader2 className="animate-spin" /> : 'Validar Medicamento'}
              </button>
            </div>
          )}

          {/* Step 2: Confirm */}
          {paso === 'confirmar' && medicamentoEscaneado && (
            <div className="space-y-6">
              <div className={`p-4 rounded-xl flex items-center gap-3
                    ${isDark ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-green-50 text-green-700 border border-green-200'}
                 `}>
                <CheckCircle size={20} />
                <span className="font-bold">Medicamento validado correctamente</span>
              </div>

              <div className={`grid grid-cols-2 gap-4 p-5 rounded-2xl
                    ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}
                 `}>
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Existencia Actual
                  </p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {medicamentoEscaneado.inventario.existencia_actual}
                  </p>
                </div>
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Fondo Fijo
                  </p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {medicamentoEscaneado.inventario.fondo_fijo}
                  </p>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-bold mb-3 ml-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Confirmar Cantidad a Surtir
                </label>
                <input
                  type="number"
                  value={cantidadASurtir}
                  onChange={(e) => setCantidadASurtir(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  max={Math.min(medicamento.surtimientos.pendiente_surtir, medicamentoEscaneado.inventario.existencia_actual)}
                  className={`w-full px-4 py-4 rounded-xl border-2 text-2xl font-bold text-center outline-none transition-all
                          ${isDark
                      ? 'bg-gray-900/50 border-gray-700 text-white focus:border-blue-500'
                      : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
                    }
                       `}
                />
                <p className={`text-center mt-2 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Max: {Math.min(medicamento.surtimientos.pendiente_surtir, medicamentoEscaneado.inventario.existencia_actual)} piezas
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    setPaso('escanear');
                    setEanInput('');
                    setMedicamentoEscaneado(null);
                    setError(null);
                  }}
                  className={`flex-1 py-4 rounded-xl font-bold transition-colors
                          ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}
                       `}
                >
                  Volver
                </button>
                <button
                  onClick={registrarSurtimiento}
                  disabled={cargando || cantidadASurtir <= 0}
                  className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95
                          ${isDark ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}
                       `}
                >
                  {cargando ? <Loader2 className="animate-spin" /> : 'Confirmar'}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium
                 ${isDark ? 'bg-red-900/20 text-red-400 border border-red-900/30' : 'bg-red-50 text-red-600 border border-red-100'}
              `}>
              <AlertTriangle size={18} className="shrink-0" />
              {error}
            </div>
          )}

          {exito && (
            <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium
                 ${isDark ? 'bg-green-900/20 text-green-400 border border-green-900/30' : 'bg-green-50 text-green-600 border border-green-100'}
              `}>
              <CheckCircle size={18} className="shrink-0" />
              {exito}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

