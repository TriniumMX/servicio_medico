'use client';

import { useState, useRef, useEffect } from 'react';
import { ResurtimientosResponse } from '@/types/farmacia/resurtimiento';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, ArrowRight, TableProperties, XCircle, Calendar, User, FileText, AlertTriangle, UserX } from 'lucide-react';

interface RecetaCanceladaInfo {
  folio_receta: string;
  motivo_cancelacion: string | null;
  fecha_cancelacion: string | null;
  usuario_cancelo?: { nombre: string; username: string } | null;
}

interface BusquedaRecetaOriginalProps {
  onRecetaEncontrada: (data: ResurtimientosResponse['data']) => void;
  isDark: boolean;
}

export default function BusquedaRecetaOriginal({
  onRecetaEncontrada,
  isDark,
}: BusquedaRecetaOriginalProps) {
  const [folioInput, setFolioInput] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [recetaCancelada, setRecetaCancelada] = useState<RecetaCanceladaInfo | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleLimpiarCancelada = () => {
    setRecetaCancelada(null);
    setFolioInput('');
    setError(null);
  };

  const buscarReceta = async () => {
    if (!folioInput.trim()) {
      setError('Por favor, ingrese un folio');
      return;
    }

    setCargando(true);
    setError(null);
    setRecetaCancelada(null);

    try {
      const response = await fetch(`/api/recetas/cupones-por-folio/${folioInput.trim()}`);
      const data: ResurtimientosResponse = await response.json();

      if (!data.success || !data.data) {
        // Verificar si el error es por receta cancelada
        if (data.receta_cancelada) {
          setRecetaCancelada({
            folio_receta: folioInput.trim(),
            motivo_cancelacion: data.motivo_cancelacion || null,
            fecha_cancelacion: data.fecha_cancelacion || null,
            usuario_cancelo: data.usuario_cancelo,
          });
        } else {
          setError(data.error || 'Receta no encontrada');
        }
        return;
      }

      if (data.data.resumen.medicamentos_con_cupones_pendientes === 0) {
        setError('Esta receta no tiene cupones pendientes para resurtir');
        return;
      }

      setFolioInput('');
      onRecetaEncontrada(data.data);
    } catch (err) {
      console.error('Error al buscar receta:', err);
      setError('Ocurrió un error al buscar la receta. Intente nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    buscarReceta();
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-6 sm:py-8 md:py-12 px-4">

      {/* Subtle Background Ring - Responsive */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-5">
        <div className={`w-[250px] sm:w-[300px] md:w-[350px] h-[250px] sm:h-[300px] md:h-[350px] rounded-full border border-dashed ${isDark ? 'border-cyan-500' : 'border-cyan-600'}`} />
      </div>

      <div className="relative z-10 flex flex-col items-center">

        {/* Icon - Responsive Size */}
        <div className={`mb-5 sm:mb-6 md:mb-8 p-3 sm:p-4 md:p-5 rounded-2xl sm:rounded-3xl backdrop-blur-sm border transition-all duration-300 ${isDark ? 'border-cyan-500/20 bg-cyan-950/10' : 'border-cyan-500/10 bg-cyan-50/50'
          }`}>
          <TableProperties
            size={32}
            strokeWidth={1.5}
            className={`sm:w-9 sm:h-9 md:w-10 md:h-10 ${isFocused ? 'text-cyan-500' : (isDark ? 'text-gray-600' : 'text-gray-400')}`}
          />
        </div>

        {/* Headlines - Responsive */}
        <div className="text-center mb-6 sm:mb-8 md:mb-10">
          <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold mb-1.5 sm:mb-2 tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Búsqueda de Tratamiento
          </h2>
          <p className={`text-sm sm:text-base ${isDark ? 'text-cyan-400/80' : 'text-cyan-600/80'}`}>
            Ingrese el número de la receta original
          </p>
        </div>

        {/* Search Bar - Responsive */}
        <form onSubmit={handleSubmit} className="w-full relative group">
          <motion.div
            initial={false}
            animate={isFocused ? { scale: 1.01 } : { scale: 1 }}
            className={`relative rounded-xl sm:rounded-2xl border-2 transition-all duration-300 flex items-center p-1.5 sm:p-2 md:p-2.5 ${error
                ? 'border-red-500'
                : isFocused
                  ? `border-cyan-500 bg-transparent`
                  : `${isDark ? 'border-gray-700' : 'border-gray-300'} bg-transparent`
              }`}
          >
            {/* Prefix Badge - Responsive */}
            <div className={`px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2 rounded-lg sm:rounded-xl font-mono font-bold text-base sm:text-lg select-none transition-colors ${isFocused
                ? (isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-700')
                : (isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400')
              }`}>
              R-
            </div>

            {/* Main Input - Responsive Size */}
            <input
              ref={inputRef}
              type="text"
              value={folioInput}
              onChange={(e) => {
                const val = e.target.value.replace(/^R-/i, '').replace(/[^a-zA-Z0-9-]/g, '');
                setFolioInput(val.toUpperCase());
                if (error) setError(null);
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="2025-XXXXXX"
              className={`flex-1 bg-transparent border-none outline-none px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-lg sm:text-xl md:text-2xl font-mono uppercase w-full tracking-wide sm:tracking-wider ${isDark ? 'text-white placeholder-gray-700' : 'text-gray-900 placeholder-gray-300'
                }`}
              disabled={cargando}
              autoComplete="off"
            />

            {/* Action Button - Responsive */}
            <button
              type="submit"
              disabled={cargando || !folioInput}
              className={`p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl transition-all duration-300 ${folioInput
                  ? 'bg-cyan-600 text-white hover:bg-cyan-500 shadow-md'
                  : 'bg-transparent text-gray-400 opacity-0 w-0 p-0 overflow-hidden'
                }`}
            >
              {cargando ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} className="sm:w-6 sm:h-6" />}
            </button>
          </motion.div>

          {/* Error Message - Responsive */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute -bottom-8 sm:-bottom-10 left-0 w-full flex items-center justify-center"
              >
                <span className="text-red-500 text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 bg-red-500/10 px-2.5 sm:px-3 py-1 rounded-full border border-red-500/20">
                  <AlertCircle size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate max-w-[250px] sm:max-w-none">{error}</span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {/* Alerta detallada de receta cancelada */}
        <AnimatePresence>
          {recetaCancelada && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mt-12 p-5 rounded-2xl border-2 ${
                isDark ? 'bg-red-950/30 border-red-800' : 'bg-red-50 border-red-200'
              }`}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-xl ${isDark ? 'bg-red-900/50' : 'bg-red-100'}`}>
                  <XCircle className={isDark ? 'text-red-400' : 'text-red-600'} size={24} />
                </div>
                <div>
                  <h3 className={`font-bold text-lg ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                    Receta Cancelada
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-red-400/70' : 'text-red-600/70'}`}>
                    No se pueden generar resurtimientos
                  </p>
                </div>
              </div>

              {/* Info Grid */}
              <div className={`grid grid-cols-1 gap-3 mb-4 p-3 rounded-xl ${
                isDark ? 'bg-gray-900/50' : 'bg-white'
              }`}>
                {/* Folio */}
                <div className="flex items-center gap-2">
                  <FileText size={16} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                  <div>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Folio de Receta</p>
                    <p className={`font-mono font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {recetaCancelada.folio_receta}
                    </p>
                  </div>
                </div>

                {/* Fecha cancelación */}
                {recetaCancelada.fecha_cancelacion && (
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Fecha de cancelación</p>
                      <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatDate(recetaCancelada.fecha_cancelacion)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Usuario que canceló */}
                {recetaCancelada.usuario_cancelo && (
                  <div className="flex items-center gap-2">
                    <UserX size={16} className={isDark ? 'text-red-400' : 'text-red-500'} />
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Cancelado por</p>
                      <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {recetaCancelada.usuario_cancelo.nombre}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        @{recetaCancelada.usuario_cancelo.username}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Motivo */}
              <div className={`p-3 rounded-xl ${isDark ? 'bg-red-900/30' : 'bg-red-100/50'}`}>
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className={`flex-shrink-0 mt-0.5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                  <div>
                    <p className={`text-xs font-bold uppercase ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                      Motivo de cancelación
                    </p>
                    <p className={`text-sm mt-1 ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                      {recetaCancelada.motivo_cancelacion || 'No especificado'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Botón buscar otra */}
              <button
                onClick={handleLimpiarCancelada}
                className={`w-full mt-4 py-3 px-4 rounded-xl font-bold transition-all ${
                  isDark
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Buscar otra receta
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
