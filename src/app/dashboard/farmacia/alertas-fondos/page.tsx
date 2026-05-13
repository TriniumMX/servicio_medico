// src/app/dashboard/farmacia/alertas-fondos/page.tsx

'use client';

import { useEffect, useState } from 'react';
import {
  Bell,
  Mail,
  Plus,
  RefreshCw,
  FileDown,
  AlertTriangle,
  Package,
  Users,
  Send,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAlertasFondos } from '@/hooks/farmacia/useAlertasFondos';
import { TablaCorreos } from '@/components/farmacia/alertas/TablaCorreos';
import { ModalAgregarCorreo } from '@/components/farmacia/alertas/ModalAgregarCorreo';
import { TablaMedicamentosAlerta } from '@/components/farmacia/alertas/TablaMedicamentosAlerta';
import { BotonEnviarAlerta } from '@/components/farmacia/alertas/BotonEnviarAlerta';
import type { CorreoAlerta, CorreoAlertaForm } from '@/types/alertas-fondos';

export default function AlertasFondosPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Hook de alertas
  const {
    correos,
    medicamentos,
    resumen,
    loading,
    loadingEnvio,
    error,
    obtenerCorreos,
    agregarCorreo,
    actualizarCorreo,
    eliminarCorreo,
    toggleActivo,
    verificarNiveles,
    enviarAlerta,
    descargarPDF,
    limpiarError,
  } = useAlertasFondos();

  // Estados locales
  const [modalOpen, setModalOpen] = useState(false);
  const [correoEditar, setCorreoEditar] = useState<CorreoAlerta | null>(null);
  const [tabActiva, setTabActiva] = useState<'alertas' | 'correos'>('alertas');
  const [descargandoPDF, setDescargandoPDF] = useState(false);

  // Cargar datos al montar
  useEffect(() => {
    setMounted(true);
    obtenerCorreos();
    verificarNiveles();
  }, [obtenerCorreos, verificarNiveles]);

  const isDark = mounted && theme === 'dark';

  // Handlers
  const handleAbrirModal = (correo?: CorreoAlerta) => {
    setCorreoEditar(correo || null);
    setModalOpen(true);
  };

  const handleCerrarModal = () => {
    setModalOpen(false);
    setCorreoEditar(null);
  };

  const handleGuardarCorreo = async (datos: CorreoAlertaForm) => {
    if (correoEditar) {
      await actualizarCorreo(correoEditar.id_correo, datos);
    } else {
      await agregarCorreo(datos);
    }
  };

  const handleEliminarCorreo = async (idCorreo: number) => {
    await eliminarCorreo(idCorreo);
  };

  const handleRefrescar = async () => {
    await Promise.all([obtenerCorreos(), verificarNiveles()]);
  };

  const handleDescargarPDF = async () => {
    setDescargandoPDF(true);
    try {
      await descargarPDF();
    } finally {
      setDescargandoPDF(false);
    }
  };

  // Contar correos activos
  const correosActivos = correos.filter((c) => c.activo).length;

  return (
    <div className="min-h-screen p-6 transition-all duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg shadow-blue-500/20 text-white">
              <Bell className="h-8 w-8" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Alertas de Fondos Fijos
              </h1>
              <p className={`mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Gestión inteligente de inventario y notificaciones
              </p>
            </div>
          </div>
          <button
            onClick={handleRefrescar}
            disabled={loading}
            className={`group flex items-center px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 backdrop-blur-md border ${
              isDark
                ? 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:text-blue-400'
                : 'bg-white/50 border-slate-200 text-slate-600 hover:text-blue-600'
            }`}
          >
            <RefreshCw className={`h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-500 ${loading ? 'animate-spin' : ''}`} />
            Actualizar Datos
          </button>
        </div>

        {/* Error global */}
        {error && (
          <div className={`p-4 rounded-2xl flex items-center backdrop-blur-md border ${
            isDark
              ? 'bg-red-900/10 border-red-800/50'
              : 'bg-red-50/50 border-red-200'
          }`}>
            <AlertTriangle className={`h-5 w-5 mr-3 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
            <span className={`font-medium ${isDark ? 'text-red-200' : 'text-red-800'}`}>{error}</span>
            <button
              onClick={limpiarError}
              className={`ml-auto ${isDark ? 'text-red-400 hover:text-red-200' : 'text-red-600 hover:text-red-800'}`}
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Tarjetas de resumen - Glassmorphism Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Alertas */}
          <div className={`relative group overflow-hidden backdrop-blur-xl p-6 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border ${
            isDark
              ? 'bg-slate-900/40 border-white/10 shadow-black/20'
              : 'bg-white border-slate-200/50 shadow-slate-200/50'
          }`}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Package className="h-24 w-24 text-blue-600" />
            </div>
            <div className="flex flex-col relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl border ${
                  isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50/50 border-blue-100'
                }`}>
                  <Package className={`h-6 w-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-lg border ${
                  isDark
                    ? 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                    : 'text-blue-600 bg-blue-50/50 border-blue-100'
                }`}>
                  Total
                </span>
              </div>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Medicamentos con Alerta</p>
              <h3 className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {resumen?.total_alertas || 0}
              </h3>
            </div>
          </div>

          {/* Criticos */}
          <div className={`relative group overflow-hidden backdrop-blur-xl p-6 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border ${
            isDark
              ? 'bg-slate-900/40 border-red-500/10 shadow-black/20'
              : 'bg-white border-red-100 shadow-red-100'
          }`}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <AlertTriangle className="h-24 w-24 text-red-600" />
            </div>
            <div className="flex flex-col relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl border ${
                  isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50/50 border-red-100'
                }`}>
                  <AlertTriangle className={`h-6 w-6 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-lg border ${
                  isDark
                    ? 'text-red-400 bg-red-500/10 border-red-500/20'
                    : 'text-red-600 bg-red-50/50 border-red-100'
                }`}>
                  Prioridad Alta
                </span>
              </div>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Estado Crítico</p>
              <h3 className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {resumen?.criticos || 0}
              </h3>
            </div>
          </div>

          {/* Bajos */}
          <div className={`relative group overflow-hidden backdrop-blur-xl p-6 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border ${
            isDark
              ? 'bg-slate-900/40 border-amber-500/10 shadow-black/20'
              : 'bg-white border-amber-100 shadow-amber-100'
          }`}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <AlertTriangle className="h-24 w-24 text-amber-600" />
            </div>
            <div className="flex flex-col relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl border ${
                  isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50/50 border-amber-100'
                }`}>
                  <AlertTriangle className={`h-6 w-6 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-lg border ${
                  isDark
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                    : 'text-amber-600 bg-amber-50/50 border-amber-100'
                }`}>
                  Atención
                </span>
              </div>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Nivel Bajo</p>
              <h3 className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {resumen?.bajos || 0}
              </h3>
            </div>
          </div>

          {/* Destinatarios */}
          <div className={`relative group overflow-hidden backdrop-blur-xl p-6 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border ${
            isDark
              ? 'bg-slate-900/40 border-white/10 shadow-black/20'
              : 'bg-white border-slate-200/50 shadow-slate-200/50'
          }`}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users className="h-24 w-24 text-green-600" />
            </div>
            <div className="flex flex-col relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl border ${
                  isDark ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50/50 border-green-100'
                }`}>
                  <Users className={`h-6 w-6 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-lg border ${
                  isDark
                    ? 'text-green-400 bg-green-500/10 border-green-500/20'
                    : 'text-green-600 bg-green-50/50 border-green-100'
                }`}>
                  Activos
                </span>
              </div>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Destinatarios</p>
              <h3 className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {correosActivos}
              </h3>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className={`flex space-x-1 p-1.5 rounded-2xl backdrop-blur-md border w-fit ${
          isDark ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-200/50'
        }`}>
          <button
            onClick={() => setTabActiva('alertas')}
            className={`flex items-center px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              tabActiva === 'alertas'
                ? isDark
                  ? 'bg-slate-800/80 text-blue-400 shadow-sm backdrop-blur-sm'
                  : 'bg-slate-100 text-blue-600 shadow-sm backdrop-blur-sm'
                : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Package className="h-4 w-4 mr-2" />
            Medicamentos ({resumen?.total_alertas || 0})
          </button>
          <button
            onClick={() => setTabActiva('correos')}
            className={`flex items-center px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              tabActiva === 'correos'
                ? isDark
                  ? 'bg-slate-800/80 text-blue-400 shadow-sm backdrop-blur-sm'
                  : 'bg-white/80 text-blue-600 shadow-sm backdrop-blur-sm'
                : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/30'
            }`}
          >
            <Mail className="h-4 w-4 mr-2" />
            Destinatarios ({correos.length})
          </button>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Panel */}
          <div className="xl:col-span-2">
            <div className={`backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden min-h-[500px] border ${
              isDark
                ? 'bg-slate-900/40 border-white/10'
                : 'bg-white border-slate-200/50'
            }`}>
              {/* Panel Header */}
              <div className={`px-8 py-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isDark ? 'border-slate-700/50' : 'border-slate-200/50'
              }`}>
                <h2 className={`text-xl font-bold flex items-center ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {tabActiva === 'alertas' ? (
                    <>
                      <Package className="h-5 w-5 mr-3 text-blue-500" />
                      Inventario Crítico
                    </>
                  ) : (
                    <>
                      <Users className="h-5 w-5 mr-3 text-blue-500" />
                      Gestión de Destinatarios
                    </>
                  )}
                </h2>

                <div className="flex items-center gap-3">
                  {tabActiva === 'correos' && (
                    <button
                      onClick={() => handleAbrirModal()}
                      className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-colors shadow-lg shadow-blue-500/20"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Destinatario
                    </button>
                  )}
                  {tabActiva === 'alertas' && (
                    <button
                      onClick={handleDescargarPDF}
                      disabled={descargandoPDF || !resumen?.total_alertas}
                      className={`flex items-center px-4 py-2 text-sm font-medium rounded-xl transition-colors shadow-sm disabled:opacity-50 border ${
                        isDark
                          ? 'text-slate-200 bg-slate-700 border-slate-600 hover:bg-slate-600'
                          : 'text-slate-700 bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <FileDown className={`h-4 w-4 mr-2 ${descargandoPDF ? 'animate-pulse' : ''}`} />
                      {descargandoPDF ? 'Generando PDF...' : 'Exportar Reporte'}
                    </button>
                  )}
                </div>
              </div>

              {/* Panel Content */}
              <div className="p-6">
                {tabActiva === 'alertas' ? (
                  <TablaMedicamentosAlerta
                    medicamentos={medicamentos}
                    loading={loading}
                    isDark={isDark}
                  />
                ) : (
                  <TablaCorreos
                    correos={correos}
                    loading={loading}
                    onEditar={handleAbrirModal}
                    onEliminar={handleEliminarCorreo}
                    onToggleActivo={toggleActivo}
                    isDark={isDark}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Actions */}
          <div className="xl:col-span-1">
            <div className={`backdrop-blur-xl rounded-3xl shadow-xl p-6 sticky top-6 space-y-6 border ${
              isDark
                ? 'bg-slate-900/40 border-white/10'
                : 'bg-white border-slate-200/50'
            }`}>
              <div>
                <h3 className={`text-lg font-bold mb-1 flex items-center ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  <Send className="h-5 w-5 mr-2 text-blue-500" />
                  Envío de Alertas
                </h3>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Notifica a los responsables sobre el estado del inventario
                </p>
              </div>

              <div className={`p-5 rounded-2xl border ${
                isDark ? 'bg-slate-800/30 border-white/5' : 'bg-slate-50 border-slate-100'
              }`}>
                <p className={`font-semibold mb-4 text-sm uppercase tracking-wider ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  Configuración de Umbrales
                </p>
                <div className="space-y-3">
                  <div className={`flex items-center justify-between p-3 rounded-xl shadow-sm border ${
                    isDark ? 'bg-slate-900/50 border-white/5' : 'bg-white border-slate-100'
                  }`}>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-3 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                      <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Crítico</span>
                    </div>
                    <span className={`text-xs font-bold text-red-500 px-2 py-1 rounded-md border ${
                      isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-100'
                    }`}>
                      &le; 10%
                    </span>
                  </div>
                  <div className={`flex items-center justify-between p-3 rounded-xl shadow-sm border ${
                    isDark ? 'bg-slate-900/50 border-white/5' : 'bg-white border-slate-100'
                  }`}>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-amber-500 rounded-full mr-3 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                      <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Bajo</span>
                    </div>
                    <span className={`text-xs font-bold text-amber-500 px-2 py-1 rounded-md border ${
                      isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-100'
                    }`}>
                      &le; 30%
                    </span>
                  </div>
                  <div className={`flex items-center justify-between p-3 rounded-xl shadow-sm border ${
                    isDark ? 'bg-slate-900/50 border-white/5' : 'bg-white border-slate-100'
                  }`}>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                      <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Medio</span>
                    </div>
                    <span className={`text-xs font-bold text-blue-500 px-2 py-1 rounded-md border ${
                      isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'
                    }`}>
                      &le; 50%
                    </span>
                  </div>
                </div>
              </div>

              <div className={`pt-2 border-t ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
                <BotonEnviarAlerta
                  onEnviar={enviarAlerta}
                  resumen={resumen}
                  correosActivos={correosActivos}
                  loading={loadingEnvio}
                  isDark={isDark}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Agregar/Editar Correo */}
        <ModalAgregarCorreo
          isOpen={modalOpen}
          onClose={handleCerrarModal}
          onGuardar={handleGuardarCorreo}
          correoEditar={correoEditar}
          loading={loading}
          isDark={isDark}
        />
      </div>
    </div>
  );
}
