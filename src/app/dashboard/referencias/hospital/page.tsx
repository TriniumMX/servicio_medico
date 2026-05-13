"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { RefreshCw, ClipboardList, AlertCircle, CalendarClock, LayoutGrid, CalendarDays, BarChart2 } from "lucide-react";
import type { ReferenciaEspecialidad } from "@/types/referencias";
import ReferenciaCard from "@/components/referencias/hospital/ReferenciaCard";
import ModalAsignarMedico from "@/components/referencias/hospital/ModalAsignarMedico";
import AgendaMedicos from "@/components/referencias/hospital/AgendaMedicos";
import TabReporteHospital from "@/components/referencias/hospital/TabReporteHospital";
import { useNotifications } from "@/context/NotificationsContext";
import AppToast, { useToast } from "@/components/ui/AppToast";

const sortByTriage = (refs: ReferenciaEspecialidad[]) =>
  [...refs].sort((a, b) => {
    const nA = a.nivel_triage ?? null;
    const nB = b.nivel_triage ?? null;
    if (nA === null && nB === null) return 0;
    if (nA === null) return 1;
    if (nB === null) return -1;
    return nA - nB;
  });

export default function HospitalReferenciasPage() {
  const { theme } = useTheme();
  const { notificaciones } = useNotifications();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'pendientes' | 'asignadas' | 'agenda' | 'reporte'>('pendientes');

  // Data states
  const [referencias, setReferencias] = useState<ReferenciaEspecialidad[]>([]);
  const [asignadas, setAsignadas] = useState<ReferenciaEspecialidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAsignadas, setLoadingAsignadas] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [referenciaSeleccionada, setReferenciaSeleccionada] = useState<ReferenciaEspecialidad | null>(null);
  const [modalReprogramarOpen, setModalReprogramarOpen] = useState(false);
  const [referenciaReprogramar, setReferenciaReprogramar] = useState<ReferenciaEspecialidad | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      cargarReferencias();
      cargarAsignadas();
    }
  }, [mounted]);

  // 🔔 Auto-recarga
  useEffect(() => {
    if (notificaciones.length > 0) {
      const ultimaNotificacion = notificaciones[0];
      const ahora = new Date();
      const fechaNotif = new Date(ultimaNotificacion.fecha);
      const diff = ahora.getTime() - fechaNotif.getTime();

      if (diff < 5000 && ultimaNotificacion.tipo === 'referencia') {
        cargarReferencias();
      }
    }
  }, [notificaciones]);

  const isDark = mounted && theme === "dark";
  const { toast, showToast, clearToast } = useToast();

  const cargarAsignadas = async () => {
    try {
      setLoadingAsignadas(true);
      const response = await fetch("/api/referencias/hospital/asignadas");
      const data = await response.json();
      if (data.success) {
        setAsignadas(sortByTriage(data.referencias || []));
      }
    } catch (error) {
      console.error("Error al cargar asignadas:", error);
    } finally {
      setLoadingAsignadas(false);
    }
  };

  const cargarReferencias = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/referencias/hospital/pendientes");
      const data = await response.json();
      if (data.success) {
        setReferencias(sortByTriage(data.referencias || []));
      } else {
        setError(data.error || "Error al cargar referencias");
      }
    } catch (error) {
      console.error("Error al cargar referencias:", error);
      setError("Error de conexión al cargar referencias");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (activeTab === 'pendientes') {
      cargarReferencias();
    } else {
      cargarAsignadas();
    }
  };

  const handleAsignar = (referencia: ReferenciaEspecialidad) => {
    setReferenciaSeleccionada(referencia);
    setModalOpen(true);
  };

  const handleAsignarConfirm = async (data: {
    id_medico_asignado: number;
    fecha_cita: string;
  }) => {
    try {
      const response = await fetch("/api/referencias/hospital/asignar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_referencia: referenciaSeleccionada?.id_referencia,
          ...data,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setModalOpen(false);
        setReferenciaSeleccionada(null);
        cargarReferencias();
        cargarAsignadas();
        showToast('success', 'Médico asignado correctamente');
      } else {
        showToast('error', result.error || 'Error al asignar médico');
      }
    } catch (error) {
      console.error("Error al asignar médico:", error);
      showToast('error', 'Error de conexión al asignar médico');
    }
  };

  const handleReprogramar = (referencia: ReferenciaEspecialidad) => {
    setReferenciaReprogramar(referencia);
    setModalReprogramarOpen(true);
  };

  const handleReprogramarConfirm = async (data: {
    id_medico_asignado: number;
    fecha_cita: string;
  }) => {
    const response = await fetch("/api/referencias/hospital/reprogramar", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_referencia: referenciaReprogramar?.id_referencia,
        ...data,
      }),
    });

    const result = await response.json();

    if (result.success) {
      setModalReprogramarOpen(false);
      setReferenciaReprogramar(null);
      cargarAsignadas();
      showToast('success', 'Cita reprogramada correctamente');
    } else {
      showToast('error', result.error || 'Error al reprogramar la cita');
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 pb-20">
      <AppToast toast={toast} isDark={isDark} onClose={clearToast} />
      {/* Header with Stats */}
      <div
        className={`rounded-3xl shadow-lg p-6 transition-all ${isDark
            ? "bg-gradient-to-r from-[#0a1929] to-[#0d2137] border border-[#0f83b2]/20"
            : "bg-white border border-gray-100 shadow-blue-500/5"
          }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl shadow-blue-500/20 shrink-0">
              <ClipboardList className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold tracking-tight mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>
                Gestión de Referencias
              </h1>
              <div className="flex gap-4 text-sm mt-1">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isDark ? "bg-[#0db1ec]" : "bg-blue-500"}`}></span>
                  <span className={`${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    Pendientes: <span className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{referencias.length}</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span className={`${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    Asignadas: <span className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{asignadas.length}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={loading || loadingAsignadas}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all border shadow-sm ${isDark
                ? "bg-[#0d1f2d] text-[#0db1ec] border-[#0f83b2]/20 hover:bg-[#0f83b2]/10"
                : "bg-white text-[#0f83b2] border-gray-100 hover:bg-gray-50 hover:border-blue-200"
              } disabled:opacity-50`}
          >
            <RefreshCw className={`w-4 h-4 ${loading || loadingAsignadas ? "animate-spin" : ""}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-4 border-b border-gray-200/50 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('pendientes')}
          className={`relative flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold transition-all ${activeTab === 'pendientes'
              ? isDark
                ? "text-[#0db1ec] bg-[#0a1929] border-t border-x border-[#0f83b2]/20 shadow-[-1px_-4px_16px_rgba(15,131,178,0.1)]"
                : "text-blue-600 bg-white border-t border-x border-gray-100 shadow-sm"
              : isDark
                ? "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            }`}
        >
          <LayoutGrid className="w-4 h-4" />
          Solicitudes Pendientes
          {activeTab === 'pendientes' && (
            <div className={`absolute bottom-[-1px] left-0 right-0 h-[2px] ${isDark ? "bg-[#0db1ec]" : "bg-blue-600"}`}></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab('asignadas')}
          className={`relative flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold transition-all ${activeTab === 'asignadas'
              ? isDark
                ? "text-amber-400 bg-[#0a1929] border-t border-x border-[#0f83b2]/20 shadow-[-1px_-4px_16px_rgba(251,191,36,0.1)]"
                : "text-amber-600 bg-white border-t border-x border-gray-100 shadow-sm"
              : isDark
                ? "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            }`}
        >
          <CalendarClock className="w-4 h-4" />
          Citas Asignadas
          {activeTab === 'asignadas' && (
            <div className={`absolute bottom-[-1px] left-0 right-0 h-[2px] ${isDark ? "bg-amber-400" : "bg-amber-500"}`}></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab('agenda')}
          className={`relative flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold transition-all ${activeTab === 'agenda'
              ? isDark
                ? "text-emerald-400 bg-[#0a1929] border-t border-x border-[#0f83b2]/20 shadow-[-1px_-4px_16px_rgba(52,211,153,0.1)]"
                : "text-emerald-700 bg-white border-t border-x border-gray-100 shadow-sm"
              : isDark
                ? "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            }`}
        >
          <CalendarDays className="w-4 h-4" />
          Agenda
          {activeTab === 'agenda' && (
            <div className={`absolute bottom-[-1px] left-0 right-0 h-[2px] ${isDark ? "bg-emerald-400" : "bg-emerald-600"}`}></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab('reporte')}
          className={`relative flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold transition-all ${activeTab === 'reporte'
              ? isDark
                ? "text-violet-400 bg-[#0a1929] border-t border-x border-[#0f83b2]/20 shadow-[-1px_-4px_16px_rgba(139,92,246,0.1)]"
                : "text-violet-700 bg-white border-t border-x border-gray-100 shadow-sm"
              : isDark
                ? "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            }`}
        >
          <BarChart2 className="w-4 h-4" />
          Reporte
          {activeTab === 'reporte' && (
            <div className={`absolute bottom-[-1px] left-0 right-0 h-[2px] ${isDark ? "bg-violet-400" : "bg-violet-600"}`}></div>
          )}
        </button>
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">

        {/* Error Display */}
        {error && (
          <div className={`mb-6 rounded-2xl shadow-lg p-6 border ${isDark ? "bg-red-500/10 border-red-500/30 text-red-200" : "bg-red-50 border-red-200 text-red-800"}`}>
            <div className="flex items-center gap-4">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="font-bold text-lg">Error</h3>
                <p className="opacity-90">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Pendientes */}
        {activeTab === 'pendientes' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`h-[300px] rounded-2xl animate-pulse ${isDark ? "bg-[#0a1929]/50" : "bg-gray-100"}`}></div>
                ))}
              </div>
            ) : referencias.length === 0 ? (
              <div className={`rounded-3xl shadow-sm p-16 text-center border-2 border-dashed ${isDark ? "bg-[#0a1929]/30 border-[#0f83b2]/10" : "bg-gray-50/50 border-gray-200"}`}>
                <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${isDark ? "bg-[#0f83b2]/10" : "bg-blue-50"}`}>
                  <ClipboardList className={`w-10 h-10 ${isDark ? "text-gray-500" : "text-gray-300"}`} />
                </div>
                <h3 className={`text-xl font-bold mb-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}>No hay solicitudes pendientes</h3>
                <p className={`${isDark ? "text-gray-500" : "text-gray-400"}`}>Todas las referencias han sido asignadas.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {referencias.map((ref) => (
                  <div key={ref.id_referencia} className="relative">
                    {ref.tipo_referencia === "seguimiento" && (
                      <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-white shadow-lg shadow-amber-500/40 tracking-wide">
                        SEGUIMIENTO
                      </div>
                    )}
                    <ReferenciaCard
                      referencia={ref}
                      variant="pending"
                      onAction={handleAsignar}
                      isDark={isDark}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Asignadas */}
        {activeTab === 'asignadas' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {loadingAsignadas ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`h-[250px] rounded-2xl animate-pulse ${isDark ? "bg-[#0a1929]/50" : "bg-gray-100"}`}></div>
                ))}
              </div>
            ) : asignadas.length === 0 ? (
              <div className={`py-16 text-center rounded-2xl border ${isDark ? "bg-[#0a1929]/30 border-[#0f83b2]/10" : "bg-gray-50 border-gray-100"}`}>
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isDark ? "bg-amber-500/10" : "bg-amber-50"}`}>
                  <CalendarClock className={`w-8 h-8 ${isDark ? "text-amber-500/50" : "text-amber-300"}`} />
                </div>
                <p className={`text-base font-medium ${isDark ? "text-gray-500" : "text-gray-500"}`}>No hay citas asignadas para mostrar</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {asignadas.map((ref) => (
                  <ReferenciaCard
                    key={ref.id_referencia}
                    referencia={ref}
                    variant="assigned"
                    onAction={handleReprogramar}
                    isDark={isDark}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        {/* Tab Content: Agenda */}
        {activeTab === 'agenda' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <AgendaMedicos isDark={isDark} />
          </div>
        )}

        {/* Tab Content: Reporte */}
        {activeTab === 'reporte' && (
          <TabReporteHospital isDark={isDark} />
        )}

      </div>

      {/* Modales - Keep them outside content area to avoid re-renders or layout shifts */}
      <ModalAsignarMedico
        referencia={referenciaSeleccionada}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setReferenciaSeleccionada(null);
        }}
        onAsignar={handleAsignarConfirm}
        isDark={isDark}
      />

      <ModalAsignarMedico
        referencia={referenciaReprogramar}
        isOpen={modalReprogramarOpen}
        onClose={() => {
          setModalReprogramarOpen(false);
          setReferenciaReprogramar(null);
        }}
        onAsignar={handleReprogramarConfirm}
        isDark={isDark}
        modo="reprogramar"
      />
    </div>
  );
}
