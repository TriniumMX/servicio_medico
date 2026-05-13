// src/app/dashboard/farmacia/surtimiento/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { Pill, Activity, CheckCircle, Clock, AlertTriangle, Search, FileText } from 'lucide-react';
import BusquedaReceta from '@/components/farmacia/surtimiento/BusquedaReceta';
import CardInfoReceta from '@/components/farmacia/surtimiento/CardInfoReceta';
import TablaMedicamentos from '@/components/farmacia/surtimiento/TablaMedicamentos';
import ModalSurtimiento from '@/components/farmacia/surtimiento/ModalSurtimiento';
import ModalMarcarCero from '@/components/farmacia/surtimiento/ModalMarcarCero';
import { RecetaCompleta, MedicamentoReceta } from '@/types/farmacia/surtimiento';

export default function SurtimientoPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = mounted && theme === 'dark';

  const [recetaActual, setRecetaActual] = useState<RecetaCompleta | null>(null);
  const [medicamentoSeleccionado, setMedicamentoSeleccionado] = useState<MedicamentoReceta | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalMarcarCero, setMostrarModalMarcarCero] = useState(false);
  const [isLoadingMarcarCero, setIsLoadingMarcarCero] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRecetaEncontrada = (data: RecetaCompleta | undefined) => {
    if (data) {
      setRecetaActual(data);
    }
  };

  const handleNuevaReceta = () => {
    setRecetaActual(null);
    setMedicamentoSeleccionado(null);
    setMostrarModal(false);
  };

  const handleSurtirMedicamento = (medicamento: MedicamentoReceta) => {
    setMedicamentoSeleccionado(medicamento);
    setMostrarModal(true);
  };

  const handleCerrarModal = () => {
    setMostrarModal(false);
    setMedicamentoSeleccionado(null);
  };

  const recargarReceta = async () => {
    if (!recetaActual) return;
    try {
      const response = await fetch(
        `/api/recetas/buscar?folio=${recetaActual.receta.folio_receta}`
      );
      const data = await response.json();
      if (data.success && data.data) {
        setRecetaActual(data.data);
      }
    } catch (error) {
      console.error('Error al recargar receta:', error);
    }
  };

  const handleSurtimientoExitoso = () => {
    recargarReceta();
  };

  const handleMarcarComoCero = async (motivo: string, observaciones: string) => {
    if (!recetaActual) return;
    setIsLoadingMarcarCero(true);
    try {
      const response = await fetch('/api/recetas/marcar-cero-entregado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folio_receta: recetaActual.receta.folio_receta,
          motivo,
          observaciones,
        }),
      });
      const result = await response.json();
      if (result.success) {
        alert('✅ Visita registrada sin entrega');
        setMostrarModalMarcarCero(false);
        await recargarReceta();
      } else {
        alert(`❌ Error: ${result.error || 'No se pudo registrar la visita'}`);
      }
    } catch (error) {
      console.error('Error al marcar como 0:', error);
      alert('❌ Error al procesar la solicitud.');
    } finally {
      setIsLoadingMarcarCero(false);
    }
  };

  const puedeMarcarComoCero = recetaActual
    ? recetaActual.medicamentos.every((med) => med.surtimientos.total_surtido === 0) &&
    (recetaActual.validacion_vigencia?.puede_marcar_como_cero ?? true)
    : false;

  const recetaVencidaPrimerSurtimiento = recetaActual?.validacion_vigencia?.vencida_primer_surtimiento ?? false;

  if (!mounted) return null;

  return (
    <div className="min-h-screen p-6 md:p-8 space-y-8 transition-colors duration-300">

      {/* --- HEADER --- */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col xl:flex-row xl:items-center justify-between gap-6"
      >
        <div className="flex items-center gap-5">
          <div className={`p-4 rounded-2xl shadow-lg shadow-emerald-500/20 ${isDark ? 'bg-gradient-to-br from-emerald-600 to-teal-800 border border-emerald-500/20'
              : 'bg-gradient-to-br from-emerald-500 to-teal-400'
            }`}>
            <Pill className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Farmacia
            </h1>
            <p className={`mt-1 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Surtimiento y control de recetas
            </p>
          </div>
        </div>

        {recetaActual && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-center gap-3 px-5 py-2.5 rounded-full border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
              }`}
          >
            <Activity className={isDark ? 'text-emerald-400' : 'text-emerald-600'} size={20} />
            <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              Folio Activo: <span className="font-bold">{recetaActual.receta.folio_receta}</span>
            </span>
            <button
              onClick={handleNuevaReceta}
              className="ml-2 text-xs font-bold text-red-500 hover:text-red-400 hover:underline"
            >
              Cambiar
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <AnimatePresence mode="wait">
        {!recetaActual ? (
          <motion.div
            key="search"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl mx-auto mt-10"
          >
            <BusquedaReceta onRecetaEncontrada={handleRecetaEncontrada} isDark={isDark} />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Grid Layout: Info + Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Patient Info */}
              <div className="lg:col-span-2">
                <CardInfoReceta
                  receta={recetaActual}
                  isDark={isDark}
                  onNuevaReceta={handleNuevaReceta}
                />
              </div>

              {/* Right Column: Status Cards */}
              <div className="space-y-4">
                {/* Vencida Alert */}
                {recetaVencidaPrimerSurtimiento && (
                  <div className={`p-5 rounded-2xl border ${isDark ? 'bg-red-900/10 border-red-800' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <AlertTriangle className="text-red-500" />
                      <h3 className={`font-bold ${isDark ? 'text-red-400' : 'text-red-700'}`}>Receta Vencida</h3>
                    </div>
                    <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-600'}`}>
                      Esta receta excedió el tiempo límite para el primer surtimiento.
                    </p>
                  </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center ${isDark ? 'bg-[#0a1929] border-gray-800' : 'bg-white border-gray-100 shadow-sm'}`}>
                    <p className={`text-xs uppercase font-bold mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Total</p>
                    <span className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {recetaActual.resumen.total_medicamentos}
                    </span>
                  </div>
                  <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center ${isDark ? 'bg-[#0a1929] border-gray-800' : 'bg-white border-gray-100 shadow-sm'}`}>
                    <p className={`text-xs uppercase font-bold mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Pendientes</p>
                    <span className={`text-3xl font-bold ${isDark ? 'text-amber-400' : 'text-amber-500'}`}>
                      {recetaActual.resumen.medicamentos_pendientes}
                    </span>
                  </div>
                </div>

                {puedeMarcarComoCero && (
                  <button
                    onClick={() => setMostrarModalMarcarCero(true)}
                    className={`w-full py-3 px-4 rounded-xl text-sm font-bold border transition-colors ${isDark
                        ? 'border-yellow-800 text-yellow-500 hover:bg-yellow-900/20'
                        : 'border-yellow-200 text-yellow-700 hover:bg-yellow-50'
                      }`}
                  >
                    Reportar Sin Stock
                  </button>
                )}
              </div>
            </div>

            {/* Table Section */}
            <TablaMedicamentos
              medicamentos={recetaActual.medicamentos}
              isDark={isDark}
              onSurtirMedicamento={handleSurtirMedicamento}
              recetaVencidaPrimerSurtimiento={recetaVencidaPrimerSurtimiento}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {mostrarModal && medicamentoSeleccionado && (
          <ModalSurtimiento
            medicamento={medicamentoSeleccionado}
            isDark={isDark}
            onClose={handleCerrarModal}
            onSurtimientoExitoso={handleSurtimientoExitoso}
          />
        )}
        {mostrarModalMarcarCero && recetaActual && (
          <ModalMarcarCero
            isOpen={mostrarModalMarcarCero}
            onClose={() => setMostrarModalMarcarCero(false)}
            onConfirm={handleMarcarComoCero}
            folioReceta={recetaActual.receta.folio_receta}
            isDark={isDark}
            isLoading={isLoadingMarcarCero}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

