// src/components/consultas/diagnosticos/SelectorCIE11.tsx

'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Loader2, X, CheckCircle2, Clock, TrendingUp, AlertCircle, Sparkles, ArrowRight, Star, GripVertical, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ResultadoCIE11 {
  id: string;
  title: string;
  theCode?: string;
  chapter?: string;
  score?: number;
}

interface DiagnosticoCIE11 {
  codigo: string;
  titulo: string;
  capitulo: string;
  es_principal?: boolean;
  orden?: number;
}

interface SelectorCIE11Props {
  onDiagnosticosChange: (diagnosticos: DiagnosticoCIE11[]) => void;
  diagnosticosSeleccionados?: DiagnosticoCIE11[];
  isDark?: boolean;
  maxDiagnosticos?: number;
}

interface CachedSearch {
  query: string;
  results: ResultadoCIE11[];
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const MAX_CACHE_SIZE = 50;
const DEBOUNCE_TIME = 300; // 300ms

// Diccionario de correcciones comunes (español médico) mejorado
const CORRECTIONS_MAP: Record<string, string> = {
  'grip': 'gripe',
  'gripa': 'gripe',
  'grippe': 'gripe',
  'gripw': 'gripe',
  'diabetis': 'diabetes',
  'diabetez': 'diabetes',
  'hipertension': 'hipertensión',
  'infecion': 'infección',
  'infeccion': 'infección',
  'gastritiz': 'gastritis',
  'gastriti': 'gastritis',
  'neumonia': 'neumonía',
  'tos': 'tos',
  'fiebre': 'fiebre',
  'diarrea': 'diarrea',
  'diarrhea': 'diarrea',
  'cefalea': 'cefalea',
  'migraña': 'migraña',
  'migrana': 'migraña',
  'asma': 'asma',
  'azma': 'asma',
  'alergia': 'alergia',
  'alerji': 'alergia',
  'fractura': 'fractura',
  'fractur': 'fractura',
  'esguince': 'esguince',
  'esguinse': 'esguince',
  'lumbalgia': 'lumbalgia',
  'lumbago': 'lumbalgia',
  'dermatitis': 'dermatitis',
  'dermatiti': 'dermatitis',
  'conjuntivitis': 'conjuntivitis',
  'conjuntiviti': 'conjuntivitis',
  'faringitis': 'faringitis',
  'faringiti': 'faringitis',
  'amigdalitis': 'amigdalitis',
  'bronquitis': 'bronquitis',
  'bronquiti': 'bronquitis',
  'covid': 'covid-19',
  'ansiedad': 'ansiedad',
  'anciedad': 'ansiedad',
  'depresion': 'depresión',
  'depresión': 'depresión',
  'obsidad': 'obesidad',
  'obecidad': 'obesidad',
  'apendicitis': 'apendicitis',
  'apendiciti': 'apendicitis'
};

// Calcular distancia de Levenshtein simplificada
const levenshteinDistance = (str1: string, str2: string): number => {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[len1][len2];
};

// Encontrar sugerencia más cercana
const findSuggestion = (term: string): string | null => {
  const lowerTerm = term.toLowerCase().trim();

  // Buscar coincidencia exacta en mapa
  if (CORRECTIONS_MAP[lowerTerm]) {
    return CORRECTIONS_MAP[lowerTerm];
  }

  // Buscar coincidencia aproximada en mapa (distancia <= 2)
  let bestMatch: string | null = null;
  let minDistance = Infinity;

  // Optimización: Solo buscar si la longitud > 3 para evitar falsos positivos cortos
  if (lowerTerm.length <= 3) return null;

  for (const [key, value] of Object.entries(CORRECTIONS_MAP)) {
    const distance = levenshteinDistance(lowerTerm, key);
    if (distance <= 2 && distance < minDistance) {
      minDistance = distance;
      bestMatch = value;
    }
  }

  return bestMatch;
};

export default function SelectorCIE11({
  onDiagnosticosChange,
  diagnosticosSeleccionados = [],
  isDark = false,
  maxDiagnosticos = 10
}: SelectorCIE11Props) {
  const [token, setToken] = useState<string>('');
  const [loadingToken, setLoadingToken] = useState(false);

  // Estado de búsqueda
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [terminoCorregido, setTerminoCorregido] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [resultados, setResultados] = useState<ResultadoCIE11[]>([]);

  // UX
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showRecent, setShowRecent] = useState(false);
  const [sugerencia, setSugerencia] = useState<string | null>(null);

  // Cache de búsquedas
  const searchCacheRef = useRef<Map<string, CachedSearch>>(new Map());
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Función para limpiar etiquetas HTML de los títulos
  const limpiarHTML = (texto: string): string => {
    return texto.replace(/<[^>]*>/g, '');
  };

  // Obtener diagnósticos recientes del localStorage
  const diagnosticosRecientes = useMemo(() => {
    try {
      const recientes = localStorage.getItem('diagnosticos_recientes');
      return recientes ? JSON.parse(recientes) : [];
    } catch {
      return [];
    }
  }, [diagnosticosSeleccionados]);

  // Obtener token al montar el componente
  useEffect(() => {
    obtenerToken();
  }, []);

  // Búsqueda automática con debounce optimizado
  useEffect(() => {
    if (!token || !terminoBusqueda.trim()) {
      setResultados([]);
      setSelectedIndex(-1);
      setSugerencia(null);
      setTerminoCorregido(null);
      return;
    }

    const timer = setTimeout(() => {
      handleSearch(terminoBusqueda);
    }, DEBOUNCE_TIME);

    return () => clearTimeout(timer);
  }, [terminoBusqueda, token]);

  const obtenerToken = async (): Promise<string | null> => {
    setLoadingToken(true);
    try {
      const response = await fetch('/api/cie11/token');
      const data = await response.json();

      if (data.success) {
        setToken(data.token);
        return data.token;
      } else {
        console.error('Error al obtener token CIE-11');
        return null;
      }
    } catch (error: any) {
      console.error('Error al obtener token:', error);
      return null;
    } finally {
      setLoadingToken(false);
    }
  };

  const limpiarCacheAntiguo = () => {
    const now = Date.now();
    const cache = searchCacheRef.current;

    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp > CACHE_DURATION) {
        cache.delete(key);
      }
    }

    // Limitar tamaño del cache
    if (cache.size > MAX_CACHE_SIZE) {
      const entries = Array.from(cache.entries());
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      searchCacheRef.current = new Map(entries.slice(0, MAX_CACHE_SIZE));
    }
  };

  const realizarPeticionBusqueda = async (query: string, tokenActual: string, retry = true): Promise<ResultadoCIE11[]> => {
    // Verificar cache primero
    limpiarCacheAntiguo();
    const cached = searchCacheRef.current.get(query.toLowerCase());

    if (cached) {
      return cached.results;
    }

    try {
      const response = await fetch(`/api/cie11/buscar?q=${encodeURIComponent(query)}&token=${tokenActual}`);

      // Si el token expiró (401), intentar refrescar y reintentar
      if (response.status === 401 && retry) {
        console.log("🔄 Token CIE-11 expirado. Renovando...");
        const nuevoToken = await obtenerToken();
        if (nuevoToken) {
          return realizarPeticionBusqueda(query, nuevoToken, false); // Reintento único
        }
      }

      const data = await response.json();

      if (data.success) {
        const results = data.resultados || [];
        // Guardar en cache
        searchCacheRef.current.set(query.toLowerCase(), {
          query,
          results,
          timestamp: Date.now()
        });
        return results;
      }

      console.warn("⚠️ API CIE-11 error:", data.error);
      return [];
    } catch (error) {
      console.error("❌ Error de red al buscar CIE-11:", error);
      return [];
    }
  };

  const handleSearch = async (queryOriginal: string) => {
    const query = queryOriginal.trim();
    if (!query) return;

    // Si no hay token, intentamos obtenerlo antes de buscar
    let tokenUsar = token;
    if (!tokenUsar) {
      tokenUsar = await obtenerToken() || '';
      if (!tokenUsar) return; // Si falla obtener token, abortar
    }

    setBuscando(true);
    setSugerencia(null);
    setTerminoCorregido(null);

    try {
      // 1. Primer intento: búsqueda exacta con lo que escribió el usuario
      let results = await realizarPeticionBusqueda(query, tokenUsar);

      // 2. Si no hay resultados, intentar corrección automática
      if (results.length === 0) {
        const correccion = findSuggestion(query);

        if (correccion) {
          // Auto-búsqueda con la corrección
          const correctedResults = await realizarPeticionBusqueda(correccion, tokenUsar);

          if (correctedResults.length > 0) {
            setResultados(correctedResults);
            setTerminoCorregido(correccion); // Indicar que mostramos resultados corregidos
          } else {
            setResultados([]); // Ni con corrección hubo resultados
          }
        } else {
          setResultados([]); // No se encontró corrección ni resultados
        }
      } else {
        setResultados(results);
      }
    } catch (error) {
      console.error('Error en búsqueda:', error);
      setResultados([]);
    } finally {
      setBuscando(false);
      setSelectedIndex(-1);
    }
  };

  const guardarDiagnosticoReciente = (diagnostico: DiagnosticoCIE11) => {
    try {
      const recientes = diagnosticosRecientes.filter(
        (d: any) => d.codigo !== diagnostico.codigo
      );
      recientes.unshift({ codigo: diagnostico.codigo, titulo: diagnostico.titulo, capitulo: diagnostico.capitulo });

      // Mantener solo los últimos 10
      const limitados = recientes.slice(0, 10);
      localStorage.setItem('diagnosticos_recientes', JSON.stringify(limitados));
    } catch (error) {
      console.error('Error al guardar diagnóstico reciente:', error);
    }
  };

  const agregarDiagnostico = (resultado: ResultadoCIE11) => {
    const codigo = resultado.theCode || resultado.id;

    // Verificar si ya está agregado
    if (diagnosticosSeleccionados.some(d => d.codigo === codigo)) {
      return; // Ya existe, no agregar duplicado
    }

    // Verificar límite
    if (diagnosticosSeleccionados.length >= maxDiagnosticos) {
      return;
    }

    const nuevoDiagnostico: DiagnosticoCIE11 = {
      codigo: codigo,
      titulo: limpiarHTML(resultado.title),
      capitulo: resultado.chapter || 'N/A',
      es_principal: diagnosticosSeleccionados.length === 0, // El primero es principal por defecto
      orden: diagnosticosSeleccionados.length + 1
    };

    const nuevosDiagnosticos = [...diagnosticosSeleccionados, nuevoDiagnostico];
    onDiagnosticosChange(nuevosDiagnosticos);
    guardarDiagnosticoReciente(nuevoDiagnostico);

    // Resetear búsqueda
    setTerminoBusqueda('');
    setResultados([]);
    setSelectedIndex(-1);
    setShowRecent(false);
    setSugerencia(null);
    setTerminoCorregido(null);
  };

  const eliminarDiagnostico = (codigo: string) => {
    const nuevosDiagnosticos = diagnosticosSeleccionados.filter(d => d.codigo !== codigo);

    // Si eliminamos el principal y quedan diagnósticos, hacer principal al primero
    if (nuevosDiagnosticos.length > 0) {
      const teniaPrincipal = diagnosticosSeleccionados.find(d => d.codigo === codigo)?.es_principal;
      if (teniaPrincipal) {
        nuevosDiagnosticos[0].es_principal = true;
      }
      // Reordenar
      nuevosDiagnosticos.forEach((d, i) => {
        d.orden = i + 1;
      });
    }

    onDiagnosticosChange(nuevosDiagnosticos);
  };

  const establecerPrincipal = (codigo: string) => {
    const nuevosDiagnosticos = diagnosticosSeleccionados.map(d => ({
      ...d,
      es_principal: d.codigo === codigo
    }));
    onDiagnosticosChange(nuevosDiagnosticos);
  };

  const seleccionarDiagnosticoReciente = (diagnostico: any) => {
    // Verificar si ya está agregado
    if (diagnosticosSeleccionados.some(d => d.codigo === diagnostico.codigo)) {
      return;
    }

    if (diagnosticosSeleccionados.length >= maxDiagnosticos) {
      return;
    }

    const nuevoDiagnostico: DiagnosticoCIE11 = {
      ...diagnostico,
      es_principal: diagnosticosSeleccionados.length === 0,
      orden: diagnosticosSeleccionados.length + 1
    };

    onDiagnosticosChange([...diagnosticosSeleccionados, nuevoDiagnostico]);
    setShowRecent(false);
    setTerminoBusqueda('');
  };

  // Navegación con teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (resultsContainerRef.current && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      // Permitir navegación normal
    }

    if (resultados.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev < resultados.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < resultados.length) {
            agregarDiagnostico(resultados[selectedIndex]);
          }
          break;
      }
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setTerminoBusqueda('');
      setResultados([]);
      setSelectedIndex(-1);
      setShowRecent(false);
    }
  };

  // Auto-scroll en navegación con teclado
  useEffect(() => {
    if (selectedIndex >= 0 && resultsContainerRef.current) {
      const selectedElement = resultsContainerRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  // Skeleton loading mejorado
  const SkeletonResult = () => (
    <div className={`p-4 border-b last:border-0 ${isDark ? 'border-[#0f83b2]/10' : 'border-gray-100'}`}>
      <div className="flex justify-between items-start mb-2">
        <div className={`h-4 ${isDark ? 'bg-[#0f83b2]/20' : 'bg-gray-200'} rounded w-3/4 animate-pulse`}></div>
        <div className={`h-5 ${isDark ? 'bg-[#0f83b2]/30' : 'bg-blue-100'} rounded w-16 animate-pulse`}></div>
      </div>
      <div className={`h-3 ${isDark ? 'bg-[#0f83b2]/10' : 'bg-gray-100'} rounded w-1/2 animate-pulse`}></div>
    </div>
  );

  // Verificar si un código ya está seleccionado
  const estaSeleccionado = (codigo: string) => {
    return diagnosticosSeleccionados.some(d => d.codigo === codigo);
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Lista de diagnósticos seleccionados */}
      <AnimatePresence>
        {diagnosticosSeleccionados.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            <div className={`flex items-center justify-between px-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <span className="text-xs font-semibold uppercase tracking-wider">
                Diagnósticos ({diagnosticosSeleccionados.length})
              </span>
              {diagnosticosSeleccionados.length > 1 && (
                <span className="text-xs opacity-60">
                  Click en ★ para marcar como principal
                </span>
              )}
            </div>

            {diagnosticosSeleccionados.map((diag, index) => (
              <motion.div
                key={diag.codigo}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20 }}
                className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${
                  diag.es_principal
                    ? isDark
                      ? 'bg-gradient-to-r from-[#0d1f2d] to-[#0a1929] border-[#0db1ec]/40 shadow-lg shadow-[#0db1ec]/10'
                      : 'bg-white border-blue-300 shadow-lg shadow-blue-500/10'
                    : isDark
                      ? 'bg-[#0d1f2d]/60 border-[#0f83b2]/20'
                      : 'bg-gray-50 border-gray-200'
                }`}
              >
                {/* Indicador de principal */}
                {diag.es_principal && (
                  <div className={`absolute top-0 left-0 w-1 h-full ${isDark ? 'bg-[#0db1ec]' : 'bg-blue-500'}`} />
                )}

                <div className="p-4 pl-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {diag.es_principal && (
                          <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[#0db1ec]' : 'text-blue-600'}`}>
                            Principal
                          </span>
                        )}
                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          #{index + 1}
                        </span>
                      </div>

                      <h3 className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {diag.titulo}
                      </h3>

                      <div className="flex items-center gap-3 mt-2 text-sm">
                        <span className={`px-2 py-0.5 rounded font-mono text-xs ${
                          isDark ? 'bg-[#0a1929] text-[#0db1ec] border border-[#0f83b2]/30' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {diag.codigo}
                        </span>
                        {diag.capitulo && (
                          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            Cap: {diag.capitulo}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Botón para hacer principal */}
                      {!diag.es_principal && diagnosticosSeleccionados.length > 1 && (
                        <button
                          type="button"
                          onClick={() => establecerPrincipal(diag.codigo)}
                          className={`p-2 rounded-lg transition-all duration-200 ${
                            isDark
                              ? 'hover:bg-[#0db1ec]/20 text-gray-500 hover:text-[#0db1ec]'
                              : 'hover:bg-yellow-50 text-gray-400 hover:text-yellow-500'
                          }`}
                          title="Marcar como principal"
                        >
                          <Star className="w-5 h-5" />
                        </button>
                      )}
                      {diag.es_principal && (
                        <div className={`p-2 ${isDark ? 'text-[#0db1ec]' : 'text-yellow-500'}`}>
                          <Star className="w-5 h-5 fill-current" />
                        </div>
                      )}

                      {/* Botón eliminar */}
                      <button
                        type="button"
                        onClick={() => eliminarDiagnostico(diag.codigo)}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          isDark
                            ? 'hover:bg-red-500/20 text-gray-500 hover:text-red-400'
                            : 'hover:bg-red-50 text-gray-400 hover:text-red-500'
                        }`}
                        title="Eliminar diagnóstico"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buscador para agregar más diagnósticos */}
      {diagnosticosSeleccionados.length < maxDiagnosticos && (
        <div className="relative group z-20">
          <div className={`relative transition-all duration-300 rounded-2xl overflow-hidden ${isDark
            ? 'bg-[#0d1f2d] shadow-lg shadow-black/20 ring-1 ring-[#0f83b2]/20 focus-within:ring-[#0db1ec]/50'
            : 'bg-white shadow-xl shadow-blue-900/5 ring-1 ring-gray-200 focus-within:ring-blue-400/50'
            } ${buscando ? 'ring-2' : ''}`}>

            <div className="flex items-center px-4 py-3.5">
              {diagnosticosSeleccionados.length > 0 ? (
                <Plus className={`w-5 h-5 mr-3 transition-colors ${
                  isDark ? 'text-gray-500 group-focus-within:text-[#0db1ec]' : 'text-gray-400 group-focus-within:text-blue-500'
                }`} />
              ) : (
                <Search className={`w-5 h-5 mr-3 transition-colors ${buscando
                  ? (isDark ? 'text-[#0db1ec] animate-pulse' : 'text-blue-500 animate-pulse')
                  : (isDark ? 'text-gray-500 group-focus-within:text-[#0db1ec]' : 'text-gray-400 group-focus-within:text-blue-500')
                  }`} />
              )}

              <input
                ref={inputRef}
                type="text"
                value={terminoBusqueda}
                onChange={(e) => setTerminoBusqueda(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowRecent(true)}
                placeholder={diagnosticosSeleccionados.length > 0
                  ? "Agregar otro diagnóstico..."
                  : "Buscar diagnóstico CIE-11 (ej: Gripe, Diabetes, A00...)"}
                className={`w-full bg-transparent border-none p-0 focus:ring-0 text-base font-medium placeholder:font-normal transition-colors ${isDark
                  ? 'text-white placeholder-gray-600'
                  : 'text-gray-900 placeholder-gray-400'
                  }`}
                disabled={loadingToken}
                autoComplete="off"
              />

              {terminoBusqueda && !buscando && (
                <button
                  onClick={() => {
                    setTerminoBusqueda('');
                    setResultados([]);
                    setTerminoCorregido(null);
                    inputRef.current?.focus();
                  }}
                  className={`p-1 rounded-full transition-colors ml-2 ${isDark ? 'hover:bg-gray-700 text-gray-600 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                    }`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Barra de progreso de carga */}
            {buscando && (
              <div className="absolute bottom-0 left-0 h-0.5 w-full bg-gray-200/20 overflow-hidden">
                <div className={`h-full w-1/3 animate-[loading_1s_ease-in-out_infinite] ${isDark ? 'bg-[#0db1ec]' : 'bg-blue-500'
                  }`} />
              </div>
            )}
          </div>

          {/* Panel de Resultados Flotante */}
          <AnimatePresence>
            {(showRecent || resultados.length > 0 || buscando || (terminoBusqueda && !buscando && resultados.length === 0)) && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                className={`absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl border z-50 ${isDark
                  ? 'bg-[#0d1f2d]/95 border-[#0f83b2]/20 shadow-black/40'
                  : 'bg-white/95 border-gray-100 shadow-blue-900/10'
                  }`}
              >
                {/* Mensaje de Corrección Automática */}
                {terminoCorregido && (
                  <div className={`px-4 py-2 text-xs flex items-center justify-between border-b ${isDark ? 'bg-[#0db1ec]/10 border-[#0db1ec]/20 text-[#0db1ec]' : 'bg-blue-50 border-blue-100 text-blue-600'
                    }`}>
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      Resultados para <span className="font-bold">"{terminoCorregido}"</span>
                    </span>
                    <span className="opacity-60 italic">Búsqueda automática</span>
                  </div>
                )}

                {/* Lista de Resultados - Scroll Optimizado para Móvil */}
                <div
                  ref={resultsContainerRef}
                  className="max-h-[60vh] md:max-h-[350px] overflow-y-auto custom-scrollbar overscroll-contain touch-pan-y"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  {buscando ? (
                    <div>
                      <SkeletonResult />
                      <SkeletonResult />
                      <SkeletonResult />
                    </div>
                  ) : resultados.length > 0 ? (
                    <div className={isDark ? 'divide-y divide-[#0f83b2]/10' : 'divide-y divide-gray-50'}>
                      {resultados.map((resultado, index) => {
                        const codigo = resultado.theCode || resultado.id;
                        const yaSeleccionado = estaSeleccionado(codigo);

                        return (
                          <button
                            key={`${resultado.id}-${index}`}
                            onClick={() => !yaSeleccionado && agregarDiagnostico(resultado)}
                            disabled={yaSeleccionado}
                            className={`w-full text-left px-5 py-3.5 transition-all duration-150 flex items-start gap-4 group ${
                              yaSeleccionado
                                ? isDark ? 'bg-[#0f83b2]/5 opacity-50 cursor-not-allowed' : 'bg-green-50/50 opacity-50 cursor-not-allowed'
                                : index === selectedIndex
                                  ? (isDark ? 'bg-[#0f83b2]/10' : 'bg-blue-50')
                                  : (isDark ? 'active:bg-[#0a1929] md:hover:bg-[#0a1929]' : 'active:bg-gray-50 md:hover:bg-gray-50')
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {yaSeleccionado && (
                                  <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-[#0db1ec]' : 'text-green-500'}`} />
                                )}
                                {resultado.score && Math.round(resultado.score) > 90 && !yaSeleccionado && (
                                  <span title="Alta relevancia" className="text-amber-500 flex-shrink-0">
                                    <TrendingUp className="w-3 h-3" />
                                  </span>
                                )}
                                <h4 className={`text-sm font-semibold truncate transition-colors ${
                                  yaSeleccionado
                                    ? isDark ? 'text-gray-400' : 'text-gray-500'
                                    : isDark
                                      ? 'text-gray-200 group-hover:text-[#0db1ec]'
                                      : 'text-gray-900 group-hover:text-blue-600'
                                }`}>
                                  {limpiarHTML(resultado.title)}
                                </h4>
                              </div>

                              {resultado.chapter && (
                                <p className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                  {resultado.chapter}
                                </p>
                              )}
                            </div>

                            <span className={`px-2 py-1 rounded text-xs font-mono font-bold whitespace-nowrap hidden sm:inline-block ${
                              yaSeleccionado
                                ? isDark ? 'bg-[#0a1929]/50 text-gray-500' : 'bg-gray-100 text-gray-400'
                                : isDark
                                  ? 'bg-[#0a1929] text-[#0db1ec] border border-[#0f83b2]/30'
                                  : 'bg-white text-gray-700 border border-gray-200 shadow-sm'
                            }`}>
                              {codigo}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    // Estado Vacio
                    <div className="p-8 text-center">
                      {terminoBusqueda ? (
                        <>
                          <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3 ${isDark ? 'bg-gray-800' : 'bg-gray-100'
                            }`}>
                            <Search className={`w-8 h-8 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                          </div>
                          <p className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                            No se encontraron resultados
                          </p>
                          <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            Intenta verificar la ortografía o usar sinónimos
                          </p>
                        </>
                      ) : (
                        // Historial Reciente (cuando el input está vacío y enfocado)
                        showRecent && diagnosticosRecientes.length > 0 && (
                          <div className="text-left -m-8">
                            <div className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${isDark ? 'bg-[#0a1929] text-gray-500' : 'bg-gray-50 text-gray-500'
                              }`}>
                              <Clock className="w-3.5 h-3.5" />
                              Recientes
                            </div>
                            {diagnosticosRecientes.map((diag: any, idx: number) => {
                              const yaSeleccionado = estaSeleccionado(diag.codigo);
                              return (
                                <button
                                  key={`recent-${idx}`}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    if (!yaSeleccionado) {
                                      seleccionarDiagnosticoReciente(diag);
                                    }
                                  }}
                                  disabled={yaSeleccionado}
                                  className={`w-full text-left px-5 py-3 border-b flex items-center justify-between group transition-colors ${
                                    yaSeleccionado
                                      ? isDark ? 'border-[#0f83b2]/10 opacity-50 cursor-not-allowed' : 'border-gray-50 opacity-50 cursor-not-allowed'
                                      : isDark
                                        ? 'border-[#0f83b2]/10 hover:bg-[#0f83b2]/5'
                                        : 'border-gray-50 hover:bg-gray-50'
                                  }`}
                                >
                                  <span className={`text-sm font-medium flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {yaSeleccionado && <CheckCircle2 className={`w-4 h-4 ${isDark ? 'text-[#0db1ec]' : 'text-green-500'}`} />}
                                    {diag.titulo}
                                  </span>
                                  <span className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-[#0a1929] text-gray-500' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    {diag.codigo}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* Footer del dropdown */}
                  {resultados.length > 0 && (
                    <div className={`px-4 py-2 border-t text-[10px] flex justify-between items-center ${isDark ? 'border-[#0f83b2]/20 bg-[#0a1929]/50 text-gray-500' : 'border-gray-100 bg-gray-50 text-gray-500'
                      }`}>
                      <span>{resultados.length} resultados encontrados</span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><kbd className="font-sans border rounded px-1">↑</kbd> <kbd className="font-sans border rounded px-1">↓</kbd> navegar</span>
                        <span className="flex items-center gap-1"><kbd className="font-sans border rounded px-1">↵</kbd> agregar</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Mensaje cuando se alcanza el límite */}
      {diagnosticosSeleccionados.length >= maxDiagnosticos && (
        <div className={`text-center py-3 rounded-xl ${isDark ? 'bg-[#0a1929] text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
          <p className="text-sm">
            Límite de {maxDiagnosticos} diagnósticos alcanzado
          </p>
        </div>
      )}
    </div>
  );
}
