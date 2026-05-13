// src/components/farmacia/surtimiento/BusquedaReceta.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { BuscarRecetaResponse } from '@/types/farmacia/surtimiento';
import { Search, ScanBarcode, Keyboard, Loader2, XCircle, Calendar, User, FileText, AlertTriangle, UserX } from 'lucide-react';

interface RecetaCanceladaInfo {
  folio_receta: string;
  motivo_cancelacion: string | null;
  fecha_cancelacion: string | null;
  paciente?: string;
  usuario_cancelo?: { nombre: string; username: string } | null;
}

interface BusquedaRecetaProps {
  onRecetaEncontrada: (data: BuscarRecetaResponse['data']) => void;
  isDark: boolean;
}

export default function BusquedaReceta({ onRecetaEncontrada, isDark }: BusquedaRecetaProps) {
  const [codigoBarras, setCodigoBarras] = useState('');
  const [folioManual, setFolioManual] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tipoBusqueda, setTipoBusqueda] = useState<'barras' | 'manual'>('barras');
  const [recetaCancelada, setRecetaCancelada] = useState<RecetaCanceladaInfo | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tipoBusqueda === 'barras' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [tipoBusqueda]);

  const buscarReceta = async (codigo?: string, folio?: string) => {
    setCargando(true);
    setError(null);
    setRecetaCancelada(null);

    try {
      const params = new URLSearchParams();
      if (codigo) params.append('codigo', codigo);
      if (folio) params.append('folio', folio);

      const response = await fetch(`/api/recetas/buscar?${params.toString()}`);
      const data: BuscarRecetaResponse = await response.json();

      if (!data.success || !data.data) {
        setError(data.error || 'Receta no encontrada');
        return;
      }

      // Validar si la receta está cancelada
      if (data.data.receta.cancelado) {
        setRecetaCancelada({
          folio_receta: data.data.receta.folio_receta,
          motivo_cancelacion: data.data.receta.motivo_cancelacion,
          fecha_cancelacion: data.data.receta.fecha_cancelacion,
          paciente: data.data.paciente?.nombre || data.data.paciente?.nombre_completo,
          usuario_cancelo: data.data.receta.usuario_cancelo,
        });
        return;
      }

      setCodigoBarras('');
      setFolioManual('');
      onRecetaEncontrada(data.data);
    } catch (err) {
      console.error('Error al buscar receta:', err);
      setError('Error de conexión al buscar receta.');
    } finally {
      setCargando(false);
    }
  };

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
    setCodigoBarras('');
    setFolioManual('');
  };

  const handleSubmitBarras = (e: React.FormEvent) => {
    e.preventDefault();
    if (codigoBarras.trim()) buscarReceta(codigoBarras.trim());
  };

  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (folioManual.trim()) buscarReceta(undefined, folioManual.trim());
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <div className="text-center mb-10">
        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4
            ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}
         `}>
          <Search size={32} />
        </div>
        <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Buscar Receta
        </h2>
        <p className={`mt-2 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Seleccione el método de búsqueda para comenzar
        </p>
      </div>

      {/* Tabs - Transparent Container */}
      <div className="flex mb-8 max-w-md mx-auto gap-2">
        <button
          onClick={() => setTipoBusqueda('barras')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all border
                ${tipoBusqueda === 'barras'
              ? (isDark ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-sm')
              : (isDark ? 'bg-transparent border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/30' : 'bg-transparent border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100')
            }
             `}
        >
          <ScanBarcode size={18} /> Código de Barras
        </button>
        <button
          onClick={() => setTipoBusqueda('manual')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all border
                ${tipoBusqueda === 'manual'
              ? (isDark ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-sm')
              : (isDark ? 'bg-transparent border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/30' : 'bg-transparent border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100')
            }
             `}
        >
          <Keyboard size={18} /> Folio Manual
        </button>
      </div>

      {/* Forms */}
      <div className="max-w-xl mx-auto">
        {tipoBusqueda === 'barras' ? (
          <form onSubmit={handleSubmitBarras} className="relative">
            <input
              ref={inputRef}
              type="text"
              value={codigoBarras}
              onChange={(e) => setCodigoBarras(e.target.value.toUpperCase())}
              placeholder="Escanee el código..."
              disabled={cargando}
              className={`w-full pl-14 pr-4 py-5 rounded-2xl border-2 text-xl font-mono outline-none transition-all
                      ${isDark
                  ? 'bg-transparent border-gray-700 text-white focus:border-emerald-500 placeholder:text-gray-600'
                  : 'bg-transparent border-gray-200 text-gray-900 focus:border-emerald-500 placeholder:text-gray-400'
                }
                   `}
            />
            <ScanBarcode className={`absolute left-5 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} size={24} />
          </form>
        ) : (
          <form onSubmit={handleSubmitManual} className="relative">
            <input
              type="text"
              value={folioManual}
              onChange={(e) => setFolioManual(e.target.value.toUpperCase())}
              placeholder="Ej: R-2023-..."
              disabled={cargando}
              className={`w-full pl-14 pr-4 py-5 rounded-2xl border-2 text-xl font-mono outline-none transition-all
                      ${isDark
                  ? 'bg-transparent border-gray-700 text-white focus:border-emerald-500 placeholder:text-gray-600'
                  : 'bg-transparent border-gray-200 text-gray-900 focus:border-emerald-500 placeholder:text-gray-400'
                }
                   `}
            />
            <Keyboard className={`absolute left-5 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} size={24} />
          </form>
        )}

        {/* Action Button */}
        <button
          onClick={tipoBusqueda === 'barras' ? handleSubmitBarras : handleSubmitManual}
          disabled={cargando || (tipoBusqueda === 'barras' ? !codigoBarras : !folioManual)}
          className={`w-full mt-8 py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all transform active:scale-[0.98]
                ${isDark
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-600 shadow-lg shadow-emerald-900/20'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 shadow-lg shadow-emerald-500/20'
            }
             `}
        >
          {cargando ? <Loader2 className="animate-spin" /> : 'Buscar Receta'}
        </button>

        {error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-sm text-center font-bold backdrop-blur-sm">
            {error}
          </div>
        )}

        {/* Alerta detallada de receta cancelada */}
        {recetaCancelada && (
          <div className={`mt-6 p-5 rounded-2xl border-2 ${
            isDark ? 'bg-red-950/30 border-red-800' : 'bg-red-50 border-red-200'
          }`}>
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
                  Esta receta no puede ser surtida
                </p>
              </div>
            </div>

            {/* Info Grid */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 p-3 rounded-xl ${
              isDark ? 'bg-gray-900/50' : 'bg-white'
            }`}>
              {/* Folio */}
              <div className="flex items-center gap-2">
                <FileText size={16} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                <div>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Folio</p>
                  <p className={`font-mono font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {recetaCancelada.folio_receta}
                  </p>
                </div>
              </div>

              {/* Paciente */}
              {recetaCancelada.paciente && (
                <div className="flex items-center gap-2">
                  <User size={16} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                  <div>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Paciente</p>
                    <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {recetaCancelada.paciente}
                    </p>
                  </div>
                </div>
              )}

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
          </div>
        )}
      </div>
    </div>
  );
}

