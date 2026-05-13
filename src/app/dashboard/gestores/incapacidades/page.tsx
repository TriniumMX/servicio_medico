"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";

import {
  FileText,
  Search,
  CheckCircle,
  Calendar,
  User,
  Printer,
  FileCheck,
  Clock,
  PackageCheck
} from "lucide-react";
import { generarIncapacidadPDF } from "@/lib/generar-incapacidad-pdf";
import ModalVistaPrevia from "@/components/catalogos/incapacidades/ModalVistaPrevia";

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
  fecha_solicitud: string;
  fecha_autorizacion?: string;
  fecha_entrega?: string;
  nombre_doctor?: string;
  nombre_autorizador?: string;
}

type TabType = "pendientes" | "entregadas";

export default function EntregaIncapacidadesPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendientes, setPendientes] = useState<Incapacidad[]>([]);
  const [entregadas, setEntregadas] = useState<Incapacidad[]>([]);
  const [filtro, setFiltro] = useState("");
  const [tabActivo, setTabActivo] = useState<TabType>("pendientes");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Incapacidad | null>(null);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      cargarDatos();
    }
  }, [mounted]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Cargar pendientes de entrega (autorizadas sin entregar)
      const resPendientes = await fetch(`/api/incapacidades/listado?estatus=AUTORIZADA&entregada=false`);
      const respPendientes = await resPendientes.json();

      // Cargar ya entregadas
      const resEntregadas = await fetch(`/api/incapacidades/listado?estatus=AUTORIZADA&entregada=true`);
      const respEntregadas = await resEntregadas.json();

      if (respPendientes.success) {
        setPendientes(respPendientes.data);
      }
      if (respEntregadas.success) {
        setEntregadas(respEntregadas.data);
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const abrirVistaPrevia = (item: Incapacidad) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

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

      const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
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

  const marcarEntregada = async (idIncapacidad: number) => {
    setProcesando(true);
    try {
      const res = await fetch('/api/incapacidades/entregar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_incapacidad: idIncapacidad })
      });
      const data = await res.json();
      if (data.success) {
        // Recargar datos
        await cargarDatos();
        setModalOpen(false);
        setSelectedItem(null);
      } else {
        alert("Error al marcar como entregada");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al marcar como entregada");
    } finally {
      setProcesando(false);
    }
  };

  const handleImprimir = () => {
    if (selectedItem) {
      generarPDF(selectedItem);
    }
  };

  const handleMarcarEntregada = () => {
    if (selectedItem) {
      marcarEntregada(selectedItem.id_incapacidad);
    }
  };

  const dataActual = tabActivo === "pendientes" ? pendientes : entregadas;
  const dataFiltrada = dataActual.filter(p =>
    p.nombre_paciente.toLowerCase().includes(filtro.toLowerCase()) ||
    p.no_nomina?.toLowerCase().includes(filtro.toLowerCase()) ||
    p.folio_consulta.toLowerCase().includes(filtro.toLowerCase())
  );

  const isDark = mounted && theme === "dark";

  if (!mounted) return null;

  const tabs = [
    {
      id: "pendientes" as TabType,
      label: "Pendientes de Entrega",
      icon: Clock,
      count: pendientes.length,
      color: "amber"
    },
    {
      id: "entregadas" as TabType,
      label: "Entregadas",
      icon: PackageCheck,
      count: entregadas.length,
      color: "green"
    }
  ];

  return (
    <div className={`min-h-screen p-4 sm:p-6 ${isDark ? "bg-[#0d2137]" : "bg-gray-50"}`}>

      {/* Header */}
      <div
        className={`rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 transition-all relative overflow-hidden mb-6 sm:mb-8 ${isDark
          ? "bg-gradient-to-r from-[#0a1929] to-[#0d2137] border border-[#0f83b2]/20"
          : "bg-white border border-gray-200"
          }`}
      >
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 sm:gap-6 relative z-10">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-[#0f83b2] to-[#0db1ec] shadow-lg shadow-blue-500/20 shrink-0">
              <FileCheck className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" />
            </div>
            <div>
              <h1
                className={`text-xl sm:text-2xl md:text-3xl font-bold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}
              >
                Entrega de Incapacidades
              </h1>
              <p className={`mt-1 text-xs sm:text-sm md:text-base ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Imprima y entregue los formatos de incapacidad autorizados
              </p>
            </div>
          </div>

          {/* Botón Actualizar */}
          <button
            onClick={cargarDatos}
            disabled={loading}
            className={`flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-sm transition-all border shadow-sm ${isDark
                ? "bg-[#0d1f2d] text-[#0db1ec] border-[#0f83b2]/20 hover:bg-[#0f83b2]/10"
                : "bg-white text-[#0f83b2] border-gray-200 hover:bg-gray-50"
              } disabled:opacity-50`}
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-6 sm:mt-8 border-t border-dashed border-gray-200 dark:border-gray-700/50 pt-4 sm:pt-6">
          <div className="flex flex-wrap gap-2 sm:gap-3 mb-4">
            {tabs.map((tab) => {
              const isActive = tabActivo === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setTabActivo(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    isActive
                      ? tab.color === "amber"
                        ? isDark
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                        : isDark
                          ? "bg-green-500/20 text-green-300 border border-green-500/30"
                          : "bg-green-50 text-green-700 border border-green-200"
                      : isDark
                        ? "bg-[#0d1f2d] text-gray-400 border border-[#0f83b2]/10 hover:border-[#0f83b2]/30"
                        : "bg-gray-50 text-gray-500 border border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                    isActive
                      ? tab.color === "amber"
                        ? isDark ? "bg-amber-500/30 text-amber-200" : "bg-amber-100 text-amber-800"
                        : isDark ? "bg-green-500/30 text-green-200" : "bg-green-100 text-green-800"
                      : isDark ? "bg-gray-700 text-gray-400" : "bg-gray-200 text-gray-600"
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-80 lg:w-96">
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

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto ${isDark ? "border-[#0db1ec]" : "border-[#0f83b2]"}`}></div>
          <p className={`mt-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Cargando incapacidades...</p>
        </div>
      ) : dataFiltrada.length === 0 ? (
        <div className={`text-center py-12 sm:py-16 rounded-xl border-2 border-dashed ${isDark ? "border-gray-700 bg-[#0a1929]" : "border-gray-300 bg-white"}`}>
          <FileText className={`w-12 sm:w-16 h-12 sm:h-16 mx-auto mb-4 ${isDark ? "text-gray-600" : "text-gray-300"}`} />
          <h3 className={`text-lg sm:text-xl font-bold ${isDark ? "text-white" : "text-gray-800"}`}>
            {tabActivo === "pendientes" ? "Sin incapacidades pendientes" : "Sin incapacidades entregadas"}
          </h3>
          <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            {tabActivo === "pendientes"
              ? "No hay formatos pendientes de entrega."
              : "Aún no se han marcado entregas."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {dataFiltrada.map((item) => (
              <motion.div
                key={item.id_incapacidad}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className={`group relative p-4 sm:p-6 rounded-2xl border transition-all hover:shadow-xl ${isDark
                    ? "bg-[#0a1929] border-[#0f83b2]/20 hover:border-green-500/40"
                    : "bg-white border-gray-100 hover:border-green-200 hover:shadow-green-500/5"
                  }`}
              >
                <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
                  {/* Info Paciente */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {tabActivo === "pendientes" ? (
                        <span className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                          isDark ? "bg-amber-500/20 text-amber-300" : "bg-amber-50 text-amber-700"
                        }`}>
                          Pendiente
                        </span>
                      ) : (
                        <span className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                          isDark ? "bg-green-500/20 text-green-300" : "bg-green-50 text-green-700"
                        }`}>
                          Entregada
                        </span>
                      )}
                      <span className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${item.departamento
                          ? isDark ? "bg-[#0f83b2]/20 text-[#0db1ec]" : "bg-blue-50 text-blue-700"
                          : isDark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-500"
                        }`}>
                        {item.departamento || "Sin Depto"}
                      </span>
                      <span className={`text-xs font-medium ml-auto ${isDark ? "text-gray-400" : "text-gray-400"}`}>
                        {tabActivo === "entregadas" && item.fecha_entrega
                          ? `Entregado: ${new Date(item.fecha_entrega).toLocaleDateString()}`
                          : `Autorizado: ${item.fecha_autorizacion ? new Date(item.fecha_autorizacion).toLocaleDateString() : 'N/A'}`
                        }
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className={`text-base sm:text-lg lg:text-xl font-bold mb-1 leading-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                          {item.nombre_paciente}
                        </h3>
                        <div className={`flex items-center gap-2 text-xs sm:text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                          <User className="w-4 h-4" />
                          <span className="font-mono">Nómina: {item.no_nomina}</span>
                        </div>
                      </div>
                    </div>

                    <div className={`mt-4 p-3 sm:p-4 rounded-xl border ${isDark ? "bg-[#0d2137]/50 border-[#0f83b2]/20" : "bg-gray-50 border-gray-100"}`}>
                      <div className="flex gap-3">
                        <div className={`mt-0.5 shrink-0 p-1.5 rounded-lg ${isDark ? "bg-[#0f83b2]/20 text-[#0db1ec]" : "bg-blue-100/50 text-blue-600"}`}>
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className={`text-xs font-bold uppercase tracking-wider block mb-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                            Diagnóstico
                          </span>
                          <p className={`text-xs sm:text-sm font-medium leading-relaxed ${isDark ? "text-gray-200" : "text-gray-700"}`}>
                            <span className="font-mono font-bold mr-2">{item.codigo_cie}</span>
                            {item.diagnostico}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info Días y Botón Imprimir */}
                  <div className={`flex flex-col gap-4 lg:w-64 xl:w-72 lg:border-l lg:pl-6 xl:pl-8 ${isDark ? "border-[#0f83b2]/20" : "border-gray-100"}`}>
                    <div className={`p-3 sm:p-4 rounded-xl ${isDark ? "bg-[#0d2137]" : "bg-white border border-gray-100 shadow-sm"}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <Calendar className={`w-5 h-5 ${isDark ? "text-green-400" : "text-green-600"}`} />
                        <div>
                          <span className={`text-xs font-bold uppercase tracking-wider block ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                            Días Autorizados
                          </span>
                          <span className={`text-lg sm:text-xl font-bold ${isDark ? "text-green-400" : "text-green-600"}`}>
                            {item.dias_autorizados} Días
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span className={isDark ? "text-gray-500" : "text-gray-400"}>Inicio:</span>
                          <span className={`font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                            {new Date(item.fecha_inicio).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={isDark ? "text-gray-500" : "text-gray-400"}>Fin:</span>
                          <span className={`font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                            {new Date(item.fecha_fin).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Botón - Diferente según el tab */}
                    {tabActivo === "pendientes" ? (
                      <button
                        onClick={() => abrirVistaPrevia(item)}
                        className={`w-full py-3 sm:py-4 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${isDark
                            ? "bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] text-white hover:shadow-blue-500/30 hover:scale-[1.02]"
                            : "bg-gradient-to-r from-[#0f83b2] to-[#0a7aa0] text-white hover:shadow-blue-500/20 hover:scale-[1.02]"
                          }`}
                      >
                        <Printer className="w-5 h-5" />
                        <span>Imprimir Formato</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => generarPDF(item)}
                        className={`w-full py-3 sm:py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border ${isDark
                            ? "bg-[#0d1f2d] text-[#0db1ec] border-[#0f83b2]/30 hover:bg-[#0f83b2]/20"
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                          }`}
                      >
                        <Printer className="w-5 h-5" />
                        <span>Reimprimir</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal Vista Previa */}
      <ModalVistaPrevia
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedItem(null);
        }}
        data={selectedItem}
        onImprimir={handleImprimir}
        onMarcarEntregada={handleMarcarEntregada}
        isDark={isDark}
        loading={procesando}
      />
    </div>
  );
}
