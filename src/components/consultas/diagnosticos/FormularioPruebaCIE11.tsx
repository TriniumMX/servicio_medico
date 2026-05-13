// src/components/consultas/diagnosticos/FormularioPruebaCIE11.tsx

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, AlertCircle, CheckCircle2, Loader2, FileText, Database } from 'lucide-react';
import Swal from 'sweetalert2';

interface BuscarCIE11Props {
  isDark: boolean;
}

interface ResultadoCIE11 {
  id: string;
  title: string;
  theCode?: string;
  chapter?: string;
  score?: number;
}

export default function FormularioPruebaCIE11({ isDark }: BuscarCIE11Props) {
  const [token, setToken] = useState<string>('');
  const [loadingToken, setLoadingToken] = useState(false);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [resultados, setResultados] = useState<ResultadoCIE11[]>([]);
  const [diagnosticoSeleccionado, setDiagnosticoSeleccionado] = useState<ResultadoCIE11 | null>(null);

  // Función para limpiar etiquetas HTML de los títulos
  const limpiarHTML = (texto: string): string => {
    return texto.replace(/<[^>]*>/g, '');
  };

  // Obtener token al montar el componente
  useEffect(() => {
    obtenerToken();
  }, []);

  // Búsqueda automática con debounce
  useEffect(() => {
    if (!token || !terminoBusqueda.trim()) {
      setResultados([]);
      return;
    }

    const timer = setTimeout(() => {
      buscarDiagnosticoAutomatico();
    }, 500); // Espera 500ms después de que el usuario deje de teclear

    return () => clearTimeout(timer);
  }, [terminoBusqueda, token]);

  const obtenerToken = async () => {
    setLoadingToken(true);
    try {
      const response = await fetch('/api/cie11/token');
      const data = await response.json();

      if (data.success) {
        setToken(data.token);
        console.log('✅ Token CIE-11 obtenido exitosamente');
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error al obtener token:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo obtener el token de autenticación para CIE-11',
        confirmButtonColor: '#0f83b2',
        background: isDark ? '#0a1929' : '#ffffff',
        color: isDark ? '#ffffff' : '#000000',
      });
    } finally {
      setLoadingToken(false);
    }
  };

  // Búsqueda automática (sin alertas de validación)
  const buscarDiagnosticoAutomatico = async () => {
    if (!terminoBusqueda.trim() || !token) {
      return;
    }

    setBuscando(true);
    try {
      const response = await fetch(`/api/cie11/buscar?q=${encodeURIComponent(terminoBusqueda)}&token=${token}`);
      const data = await response.json();

      if (data.success) {
        setResultados(data.resultados || []);
        console.log(`✅ Se encontraron ${data.total} resultados`);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error al buscar:', error);
      setResultados([]);
    } finally {
      setBuscando(false);
    }
  };

  // Búsqueda manual con validaciones
  const buscarDiagnostico = async () => {
    if (!terminoBusqueda.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'Por favor ingrese un término de búsqueda',
        confirmButtonColor: '#0f83b2',
        background: isDark ? '#0a1929' : '#ffffff',
        color: isDark ? '#ffffff' : '#000000',
      });
      return;
    }

    if (!token) {
      Swal.fire({
        icon: 'error',
        title: 'Sin autenticación',
        text: 'No hay token de autenticación disponible',
        confirmButtonColor: '#0f83b2',
        background: isDark ? '#0a1929' : '#ffffff',
        color: isDark ? '#ffffff' : '#000000',
      });
      return;
    }

    await buscarDiagnosticoAutomatico();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      buscarDiagnostico();
    }
  };

  const seleccionarDiagnostico = (diagnostico: ResultadoCIE11) => {
    setDiagnosticoSeleccionado(diagnostico);
    Swal.fire({
      icon: 'success',
      title: 'Diagnóstico Seleccionado',
      html: `
        <div style="text-align: left;">
          <p><strong>Código:</strong> ${diagnostico.theCode || 'N/A'}</p>
          <p><strong>Título:</strong> ${limpiarHTML(diagnostico.title)}</p>
          <p><strong>Capítulo:</strong> ${diagnostico.chapter || 'N/A'}</p>
        </div>
        <br/>
        <p style="color: #f59e0b; font-weight: bold;">⚠️ MODO PRUEBA: No se guardará en base de datos</p>
      `,
      confirmButtonColor: '#0f83b2',
      background: isDark ? '#0a1929' : '#ffffff',
      color: isDark ? '#ffffff' : '#000000',
    });
  };

  return (
    <div className="space-y-6">
      {/* Banner de advertencia */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-4"
      >
        <div className="flex items-center gap-3">
          <AlertCircle size={24} className="text-amber-500" />
          <div>
            <h3 className="font-bold text-amber-500">Modo de Prueba - Solo Consulta</h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Este formulario solo consulta la API de CIE-11. NO guarda información en la base de datos.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Estado del token */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl border-2 p-6 ${
          isDark ? 'bg-[#0d1f2d] border-[#0f83b2]/20' : 'bg-gray-50 border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database size={24} className={isDark ? 'text-[#0db1ec]' : 'text-blue-600'} />
            <div>
              <h4 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Estado de Autenticación CIE-11
              </h4>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {loadingToken ? 'Obteniendo token...' : token ? 'Token válido' : 'Sin token'}
              </p>
            </div>
          </div>
          {loadingToken ? (
            <Loader2 size={24} className="animate-spin text-[#0db1ec]" />
          ) : token ? (
            <CheckCircle2 size={24} className="text-green-500" />
          ) : (
            <button
              onClick={obtenerToken}
              className="px-4 py-2 bg-[#0f83b2] text-white rounded-lg font-semibold hover:bg-[#0db1ec] transition-all"
            >
              Obtener Token
            </button>
          )}
        </div>
      </motion.div>

      {/* Buscador */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`rounded-2xl border-2 p-6 ${
          isDark ? 'bg-[#0d1f2d] border-[#0f83b2]/20' : 'bg-gray-50 border-gray-200'
        }`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-xl ${isDark ? 'bg-[#0f83b2]/20' : 'bg-blue-100'}`}>
            <Search size={24} className={isDark ? 'text-[#0db1ec]' : 'text-blue-600'} />
          </div>
          <div>
            <h4 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Buscar Diagnóstico CIE-11
            </h4>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Comience a escribir para buscar automáticamente (ej: diabetes, gripe, hipertensión)
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escriba para buscar automáticamente..."
              disabled={!token || loadingToken}
              className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all font-medium ${
                isDark
                  ? 'bg-[#0a1929] border-[#0f83b2]/30 text-white placeholder-gray-500 focus:border-[#0db1ec] disabled:opacity-50'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 disabled:opacity-50'
              }`}
            />
          </div>
          <button
            onClick={buscarDiagnostico}
            disabled={buscando || !token || loadingToken}
            className="px-8 py-3 bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] text-white rounded-xl font-bold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
          >
            {buscando ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search size={20} />
                Buscar
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Resultados */}
      {resultados.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-2xl border-2 p-6 ${
            isDark ? 'bg-[#0d1f2d] border-[#0f83b2]/20' : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <FileText size={24} className={isDark ? 'text-[#0db1ec]' : 'text-blue-600'} />
            <h4 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Resultados Encontrados
            </h4>
            <span className={`ml-auto px-3 py-1 rounded-full text-sm font-bold ${
              isDark ? 'bg-[#0f83b2]/20 text-[#0db1ec]' : 'bg-blue-100 text-blue-700'
            }`}>
              {resultados.length} resultado(s)
            </span>
          </div>

          <div className="space-y-3 max-h-[700px] overflow-y-auto">
            {resultados.map((resultado, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => seleccionarDiagnostico(resultado)}
                className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                  diagnosticoSeleccionado?.id === resultado.id
                    ? 'bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] text-white shadow-lg scale-102 ring-4 ring-[#0f83b2]/30'
                    : isDark
                    ? 'bg-[#0a1929] border-2 border-[#0f83b2]/30 text-white hover:border-[#0db1ec]/50 hover:scale-101'
                    : 'bg-white border-2 border-gray-200 text-gray-900 hover:border-blue-500/50 hover:shadow-md hover:scale-101'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {resultado.theCode && (
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold font-mono ${
                          diagnosticoSeleccionado?.id === resultado.id
                            ? 'bg-white/20 text-white'
                            : isDark
                            ? 'bg-[#0f83b2]/20 text-[#0db1ec]'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {resultado.theCode}
                        </span>
                      )}
                      {resultado.chapter && (
                        <span className={`text-xs ${
                          diagnosticoSeleccionado?.id === resultado.id ? 'text-white/70' : 'opacity-70'
                        }`}>
                          {resultado.chapter}
                        </span>
                      )}
                    </div>
                    <h5 className="font-semibold text-base mb-1">
                      {limpiarHTML(resultado.title)}
                    </h5>
                    {resultado.score && (
                      <p className={`text-xs ${
                        diagnosticoSeleccionado?.id === resultado.id ? 'text-white/70' : 'opacity-70'
                      }`}>
                        Relevancia: {(resultado.score * 100).toFixed(0)}%
                      </p>
                    )}
                  </div>
                  {diagnosticoSeleccionado?.id === resultado.id && (
                    <CheckCircle2 size={24} className="text-white flex-shrink-0" />
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Diagnóstico seleccionado */}
      {diagnosticoSeleccionado && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 border-2 border-emerald-500/30 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle2 size={24} className="text-emerald-500" />
            <h4 className="text-xl font-bold text-emerald-500">
              Diagnóstico Seleccionado
            </h4>
          </div>
          <div className={`space-y-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <p><strong>Código:</strong> {diagnosticoSeleccionado.theCode || 'N/A'}</p>
            <p><strong>Título:</strong> {limpiarHTML(diagnosticoSeleccionado.title)}</p>
            <p><strong>Capítulo:</strong> {diagnosticoSeleccionado.chapter || 'N/A'}</p>
          </div>
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <p className="text-sm font-bold text-amber-500 text-center">
              ⚠️ MODO PRUEBA: Este diagnóstico no se guardará en la base de datos
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
