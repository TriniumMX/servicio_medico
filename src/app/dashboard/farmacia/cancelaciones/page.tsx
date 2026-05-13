// src/app/dashboard/farmacia/cancelaciones/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XCircle,
  Search,
  AlertTriangle,
  FileText,
  User,
  Calendar,
  Hash,
  CheckCircle,
  Loader2,
  Stethoscope,
  ClipboardList,
  Building,
  Pill,
  RefreshCw,
  Package,
  Ban,
  UserX,
} from 'lucide-react';

// Interfaces para el plan JSON
interface MedicamentoPlan {
  id_temp: string;
  clavemedicamento: number;
  nombre_medicamento: string;
  indicaciones: string;
  tratamiento_dias: number;
  piezas: number;
  realizar_resurtimiento: boolean;
  meses_resurtimiento: number;
}

interface PlanData {
  opciones?: {
    medicamentos?: boolean;
    incapacidad?: boolean;
    especialidad?: boolean;
    laboratorio?: boolean;
  };
  medicamentos?: {
    medicamentos?: MedicamentoPlan[];
  };
}

interface ConsultaData {
  id_consulta: number;
  folio: string;
  paciente: string;
  nomina: string;
  fecha_consulta: string;
  edad: number | null;
  sexo: string | null;
  departamento: string | null;
  motivo_consulta: string | null;
  // SOAP
  subjetivo: string | null;
  objetivo: string | null;
  analisis: string | null;
  plan: string | null;
}

interface RecetaData {
  id_receta: number;
  folio_receta: string;
  tipo_receta: string;
  fecha_emision: string;
  cancelado: boolean;
  motivo_cancelacion: string | null;
  fecha_cancelacion: string | null;
  usuario_cancelo?: { nombre: string; username: string } | null;
}

interface SurtimientoHistorial {
  cantidad: number;
  fecha: string;
  observaciones: string | null;
}

interface MedicamentoData {
  id_detalle: number;
  medicamento: {
    id_medicamento: number;
    nombre_comercial: string;
    sustancia_activa: string;
  };
  prescripcion: {
    cantidad_total: number;
    dosis: string;
    duracion_tratamiento_dias: number;
    realizar_resurtimiento: boolean;
    meses_resurtimiento: number | null;
  };
  surtimientos: {
    total_surtido: number;
    pendiente_surtir: number;
    cantidad_entregas: number;
    historial: SurtimientoHistorial[];
  };
}

interface ResumenData {
  total_medicamentos: number;
  medicamentos_con_entregas: number;
  hay_entregas_previas: boolean;
}

interface BusquedaResult {
  consulta: ConsultaData;
  receta: RecetaData;
  medicamentos?: MedicamentoData[];
  resumen?: ResumenData;
}

export default function CancelacionesPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = mounted && theme === 'dark';

  const [folioConsulta, setFolioConsulta] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [resultado, setResultado] = useState<BusquedaResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [cancelacionExitosa, setCancelacionExitosa] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleBuscar = async () => {
    if (!folioConsulta.trim()) {
      setError('Ingresa un folio de consulta');
      return;
    }

    setIsSearching(true);
    setError(null);
    setResultado(null);
    setCancelacionExitosa(false);

    try {
      const response = await fetch(
        `/api/recetas/cancelar?folio_consulta=${encodeURIComponent(folioConsulta.trim())}`
      );
      const data = await response.json();

      if (data.success) {
        setResultado(data.data);
      } else {
        setError(data.error || 'No se encontró la consulta');
      }
    } catch (err) {
      setError('Error al buscar la consulta');
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCancelar = async () => {
    if (!motivoCancelacion.trim()) {
      setError('Debes ingresar un motivo de cancelación');
      return;
    }

    if (!resultado) return;

    setIsCanceling(true);
    setError(null);

    try {
      const response = await fetch('/api/recetas/cancelar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folio_consulta: resultado.consulta.folio,
          motivo_cancelacion: motivoCancelacion.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCancelacionExitosa(true);
        setResultado((prev) =>
          prev
            ? {
                ...prev,
                receta: {
                  ...prev.receta,
                  cancelado: true,
                  motivo_cancelacion: motivoCancelacion.trim(),
                  fecha_cancelacion: new Date().toISOString(),
                },
              }
            : null
        );
        setMotivoCancelacion('');
      } else {
        setError(data.error || 'Error al cancelar la receta');
      }
    } catch (err) {
      setError('Error al procesar la cancelación');
      console.error(err);
    } finally {
      setIsCanceling(false);
    }
  };

  const handleNuevaBusqueda = () => {
    setFolioConsulta('');
    setResultado(null);
    setError(null);
    setMotivoCancelacion('');
    setCancelacionExitosa(false);
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

  // Parsear el plan JSON
  const parsePlan = (planString: string | null): PlanData | null => {
    if (!planString) return null;
    try {
      return JSON.parse(planString);
    } catch {
      return null;
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen p-6 md:p-8 space-y-8 transition-colors duration-300">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col xl:flex-row xl:items-center justify-between gap-6"
      >
        <div className="flex items-center gap-5">
          <div
            className={`p-4 rounded-2xl shadow-lg shadow-red-500/20 ${
              isDark
                ? 'bg-gradient-to-br from-red-600 to-rose-800 border border-red-500/20'
                : 'bg-gradient-to-br from-red-500 to-rose-400'
            }`}
          >
            <XCircle className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1
              className={`text-3xl font-bold tracking-tight ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              Cancelaciones
            </h1>
            <p
              className={`mt-1 font-medium ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              Cancelar recetas por folio de consulta
            </p>
          </div>
        </div>
      </motion.div>

      {/* Contenido Principal */}
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Buscador */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-2xl border ${
            isDark
              ? 'bg-[#0a1929] border-gray-800'
              : 'bg-white border-gray-200 shadow-sm'
          }`}
        >
          <label
            className={`block text-sm font-bold mb-3 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            Folio de Consulta
          </label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search
                className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`}
                size={20}
              />
              <input
                type="text"
                value={folioConsulta}
                onChange={(e) => setFolioConsulta(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
                placeholder="Ej: A7K9M2F8"
                className={`w-full pl-12 pr-4 py-3 rounded-xl border text-lg font-mono ${
                  isDark
                    ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-red-500'
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-500'
                } focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all`}
              />
            </div>
            <button
              onClick={handleBuscar}
              disabled={isSearching}
              className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
                isDark
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              } disabled:opacity-50`}
            >
              {isSearching ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Search size={20} />
              )}
              Buscar
            </button>
          </div>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-xl flex items-center gap-3 ${
                isDark
                  ? 'bg-red-900/20 border border-red-800 text-red-400'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              <AlertTriangle size={20} />
              <span className="font-medium">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cancelación exitosa */}
        <AnimatePresence>
          {cancelacionExitosa && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`p-6 rounded-xl flex items-center gap-4 ${
                isDark
                  ? 'bg-green-900/20 border border-green-800'
                  : 'bg-green-50 border border-green-200'
              }`}
            >
              <CheckCircle
                className={isDark ? 'text-green-400' : 'text-green-600'}
                size={32}
              />
              <div>
                <h3
                  className={`font-bold text-lg ${
                    isDark ? 'text-green-400' : 'text-green-700'
                  }`}
                >
                  Receta Cancelada Exitosamente
                </h3>
                <p
                  className={`text-sm ${
                    isDark ? 'text-green-300' : 'text-green-600'
                  }`}
                >
                  La receta ya no podrá ser surtida ni resurtida.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Resultado de búsqueda */}
        <AnimatePresence>
          {resultado && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Card de información */}
              <div
                className={`p-6 rounded-2xl border ${
                  isDark
                    ? 'bg-[#0a1929] border-gray-800'
                    : 'bg-white border-gray-200 shadow-sm'
                }`}
              >
                <h3
                  className={`text-lg font-bold mb-4 flex items-center gap-2 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  <FileText size={20} />
                  Información de la Receta
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Paciente */}
                  <div
                    className={`p-4 rounded-xl ${
                      isDark ? 'bg-gray-800/50' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <User
                        size={16}
                        className={isDark ? 'text-gray-500' : 'text-gray-400'}
                      />
                      <span
                        className={`text-xs font-bold uppercase ${
                          isDark ? 'text-gray-500' : 'text-gray-400'
                        }`}
                      >
                        Paciente
                      </span>
                    </div>
                    <p
                      className={`font-semibold ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {resultado.consulta.paciente}
                    </p>
                    <p
                      className={`text-sm ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      Nómina: {resultado.consulta.nomina}
                    </p>
                  </div>

                  {/* Folio Consulta */}
                  <div
                    className={`p-4 rounded-xl ${
                      isDark ? 'bg-gray-800/50' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Hash
                        size={16}
                        className={isDark ? 'text-gray-500' : 'text-gray-400'}
                      />
                      <span
                        className={`text-xs font-bold uppercase ${
                          isDark ? 'text-gray-500' : 'text-gray-400'
                        }`}
                      >
                        Folio Consulta
                      </span>
                    </div>
                    <p
                      className={`font-mono font-bold text-lg ${
                        isDark ? 'text-blue-400' : 'text-blue-600'
                      }`}
                    >
                      {resultado.consulta.folio}
                    </p>
                  </div>

                  {/* Folio Receta */}
                  <div
                    className={`p-4 rounded-xl ${
                      isDark ? 'bg-gray-800/50' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FileText
                        size={16}
                        className={isDark ? 'text-gray-500' : 'text-gray-400'}
                      />
                      <span
                        className={`text-xs font-bold uppercase ${
                          isDark ? 'text-gray-500' : 'text-gray-400'
                        }`}
                      >
                        Folio Receta
                      </span>
                    </div>
                    <p
                      className={`font-mono font-bold text-lg ${
                        isDark ? 'text-emerald-400' : 'text-emerald-600'
                      }`}
                    >
                      {resultado.receta.folio_receta}
                    </p>
                    <p
                      className={`text-xs ${
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      }`}
                    >
                      Tipo: {resultado.receta.tipo_receta}
                    </p>
                  </div>

                  {/* Fecha emisión */}
                  <div
                    className={`p-4 rounded-xl ${
                      isDark ? 'bg-gray-800/50' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar
                        size={16}
                        className={isDark ? 'text-gray-500' : 'text-gray-400'}
                      />
                      <span
                        className={`text-xs font-bold uppercase ${
                          isDark ? 'text-gray-500' : 'text-gray-400'
                        }`}
                      >
                        Fecha Emisión
                      </span>
                    </div>
                    <p
                      className={`font-medium ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {formatDate(resultado.receta.fecha_emision)}
                    </p>
                  </div>

                  {/* Edad y Sexo */}
                  <div
                    className={`p-4 rounded-xl ${
                      isDark ? 'bg-gray-800/50' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <User
                        size={16}
                        className={isDark ? 'text-gray-500' : 'text-gray-400'}
                      />
                      <span
                        className={`text-xs font-bold uppercase ${
                          isDark ? 'text-gray-500' : 'text-gray-400'
                        }`}
                      >
                        Edad / Sexo
                      </span>
                    </div>
                    <p
                      className={`font-medium ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {resultado.consulta.edad || 'N/A'} años / {resultado.consulta.sexo === 'M' ? 'Masculino' : resultado.consulta.sexo === 'F' ? 'Femenino' : 'N/A'}
                    </p>
                  </div>

                  {/* Departamento */}
                  <div
                    className={`p-4 rounded-xl ${
                      isDark ? 'bg-gray-800/50' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Building
                        size={16}
                        className={isDark ? 'text-gray-500' : 'text-gray-400'}
                      />
                      <span
                        className={`text-xs font-bold uppercase ${
                          isDark ? 'text-gray-500' : 'text-gray-400'
                        }`}
                      >
                        Departamento
                      </span>
                    </div>
                    <p
                      className={`font-medium text-sm ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {resultado.consulta.departamento || 'No especificado'}
                    </p>
                  </div>
                </div>

                {/* Motivo de Consulta */}
                {resultado.consulta.motivo_consulta && (
                  <div
                    className={`mt-4 p-4 rounded-xl ${
                      isDark ? 'bg-gray-800/50' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Stethoscope
                        size={16}
                        className={isDark ? 'text-cyan-400' : 'text-cyan-600'}
                      />
                      <span
                        className={`text-xs font-bold uppercase ${
                          isDark ? 'text-gray-500' : 'text-gray-400'
                        }`}
                      >
                        Motivo de Consulta
                      </span>
                    </div>
                    <p
                      className={`text-sm ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      {resultado.consulta.motivo_consulta}
                    </p>
                  </div>
                )}

                {/* SOAP */}
                {(resultado.consulta.subjetivo || resultado.consulta.objetivo || resultado.consulta.analisis || resultado.consulta.plan) && (
                  <div className={`mt-4 p-4 rounded-xl border ${
                    isDark ? 'bg-cyan-900/10 border-cyan-800/30' : 'bg-cyan-50 border-cyan-100'
                  }`}>
                    <div className="flex items-center gap-2 mb-3">
                      <ClipboardList
                        size={18}
                        className={isDark ? 'text-cyan-400' : 'text-cyan-600'}
                      />
                      <span
                        className={`text-sm font-bold ${
                          isDark ? 'text-cyan-300' : 'text-cyan-700'
                        }`}
                      >
                        Nota SOAP
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {resultado.consulta.subjetivo && (
                        <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-white'}`}>
                          <p className={`text-xs font-bold uppercase mb-1 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                            S - Subjetivo
                          </p>
                          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {resultado.consulta.subjetivo}
                          </p>
                        </div>
                      )}
                      {resultado.consulta.objetivo && (
                        <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-white'}`}>
                          <p className={`text-xs font-bold uppercase mb-1 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                            O - Objetivo
                          </p>
                          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {resultado.consulta.objetivo}
                          </p>
                        </div>
                      )}
                      {resultado.consulta.analisis && (
                        <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-white'}`}>
                          <p className={`text-xs font-bold uppercase mb-1 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                            A - Análisis
                          </p>
                          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {resultado.consulta.analisis}
                          </p>
                        </div>
                      )}
                      {resultado.consulta.plan && (() => {
                        const planData = parsePlan(resultado.consulta.plan);
                        const medicamentos = planData?.medicamentos?.medicamentos || [];

                        return (
                          <div className={`p-3 rounded-lg md:col-span-2 ${isDark ? 'bg-gray-800/50' : 'bg-white'}`}>
                            <p className={`text-xs font-bold uppercase mb-2 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                              P - Plan (Medicamentos)
                            </p>
                            {medicamentos.length > 0 ? (
                              <div className="space-y-2">
                                {medicamentos.map((med, idx) => (
                                  <div
                                    key={med.id_temp || idx}
                                    className={`p-2 rounded-lg border ${isDark ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <Pill size={14} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
                                      <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {med.nombre_medicamento}
                                      </span>
                                      <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                                        {med.piezas} pzas × {med.tratamiento_dias} días
                                      </span>
                                    </div>
                                    <p className={`text-xs ml-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {med.indicaciones}
                                    </p>
                                    {med.realizar_resurtimiento && (
                                      <div className={`flex items-center gap-1 mt-1 ml-5`}>
                                        <RefreshCw size={12} className={isDark ? 'text-amber-400' : 'text-amber-600'} />
                                        <span className={`text-xs ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                          Resurtimiento: {med.meses_resurtimiento} {med.meses_resurtimiento === 1 ? 'mes' : 'meses'}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Sin medicamentos en el plan
                              </p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Medicamentos con Entregas */}
                {resultado.medicamentos && resultado.medicamentos.length > 0 && (
                  <div className={`mt-4 p-4 rounded-xl border ${
                    isDark ? 'bg-purple-900/10 border-purple-800/30' : 'bg-purple-50 border-purple-100'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Package
                          size={18}
                          className={isDark ? 'text-purple-400' : 'text-purple-600'}
                        />
                        <span className={`text-sm font-bold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                          Medicamentos de la Receta
                        </span>
                      </div>
                      {resultado.resumen?.hay_entregas_previas && (
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          isDark ? 'bg-amber-900/50 text-amber-300' : 'bg-amber-100 text-amber-700'
                        }`}>
                          Con entregas previas
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {resultado.medicamentos.map((med) => (
                        <div
                          key={med.id_detalle}
                          className={`p-3 rounded-lg border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Pill size={14} className={isDark ? 'text-purple-400' : 'text-purple-600'} />
                                <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {med.medicamento.nombre_comercial}
                                </span>
                              </div>
                              <p className={`text-xs ml-5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                {med.medicamento.sustancia_activa}
                              </p>
                              <p className={`text-xs ml-5 mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {med.prescripcion.dosis}
                              </p>
                            </div>
                            <div className="text-right">
                              {med.surtimientos.total_surtido > 0 ? (
                                <div className={`px-2 py-1 rounded-lg ${isDark ? 'bg-emerald-900/50' : 'bg-emerald-50'}`}>
                                  <p className={`text-xs font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                                    Entregado
                                  </p>
                                  <p className={`text-sm font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>
                                    {med.surtimientos.total_surtido} / {med.prescripcion.cantidad_total} pzas
                                  </p>
                                  <p className={`text-xs ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                    {med.surtimientos.cantidad_entregas} {med.surtimientos.cantidad_entregas === 1 ? 'entrega' : 'entregas'}
                                  </p>
                                </div>
                              ) : (
                                <div className={`px-2 py-1 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                  <p className={`text-xs font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Sin entregar
                                  </p>
                                  <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    0 / {med.prescripcion.cantidad_total} pzas
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          {med.prescripcion.realizar_resurtimiento && (
                            <div className={`flex items-center gap-1 mt-2 ml-5`}>
                              <RefreshCw size={12} className={isDark ? 'text-amber-400' : 'text-amber-600'} />
                              <span className={`text-xs ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                Tratamiento de {med.prescripcion.meses_resurtimiento} {med.prescripcion.meses_resurtimiento === 1 ? 'mes' : 'meses'}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Advertencia de desactivación de tratamiento */}
                {!resultado.receta.cancelado && resultado.resumen?.hay_entregas_previas && (
                  <div className={`mt-4 p-4 rounded-xl border-2 border-dashed ${
                    isDark ? 'bg-amber-900/10 border-amber-700' : 'bg-amber-50 border-amber-300'
                  }`}>
                    <div className="flex items-start gap-3">
                      <Ban className={`flex-shrink-0 mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} size={20} />
                      <div>
                        <p className={`font-bold text-sm ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                          Atención: Ya se han realizado entregas de esta receta
                        </p>
                        <p className={`text-xs mt-1 ${isDark ? 'text-amber-400/80' : 'text-amber-600/80'}`}>
                          Al cancelar esta receta, <strong>se desactivará el tratamiento completo</strong>.
                          El paciente no podrá recibir más surtimientos ni resurtimientos de los medicamentos asociados.
                          Esta acción es irreversible.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Estado de cancelación */}
                {resultado.receta.cancelado && (
                  <div
                    className={`mt-4 p-4 rounded-xl border ${
                      isDark
                        ? 'bg-red-900/20 border-red-800'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <XCircle
                        className={isDark ? 'text-red-400' : 'text-red-600'}
                        size={20}
                      />
                      <span
                        className={`font-bold ${
                          isDark ? 'text-red-400' : 'text-red-700'
                        }`}
                      >
                        Receta Cancelada
                      </span>
                    </div>

                    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 p-3 rounded-lg ${
                      isDark ? 'bg-gray-900/50' : 'bg-white/50'
                    }`}>
                      {/* Fecha de cancelación */}
                      {resultado.receta.fecha_cancelacion && (
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                          <div>
                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              Fecha de cancelación
                            </p>
                            <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {formatDate(resultado.receta.fecha_cancelacion)}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Usuario que canceló */}
                      {resultado.receta.usuario_cancelo && (
                        <div className="flex items-center gap-2">
                          <UserX size={16} className={isDark ? 'text-red-400' : 'text-red-500'} />
                          <div>
                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              Cancelado por
                            </p>
                            <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {resultado.receta.usuario_cancelo.nombre}
                            </p>
                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              @{resultado.receta.usuario_cancelo.username}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Motivo */}
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-red-900/30' : 'bg-red-100/50'}`}>
                      <div className="flex items-start gap-2">
                        <AlertTriangle size={16} className={`flex-shrink-0 mt-0.5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                        <div>
                          <p className={`text-xs font-bold uppercase ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                            Motivo de cancelación
                          </p>
                          <p className={`text-sm mt-1 ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                            {resultado.receta.motivo_cancelacion || 'No especificado'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Formulario de cancelación */}
              {!resultado.receta.cancelado && (
                <div
                  className={`p-6 rounded-2xl border ${
                    isDark
                      ? 'bg-[#0a1929] border-red-900/50'
                      : 'bg-white border-red-200 shadow-sm'
                  }`}
                >
                  <h3
                    className={`text-lg font-bold mb-4 flex items-center gap-2 ${
                      isDark ? 'text-red-400' : 'text-red-700'
                    }`}
                  >
                    <AlertTriangle size={20} />
                    Cancelar Receta
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label
                        className={`block text-sm font-bold mb-2 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}
                      >
                        Motivo de Cancelación *
                      </label>
                      <textarea
                        value={motivoCancelacion}
                        onChange={(e) => setMotivoCancelacion(e.target.value)}
                        placeholder="Describe el motivo por el cual se cancela esta receta..."
                        rows={4}
                        className={`w-full px-4 py-3 rounded-xl border resize-none ${
                          isDark
                            ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-red-500'
                            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-500'
                        } focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all`}
                      />
                    </div>

                    <div
                      className={`p-4 rounded-xl ${
                        isDark ? 'bg-yellow-900/20' : 'bg-yellow-50'
                      }`}
                    >
                      <p
                        className={`text-sm ${
                          isDark ? 'text-yellow-300' : 'text-yellow-700'
                        }`}
                      >
                        <strong>Advertencia:</strong> Una vez cancelada, la
                        receta no podrá ser surtida ni se podrán generar
                        resurtimientos. Esta acción no se puede deshacer.
                      </p>
                    </div>

                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={handleNuevaBusqueda}
                        className={`px-5 py-2.5 rounded-xl font-bold transition-all ${
                          isDark
                            ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        Nueva Búsqueda
                      </button>
                      <button
                        onClick={handleCancelar}
                        disabled={isCanceling || !motivoCancelacion.trim()}
                        className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${
                          isDark
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-red-500 hover:bg-red-600 text-white'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isCanceling ? (
                          <Loader2 className="animate-spin" size={20} />
                        ) : (
                          <XCircle size={20} />
                        )}
                        Confirmar Cancelación
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Botón nueva búsqueda si ya está cancelada */}
              {resultado.receta.cancelado && (
                <div className="flex justify-center">
                  <button
                    onClick={handleNuevaBusqueda}
                    className={`px-6 py-3 rounded-xl font-bold transition-all ${
                      isDark
                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    Buscar Otra Receta
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
