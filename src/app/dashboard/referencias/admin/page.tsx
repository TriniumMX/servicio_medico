//src/app/dashboard/referencias/admin/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { RefreshCw, Bell, AlertCircle, ClipboardCheck, FileCheck, RefreshCcw } from "lucide-react";
import Swal from "sweetalert2";
import type { ReferenciaEspecialidad } from "@/types/referencias";
import TablaReferenciasNotificar from "@/components/referencias/admin/TablaReferenciasNotificar";
import TablaReferenciasNotificadas from "@/components/referencias/admin/TablaReferenciasNotificadas";
import TabSeguimientosAdmin from "@/components/referencias/admin/TabSeguimientosAdmin";
import ModalNotificarPaciente from "@/components/referencias/admin/ModalNotificarPaciente";
import ModalDetalleReferenciaNotificada from "@/components/referencias/admin/ModalDetalleReferenciaNotificada";
import ModalPaseEspecialidadPreview from "@/components/referencias/admin/ModalPaseEspecialidadPreview";
import { useNotifications } from "@/context/NotificationsContext";

type TabType = "pendientes" | "notificadas" | "seguimientos";

export default function AdminReferenciasPage() {
  const { theme } = useTheme();
  const { notificaciones } = useNotifications();
  const [mounted, setMounted] = useState(false);
  const [tabActual, setTabActual] = useState<TabType>("pendientes");

  // Referencias pendientes
  const [referencias, setReferencias] = useState<ReferenciaEspecialidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Referencias notificadas
  const [referenciasNotificadas, setReferenciasNotificadas] = useState<ReferenciaEspecialidad[]>([]);
  const [loadingNotificadas, setLoadingNotificadas] = useState(false);

  // Modal de notificación (para pendientes)
  const [modalOpen, setModalOpen] = useState(false);
  const [referenciaSeleccionada, setReferenciaSeleccionada] =
    useState<ReferenciaEspecialidad | null>(null);

  // Modal de vista previa del pase (nuevo)
  const [modalPreviewOpen, setModalPreviewOpen] = useState(false);
  const [datosNotificacion, setDatosNotificacion] = useState<{
    medio_notificacion?: string;
    observaciones?: string;
  } | null>(null);

  // Modal de detalle (para notificadas)
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [referenciaDetalle, setReferenciaDetalle] = useState<ReferenciaEspecialidad | null>(null);

  // Contador de seguimientos listos para notificar
  const [seguimientosCount, setSeguimientosCount] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      cargarReferencias();
    }
  }, [mounted]);

  // Cargar referencias notificadas cuando se cambia a esa pestaña
  useEffect(() => {
    if (mounted && tabActual === "notificadas" && referenciasNotificadas.length === 0) {
      cargarReferenciasNotificadas();
    }
  }, [mounted, tabActual]);

  // 🔔 Auto-recarga cuando llega una notificación del notificador
  useEffect(() => {
    if (notificaciones.length > 0) {
      const ultimaNotificacion = notificaciones[0];
      const ahora = new Date();
      const fechaNotif = new Date(ultimaNotificacion.fecha);
      const diff = ahora.getTime() - fechaNotif.getTime();

      // Si es reciente (< 5 segundos) y del tipo correcto
      if (diff < 5000 && ultimaNotificacion.tipo === 'referencia_notificador') {
        console.log('🔄 Nueva referencia autorizada detectada, recargando datos...');
        if (tabActual === 'pendientes') {
          cargarReferencias();
        }
      }
    }
  }, [notificaciones, tabActual]);

  const isDark = mounted && theme === "dark";

  const cargarReferencias = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/referencias/admin/pendientes");
      const data = await response.json();

      if (data.success) {
        setReferencias(data.referencias || []);
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

  const cargarReferenciasNotificadas = async () => {
    try {
      setLoadingNotificadas(true);

      const response = await fetch("/api/referencias/admin/notificadas");
      const data = await response.json();

      if (data.success) {
        setReferenciasNotificadas(data.referencias || []);
      }
    } catch (error) {
      console.error("Error al cargar referencias notificadas:", error);
    } finally {
      setLoadingNotificadas(false);
    }
  };

  const handleRefresh = () => {
    if (tabActual === "pendientes") {
      cargarReferencias();
    } else if (tabActual === "notificadas") {
      cargarReferenciasNotificadas();
    }
    // seguimientos se actualiza internamente desde TabSeguimientosAdmin
  };

  const handleNotificar = (referencia: ReferenciaEspecialidad) => {
    setReferenciaSeleccionada(referencia);
    setModalOpen(true);
  };

  const handleVerDetalle = (referencia: ReferenciaEspecialidad) => {
    setReferenciaDetalle(referencia);
    setModalDetalleOpen(true);
  };

  const handleNotificarConfirm = async (data: {
    medio_notificacion?: string;
    observaciones?: string;
  }) => {
    // Guardar los datos de notificación y abrir el modal de preview
    setDatosNotificacion(data);
    setModalOpen(false);
    setModalPreviewOpen(true);
  };

  const handleConfirmarNotificacionFinal = async () => {
    if (!referenciaSeleccionada || !datosNotificacion) return;

    try {
      const response = await fetch("/api/referencias/admin/notificar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_referencia: referenciaSeleccionada.id_referencia,
          ...datosNotificacion,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setModalPreviewOpen(false);
        setReferenciaSeleccionada(null);
        setDatosNotificacion(null);
        cargarReferencias();
        cargarReferenciasNotificadas();
        Swal.fire({ icon: "success", title: "Paciente notificado", text: "La notificación fue registrada exitosamente.", confirmButtonColor: "#0f83b2", timer: 3000, timerProgressBar: true });
      } else {
        Swal.fire({ icon: "error", title: "Error", text: result.error || "No se pudo registrar la notificación.", confirmButtonColor: "#0f83b2" });
      }
    } catch (error) {
      console.error("Error al notificar:", error);
      Swal.fire({ icon: "error", title: "Error de conexión", text: "No se pudo conectar al servidor.", confirmButtonColor: "#0f83b2" });
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      {/* Header */}
      <div
        className={`rounded-2xl shadow-lg p-6 lg:p-8 transition-all relative overflow-hidden ${isDark
            ? "bg-gradient-to-r from-[#0a1929] to-[#0d2137] border border-[#0f83b2]/20"
            : "bg-white border border-gray-200"
          }`}
      >
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0f83b2] to-[#0db1ec] shadow-lg shadow-blue-500/20 shrink-0">
              <Bell className="w-8 h-8 md:w-10 md:h-10 text-white" />
            </div>
            <div>
              <h1
                className={`text-2xl md:text-3xl font-bold tracking-tight ${isDark ? "text-white" : "text-gray-900"
                  }`}
              >
                Notificaciones - Administración
              </h1>
              <p className={`mt-1 text-sm md:text-base ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Gestión y entrega de referencias médicas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto w-full md:w-auto">
            <button
              onClick={handleRefresh}
              disabled={loading || loadingNotificadas}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all border shadow-sm w-full md:w-auto ${isDark
                  ? "bg-[#0d1f2d] text-[#0db1ec] border-[#0f83b2]/20 hover:bg-[#0f83b2]/10"
                  : "bg-white text-[#0f83b2] border-gray-200 hover:bg-gray-50"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <RefreshCw
                className={`w-4 h-4 ${(loading || loadingNotificadas) ? "animate-spin" : ""}`}
              />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs & Stats */}
        <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-dashed border-gray-200 dark:border-gray-700/50 pt-6">
          {/* Segmented Tabs */}
          <div className={`flex p-1.5 rounded-xl border w-full sm:w-auto ${isDark ? "bg-[#050b14]/50 border-gray-800" : "bg-gray-100/80 border-gray-200"}`}>
            <button
              onClick={() => setTabActual("pendientes")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${tabActual === "pendientes"
                  ? isDark
                    ? "bg-[#0f83b2] text-white shadow-lg shadow-blue-900/20"
                    : "bg-white text-[#0f83b2] shadow-sm ring-1 ring-black/5"
                  : isDark
                    ? "text-gray-400 hover:text-white hover:bg-white/5"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Por Notificar</span>
              {referencias.length > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] ${tabActual === "pendientes"
                    ? "bg-white/20 text-white"
                    : isDark ? "bg-[#0f83b2]/20 text-[#0db1ec]" : "bg-blue-100 text-[#0f83b2]"
                  }`}>
                  {referencias.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setTabActual("notificadas")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${tabActual === "notificadas"
                  ? isDark
                    ? "bg-green-600 text-white shadow-lg shadow-green-900/20"
                    : "bg-white text-green-700 shadow-sm ring-1 ring-black/5"
                  : isDark
                    ? "text-gray-400 hover:text-white hover:bg-white/5"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Notificadas</span>
            </button>

            <button
              onClick={() => setTabActual("seguimientos")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${tabActual === "seguimientos"
                  ? isDark
                    ? "bg-amber-500 text-white shadow-lg shadow-amber-900/20"
                    : "bg-white text-amber-700 shadow-sm ring-1 ring-black/5"
                  : isDark
                    ? "text-gray-400 hover:text-white hover:bg-white/5"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                }`}
            >
              <RefreshCcw className="w-4 h-4" />
              <span>Seguimientos</span>
              {seguimientosCount > 0 && (
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${tabActual === "seguimientos"
                    ? "bg-white/20 text-white"
                    : isDark ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-700"
                  }`}>
                  {seguimientosCount}
                </span>
              )}
            </button>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-3 px-2">
            <div className="flex flex-col items-end">
              <span className={`text-[10px] uppercase tracking-wider font-bold ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                {tabActual === "pendientes" ? "Por notificar" : tabActual === "notificadas" ? "Total notificadas" : "Lista p/ notificar"}
              </span>
              <span className={`text-xl font-mono font-bold ${
                tabActual === "pendientes"
                  ? isDark ? "text-[#0db1ec]" : "text-[#0f83b2]"
                  : tabActual === "notificadas"
                    ? isDark ? "text-green-400" : "text-green-600"
                    : isDark ? "text-amber-400" : "text-amber-600"
                }`}>
                {tabActual === "pendientes"
                  ? referencias.length
                  : tabActual === "notificadas"
                    ? referenciasNotificadas.length
                    : seguimientosCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className={`rounded-xl shadow-lg p-6 border-2 ${isDark
            ? "bg-red-500/10 border-red-500/30"
            : "bg-red-50 border-red-200"
            }`}
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <div>
              <h3
                className={`font-bold ${isDark ? "text-red-300" : "text-red-700"
                  }`}
              >
                Error
              </h3>
              <p
                className={`text-sm ${isDark ? "text-red-400" : "text-red-600"
                  }`}
              >
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Seguimientos */}
      {tabActual === "seguimientos" && (
        <TabSeguimientosAdmin
          onNotificar={handleNotificar}
          onContadorChange={setSeguimientosCount}
          isDark={isDark}
        />
      )}

      {/* Contenido según pestaña (pendientes / notificadas) */}
      {tabActual !== "seguimientos" && (tabActual === "pendientes" ? (
        /* Tabla de referencias pendientes de notificar */
        loading ? (
          <div className={`rounded-xl shadow-lg p-10 text-center ${isDark ? "bg-[#0a1929] border border-[#0f83b2]/20" : "bg-white border border-gray-200"}`}>
            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto ${isDark ? "border-[#0db1ec]" : "border-[#0f83b2]"}`} />
            <p className={`mt-4 font-medium text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>Cargando referencias...</p>
          </div>
        ) : referencias.length === 0 ? (
          <div className={`rounded-xl shadow-lg p-10 text-center ${isDark ? "bg-[#0a1929] border border-[#0f83b2]/20" : "bg-white border border-gray-200"}`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isDark ? "bg-emerald-500/10" : "bg-emerald-50"}`}>
              <Bell className={`w-7 h-7 ${isDark ? "text-emerald-400" : "text-emerald-500"}`} />
            </div>
            <h3 className={`text-lg font-bold mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Todo al día</h3>
            <p className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>No hay referencias pendientes de notificar</p>
          </div>
        ) : (
          <div className={`rounded-xl shadow-lg overflow-hidden ${isDark ? "bg-[#0a1929] border border-[#0f83b2]/20" : "bg-white border border-gray-200"}`}>
            <TablaReferenciasNotificar referencias={referencias} onNotificar={handleNotificar} isDark={isDark} />
          </div>
        )
      ) : (
        /* Tabla de referencias notificadas */
        loadingNotificadas ? (
          <div className={`rounded-xl shadow-lg p-10 text-center ${isDark ? "bg-[#0a1929] border border-[#0f83b2]/20" : "bg-white border border-gray-200"}`}>
            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto ${isDark ? "border-[#0db1ec]" : "border-[#0f83b2]"}`} />
            <p className={`mt-4 font-medium text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>Cargando notificadas...</p>
          </div>
        ) : referenciasNotificadas.length === 0 ? (
          <div className={`rounded-xl shadow-lg p-10 text-center ${isDark ? "bg-[#0a1929] border border-[#0f83b2]/20" : "bg-white border border-gray-200"}`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isDark ? "bg-[#0f83b2]/10" : "bg-blue-50"}`}>
              <FileCheck className={`w-7 h-7 ${isDark ? "text-[#0db1ec]" : "text-[#0f83b2]"}`} />
            </div>
            <h3 className={`text-lg font-bold mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Sin notificadas aún</h3>
            <p className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>Las referencias notificadas aparecerán aquí</p>
          </div>
        ) : (
          <div className={`rounded-xl shadow-lg overflow-hidden ${isDark ? "bg-[#0a1929] border border-[#0f83b2]/20" : "bg-white border border-gray-200"}`}>
            <TablaReferenciasNotificadas referencias={referenciasNotificadas} onVerDetalle={handleVerDetalle} isDark={isDark} />
          </div>
        )
      ))}


      {/* Modal de notificación (para pendientes) */}
      <ModalNotificarPaciente
        referencia={referenciaSeleccionada}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setReferenciaSeleccionada(null);
        }}
        onNotificar={handleNotificarConfirm}
        isDark={isDark}
      />

      {/* Modal de vista previa del pase */}
      <ModalPaseEspecialidadPreview
        referencia={referenciaSeleccionada}
        datosNotificacion={datosNotificacion}
        isOpen={modalPreviewOpen}
        onClose={() => {
          setModalPreviewOpen(false);
          setModalOpen(true); // Volver al modal de notificación
        }}
        onConfirmarNotificacion={handleConfirmarNotificacionFinal}
        isDark={isDark}
      />

      {/* Modal de detalle (para notificadas) */}
      <ModalDetalleReferenciaNotificada
        referencia={referenciaDetalle}
        isOpen={modalDetalleOpen}
        onClose={() => {
          setModalDetalleOpen(false);
          setReferenciaDetalle(null);
        }}
        isDark={isDark}
      />
    </div>
  );
}
