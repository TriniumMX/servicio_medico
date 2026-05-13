'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { PacienteEnEspera } from '@/types/consultas';
import { Clock, User, Activity, RefreshCw, FileCheck } from 'lucide-react';
import TablaPacientesEspera from '@/components/consultas/diagnosticos/TablaPacientesEspera';
import TablaPacientesAtendidos from '@/components/consultas/diagnosticos/TablaPacientesAtendidos';
import ModalReceta from '@/components/recetas/ModalReceta';

export default function DiagnosticoPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [pacientes, setPacientes] = useState<PacienteEnEspera[]>([]);
  const [consultasAtendidas, setConsultasAtendidas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vistaActual, setVistaActual] = useState<'espera' | 'atendidos'>('espera');
  const [showModalReceta, setShowModalReceta] = useState(false);
  const [recetaParaModal, setRecetaParaModal] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    await Promise.all([
      cargarPacientes(),
      cargarConsultasAtendidas()
    ]);
  };

  const isDark = mounted && theme === 'dark';

  const cargarPacientes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/diagnostico/pacientes-en-espera');
      const data = await response.json();

      if (data.success) {
        setPacientes(data.pacientes);
      } else {
        setError(data.error || 'Error al cargar pacientes');
      }
    } catch (err) {
      console.error('Error al cargar pacientes:', err);
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const cargarConsultasAtendidas = async () => {
    try {
      const response = await fetch('/api/consultas/atendidas?dias=7');
      const data = await response.json();

      if (data.success) {
        setConsultasAtendidas(data.consultas);
      }
    } catch (err) {
      console.error('Error al cargar consultas atendidas:', err);
    }
  };

  const handleImprimirReceta = (consulta: any) => {
    // Construir datos mínimos para el modal (el modal carga el PDF internamente vía id_consulta)
    const recetaData = {
      id_consulta: consulta.id_consulta,
      folio_receta: consulta.folio_receta || '',
      folio_consulta: consulta.folio || '',
      fecha_emision: consulta.fecha_atencion,
      paciente: {
        nombre: consulta.nombre,
        edad: consulta.edad,
        no_nomina: consulta.no_nomina || '',
        departamento: consulta.departamento || '',
        es_empleado: consulta.es_empleado,
      },
      medico: { nombre: '', cedula: '' },
      medicamentos: [],
      diagnostico: consulta.cie11_codigo
        ? { codigo: consulta.cie11_codigo, titulo: consulta.cie11_titulo || '' }
        : undefined,
    };
    setRecetaParaModal(recetaData);
    setShowModalReceta(true);
  };

  const handleCerrarModalReceta = () => {
    setShowModalReceta(false);
    setRecetaParaModal(null);
  };

  const handleAtender = (paciente: PacienteEnEspera) => {
    const id = paciente.id_consulta || paciente.id_signo_vital;
    router.push(`/dashboard/consultas/diagnostico/atender/${id}`);
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0d2137]' : 'bg-gray-50'
        }`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-16 w-16 border-b-2 mx-auto ${isDark ? 'border-[#0db1ec]' : 'border-[#0f83b2]'
            }`}></div>
          <p className={`mt-4 font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Cargando pacientes...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className={`rounded-2xl shadow-lg p-6 lg:p-8 ${isDark
        ? 'bg-gradient-to-r from-[#0a1929] to-[#0d2137] border border-[#0f83b2]/20'
        : 'bg-white border border-gray-200'
        }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0f83b2] to-[#0db1ec] shadow-lg shadow-blue-500/20">
              <Activity className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <div>
              <h1 className={`text-3xl sm:text-4xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Diagnóstico Médico
              </h1>
              <p className={`mt-2 text-base ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Gestión de pacientes en espera y consultas finalizadas
              </p>
            </div>
          </div>
          <button
            onClick={cargarDatos}
            disabled={loading}
            className={`self-start lg:self-auto flex items-center gap-3 px-6 py-3.5 rounded-xl font-bold transition-all border shadow-sm ${loading
              ? 'opacity-50 cursor-not-allowed'
              : isDark
                ? 'bg-[#0d1f2d] text-[#0db1ec] border-[#0f83b2]/20 hover:bg-[#0f83b2]/10'
                : 'bg-white text-[#0f83b2] border-gray-200 hover:bg-gray-50'
              }`}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Actualizar Datos
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`p-4 rounded-lg border ${isDark
          ? 'bg-red-500/10 border-red-500/30 text-red-400'
          : 'bg-red-50 border-red-200 text-red-700'
          }`}>
          {error}
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total en espera */}
        <div className={`rounded-xl shadow-lg p-6 ${isDark ? 'bg-[#0a1929] border border-[#0f83b2]/20' : 'bg-white border border-gray-200'
          }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Pacientes en Espera
              </p>
              <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {pacientes.length}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
              <User className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Empleados */}
        <div className={`rounded-xl shadow-lg p-6 ${isDark ? 'bg-[#0a1929] border border-[#0f83b2]/20' : 'bg-white border border-gray-200'
          }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Empleados
              </p>
              <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {pacientes.filter(p => p.es_empleado || p.elpacienteesempleado).length}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600">
              <User className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Beneficiarios */}
        <div className={`rounded-xl shadow-lg p-6 ${isDark ? 'bg-[#0a1929] border border-[#0f83b2]/20' : 'bg-white border border-gray-200'
          }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Beneficiarios
              </p>
              <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {pacientes.filter(p => !(p.es_empleado || p.elpacienteesempleado)).length}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
              <User className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs / Switch de Vistas */}
      <div className="flex justify-center">
        <div className={`p-1.5 rounded-2xl border flex w-full max-w-2xl relative ${isDark ? 'bg-[#0a1929] border-[#0f83b2]/30' : 'bg-white border-gray-200 shadow-sm'
          }`}>

          {/* Opción: En Espera */}
          <button
            onClick={() => setVistaActual('espera')}
            className={`flex-1 relative flex items-center justify-center gap-2 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-bold transition-all z-10 ${vistaActual === 'espera'
              ? isDark ? 'text-white' : 'text-[#0f83b2]'
              : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {vistaActual === 'espera' && (
              <motion.div
                layoutId="activeTab"
                className={`absolute inset-0 rounded-xl shadow-sm ${isDark ? 'bg-[#0f83b2]' : 'bg-blue-50/80 border border-blue-100'}`}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative flex items-center gap-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Pacientes en Espera</span>
              <span className="sm:hidden">En Espera</span>
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${vistaActual === 'espera'
                ? isDark ? 'bg-white/20 text-white' : 'bg-white text-[#0f83b2] shadow-sm'
                : isDark ? 'bg-[#0a1929] text-gray-500' : 'bg-gray-100 text-gray-500'
                }`}>
                {pacientes.length}
              </span>
            </span>
          </button>

          {/* Opción: Atendidos */}
          <button
            onClick={() => setVistaActual('atendidos')}
            className={`flex-1 relative flex items-center justify-center gap-2 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-bold transition-all z-10 ${vistaActual === 'atendidos'
              ? isDark ? 'text-white' : 'text-green-600'
              : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {vistaActual === 'atendidos' && (
              <motion.div
                layoutId="activeTab"
                className={`absolute inset-0 rounded-xl shadow-sm ${isDark ? 'bg-green-600' : 'bg-green-50/80 border border-green-100'}`}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative flex items-center gap-2">
              <FileCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Pacientes Atendidos</span>
              <span className="sm:hidden">Atendidos</span>
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${vistaActual === 'atendidos'
                ? isDark ? 'bg-white/20 text-white' : 'bg-white text-green-600 shadow-sm'
                : isDark ? 'bg-[#0a1929] text-gray-500' : 'bg-gray-100 text-gray-500'
                }`}>
                {consultasAtendidas.length}
              </span>
            </span>
          </button>
        </div>
      </div>

      {/* Tabla de Pacientes */}
      {vistaActual === 'espera' ? (
        <TablaPacientesEspera
          pacientes={pacientes}
          isDark={isDark}
          onAtender={handleAtender}
        />
      ) : (
        <TablaPacientesAtendidos
          consultas={consultasAtendidas}
          isDark={isDark}
          onImprimirReceta={handleImprimirReceta}
        />
      )}

      {/* Modal de vista previa de receta para reimprimir */}
      {showModalReceta && recetaParaModal && (
        <ModalReceta
          isOpen={showModalReceta}
          onClose={handleCerrarModalReceta}
          recetaData={recetaParaModal}
          isDark={isDark}
        />
      )}
    </div>
  );
}
