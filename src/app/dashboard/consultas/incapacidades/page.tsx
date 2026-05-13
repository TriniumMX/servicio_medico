"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "@/context/NotificationsContext";

import {
  FileText,
  Search,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Printer,
  Clock,
  Ban
} from "lucide-react";
import { generarIncapacidadPDF } from "@/lib/generar-incapacidad-pdf";
import ModalDecision from "@/components/catalogos/incapacidades/ModalDecision";

interface Incapacidad {
  id_incapacidad: number;
  id_consulta: number;
  no_nomina: string;
  nombre_paciente: string;
  departamento: string;
  folio_consulta: string;
  diagnostico: string;
  codigo_cie: string;
  fecha_inicio: string;
  fecha_fin: string;
  dias_sugeridos: number;
  dias_autorizados?: number;
  motivo_medico: string;
  motivo_rechazo?: string;
  fecha_solicitud: string;
  fecha_autorizacion?: string;
  nombre_doctor?: string;
  nombre_autorizador?: string;
}

export default function IncapacidadesPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Incapacidad[]>([]);
  const [filtro, setFiltro] = useState("");

  // Estado del Tab (Switch)
  const [tabActual, setTabActual] = useState<"PENDIENTE" | "AUTORIZADA" | "RECHAZADA">("PENDIENTE");

  // Estados del Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTipo, setModalTipo] = useState<"AUTORIZAR" | "RECHAZAR">("AUTORIZAR");
  const [itemSeleccionado, setItemSeleccionado] = useState<any>(null);
  const [nuevoRegistroId, setNuevoRegistroId] = useState<number | null>(null);
  const { notificaciones } = useNotifications();

  // Escuchar cambios en las notificaciones para recargar la tabla
  useEffect(() => {
    if (notificaciones.length > 0) {
      const ultimaNotificacion = notificaciones[0];
      // Si es una notificación de incapacidad reciente (menos de 5 segundos)
      const ahora = new Date();
      const fechaNotif = new Date(ultimaNotificacion.fecha);
      const diff = ahora.getTime() - fechaNotif.getTime();

      if (diff < 5000 && ultimaNotificacion.tipo === 'incapacidad' && tabActual === 'PENDIENTE') {
        console.log('🔄 Recargando datos de incapacidades...');
        cargarDatos();
      }
    }
  }, [notificaciones]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cargar datos cada vez que cambiamos de pestaña
  useEffect(() => {
    if (mounted) {
      cargarDatos();
    }
  }, [mounted, tabActual]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Guardar el ID del primer registro actual para detectar nuevos
      const primerIdAnterior = data.length > 0 ? data[0].id_incapacidad : null;

      // Usamos la nueva API flexible
      const res = await fetch(`/api/incapacidades/listado?estatus=${tabActual}`);
      const respuesta = await res.json();
      if (respuesta.success) {
        setData(respuesta.data);

        // Si hay un nuevo registro (el primer ID cambió), marcarlo para animación
        if (respuesta.data.length > 0 && respuesta.data[0].id_incapacidad !== primerIdAnterior) {
          setNuevoRegistroId(respuesta.data[0].id_incapacidad);
          // Quitar la marca después de 3 segundos
          setTimeout(() => setNuevoRegistroId(null), 3000);
        }
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (item: any, tipo: "AUTORIZAR" | "RECHAZAR") => {
    setItemSeleccionado(item);
    setModalTipo(tipo);
    setModalOpen(true);
  };

  const procesarDecision = async (datos: any) => {
    try {
      const res = await fetch("/api/incapacidades/decidir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
      });

      const respuesta = await res.json();

      if (respuesta.success) {
        alert(modalTipo === "AUTORIZAR" ? "✅ Incapacidad Autorizada" : "🚫 Incapacidad Rechazada");
        setModalOpen(false);
        cargarDatos(); // Recargar la lista actual
      } else {
        alert("Error: " + respuesta.error);
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión");
    }
  };

  // ==========================================
  // GENERACIÓN DE PDF (NUEVO FORMATO PDF-LIB)
  // ==========================================
  const generarPDF = async (item: Incapacidad) => {
    try {
      const pdfBytes = await generarIncapacidadPDF({
        id_incapacidad: item.id_incapacidad,
        folio_consulta: item.folio_consulta,
        no_nomina: item.no_nomina,
        nombre_paciente: item.nombre_paciente,
        departamento: item.departamento,
        diagnostico: `${item.codigo_cie} - ${item.diagnostico}`,
        dias_autorizados: item.dias_autorizados || 0,
        fecha_inicio: item.fecha_inicio,
        fecha_fin: item.fecha_fin,
        nombre_doctor: item.nombre_doctor || "Dr. Desconocido",
        fecha_autorizacion: item.fecha_autorizacion || new Date().toISOString(),
        nombre_autorizador: item.nombre_autorizador
      });

      // Crear Blob y descargar
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Incapacidad_${item.no_nomina}_${item.id_incapacidad}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generando PDF:", error);
      alert("Error al generar el formato PDF");
    }
  };

  // Filtrado local
  const dataFiltrada = data.filter(p =>
    p.nombre_paciente.toLowerCase().includes(filtro.toLowerCase()) ||
    p.no_nomina?.toLowerCase().includes(filtro.toLowerCase()) ||
    p.folio_consulta.toLowerCase().includes(filtro.toLowerCase())
  );

  const isDark = mounted && theme === "dark";

  if (!mounted) return null;

  return (
    <div className={`min-h-screen p-6 ${isDark ? "bg-[#0d2137]" : "bg-gray-50"}`}>

      {/* Header */}
      <div
        className={`rounded-2xl shadow-lg p-6 lg:p-8 transition-all relative overflow-hidden mb-8 ${isDark
          ? "bg-gradient-to-r from-[#0a1929] to-[#0d2137] border border-[#0f83b2]/20"
          : "bg-white border border-gray-200"
          }`}
      >
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0f83b2] to-[#0db1ec] shadow-lg shadow-blue-500/20 shrink-0">
              <FileText className="w-8 h-8 md:w-10 md:h-10 text-white" />
            </div>
            <div>
              <h1
                className={`text-2xl md:text-3xl font-bold tracking-tight ${isDark ? "text-white" : "text-gray-900"
                  }`}
              >
                Gestión de Incapacidades
              </h1>
              <p className={`mt-1 text-sm md:text-base ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Administre, autorice solicitudes y consulte el historial
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Segmented) */}
        <div className="mt-8 flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-t border-dashed border-gray-200 dark:border-gray-700/50 pt-6">
          <div className={`p-1.5 rounded-xl border flex flex-col sm:flex-row gap-2 ${isDark ? "bg-[#050b14]/50 border-gray-800" : "bg-gray-100/80 border-gray-200"}`}>
            <button
              onClick={() => setTabActual("PENDIENTE")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${tabActual === "PENDIENTE"
                ? isDark
                  ? "bg-[#0f83b2] text-white shadow-lg shadow-blue-900/20"
                  : "bg-white text-[#0f83b2] shadow-sm ring-1 ring-black/5"
                : isDark
                  ? "text-gray-400 hover:text-white hover:bg-white/5"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                }`}
            >
              <Clock className="w-4 h-4" />
              <span>Pendientes</span>
            </button>
            <button
              onClick={() => setTabActual("AUTORIZADA")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${tabActual === "AUTORIZADA"
                ? isDark
                  ? "bg-green-600 text-white shadow-lg shadow-green-900/20"
                  : "bg-white text-green-700 shadow-sm ring-1 ring-black/5"
                : isDark
                  ? "text-gray-400 hover:text-white hover:bg-white/5"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>Autorizadas</span>
            </button>
            <button
              onClick={() => setTabActual("RECHAZADA")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${tabActual === "RECHAZADA"
                ? isDark
                  ? "bg-red-600 text-white shadow-lg shadow-red-900/20"
                  : "bg-white text-red-600 shadow-sm ring-1 ring-black/5"
                : isDark
                  ? "text-gray-400 hover:text-white hover:bg-white/5"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                }`}
            >
              <Ban className="w-4 h-4" />
              <span>Rechazadas</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full xl:w-96">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
            <input
              type="text"
              placeholder="Buscar por nombre, nómina o folio..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium transition-all outline-none ${isDark
                ? "bg-[#0d1f2d] border-[#0f83b2]/20 text-white placeholder-gray-600 focus:border-[#0f83b2] focus:ring-1 focus:ring-[#0f83b2]"
                : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#0f83b2] focus:ring-1 focus:ring-[#0f83b2]"
                }`}
            />
          </div>
        </div>
      </div>

      {/* Tabla de Datos */}
      {loading ? (
        <div className="text-center py-12">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto ${isDark ? "border-[#0db1ec]" : "border-[#0f83b2]"}`}></div>
          <p className={`mt-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Cargando...</p>
        </div>
      ) : dataFiltrada.length === 0 ? (
        <div className={`text-center py-16 rounded-xl border-2 border-dashed ${isDark ? "border-gray-700 bg-[#0a1929]" : "border-gray-300 bg-white"}`}>
          <FileText className={`w-16 h-16 mx-auto mb-4 ${isDark ? "text-gray-600" : "text-gray-300"}`} />
          <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-800"}`}>Sin registros</h3>
          <p className={`${isDark ? "text-gray-400" : "text-gray-500"}`}>No hay incapacidades en la bandeja de {tabActual.toLowerCase()}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {dataFiltrada.map((item, index) => {
              const esNuevo = item.id_incapacidad === nuevoRegistroId;
              return (
                <motion.div
                  key={item.id_incapacidad}
                  layout
                  initial={esNuevo ? { opacity: 0, scale: 0.9, y: -20 } : false}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    backgroundColor: esNuevo
                      ? (isDark ? 'rgba(15, 131, 178, 0.2)' : 'rgba(45, 175, 220, 0.15)')
                      : 'transparent'
                  }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{
                    duration: 0.5,
                    type: "spring",
                    stiffness: 200,
                    damping: 20
                  }}
                  className={`group relative p-6 rounded-2xl border transition-all hover:shadow-xl ${isDark
                      ? "bg-[#0a1929] border-[#0f83b2]/20 hover:border-[#0f83b2]/40"
                      : "bg-white border-gray-100 hover:border-blue-100 hover:shadow-blue-500/5"
                    } ${esNuevo ? 'ring-2 ring-[#0f83b2] ring-opacity-50' : ''}`}
                >
                  <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                    {/* Info Paciente */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${item.departamento
                            ? isDark ? "bg-[#0f83b2]/20 text-[#0db1ec]" : "bg-blue-50 text-blue-700"
                            : isDark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-500"
                          }`}>
                          {item.departamento || "Sin Depto"}
                        </span>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${tabActual === "PENDIENTE"
                            ? isDark ? "bg-[#0f83b2]/20 text-white" : "bg-blue-50 text-blue-700"
                            : tabActual === "AUTORIZADA"
                              ? isDark ? "bg-green-500/20 text-green-300" : "bg-green-50 text-green-700"
                              : isDark ? "bg-red-500/20 text-red-300" : "bg-red-50 text-red-700"
                          }`}>
                          {tabActual}
                        </span>
                        <span className={`text-xs font-medium ml-auto ${isDark ? "text-gray-400" : "text-gray-400"}`}>
                          Solicitado: {new Date(item.fecha_solicitud).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className={`text-lg sm:text-xl font-bold mb-1 leading-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                            {item.nombre_paciente}
                          </h3>
                          <div className={`flex items-center gap-2 text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                            <User className="w-4 h-4" />
                            <span className="font-mono">Nómina: {item.no_nomina}</span>
                          </div>
                        </div>
                      </div>

                      <div className={`mt-4 p-4 rounded-xl border ${isDark ? "bg-[#0d2137]/50 border-[#0f83b2]/20" : "bg-gray-50 border-gray-100"}`}>
                        <div className="flex gap-3">
                          <div className={`mt-0.5 shrink-0 p-1.5 rounded-lg ${isDark ? "bg-[#0f83b2]/20 text-[#0db1ec]" : "bg-blue-100/50 text-blue-600"}`}>
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <span className={`text-xs font-bold uppercase tracking-wider block mb-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                              Diagnóstico (CIE-10)
                            </span>
                            <p className={`text-sm font-medium leading-relaxed ${isDark ? "text-gray-200" : "text-gray-700"}`}>
                              <span className="font-mono font-bold mr-2">{item.codigo_cie}</span>
                              {item.diagnostico}
                            </p>
                            {/* Mostrar motivo de rechazo si aplica */}
                            {tabActual === "RECHAZADA" && item.motivo_rechazo && (
                              <div className={`mt-3 pt-3 border-t border-dashed ${isDark ? "border-red-500/30" : "border-red-200"}`}>
                                <span className={`text-xs font-bold uppercase tracking-wider block mb-1 ${isDark ? "text-red-400" : "text-red-600"}`}>
                                  Motivo de Rechazo
                                </span>
                                <p className={`text-sm italic ${isDark ? "text-red-300" : "text-red-700"}`}>
                                  "{item.motivo_rechazo}"
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Info Días y Botones */}
                    <div className={`flex flex-col gap-4 lg:w-72 lg:border-l lg:pl-8 ${isDark ? "border-[#0f83b2]/20" : "border-gray-100"}`}>
                      <div className={`p-4 rounded-xl ${isDark ? "bg-[#0d2137]" : "bg-white border border-gray-100 shadow-sm"}`}>
                        <div className="flex items-center gap-3 mb-3">
                          <Calendar className={`w-5 h-5 ${isDark ? "text-[#0db1ec]" : "text-[#0f83b2]"}`} />
                          <div>
                            <span className={`text-xs font-bold uppercase tracking-wider block ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                              Duración
                            </span>
                            <span className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                              {tabActual === "AUTORIZADA" ? item.dias_autorizados : item.dias_sugeridos} Días
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className={isDark ? "text-gray-500" : "text-gray-400"}>Inicio:</span>
                            <span className={`font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                              {new Date(item.fecha_inicio).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className={isDark ? "text-gray-500" : "text-gray-400"}>Fin:</span>
                            <span className={`font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                              {new Date(item.fecha_fin).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 mt-auto">
                        {/* BOTONES PARA PENDIENTES */}
                        {tabActual === "PENDIENTE" && (
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => abrirModal(item, "RECHAZAR")}
                              className={`py-2.5 rounded-xl font-bold text-sm transition-all ${isDark
                                  ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                  : "bg-red-50 text-red-600 hover:bg-red-100"
                                }`}
                            >
                              Rechazar
                            </button>
                            <button
                              onClick={() => abrirModal(item, "AUTORIZAR")}
                              className={`py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-green-500/20 ${isDark
                                  ? "bg-gradient-to-r from-green-500 to-green-600 text-white hover:to-green-500"
                                  : "bg-gradient-to-r from-green-600 to-green-700 text-white hover:to-green-600"
                                }`}
                            >
                              Autorizar
                            </button>
                          </div>
                        )}

                        {/* BOTÓN PARA AUTORIZADAS (IMPRIMIR) */}
                        {tabActual === "AUTORIZADA" && (
                          <button
                            onClick={() => generarPDF(item)}
                            className={`w-full py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 ${isDark
                                ? "bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] text-white hover:to-[#0db1ec]"
                                : "bg-gradient-to-r from-[#0f83b2] to-[#0a7aa0] text-white hover:to-[#0a7aa0]"
                              }`}
                          >
                            <Printer className="w-4 h-4" />
                            <span>Imprimir Formato</span>
                          </button>
                        )}

                        {/* RECHAZADAS NO TIENEN ACCIÓN */}
                        {tabActual === "RECHAZADA" && (
                          <span className={`text-xs text-center italic ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                            Solicitud cerrada permanentemente
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <ModalDecision
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        tipo={modalTipo}
        data={itemSeleccionado}
        onConfirm={procesarDecision}
        isDark={isDark}
      />
    </div>
  );
}