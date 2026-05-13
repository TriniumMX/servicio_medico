"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { PacienteEnEspera, DiagnosticoCIE11, DatosSOAP, CacheNotaMedica } from '@/types/consultas';
import { ArrowLeft, User, Activity, Heart, Thermometer, Droplet, Weight, Ruler, ArrowRight, AlertCircle, Calendar, ChevronDown } from 'lucide-react';
import SelectorCIE11 from '@/components/consultas/diagnosticos/SelectorCIE11';
import { ReferenciaEspecialidad } from '@/types/referencias';

const CACHE_KEY = 'nota_medica_en_progreso';

export default function AtenderPacientePage() {
  const params = useParams();
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const id = params.id as string;

  const [paciente, setPaciente] = useState<PacienteEnEspera | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado para referencia (si existe)
  const [referencia, setReferencia] = useState<ReferenciaEspecialidad | null>(null);

  // Datos del formulario SOAP
  const [subjetivo, setSubjetivo] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [diagnosticosSeleccionados, setDiagnosticosSeleccionados] = useState<DiagnosticoCIE11[]>([]);
  const [analisis, setAnalisis] = useState('');

  // Estados para secciones colapsables (Mobile UX)
  const [isPatientInfoOpen, setIsPatientInfoOpen] = useState(true);
  const [isVitalsOpen, setIsVitalsOpen] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      cargarPaciente();
      cargarDatosCache();
    }
  }, [id, mounted]);

  // Cargar referencia si el paciente tiene id_referencia_origen
  useEffect(() => {
    if (paciente?.id_referencia_origen) {
      const cargarReferencia = async () => {
        try {
          const response = await fetch(`/api/referencias/especialista/detalle/${paciente.id_referencia_origen}`);
          const data = await response.json();
          if (data.success) {
            setReferencia(data.data);
          }
        } catch (error) {
          console.error('Error al cargar detalle de referencia:', error);
        }
      };
      cargarReferencia();
    }
  }, [paciente]);

  const isDark = mounted && theme === 'dark';

  const cargarPaciente = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/diagnostico/paciente/${id}`);
      const data = await response.json();

      if (data.success) {
        setPaciente(data.paciente);
      } else {
        setError(data.error || 'Error al cargar paciente');
      }
    } catch (err) {
      console.error('Error al cargar paciente:', err);
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const cargarDatosCache = () => {
    try {
      const cacheStr = localStorage.getItem(CACHE_KEY);
      if (cacheStr) {
        const cache: CacheNotaMedica = JSON.parse(cacheStr);

        // Verificar si el cache es de la misma consulta
        if (cache.id_consulta === parseInt(id) && cache.datos_soap) {
          setSubjetivo(cache.datos_soap.subjetivo);
          setObjetivo(cache.datos_soap.objetivo);
          // Cargar array de diagnósticos
          setDiagnosticosSeleccionados(cache.datos_soap.diagnosticos || []);
          setAnalisis(cache.datos_soap.analisis || '');
        }
      }
    } catch (error) {
      console.error('Error al cargar cache:', error);
    }
  };

  const guardarEnCache = () => {
    if (!paciente) return;

    const datosSOAP: DatosSOAP = {
      paciente,
      subjetivo,
      objetivo,
      diagnosticos: diagnosticosSeleccionados, // Array de diagnósticos
      analisis
    };

    const cache: CacheNotaMedica = {
      id_consulta: paciente.id_consulta, // ⚠️ IMPORTANTE para el UPDATE
      timestamp: new Date().toISOString(),
      hoja_actual: 1,
      datos_soap: datosSOAP,
      datos_plan: null
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  };

  const handleSiguiente = () => {
    // Validar que se hayan llenado los campos requeridos
    if (!subjetivo.trim()) {
      alert('Por favor ingrese el Subjetivo (S)');
      return;
    }
    if (!objetivo.trim()) {
      alert('Por favor ingrese el Objetivo (O)');
      return;
    }
    // Diagnóstico CIE-11 es OPCIONAL - removida validación

    // Guardar automáticamente en cache
    guardarEnCache();

    // Navegar a la página del Plan (Hoja 2)
    router.push(`/dashboard/consultas/diagnostico/plan/${id}`);
  };

  const handleVolver = () => {
    const confirmar = confirm('¿Está seguro de volver? Los datos ingresados se guardarán en caché.');
    if (confirmar) {
      guardarEnCache();
      router.push('/dashboard/consultas/diagnostico');
    }
  };

  if (loading || !mounted) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0d2137]' : 'bg-gray-50'
        }`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-16 w-16 border-b-2 mx-auto ${isDark ? 'border-[#0db1ec]' : 'border-[#0f83b2]'
            }`}></div>
          <p className={`mt-4 font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Cargando paciente...
          </p>
        </div>
      </div>
    );
  }

  if (error || !paciente) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0d2137]' : 'bg-gray-50'
        }`}>
        <div className="text-center">
          <p className={`text-xl mb-4 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
            {error || 'Paciente no encontrado'}
          </p>
          <button
            onClick={handleVolver}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${isDark
              ? 'bg-[#0f83b2] text-white hover:bg-[#0d6f97]'
              : 'bg-[#0f83b2] text-white hover:bg-[#0d6f97]'
              }`}
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Mejorado */}
      <div className={`rounded-2xl shadow-2xl overflow-hidden ${isDark ? 'bg-gradient-to-br from-[#0a1929] via-[#0a1929] to-[#0d2137]' : 'bg-white'
        }`}>
        <div className={`h-2 bg-gradient-to-r from-[#0f83b2] via-[#0db1ec] to-[#0f83b2]`}></div>
        <div className="p-6">
          <button
            onClick={handleVolver}
            className={`flex items-center gap-2 mb-6 px-4 py-2 rounded-lg transition-all duration-300 ${isDark
              ? 'text-gray-300 hover:text-white hover:bg-[#0f83b2]/10 hover:border-[#0f83b2]/30 border border-transparent'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 border border-transparent'
              }`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Volver a lista de pacientes</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] shadow-lg ${isDark ? 'shadow-[#0db1ec]/20' : 'shadow-[#0f83b2]/30'
                }`}>
                <Activity className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className={`text-3xl md:text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Atención Médica
                </h1>
                <p className={`mt-1 text-sm md:text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Metodología SOAP - Registro clínico estructurado
                </p>
              </div>
            </div>

            {/* Indicador de progreso mejorado */}
            <div className={`px-6 py-3 rounded-xl border-2 self-start md:self-auto ${isDark
              ? 'bg-[#0f83b2]/10 border-[#0db1ec]/40'
              : 'bg-blue-50 border-blue-200'
              }`}>
              <div className={`text-sm font-semibold ${isDark ? 'text-[#0db1ec]' : 'text-[#0f83b2]'}`}>
                Hoja 1 de 2
              </div>
              <div className="flex gap-2 mt-2">
                <div className={`h-2 w-12 rounded-full bg-gradient-to-r from-[#0f83b2] to-[#0db1ec]`}></div>
                <div className={`h-2 w-12 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Banner de Referencia Mejorado (si existe) */}
      {referencia && (
        <div className={`rounded-2xl shadow-xl overflow-hidden border-l-4 ${isDark
          ? 'bg-[#0f83b2]/10 border-[#0db1ec]'
          : 'bg-blue-50 border-blue-500'
          }`}>
          <div className={`h-1 bg-gradient-to-r from-[#0db1ec] to-[#0f83b2]`}></div>
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-[#0db1ec]/20' : 'bg-blue-100'
                }`}>
                <AlertCircle className={`w-7 h-7 ${isDark ? 'text-[#0db1ec]' : 'text-blue-600'
                  }`} />
              </div>
              <div className="flex-1">
                <h3 className={`font-bold text-xl mb-1 ${isDark ? 'text-[#0db1ec]' : 'text-blue-700'
                  }`}>
                  Consulta por Referencia Médica
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-[#0a1929]/50' : 'bg-white/70'
                    }`}>
                    <span className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                      Especialidad Solicitada
                    </span>
                    <p className={`mt-1 font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-800'
                      }`}>
                      {referencia.nombre_especialidad}
                    </p>
                  </div>
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-[#0a1929]/50' : 'bg-white/70'
                    }`}>
                    <span className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                      Médico que Refiere
                    </span>
                    <p className={`mt-1 font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-800'
                      }`}>
                      {referencia.nombre_medico_refiere}
                    </p>
                  </div>
                  <div className={`md:col-span-2 p-4 rounded-xl ${isDark ? 'bg-[#0a1929]/50' : 'bg-white/70'
                    }`}>
                    <span className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                      Motivo de Referencia
                    </span>
                    <p className={`mt-2 leading-relaxed ${isDark ? 'text-gray-200' : 'text-gray-700'
                      }`}>
                      {referencia.motivo_referencia}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda - Información del paciente (Collapsible en móvil) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Datos del paciente - Mejorado y Collapsible */}
          <div className={`rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${isDark ? 'bg-gradient-to-br from-[#0a1929] to-[#0d2137]' : 'bg-white'
            }`}>
            <div className={`h-1.5 bg-gradient-to-r from-[#0f83b2] to-[#0db1ec]`}></div>

            {/* Header del Card - Clickable en móvil para colapsar */}
            <button
              onClick={() => setIsPatientInfoOpen(!isPatientInfoOpen)}
              className="w-full p-6 flex items-center justify-between text-left focus:outline-none"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${isDark ? 'bg-[#0db1ec]/20' : 'bg-blue-50'
                  }`}>
                  <User className={`w-6 h-6 ${isDark ? 'text-[#0db1ec]' : 'text-[#0f83b2]'}`} />
                </div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Información del Paciente
                </h2>
              </div>
              <div className={`transform transition-transform duration-300 ${isPatientInfoOpen ? 'rotate-180' : ''}`}>
                <ChevronDown className={`w-6 h-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
            </button>

            {/* Contenido Colapsable */}
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isPatientInfoOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
              }`}>
              <div className="p-6 pt-0 space-y-4">
                <div className={`p-4 rounded-xl ${isDark ? 'bg-[#0f83b2]/5 border border-[#0f83b2]/10' : 'bg-gray-50 border border-gray-200'
                  }`}>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                    Nombre
                  </p>
                  <p className={`font-bold text-lg mt-1 ${isDark ? 'text-white' : 'text-gray-800'
                    }`}>
                    {paciente.nombrepaciente}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-[#0f83b2]/5 border border-[#0f83b2]/10' : 'bg-gray-50 border border-gray-200'
                    }`}>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                      Nómina
                    </p>
                    <p className={`font-semibold mt-1 ${isDark ? 'text-white' : 'text-gray-800'
                      }`}>
                      {paciente.clavenomina}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-[#0f83b2]/5 border border-[#0f83b2]/10' : 'bg-gray-50 border border-gray-200'
                    }`}>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                      Edad
                    </p>
                    <p className={`font-semibold mt-1 ${isDark ? 'text-white' : 'text-gray-800'
                      }`}>
                      {paciente.edad} años
                    </p>
                  </div>
                </div>
                <div className={`p-3 rounded-xl ${isDark ? 'bg-[#0f83b2]/5 border border-[#0f83b2]/10' : 'bg-gray-50 border border-gray-200'
                  }`}>
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                    Tipo
                  </p>
                  <span className={`inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-lg ${paciente.elpacienteesempleado
                    ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                    : 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                    }`}>
                    {paciente.parentesco_desc}
                  </span>
                </div>
                <div className={`p-4 rounded-xl ${isDark ? 'bg-[#0f83b2]/5 border border-[#0f83b2]/10' : 'bg-gray-50 border border-gray-200'
                  }`}>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                    Departamento
                  </p>
                  <p className={`font-semibold mt-1 text-sm ${isDark ? 'text-white' : 'text-gray-800'
                    }`}>
                    {paciente.departamento || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Signos Vitales - Mejorado y Collapsible */}
          <div className={`rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${isDark ? 'bg-gradient-to-br from-[#0a1929] to-[#0d2137]' : 'bg-white'
            }`}>
            <div className={`h-1.5 bg-gradient-to-r from-[#0f83b2] to-[#0db1ec]`}></div>

            <button
              onClick={() => setIsVitalsOpen(!isVitalsOpen)}
              className="w-full p-6 flex items-center justify-between text-left focus:outline-none"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${isDark ? 'bg-[#0db1ec]/20' : 'bg-red-50'
                  }`}>
                  <Activity className={`w-6 h-6 ${isDark ? 'text-[#0db1ec]' : 'text-red-500'
                    }`} />
                </div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Signos Vitales
                </h2>
              </div>
              <div className={`transform transition-transform duration-300 ${isVitalsOpen ? 'rotate-180' : ''}`}>
                <ChevronDown className={`w-6 h-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
            </button>

            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isVitalsOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
              }`}>
              <div className="p-6 pt-0 space-y-3">
                <div className={`p-4 rounded-lg transition-all duration-200 ${isDark
                  ? 'bg-[#0f83b2]/5 border border-[#0f83b2]/10 hover:border-[#0f83b2]/30'
                  : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/15">
                      <Heart className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex-1">
                      <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                        Presión Arterial
                      </p>
                      <p className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-800'
                        }`}>
                        {paciente.presion_arterial} <span className="text-sm font-normal text-gray-500">mmHg</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className={`p-4 rounded-lg transition-all duration-200 ${isDark
                  ? 'bg-[#0f83b2]/5 border border-[#0f83b2]/10 hover:border-[#0f83b2]/30'
                  : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/15">
                      <Thermometer className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                        Temperatura
                      </p>
                      <p className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-800'
                        }`}>
                        {paciente.temperatura} <span className="text-sm font-normal text-gray-500">°C</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className={`p-4 rounded-lg transition-all duration-200 ${isDark
                  ? 'bg-[#0f83b2]/5 border border-[#0f83b2]/10 hover:border-[#0f83b2]/30'
                  : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-pink-500/15">
                      <Heart className="w-5 h-5 text-pink-500" />
                    </div>
                    <div className="flex-1">
                      <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                        Frecuencia Cardíaca
                      </p>
                      <p className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-800'
                        }`}>
                        {paciente.frecuencia_cardiaca} <span className="text-sm font-normal text-gray-500">bpm</span>
                      </p>
                    </div>
                  </div>
                </div>
                {paciente.oxigenacion && (
                  <div className={`p-4 rounded-lg transition-all duration-200 ${isDark
                    ? 'bg-[#0f83b2]/5 border border-[#0f83b2]/10 hover:border-[#0f83b2]/30'
                    : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                    }`}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/15">
                        <Droplet className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                          Oxigenación
                        </p>
                        <p className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-800'
                          }`}>
                          {paciente.oxigenacion} <span className="text-sm font-normal text-gray-500">%</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {paciente.altura && (
                  <div className={`p-4 rounded-lg transition-all duration-200 ${isDark
                    ? 'bg-[#0f83b2]/5 border border-[#0f83b2]/10 hover:border-[#0f83b2]/30'
                    : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                    }`}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/15">
                        <Ruler className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                          Altura
                        </p>
                        <p className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-800'
                          }`}>
                          {paciente.altura} <span className="text-sm font-normal text-gray-500">cm</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {paciente.peso && (
                  <div className={`p-4 rounded-lg transition-all duration-200 ${isDark
                    ? 'bg-[#0f83b2]/5 border border-[#0f83b2]/10 hover:border-[#0f83b2]/30'
                    : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                    }`}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/15">
                        <Weight className="w-5 h-5 text-purple-500" />
                      </div>
                      <div className="flex-1">
                        <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                          Peso
                        </p>
                        <p className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-800'
                          }`}>
                          {paciente.peso} <span className="text-sm font-normal text-gray-500">kg</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {paciente.glucosa && (
                  <div className={`p-4 rounded-lg transition-all duration-200 ${isDark
                    ? 'bg-[#0f83b2]/5 border border-[#0f83b2]/10 hover:border-[#0f83b2]/30'
                    : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                    }`}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-yellow-500/15">
                        <Droplet className="w-5 h-5 text-yellow-500" />
                      </div>
                      <div className="flex-1">
                        <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                          Glucosa
                        </p>
                        <p className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-800'
                          }`}>
                          {paciente.glucosa} <span className="text-sm font-normal text-gray-500">mg/dL</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Columna derecha - Formulario SOAP Mejorado */}
        <div className="lg:col-span-2">
          <div className={`rounded-2xl shadow-2xl overflow-hidden ${isDark ? 'bg-gradient-to-br from-[#0a1929] to-[#0d2137]' : 'bg-white'
            }`}>
            <div className={`h-1.5 bg-gradient-to-r from-[#0f83b2] to-[#0db1ec]`}></div>
            <div className="p-6">
              <div className="mb-6">
                <h2 className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Metodología SOAP
                </h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Registro clínico estructurado
                </p>
              </div>

              <div className="space-y-6">
                {/* S - Subjetivo */}
                <div className={`rounded-xl ${isDark ? 'bg-[#0f83b2]/5 border border-[#0f83b2]/20' : 'bg-gray-50 border border-gray-200'
                  }`}>
                  <div className="p-5">
                    <label className="flex items-center gap-3 mb-3">
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] text-white font-bold text-lg shadow-md">
                        S
                      </div>
                      <div>
                        <span className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-800'
                          }`}>
                          Subjetivo
                        </span>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                          Lo que el paciente refiere
                        </p>
                      </div>
                    </label>
                    <textarea
                      value={subjetivo}
                      onChange={(e) => setSubjetivo(e.target.value)}
                      placeholder="Describa los síntomas, molestias y quejas que refiere el paciente..."
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0f83b2] focus:border-[#0f83b2] resize-none transition-all ${isDark
                        ? 'bg-[#0d1f2d] border-[#0f83b2]/30 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        }`}
                      rows={4}
                    />
                  </div>
                </div>

                {/* O - Objetivo */}
                <div className={`rounded-xl ${isDark ? 'bg-[#0f83b2]/5 border border-[#0f83b2]/20' : 'bg-gray-50 border border-gray-200'
                  }`}>
                  <div className="p-5">
                    <label className="flex items-center gap-3 mb-3">
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] text-white font-bold text-lg shadow-md">
                        O
                      </div>
                      <div>
                        <span className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-800'
                          }`}>
                          Objetivo
                        </span>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                          Lo que el médico observa
                        </p>
                      </div>
                    </label>
                    <textarea
                      value={objetivo}
                      onChange={(e) => setObjetivo(e.target.value)}
                      placeholder="Describa los signos clínicos observados y hallazgos en la exploración física..."
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0f83b2] focus:border-[#0f83b2] resize-none transition-all ${isDark
                        ? 'bg-[#0d1f2d] border-[#0f83b2]/30 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        }`}
                      rows={4}
                    />
                  </div>
                </div>

                {/* A - Assessment (Diagnóstico CIE-11) */}
                <div className={`rounded-xl ${isDark ? 'bg-[#0f83b2]/5 border border-[#0f83b2]/20' : 'bg-gray-50 border border-gray-200'
                  }`}>
                  <div className="p-5">
                    <label className="flex items-center gap-3 mb-3">
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] text-white font-bold text-lg shadow-md">
                        A
                      </div>
                      <div>
                        <span className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-800'
                          }`}>
                          Assessment (Diagnósticos)
                        </span>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                          Clasificación CIE-11 - Puede agregar múltiples diagnósticos
                        </p>
                      </div>
                    </label>
                    <SelectorCIE11
                      onDiagnosticosChange={setDiagnosticosSeleccionados}
                      diagnosticosSeleccionados={diagnosticosSeleccionados}
                      isDark={isDark}
                      maxDiagnosticos={10}
                    />

                    {/* Campo Análisis dentro de Assessment */}
                    <div className="mt-4">
                      <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                        Análisis Clínico
                        <span className={`text-xs ml-2 font-normal ${isDark ? 'text-gray-500' : 'text-gray-500'
                          }`}>
                          (Notas adicionales del diagnóstico)
                        </span>
                      </label>
                      <textarea
                        value={analisis}
                        onChange={(e) => setAnalisis(e.target.value)}
                        placeholder="Análisis clínico, diagnóstico diferencial o notas complementarias..."
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0f83b2] focus:border-[#0f83b2] resize-none transition-all ${isDark
                          ? 'bg-[#0d1f2d] border-[#0f83b2]/30 text-white placeholder-gray-500'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                          }`}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Botón Siguiente Mejorado */}
                <div className={`flex justify-end pt-6 border-t-2 ${isDark ? 'border-[#0f83b2]/20' : 'border-gray-200'
                  }`}>
                  <button
                    onClick={handleSiguiente}
                    className={`group flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg ${isDark
                      ? 'bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] text-white hover:shadow-[#0db1ec]/30 hover:shadow-2xl hover:scale-105'
                      : 'bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] text-white hover:shadow-[#0f83b2]/40 hover:shadow-2xl hover:scale-105'
                      }`}
                  >
                    Continuar al Plan
                    <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
