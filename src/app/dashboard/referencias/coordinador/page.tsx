//src/app/dashboard/referencias/coordinador/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { RefreshCw, CheckCircle, AlertCircle, ClipboardCheck, FileCheck } from "lucide-react";
import Swal from "sweetalert2";
import AppToast, { useToast } from "@/components/ui/AppToast";
import type { ReferenciaEspecialidad } from "@/types/referencias";
import TablaReferenciasAutorizar from "@/components/referencias/coordinador/TablaReferenciasAutorizar";
import TablaReferenciasAutorizadas from "@/components/referencias/coordinador/TablaReferenciasAutorizadas";
import ModalAutorizarReferencia from "@/components/referencias/coordinador/ModalAutorizarReferencia";
import ModalDetalleReferenciaAutorizada from "@/components/referencias/coordinador/ModalDetalleReferenciaAutorizada";
import { useNotifications } from "@/context/NotificationsContext";

type TabType = "pendientes" | "autorizadas";

export default function CoordinadorReferenciasPage() {
  const { theme } = useTheme();
  const { notificaciones } = useNotifications();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [tabActual, setTabActual] = useState<TabType>("pendientes");

  // Referencias pendientes
  const [referencias, setReferencias] = useState<ReferenciaEspecialidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Referencias autorizadas
  const [referenciasAutorizadas, setReferenciasAutorizadas] = useState<ReferenciaEspecialidad[]>([]);
  const [loadingAutorizadas, setLoadingAutorizadas] = useState(false);

  const { toast, showToast, clearToast } = useToast();

  // Modal de autorización (para pendientes)
  const [modalOpen, setModalOpen] = useState(false);
  const [referenciaSeleccionada, setReferenciaSeleccionada] = useState<ReferenciaEspecialidad | null>(null);

  // Modal de detalle (para autorizadas)
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [referenciaDetalle, setReferenciaDetalle] = useState<ReferenciaEspecialidad | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      cargarReferencias();
    }
  }, [mounted]);

  // Cargar referencias autorizadas cuando se cambia a esa pestaña
  useEffect(() => {
    if (mounted && tabActual === "autorizadas" && referenciasAutorizadas.length === 0) {
      cargarReferenciasAutorizadas();
    }
  }, [mounted, tabActual]);

  // 🔔 Auto-recarga cuando llega una notificación de coordinador
  useEffect(() => {
    if (notificaciones.length > 0) {
      const ultimaNotificacion = notificaciones[0];
      const ahora = new Date();
      const fechaNotif = new Date(ultimaNotificacion.fecha);
      const diff = ahora.getTime() - fechaNotif.getTime();

      // Si es reciente (< 5 segundos) y del tipo correcto
      if (diff < 5000 && ultimaNotificacion.tipo === 'referencia_coordinador') {
        console.log('🔄 Nueva referencia para autorizar detectada, recargando datos...');
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

      const [pendRes, segRes] = await Promise.all([
        fetch("/api/referencias/coordinador/pendientes"),
        fetch("/api/referencias/coordinador/seguimientos"),
      ]);
      const pendData = await pendRes.json();
      const segData = await segRes.json();

      const pendientes: ReferenciaEspecialidad[] = pendData.success ? (pendData.referencias || []) : [];
      const seguimientos: ReferenciaEspecialidad[] = segData.success ? (segData.referencias || []) : [];

      setReferencias([...pendientes, ...seguimientos]);

      if (!pendData.success && !segData.success) {
        setError(pendData.error || "Error al cargar referencias");
      }
    } catch (error) {
      console.error("Error al cargar referencias:", error);
      setError("Error de conexión al cargar referencias");
    } finally {
      setLoading(false);
    }
  };

  const cargarReferenciasAutorizadas = async () => {
    try {
      setLoadingAutorizadas(true);

      const response = await fetch("/api/referencias/coordinador/autorizadas");
      const data = await response.json();

      if (data.success) {
        setReferenciasAutorizadas(data.referencias || []);
      }
    } catch (error) {
      console.error("Error al cargar referencias autorizadas:", error);
    } finally {
      setLoadingAutorizadas(false);
    }
  };

  const handleRefresh = () => {
    if (tabActual === "pendientes") {
      cargarReferencias();
    } else if (tabActual === "autorizadas") {
      cargarReferenciasAutorizadas();
    }
  };

  const handleVerDetalle = (referencia: ReferenciaEspecialidad) => {
    setReferenciaSeleccionada(referencia);
    setModalOpen(true);
  };

  const handleVerDetalleAutorizada = (referencia: ReferenciaEspecialidad) => {
    setReferenciaDetalle(referencia);
    setModalDetalleOpen(true);
  };

  const handleAutorizar = async (data: { observaciones?: string; firma_digital?: string }) => {
    const esSeguimiento = referenciaSeleccionada?.tipo_referencia === 'seguimiento';
    try {
      const response = await fetch("/api/referencias/coordinador/autorizar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_referencia: referenciaSeleccionada?.id_referencia,
          ...data,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast('success', esSeguimiento ? 'Seguimiento autorizado exitosamente' : 'Referencia autorizada exitosamente');
        setModalOpen(false);
        setReferenciaSeleccionada(null);

        if (esSeguimiento) {
          cargarReferencias();
          cargarReferenciasAutorizadas();

          // Preguntar si quiere ir a autorizar estudios de lab
          const nomina = referenciaSeleccionada?.no_nomina ?? '';
          const labConfirm = await Swal.fire({
            title: '¿Autorizar estudios de laboratorio?',
            html: 'El especialista puede haber solicitado estudios para este seguimiento.<br>¿Desea ir al módulo de laboratorio para revisarlos?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, ir a laboratorio',
            cancelButtonText: 'No, continuar aquí',
            confirmButtonColor: '#0f83b2',
            cancelButtonColor: '#6b7280',
            background: isDark ? '#0a1929' : '#ffffff',
            color: isDark ? '#e2e8f0' : '#1a202c',
            customClass: {
              popup: isDark ? 'swal-dark-popup' : '',
            },
          });

          if (labConfirm.isConfirmed) {
            router.push(`/dashboard/coordinacion/laboratorio?from=seguimiento&nomina=${encodeURIComponent(nomina)}`);
          }
        } else {
          cargarReferencias();
        }
      } else {
        showToast('error', result.error || 'Error al autorizar');
      }
    } catch (error) {
      console.error("Error al autorizar:", error);
      showToast('error', 'Error de conexión al autorizar referencia');
    }
  };

  const handleRechazar = async (motivo: string) => {
    try {
      const response = await fetch("/api/referencias/coordinador/rechazar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_referencia: referenciaSeleccionada?.id_referencia,
          motivo_rechazo: motivo,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast('success', 'Referencia rechazada correctamente');
        setModalOpen(false);
        setReferenciaSeleccionada(null);
        cargarReferencias();
      } else {
        showToast('error', result.error || 'Error al rechazar');
      }
    } catch (error) {
      console.error("Error al rechazar:", error);
      showToast('error', 'Error de conexión al rechazar referencia');
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
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <CheckCircle className={`w-32 h-32 ${isDark ? "text-[#0f83b2]" : "text-[#0f83b2]"}`} />
        </div>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0f83b2] to-[#0db1ec] shadow-lg shadow-blue-500/20 shrink-0">
              <CheckCircle className="w-8 h-8 md:w-10 md:h-10 text-white" />
            </div>
            <div>
              <h1
                className={`text-2xl md:text-3xl font-bold tracking-tight ${isDark ? "text-white" : "text-gray-900"
                  }`}
              >
                Referencias - Coordinación
              </h1>
              <p className={`mt-1 text-sm md:text-base ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Gestión y autorización de referencias médicas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto w-full md:w-auto">
            <button
              onClick={handleRefresh}
              disabled={loading || loadingAutorizadas}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all border shadow-sm w-full md:w-auto ${isDark
                  ? "bg-[#0d1f2d] text-[#0db1ec] border-[#0f83b2]/20 hover:bg-[#0f83b2]/10"
                  : "bg-white text-[#0f83b2] border-gray-200 hover:bg-gray-50"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <RefreshCw
                className={`w-4 h-4 ${(loading || loadingAutorizadas) ? "animate-spin" : ""}`}
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
              <span>Por Autorizar</span>
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
              onClick={() => setTabActual("autorizadas")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${tabActual === "autorizadas"
                  ? isDark
                    ? "bg-green-600 text-white shadow-lg shadow-green-900/20"
                    : "bg-white text-green-700 shadow-sm ring-1 ring-black/5"
                  : isDark
                    ? "text-gray-400 hover:text-white hover:bg-white/5"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Autorizadas</span>
            </button>

          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-3 px-2">
            <div className="flex flex-col items-end">
              <span className={`text-[10px] uppercase tracking-wider font-bold ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                {tabActual === "pendientes" ? "Por Autorizar" : "Total Autorizadas"}
              </span>
              <span className={`text-xl font-mono font-bold ${tabActual === "pendientes"
                  ? isDark ? "text-[#0db1ec]" : "text-[#0f83b2]"
                  : isDark ? "text-green-400" : "text-green-600"
                }`}>
                {tabActual === "pendientes" ? referencias.length : referenciasAutorizadas.length}
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

      {/* Contenido según pestaña */}
      {tabActual === "pendientes" ? (
        /* Tabla de referencias pendientes */
        loading ? (
          <div
            className={`rounded-xl shadow-lg p-12 text-center ${isDark
              ? "bg-[#0a1929] border border-[#0f83b2]/20"
              : "bg-white border border-gray-200"
              }`}
          >
            <div
              className={`animate-spin rounded-full h-16 w-16 border-b-2 mx-auto ${isDark ? "border-[#0db1ec]" : "border-[#0f83b2]"
                }`}
            ></div>
            <p
              className={`mt-4 font-medium ${isDark ? "text-gray-300" : "text-gray-600"
                }`}
            >
              Cargando referencias pendientes...
            </p>
          </div>
        ) : referencias.length === 0 ? (
          <div
            className={`rounded-xl shadow-lg p-12 text-center ${isDark
              ? "bg-[#0a1929] border border-[#0f83b2]/20"
              : "bg-white border border-gray-200"
              }`}
          >
            <CheckCircle
              className={`w-16 h-16 mx-auto mb-4 ${isDark ? "text-gray-600" : "text-gray-300"
                }`}
            />
            <h3
              className={`text-xl font-bold mb-2 ${isDark ? "text-gray-300" : "text-gray-600"
                }`}
            >
              No hay referencias pendientes de autorización
            </h3>
            <p className={`${isDark ? "text-gray-500" : "text-gray-400"}`}>
              Todas las referencias han sido procesadas
            </p>
          </div>
        ) : (
          <div
            className={`rounded-xl shadow-lg overflow-hidden ${isDark
              ? "bg-[#0a1929] border border-[#0f83b2]/20"
              : "bg-white border border-gray-200"
              }`}
          >
            <TablaReferenciasAutorizar
              referencias={referencias}
              onVerDetalle={handleVerDetalle}
              isDark={isDark}
            />
          </div>
        )
      ) : (
        /* Tabla de referencias autorizadas */
        loadingAutorizadas ? (
          <div
            className={`rounded-xl shadow-lg p-12 text-center ${isDark
              ? "bg-[#0a1929] border border-[#0f83b2]/20"
              : "bg-white border border-gray-200"
              }`}
          >
            <div
              className={`animate-spin rounded-full h-16 w-16 border-b-2 mx-auto ${isDark ? "border-[#0db1ec]" : "border-[#0f83b2]"
                }`}
            ></div>
            <p
              className={`mt-4 font-medium ${isDark ? "text-gray-300" : "text-gray-600"
                }`}
            >
              Cargando referencias autorizadas...
            </p>
          </div>
        ) : referenciasAutorizadas.length === 0 ? (
          <div
            className={`rounded-xl shadow-lg p-12 text-center ${isDark
              ? "bg-[#0a1929] border border-[#0f83b2]/20"
              : "bg-white border border-gray-200"
              }`}
          >
            <FileCheck
              className={`w-16 h-16 mx-auto mb-4 ${isDark ? "text-gray-600" : "text-gray-300"
                }`}
            />
            <h3
              className={`text-xl font-bold mb-2 ${isDark ? "text-gray-300" : "text-gray-600"
                }`}
            >
              No hay referencias autorizadas
            </h3>
            <p className={`${isDark ? "text-gray-500" : "text-gray-400"}`}>
              Aún no has autorizado ninguna referencia
            </p>
          </div>
        ) : (
          <div
            className={`rounded-xl shadow-lg overflow-hidden ${isDark
              ? "bg-[#0a1929] border border-[#0f83b2]/20"
              : "bg-white border border-gray-200"
              }`}
          >
            <TablaReferenciasAutorizadas
              referencias={referenciasAutorizadas}
              onVerDetalle={handleVerDetalleAutorizada}
              isDark={isDark}
            />
          </div>
        )
      )}

      {/* Modal de autorización/rechazo */}
      <ModalAutorizarReferencia
        referencia={referenciaSeleccionada}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setReferenciaSeleccionada(null);
        }}
        onAutorizar={handleAutorizar}
        onRechazar={handleRechazar}
        isDark={isDark}
      />

      {/* Modal de detalle (para autorizadas) */}
      <ModalDetalleReferenciaAutorizada
        referencia={referenciaDetalle}
        isOpen={modalDetalleOpen}
        onClose={() => {
          setModalDetalleOpen(false);
          setReferenciaDetalle(null);
        }}
        isDark={isDark}
      />

      <AppToast toast={toast} isDark={isDark} onClose={clearToast} />
    </div>
  );
}
