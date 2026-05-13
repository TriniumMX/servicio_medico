'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import BusquedaRecetaOriginal from '@/components/farmacia/resurtimiento/BusquedaRecetaOriginal';
import TablaCupones from '@/components/farmacia/resurtimiento/TablaCupones';
import ModalImprimirResurtimiento from '@/components/farmacia/resurtimiento/ModalImprimirResurtimiento';
import {
  ResurtimientosData,
  CuponSeleccionado,
} from '@/types/farmacia/resurtimiento';

export default function ResurtimientoPage() {
  const { theme } = useTheme();
  // Hydration fix: only render theme-dependent UI after mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === 'dark';

  const [recetaData, setRecetaData] = useState<ResurtimientosData | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [recetaGenerada, setRecetaGenerada] = useState<{
    id_receta: number;
    folio_receta: string;
    folio_receta_original: string;
  } | null>(null);

  const handleRecetaEncontrada = (data: ResurtimientosData | undefined) => {
    if (data) {
      setRecetaData(data);
    }
  };

  const handleNuevaReceta = () => {
    setRecetaData(null);
    setMostrarModal(false);
    setRecetaGenerada(null);
  };

  const handleGenerarResurtimiento = async (cupones: CuponSeleccionado[]) => {
    if (!recetaData || cupones.length === 0) return;

    try {
      const cuponesParaAPI = cupones.map((cupon) => ({
        id_control: cupon.id_control,
        id_medicamento: cupon.medicamento.id_medicamento,
        cantidad: cupon.prescripcion.cantidad_total,
        dosis: cupon.prescripcion.dosis,
        numero_resurtimiento: cupon.numero_resurtimiento,
      }));

      const response = await fetch('/api/recetas/generar-resurtimiento', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folio_original: recetaData.receta.folio_receta,
          cupones: cuponesParaAPI,
        }),
      });

      const result = await response.json();

      if (!result.success || !result.data) {
        alert(`Error al generar receta: ${result.error || 'Error desconocido'}`);
        return;
      }

      setRecetaGenerada({
        id_receta: result.data.receta.id_receta,
        folio_receta: result.data.receta.folio_receta,
        folio_receta_original: result.data.receta.folio_receta_original,
      });
      setMostrarModal(true);

      handleRecetaEncontrada(undefined);
      const refetch = await fetch(`/api/recetas/cupones-por-folio/${recetaData.receta.folio_receta}`);
      const refetchData = await refetch.json();
      if (refetchData.success) {
        setRecetaData(refetchData.data);
      }
    } catch (error) {
      console.error('Error al generar receta de resurtimiento:', error);
      alert('Error al generar receta de resurtimiento. Intente nuevamente.');
    }
  };

  const handleReimprimirReceta = async (folioReceta: string, idReceta: number) => {
    if (!recetaData) return;
    try {
      setRecetaGenerada({
        id_receta: idReceta,
        folio_receta: folioReceta,
        folio_receta_original: recetaData.receta.folio_receta,
      });
      setMostrarModal(true);
    } catch (error) {
      console.error('Error al reimprimir receta:', error);
      alert('Error al reimprimir receta. Intente nuevamente.');
    }
  };

  if (!mounted) {
    return <div className="min-h-screen" />;
  }

  return (
    <div className={`transition-colors duration-300 ${!recetaData ? 'h-[calc(100vh-4rem)] flex items-center' : 'min-h-screen py-4 sm:py-6'}`}>

      <div className="container mx-auto px-3 sm:px-4 md:px-6 relative z-10 max-w-7xl w-full">
        {/* Header Hero */}
        <motion.div
          layout
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`text-center ${!recetaData ? 'mb-6 sm:mb-8' : 'mb-6 sm:mb-8 md:mb-10'}`}
        >
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <span className={`inline-block px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium border ${isDark ? 'bg-cyan-900/10 border-cyan-800 text-cyan-300' : 'bg-cyan-50 border-cyan-200 text-cyan-700'
              }`}>
              Farmacia / Resurtimiento
            </span>
          </div>

          <h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-2 sm:mb-3 bg-clip-text text-transparent bg-gradient-to-r ${isDark ? 'from-white via-cyan-200 to-blue-200' : 'from-gray-900 via-cyan-800 to-blue-800'
            }`}>
            Control de Resurtido
          </h1>
          <p className={`text-sm sm:text-base md:text-lg max-w-2xl mx-auto font-normal px-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Gestione las entregas mensuales de tratamientos prolongados de forma eficiente.
          </p>
        </motion.div>

        {/* Contenido principal */}
        <div className="space-y-4 sm:space-y-6">
          <AnimatePresence mode="wait">
            {!recetaData ? (
              <motion.div
                key="busqueda"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="max-w-xl mx-auto"
              >
                <BusquedaRecetaOriginal
                  onRecetaEncontrada={handleRecetaEncontrada}
                  isDark={isDark}
                />
              </motion.div>
            ) : (
              <motion.div
                key="resultados"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="space-y-4 sm:space-y-6"
              >
                {/* Panel de Control - Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
                  {/* Info Paciente y Receta (Left Column) */}
                  <div className="lg:col-span-4 space-y-3 sm:space-y-4">
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className={`overflow-hidden rounded-2xl sm:rounded-3xl border shadow-md ${isDark ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-white'
                        }`}
                    >
                      <div className={`p-4 sm:p-5 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <h2 className={`text-lg sm:text-xl md:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Expediente
                          </h2>
                          <button
                            onClick={handleNuevaReceta}
                            className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all duration-200 ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                              }`}
                            title="Buscar otra receta"
                          >
                            <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
                          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-lg sm:text-xl font-bold ${isDark ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white' : 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white'
                            }`}>
                            {recetaData.paciente.nombre.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-semibold text-base sm:text-lg leading-tight truncate ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                              {recetaData.paciente.nombre}
                            </h3>
                            <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              Nómina: {recetaData.paciente.nomina}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className={`p-3 sm:p-4 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                            <p className={`text-xs uppercase tracking-wider font-semibold mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              Receta Original
                            </p>
                            <p className={`font-mono text-sm sm:text-base md:text-lg font-medium break-all ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                              {recetaData.receta.folio_receta}
                            </p>
                          </div>

                          <div className={`p-3 sm:p-4 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                            <div className="flex justify-between items-center mb-2">
                              <p className={`text-xs uppercase tracking-wider font-semibold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Progreso</p>
                              <span className={`text-xs sm:text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                {recetaData.resumen.total_cupones_disponibles} disp.
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 sm:h-2 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                                style={{ width: `${(recetaData.resumen.total_cupones_surtidos / (recetaData.resumen.total_cupones_surtidos + recetaData.resumen.total_cupones_pendientes)) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Instrucciones */}
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className={`rounded-xl sm:rounded-2xl border p-4 sm:p-5 ${isDark ? 'bg-cyan-900/10 border-cyan-800/30' : 'bg-cyan-50 border-cyan-100'
                        }`}
                    >
                      <h4 className={`font-semibold mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
                        <Info size={16} className="sm:w-[18px] sm:h-[18px]" /> Guía Rápida
                      </h4>
                      <ul className={`text-xs sm:text-sm space-y-1.5 sm:space-y-2 ${isDark ? 'text-cyan-200/70' : 'text-cyan-800/70'}`}>
                        <li className="flex gap-2 items-start">
                          <span className="font-bold text-cyan-500 mt-0.5">•</span>
                          <span>Meses <span className="font-semibold text-yellow-500">amarillos</span> disponibles.</span>
                        </li>
                        <li className="flex gap-2 items-start">
                          <span className="font-bold text-cyan-500 mt-0.5">•</span>
                          <span>Entrega con tolerancia de ±2 días.</span>
                        </li>
                      </ul>
                    </motion.div>
                  </div>

                  {/* Tabla de Cupones (Right Column) */}
                  <div className="lg:col-span-8">
                    {recetaData.resumen.total_cupones_pendientes === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`h-full min-h-[300px] sm:min-h-[350px] flex flex-col items-center justify-center text-center rounded-2xl sm:rounded-3xl border border-dashed p-6 sm:p-8 md:p-10 ${isDark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-300 bg-gray-50'
                          }`}
                      >
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 sm:mb-6">
                          <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" />
                        </div>
                        <h3 className={`text-xl sm:text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Tratamiento Completado
                        </h3>
                        <p className={`text-sm sm:text-base max-w-md px-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          No hay meses pendientes de resurtimiento para esta receta. El tratamiento ha concluido.
                        </p>
                      </motion.div>
                    ) : (
                      <>
                        <TablaCupones
                          medicamentos={recetaData.medicamentos}
                          isDark={isDark}
                          onGenerarResurtimiento={handleGenerarResurtimiento}
                          onReimprimirReceta={handleReimprimirReceta}
                        />

                        {/* Alerta de bloqueo por fecha */}
                        {recetaData.resumen.total_cupones_disponibles === 0 &&
                          recetaData.resumen.total_cupones_pendientes > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`mt-4 sm:mt-6 rounded-xl sm:rounded-2xl border p-3 sm:p-4 flex items-start gap-3 sm:gap-4 ${isDark ? 'bg-orange-900/20 border-orange-800' : 'bg-orange-50 border-orange-200'
                                }`}
                            >
                              <div className="p-1.5 sm:p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg text-orange-600 dark:text-orange-400 flex-shrink-0">
                                <AlertTriangle size={18} className="sm:w-5 sm:h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className={`font-semibold text-sm sm:text-base ${isDark ? 'text-orange-400' : 'text-orange-800'}`}>
                                  Fuera de periodo de entrega
                                </h3>
                                <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-orange-300/80' : 'text-orange-700/80'}`}>
                                  Por favor indique al paciente regresar en la fecha programada (±2 días).
                                </p>
                              </div>
                            </motion.div>
                          )}
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal de descarga de PDF */}
      <AnimatePresence>
        {mostrarModal && recetaGenerada && (
          <ModalImprimirResurtimiento
            isOpen={mostrarModal}
            onClose={() => setMostrarModal(false)}
            idReceta={recetaGenerada.id_receta}
            folioReceta={recetaGenerada.folio_receta}
            folioRecetaOriginal={recetaGenerada.folio_receta_original}
            isDark={isDark}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
