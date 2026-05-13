// src/app/dashboard/consultas/signos-vitales/page.tsx

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Plus, RefreshCw } from 'lucide-react';
import { useConsultas } from '@/hooks/consultas/useConsultas';
import BuscarPorNomina from '@/components/consultas/signos-vitales/BuscarPorNomina';
import TablaConsultas from '@/components/consultas/signos-vitales/TablaConsultas';

function SignosVitalesContent() {
  const { theme } = useTheme();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const isDark = mounted && theme === 'dark';

  const [mostrarBuscador, setMostrarBuscador] = useState(false);
  const [referenciaId, setReferenciaId] = useState<number | null>(null);
  const [nominaPrevia, setNominaPrevia] = useState<string>('');
  const [beneficiarioId, setBeneficiarioId] = useState<number | null>(null);
  const [tipoPacientePrevia, setTipoPacientePrevia] = useState<'empleado' | 'beneficiario' | null>(null);

  // Cargar signos vitales con clavestatus=1 (en espera)
  const { consultas, loading, recargar } = useConsultas(1, true);

  // Detectar parametros de URL para flujo de atención de referencia
  useEffect(() => {
    setMounted(true);
    const refId = searchParams.get('referencia');
    const nomina = searchParams.get('nomina');
    const benId = searchParams.get('beneficiario');
    const tipo = searchParams.get('tipoPaciente');

    if (refId && nomina) {
      setReferenciaId(parseInt(refId));
      setNominaPrevia(nomina);
      if (benId) setBeneficiarioId(parseInt(benId));
      if (tipo === 'empleado' || tipo === 'beneficiario') setTipoPacientePrevia(tipo);
      setMostrarBuscador(true);
    }
  }, [searchParams]);

  if (!mounted) {
    return <div className="min-h-screen p-4 sm:p-6" />;
  }

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-gradient-to-br from-[#0f83b2] to-[#0db1ec]">
              <Activity size={28} className="text-white" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Signos Vitales
              </h1>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Registro y seguimiento de signos vitales
              </p>
            </div>
          </div>

          {/* Botón Recargar */}
          <button
            onClick={recargar}
            disabled={loading}
            className={`self-start sm:self-auto p-3 rounded-lg transition-all ${isDark
              ? 'bg-[#0d1f2d] text-[#0db1ec] hover:bg-[#0f83b2]/20'
              : 'bg-gray-100 text-[#0f83b2] hover:bg-gray-200'
              } ${loading ? 'animate-spin' : ''}`}
            title="Recargar consultas"
          >
            <RefreshCw size={20} />
          </button>
        </motion.div>

        {/* Botón Buscar Paciente - Premium UI Redesign */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <button
            onClick={() => {
              setReferenciaId(null);
              setNominaPrevia('');
              setMostrarBuscador(true);
            }}
            className={`w-full py-3.5 rounded-xl font-bold text-base transition-all duration-300 group relative overflow-hidden ${isDark
              ? 'bg-[#0f83b2]/10 hover:bg-[#0f83b2]/20 text-[#2dafdc] border border-[#0f83b2]/30 hover:border-[#2dafdc]/50'
              : 'bg-white hover:bg-gray-50 text-[#0f83b2] border border-gray-200 hover:border-[#0f83b2]/30 shadow-sm hover:shadow-md'
              }`}
          >
            <div className="flex items-center justify-center gap-2 relative z-10">
              <div className={`p-1.5 rounded-lg transition-colors ${isDark ? 'bg-[#0f83b2]/20' : 'bg-[#0f83b2]/10'}`}>
                <Plus size={20} className="group-hover:scale-110 transition-transform duration-300" />
              </div>
              <span>Agregar Paciente por Nómina</span>
            </div>
          </button>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-[#0f83b2]/30 border-t-[#0db1ec] rounded-full animate-spin" />
          </div>
        )}

        {/* Tabla de Signos Vitales */}
        {!loading && (
          <TablaConsultas
            consultas={consultas}
            isDark={isDark}
          />
        )}

        {/* Modal Buscar por Nómina */}
        <AnimatePresence>
          {mostrarBuscador && (
            <BuscarPorNomina
              onCerrar={() => {
                setMostrarBuscador(false);
                // Si venía de referencia, limpiar URL al cerrar
                if (referenciaId) {
                  window.history.replaceState({}, '', '/dashboard/consultas/signos-vitales');
                  setReferenciaId(null);
                  setNominaPrevia('');
                }
              }}
              isDark={isDark}
              onSuccess={() => {
                recargar();
                setMostrarBuscador(false);
              }}
              referenciaId={referenciaId}
              nominaInicial={nominaPrevia}
              beneficiarioId={beneficiarioId}
              tipoPacienteInicial={tipoPacientePrevia}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function SignosVitalesPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <SignosVitalesContent />
    </Suspense>
  );
}
