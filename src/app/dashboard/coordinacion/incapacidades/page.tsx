"use client";

import { useState, useEffect, useMemo } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "@/context/NotificationsContext";
import {
  FileText, Search, CheckCircle, XCircle, Calendar, User, Printer,
  Clock, Ban, ClipboardCheck, Stethoscope, ChevronDown, ChevronUp,
  BadgeInfo, RefreshCcw
} from "lucide-react";
import { generarIncapacidadPDF } from "@/lib/generar-incapacidad-pdf";
import ModalDecision from "@/components/catalogos/incapacidades/ModalDecision";
import AppToast, { useToast } from "@/components/ui/AppToast";
import Paginacion from "@/components/ui/Paginacion";

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

type Tab = "PENDIENTE" | "AUTORIZADA" | "RECHAZADA";

const TAB_CONFIG: Record<Tab, { label: string; icon: React.ElementType; color: string; activeClass: string }> = {
  PENDIENTE:  { label: "Pendientes",  icon: Clock,         color: "blue",  activeClass: "bg-[#0f83b2] text-white shadow-lg shadow-blue-900/20" },
  AUTORIZADA: { label: "Autorizadas", icon: CheckCircle,   color: "green", activeClass: "bg-green-600 text-white shadow-lg shadow-green-900/20" },
  RECHAZADA:  { label: "Rechazadas",  icon: Ban,           color: "red",   activeClass: "bg-red-600 text-white shadow-lg shadow-red-900/20" },
};

export default function AutorizarIncapacidadesPage() {
  const { theme } = useTheme();
  const [mounted, setMounted]     = useState(false);
  const [loading, setLoading]     = useState(true);
  const [data, setData]           = useState<Incapacidad[]>([]);
  const [filtro, setFiltro]       = useState("");
  const [pagina, setPagina]       = useState(1);
  const [tabActual, setTabActual] = useState<Tab>("PENDIENTE");
  const [expandidos, setExpandidos] = useState<Record<number, boolean>>({});
  const { toast, showToast, clearToast } = useToast();

  const [modalOpen, setModalOpen]             = useState(false);
  const [modalTipo, setModalTipo]             = useState<"AUTORIZAR" | "RECHAZAR">("AUTORIZAR");
  const [itemSeleccionado, setItemSeleccionado] = useState<any>(null);
  const [nuevoRegistroId, setNuevoRegistroId] = useState<number | null>(null);

  const { notificaciones } = useNotifications();

  // ── Notificaciones en tiempo real ──────────────────────────────────────
  useEffect(() => {
    if (notificaciones.length > 0) {
      const ultima = notificaciones[0];
      const diff   = Date.now() - new Date(ultima.fecha).getTime();
      if (diff < 5000 && ultima.tipo === "incapacidad" && tabActual === "PENDIENTE") {
        cargarDatos();
      }
    }
  }, [notificaciones]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted) cargarDatos();
  }, [mounted, tabActual]);

  // ── Carga de datos ─────────────────────────────────────────────────────
  const cargarDatos = async () => {
    setLoading(true);
    try {
      const primerIdAnterior = data.length > 0 ? data[0].id_incapacidad : null;
      const res      = await fetch(`/api/incapacidades/listado?estatus=${tabActual}`);
      const respuesta = await res.json();
      if (respuesta.success) {
        setData(respuesta.data);
        // Expandir todas las consultas por defecto
        const ids: Record<number, boolean> = {};
        (respuesta.data as Incapacidad[]).forEach(i => { ids[i.id_consulta] = true; });
        setExpandidos(ids);

        if (respuesta.data.length > 0 && respuesta.data[0].id_incapacidad !== primerIdAnterior) {
          setNuevoRegistroId(respuesta.data[0].id_incapacidad);
          setTimeout(() => setNuevoRegistroId(null), 3000);
        }
      }
    } catch (e) {
      console.error("Error cargando datos:", e);
    } finally {
      setLoading(false);
    }
  };

  // ── Agrupación por consulta ────────────────────────────────────────────
  const dataFiltrada = useMemo(() => {
    const q = filtro.toLowerCase();
    return data.filter(p =>
      p.nombre_paciente.toLowerCase().includes(q) ||
      p.no_nomina?.toLowerCase().includes(q) ||
      p.folio_consulta.toLowerCase().includes(q) ||
      p.nombre_doctor?.toLowerCase().includes(q)
    );
  }, [data, filtro]);

  const grupos = useMemo(() => {
    const map: Record<number, {
      id_consulta: number;
      folio: string;
      paciente: string;
      nomina: string;
      depto: string;
      medico: string;
      fecha: string;
      incapacidades: Incapacidad[];
    }> = {};

    dataFiltrada.forEach(inc => {
      if (!map[inc.id_consulta]) {
        map[inc.id_consulta] = {
          id_consulta:  inc.id_consulta,
          folio:        inc.folio_consulta,
          paciente:     inc.nombre_paciente,
          nomina:       inc.no_nomina,
          depto:        inc.departamento,
          medico:       inc.nombre_doctor || "—",
          fecha:        inc.fecha_solicitud,
          incapacidades: [],
        };
      }
      map[inc.id_consulta].incapacidades.push(inc);
    });

    return Object.values(map);
  }, [dataFiltrada]);

  const PAGE_SIZE = 12;
  const gruposPaginados = useMemo(() =>
    grupos.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE),
    [grupos, pagina]
  );

  // Reset página al cambiar filtro o tab
  useEffect(() => { setPagina(1); }, [filtro, tabActual]);

  const toggleExpandir = (id: number) =>
    setExpandidos(prev => ({ ...prev, [id]: !prev[id] }));

  // ── Acciones ───────────────────────────────────────────────────────────
  const abrirModal = (item: Incapacidad, tipo: "AUTORIZAR" | "RECHAZAR") => {
    setItemSeleccionado(item);
    setModalTipo(tipo);
    setModalOpen(true);
  };

  const procesarDecision = async (datos: any) => {
    try {
      const res       = await fetch("/api/incapacidades/decidir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      const respuesta = await res.json();
      if (respuesta.success) {
        showToast('success', modalTipo === "AUTORIZAR" ? "Incapacidad autorizada correctamente" : "Incapacidad rechazada");
        setModalOpen(false);
        cargarDatos();
      } else {
        showToast('error', "Error: " + respuesta.error);
      }
    } catch { showToast('error', "Error de conexión"); }
  };

  const generarPDF = async (item: Incapacidad) => {
    try {
      const pdfBytes = await generarIncapacidadPDF({
        id_incapacidad:    item.id_incapacidad,
        folio_consulta:    item.folio_consulta,
        no_nomina:         item.no_nomina,
        nombre_paciente:   item.nombre_paciente,
        departamento:      item.departamento,
        diagnostico:       `${item.codigo_cie} - ${item.diagnostico}`,
        dias_autorizados:  item.dias_autorizados || 0,
        fecha_inicio:      item.fecha_inicio,
        fecha_fin:         item.fecha_fin,
        nombre_doctor:     item.nombre_doctor || "Dr. Desconocido",
        fecha_autorizacion: item.fecha_autorizacion || new Date().toISOString(),
        nombre_autorizador: item.nombre_autorizador,
      });
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      const url  = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Incapacidad_${item.no_nomina}_${item.id_incapacidad}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch { showToast('error', "Error al generar el PDF"); }
  };

  const isDark = mounted && theme === "dark";
  if (!mounted) return null;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen p-4 sm:p-6 ${isDark ? "bg-[#0d2137]" : "bg-gray-50"}`}>

      {/* Header */}
      <div className={`rounded-2xl shadow-lg p-4 sm:p-6 mb-6 transition-all relative overflow-hidden
        ${isDark ? "bg-gradient-to-r from-[#0a1929] to-[#0d2137] border border-[#0f83b2]/20" : "bg-white border border-gray-200"}`}>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Título */}
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/20 shrink-0">
              <ClipboardCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                Autorizar Incapacidades
              </h1>
              <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Incapacidades agrupadas por consulta de origen
              </p>
            </div>
          </div>

          {/* Contador + Refresh */}
          <div className="flex items-center gap-2">
            {!loading && grupos.length > 0 && tabActual === "PENDIENTE" && (
              <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 text-sm font-semibold
                ${isDark ? "bg-[#0a1929] border-green-500/30 text-green-300" : "bg-green-50 border-green-200 text-green-700"}`}>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                </span>
                {dataFiltrada.length} pendiente(s)
              </div>
            )}
            <button
              onClick={cargarDatos}
              className={`p-2 rounded-xl border transition-colors
                ${isDark ? "border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800"
                         : "border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-100"}`}
              title="Actualizar"
            >
              <RefreshCcw size={16} />
            </button>
          </div>
        </div>

        {/* Tabs + Búsqueda */}
        <div className="mt-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-t border-dashed border-gray-200 dark:border-gray-700/50 pt-4">
          {/* Tabs */}
          <div className={`p-1 rounded-xl border flex gap-1
            ${isDark ? "bg-[#050b14]/50 border-gray-800" : "bg-gray-100/80 border-gray-200"}`}>
            {(Object.entries(TAB_CONFIG) as [Tab, typeof TAB_CONFIG[Tab]][]).map(([key, cfg]) => {
              const Icon    = cfg.icon;
              const active  = tabActual === key;
              return (
                <button
                  key={key}
                  onClick={() => setTabActual(key)}
                  className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all
                    ${active ? cfg.activeClass
                             : isDark ? "text-gray-400 hover:text-white hover:bg-white/5"
                                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"}`}
                >
                  <Icon className="w-4 h-4" />
                  {cfg.label}
                </button>
              );
            })}
          </div>

          {/* Búsqueda */}
          <div className="relative w-full xl:w-80">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
            <input
              type="text"
              placeholder="Buscar por nombre, nómina o folio..."
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all
                ${isDark ? "bg-[#0d1f2d] border-[#0f83b2]/20 text-white placeholder-gray-600 focus:border-[#0f83b2]"
                         : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#0f83b2]"}`}
            />
          </div>
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className={`animate-spin rounded-full h-10 w-10 border-b-2 mb-3 ${isDark ? "border-[#0db1ec]" : "border-[#0f83b2]"}`} />
          <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>Cargando...</p>
        </div>
      ) : grupos.length === 0 ? (
        <div className={`text-center py-16 rounded-2xl border-2 border-dashed
          ${isDark ? "border-gray-700 bg-[#0a1929]" : "border-gray-300 bg-white"}`}>
          <FileText className={`w-14 h-14 mx-auto mb-3 ${isDark ? "text-gray-600" : "text-gray-300"}`} />
          <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-800"}`}>Sin registros</h3>
          <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            No hay incapacidades {tabActual === "PENDIENTE" ? "pendientes" : tabActual === "AUTORIZADA" ? "autorizadas" : "rechazadas"}.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {gruposPaginados.map((grupo, idx) => {
              const abierto = expandidos[grupo.id_consulta] ?? true;

              return (
                <motion.div
                  key={grupo.id_consulta}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ delay: idx * 0.04, duration: 0.3 }}
                  className={`rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-shadow
                    ${isDark ? "bg-[#0a1929] border-[#0f83b2]/20" : "bg-white border-gray-200"}`}
                >
                  {/* ── Cabecera de consulta ──────────────────────────── */}
                  <button
                    onClick={() => toggleExpandir(grupo.id_consulta)}
                    className={`w-full text-left px-5 py-4 flex items-center justify-between gap-3 transition-colors
                      ${isDark ? "bg-[#0d2137] hover:bg-[#0f2847] border-b border-[#0f83b2]/20"
                               : "bg-green-50 hover:bg-green-100 border-b border-green-100"}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Ícono */}
                      <div className={`shrink-0 p-2 rounded-xl
                        ${isDark ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-600"}`}>
                        <Stethoscope size={18} />
                      </div>

                      {/* Info paciente */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-bold text-base truncate ${isDark ? "text-white" : "text-gray-900"}`}>
                            {grupo.paciente}
                          </span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                            ${isDark ? "bg-gray-700 text-gray-300" : "bg-white text-gray-500 border border-gray-200"}`}>
                            {grupo.folio}
                          </span>
                        </div>
                        <div className={`flex items-center gap-3 text-xs mt-0.5 flex-wrap
                          ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                          <span className="flex items-center gap-1"><User size={11} /> {grupo.nomina}</span>
                          <span className="flex items-center gap-1"><BadgeInfo size={11} /> {grupo.depto}</span>
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            {new Date(grupo.fecha).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Badge cantidad */}
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5
                        ${isDark ? "bg-green-900/30 text-green-300" : "bg-green-100 text-green-700"}`}>
                        <FileText size={12} />
                        {grupo.incapacidades.length} {grupo.incapacidades.length === 1 ? "incapacidad" : "incapacidades"}
                      </span>
                      {abierto ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                  </button>

                  {/* ── Cuerpo: lista de incapacidades ────────────────── */}
                  <AnimatePresence initial={false}>
                    {abierto && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        {/* Médico solicitante */}
                        <div className={`px-5 pt-3 pb-1 text-xs font-medium
                          ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                          Solicitado por&nbsp;
                          <span className={`font-bold ${isDark ? "text-green-300" : "text-green-700"}`}>
                            Dr. {grupo.medico}
                          </span>
                        </div>

                        {/* Incapacidades */}
                        <div className="px-5 pb-2 space-y-3">
                          {grupo.incapacidades.map(item => {
                            const esNuevo = item.id_incapacidad === nuevoRegistroId;
                            return (
                              <div
                                key={item.id_incapacidad}
                                className={`rounded-xl border transition-all
                                  ${isDark ? "border-gray-700 bg-black/10" : "border-gray-100 bg-gray-50"}
                                  ${esNuevo ? "ring-2 ring-[#0f83b2]" : ""}`}
                              >
                                <div className="p-4 flex flex-col sm:flex-row gap-4">
                                  {/* Diagnóstico + motivo */}
                                  <div className="flex-1 min-w-0">
                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold mb-3
                                      ${tabActual === "PENDIENTE"
                                        ? isDark ? "bg-blue-900/30 text-blue-300"  : "bg-blue-50 text-blue-700"
                                        : tabActual === "AUTORIZADA"
                                        ? isDark ? "bg-green-900/30 text-green-300" : "bg-green-50 text-green-700"
                                        : isDark ? "bg-red-900/30 text-red-300"    : "bg-red-50 text-red-600"}`}>
                                      {tabActual === "PENDIENTE"  ? <Clock size={11} />        : null}
                                      {tabActual === "AUTORIZADA" ? <CheckCircle size={11} />  : null}
                                      {tabActual === "RECHAZADA"  ? <XCircle size={11} />      : null}
                                      {tabActual}
                                    </div>

                                    {/* Diagnóstico */}
                                    <div className={`p-3 rounded-lg border mb-3
                                      ${isDark ? "bg-[#0d2137]/50 border-[#0f83b2]/10" : "bg-white border-gray-200"}`}>
                                      <p className={`text-[11px] font-bold uppercase tracking-wider mb-1
                                        ${isDark ? "text-gray-500" : "text-gray-400"}`}>Diagnóstico</p>
                                      <p className={`text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-700"}`}>
                                        <span className="font-mono font-bold mr-1.5">{item.codigo_cie}</span>
                                        {item.diagnostico}
                                      </p>
                                    </div>

                                    {/* Motivo médico */}
                                    {item.motivo_medico && (
                                      <p className={`text-xs italic ${isDark ? "text-blue-300" : "text-blue-600"}`}>
                                        "{item.motivo_medico}"
                                      </p>
                                    )}

                                    {/* Motivo rechazo */}
                                    {tabActual === "RECHAZADA" && item.motivo_rechazo && (
                                      <div className={`mt-2 pt-2 border-t border-dashed text-xs
                                        ${isDark ? "border-red-500/30 text-red-300" : "border-red-200 text-red-600"}`}>
                                        <span className="font-bold uppercase tracking-wider">Motivo rechazo: </span>
                                        <span className="italic">"{item.motivo_rechazo}"</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Días y fechas + acciones */}
                                  <div className={`flex flex-col gap-3 sm:w-52 sm:border-l sm:pl-4
                                    ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                                    {/* Días */}
                                    <div className={`p-3 rounded-xl text-center
                                      ${isDark ? "bg-[#0d2137]" : "bg-white border border-gray-100 shadow-sm"}`}>
                                      <p className={`text-[11px] font-bold uppercase tracking-wider mb-1
                                        ${isDark ? "text-gray-500" : "text-gray-400"}`}>Días</p>
                                      <p className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                                        {tabActual === "AUTORIZADA" ? item.dias_autorizados : item.dias_sugeridos}
                                      </p>
                                      <p className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                                        {new Date(item.fecha_inicio).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
                                        {" → "}
                                        {new Date(item.fecha_fin).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                                      </p>
                                    </div>

                                    {/* Botones */}
                                    {tabActual === "PENDIENTE" && (
                                      <div className="grid grid-cols-2 gap-2">
                                        <button
                                          onClick={() => abrirModal(item, "RECHAZAR")}
                                          className={`py-2 rounded-xl font-bold text-xs transition-all
                                            ${isDark ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                                     : "bg-red-50 text-red-600 hover:bg-red-100"}`}
                                        >
                                          Rechazar
                                        </button>
                                        <button
                                          onClick={() => abrirModal(item, "AUTORIZAR")}
                                          className="py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-green-500 to-green-600 text-white hover:to-green-500 shadow shadow-green-500/20 transition-all"
                                        >
                                          Autorizar
                                        </button>
                                      </div>
                                    )}

                                    {tabActual === "AUTORIZADA" && (
                                      <button
                                        onClick={() => generarPDF(item)}
                                        className={`w-full py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all
                                          ${isDark ? "bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] text-white"
                                                   : "bg-gradient-to-r from-[#0f83b2] to-[#0a7aa0] text-white"}`}
                                      >
                                        <Printer className="w-3.5 h-3.5" /> Imprimir
                                      </button>
                                    )}

                                    {tabActual === "RECHAZADA" && (
                                      <span className={`text-xs text-center italic ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                                        Solicitud cerrada
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Padding inferior */}
                        <div className="pb-2" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>

          <Paginacion
            total={grupos.length}
            porPagina={PAGE_SIZE}
            pagina={pagina}
            onChange={setPagina}
            isDark={isDark}
            label="consultas"
          />
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

      <AppToast toast={toast} isDark={isDark} onClose={clearToast} />
    </div>
  );
}
