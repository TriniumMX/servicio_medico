'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardCheck, CheckCircle, XCircle, FileText, User, Calendar,
  ChevronDown, ChevronUp, Clock, History, FlaskConical, Stethoscope,
  BadgeInfo, RefreshCcw, ClipboardList, Search, UserCheck,
} from 'lucide-react';
import SignatureModal from '@/components/coordinacion/SignatureModal';
import ModalAutorizarOrden from '@/components/coordinacion/ModalAutorizarOrden';
import ModalRechazarOrden from '@/components/coordinacion/ModalRechazarOrden';
import AppToast, { useToast } from '@/components/ui/AppToast';
import Paginacion from '@/components/ui/Paginacion';

// ── Tipos ────────────────────────────────────────────────────────────────────
interface SolicitudRaw {
  id_solicitud: number;
  id_consulta: number;
  motivo_clinico: string;
  fecha_solicitud: string;
  nombre_estudio: string;
  categoria: string;
  costo: number | null;
  folio_consulta: string;
  paciente_nombre: string;
  no_nomina: string;
  departamento: string;
  medico_solicitante: string;
}

interface EstudioAutorizado {
  id_solicitud: number;
  id_consulta: number;
  motivo_clinico: string;
  fecha_solicitud: string;
  fecha_autorizacion: string | null;
  estatus: 'AUTORIZADO' | 'ENTREGADO';
  nombre_estudio: string;
  categoria: string;
  costo: number | null;
  folio_consulta: string;
  paciente_nombre: string;
  no_nomina: string;
  departamento: string;
  medico_solicitante: string;
  coordinador_nombre: string | null;
}

interface EstudioHistorial {
  id_solicitud: number;
  estatus: string;
  fecha_solicitud: string;
  fecha_autorizacion: string | null;
  nombre_estudio: string;
  categoria: string;
  costo: number | null;
  folio_consulta: string;
  medico_solicitante: string;
}

// ── Constantes ───────────────────────────────────────────────────────────────
const ESTATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  PENDIENTE:  { bg: 'bg-yellow-100 dark:bg-yellow-500/20', text: 'text-yellow-700 dark:text-yellow-400', label: 'Pendiente'  },
  AUTORIZADO: { bg: 'bg-green-100 dark:bg-green-500/20',   text: 'text-green-700 dark:text-green-400',   label: 'Autorizado' },
  RECHAZADO:  { bg: 'bg-red-100 dark:bg-red-500/20',       text: 'text-red-700 dark:text-red-400',       label: 'Rechazado'  },
  ENTREGADO:  { bg: 'bg-blue-100 dark:bg-blue-500/20',     text: 'text-blue-700 dark:text-blue-400',     label: 'Entregado'  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (fecha: string) =>
  new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

const fmtHora = (fecha: string) =>
  new Date(fecha).toLocaleString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

// ── Componente interno (usa useSearchParams) ──────────────────────────────────
function CoordinacionLabInner() {
  const { theme } = useTheme();
  const { user, updateFirmaDigital } = useAuth();
  const searchParams = useSearchParams();
  const isDark = theme === 'dark';

  // Animación de 15s cuando llega desde autorización de seguimiento
  const [destacadoSeguimiento, setDestacadoSeguimiento] = useState(false);
  const [nominaDestacada, setNominaDestacada] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('from') === 'seguimiento') {
      setDestacadoSeguimiento(true);
      setNominaDestacada(searchParams.get('nomina'));
      const t = setTimeout(() => {
        setDestacadoSeguimiento(false);
        setNominaDestacada(null);
      }, 15000);
      return () => clearTimeout(t);
    }
  }, [searchParams]);

  // Tabs
  const [activeTab, setActiveTab] = useState<'pendientes' | 'autorizados'>('pendientes');

  // Pendientes
  const [solicitudes, setSolicitudes]   = useState<SolicitudRaw[]>([]);
  const [loading, setLoading]           = useState(true);
  const [expandidos, setExpandidos]     = useState<Record<number, boolean>>({});

  const [historialAbierto, setHistorialAbierto]   = useState<Record<string, boolean>>({});
  const [historialData, setHistorialData]         = useState<Record<string, EstudioHistorial[]>>({});
  const [historialLoading, setHistorialLoading]   = useState<Record<string, boolean>>({});

  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [pendingAuthIds, setPendingAuthIds]         = useState<number[]>([]);
  const [showConfirmModal, setShowConfirmModal]     = useState(false);
  const [selectedGroup, setSelectedGroup]           = useState<any>(null);
  const [showRejectModal, setShowRejectModal]       = useState(false);
  const [pendingRejectIds, setPendingRejectIds]     = useState<number[]>([]);
  const [motivoRechazo, setMotivoRechazo]           = useState('');
  const { toast, showToast, clearToast }            = useToast();

  // Autorizados
  const [autorizados, setAutorizados]           = useState<EstudioAutorizado[]>([]);
  const [loadingAut, setLoadingAut]             = useState(false);
  const [expandidosAut, setExpandidosAut]       = useState<Record<number, boolean>>({});
  const [busquedaAut, setBusquedaAut]           = useState('');
  const [filtroEstatus, setFiltroEstatus]       = useState<'TODOS' | 'AUTORIZADO' | 'ENTREGADO'>('TODOS');
  const [busquedaPend, setBusquedaPend]         = useState('');
  const [paginaPend, setPaginaPend]             = useState(1);
  const [paginaAut, setPaginaAut]               = useState(1);
  const PAGE_SIZE = 12;

  // ── Fetches ────────────────────────────────────────────────────────────────
  const fetchSolicitudes = async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/coordinacion/laboratorio');
      const data = await res.json();
      if (data.success) {
        setSolicitudes(data.data);
        const ids: Record<number, boolean> = {};
        (data.data as SolicitudRaw[]).forEach(s => { ids[s.id_consulta] = true; });
        setExpandidos(ids);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchAutorizados = async () => {
    setLoadingAut(true);
    try {
      const res  = await fetch('/api/coordinacion/laboratorio/autorizados');
      const data = await res.json();
      if (data.success) setAutorizados(data.data);
    } catch (e) { console.error(e); }
    finally { setLoadingAut(false); }
  };

  // Scroll automático al card destacado cuando los datos ya cargaron
  useEffect(() => {
    if (!loading && nominaDestacada) {
      const el = document.getElementById('card-seguimiento-destacado');
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    }
  }, [loading, nominaDestacada]);

  useEffect(() => { fetchSolicitudes(); }, []);
  useEffect(() => { if (activeTab === 'autorizados') fetchAutorizados(); }, [activeTab]);

  // ── Agrupar pendientes ─────────────────────────────────────────────────────
  const grupos = useMemo(() => {
    const map: Record<number, {
      id_consulta: number; folio: string; paciente: string; nomina: string;
      depto: string; medico: string; fecha: string; estudios: SolicitudRaw[];
    }> = {};
    solicitudes.forEach(sol => {
      if (!map[sol.id_consulta]) {
        map[sol.id_consulta] = {
          id_consulta: sol.id_consulta, folio: sol.folio_consulta,
          paciente: sol.paciente_nombre, nomina: sol.no_nomina,
          depto: sol.departamento, medico: sol.medico_solicitante,
          fecha: sol.fecha_solicitud, estudios: [],
        };
      }
      map[sol.id_consulta].estudios.push(sol);
    });
    return Object.values(map).sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );
  }, [solicitudes]);

  // ── Agrupar autorizados ────────────────────────────────────────────────────
  const gruposAut = useMemo(() => {
    const map: Record<number, {
      id_consulta: number; folio: string; paciente: string; nomina: string;
      depto: string; medico: string; coordinador: string | null;
      fecha_solicitud: string; fecha_autorizacion: string | null;
      estudios: EstudioAutorizado[];
    }> = {};
    autorizados.forEach(est => {
      if (!map[est.id_consulta]) {
        map[est.id_consulta] = {
          id_consulta: est.id_consulta, folio: est.folio_consulta,
          paciente: est.paciente_nombre, nomina: est.no_nomina,
          depto: est.departamento, medico: est.medico_solicitante,
          coordinador: est.coordinador_nombre,
          fecha_solicitud: est.fecha_solicitud,
          fecha_autorizacion: est.fecha_autorizacion,
          estudios: [],
        };
      }
      map[est.id_consulta].estudios.push(est);
    });
    return Object.values(map).sort((a, b) => {
      const fa = a.fecha_autorizacion ?? a.fecha_solicitud;
      const fb = b.fecha_autorizacion ?? b.fecha_solicitud;
      return new Date(fb).getTime() - new Date(fa).getTime();
    });
  }, [autorizados]);

  // Filtrado pendientes
  const gruposFiltradosPend = useMemo(() => {
    const q = busquedaPend.toLowerCase().trim();
    if (!q) return grupos;
    return grupos.filter(g =>
      g.paciente.toLowerCase().includes(q) ||
      g.nomina.toLowerCase().includes(q) ||
      g.medico.toLowerCase().includes(q) ||
      g.depto.toLowerCase().includes(q)
    );
  }, [grupos, busquedaPend]);

  const gruposPaginadosPend = useMemo(() =>
    gruposFiltradosPend.slice((paginaPend - 1) * PAGE_SIZE, paginaPend * PAGE_SIZE),
    [gruposFiltradosPend, paginaPend]
  );

  // Filtrado autorizados
  const gruposAutFiltrados = useMemo(() => {
    const q = busquedaAut.toLowerCase();
    return gruposAut.filter(g => {
      const coincideTexto = !q ||
        g.paciente.toLowerCase().includes(q) ||
        g.nomina.toLowerCase().includes(q) ||
        g.folio.toLowerCase().includes(q) ||
        g.depto.toLowerCase().includes(q);
      const coincideEstatus = filtroEstatus === 'TODOS' ||
        g.estudios.some(e => e.estatus === filtroEstatus);
      return coincideTexto && coincideEstatus;
    });
  }, [gruposAut, busquedaAut, filtroEstatus]);

  const gruposAutPaginados = useMemo(() =>
    gruposAutFiltrados.slice((paginaAut - 1) * PAGE_SIZE, paginaAut * PAGE_SIZE),
    [gruposAutFiltrados, paginaAut]
  );

  // Resets de página
  useEffect(() => { setPaginaPend(1); }, [busquedaPend]);
  useEffect(() => { setPaginaAut(1); }, [busquedaAut, filtroEstatus]);

  // ── Handlers pendientes ────────────────────────────────────────────────────
  const toggleExpandir    = (id: number) => setExpandidos(p => ({ ...p, [id]: !p[id] }));
  const toggleExpandirAut = (id: number) => setExpandidosAut(p => ({ ...p, [id]: !p[id] }));

  const toggleHistorial = async (nomina: string) => {
    const yaAbierto = historialAbierto[nomina];
    setHistorialAbierto(p => ({ ...p, [nomina]: !yaAbierto }));
    if (historialData[nomina] || yaAbierto) return;
    setHistorialLoading(p => ({ ...p, [nomina]: true }));
    try {
      const res  = await fetch(`/api/coordinacion/laboratorio/historial?no_nomina=${encodeURIComponent(nomina)}`);
      const data = await res.json();
      if (data.success) setHistorialData(p => ({ ...p, [nomina]: data.data }));
    } catch (e) { console.error(e); }
    finally { setHistorialLoading(p => ({ ...p, [nomina]: false })); }
  };

  const enviarAutorizacion = async (ids: number[], firma?: string) => {
    if (!user) return;
    try {
      const res  = await fetch('/api/coordinacion/laboratorio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids_solicitudes: ids, accion: 'AUTORIZAR', id_usuario: user.id_usuario, firma_base64: firma }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Orden autorizada correctamente');
        fetchSolicitudes();
        setShowSignatureModal(false);
        setShowConfirmModal(false);
      } else if (data.code === 'NO_SIGNATURE') {
        setShowConfirmModal(false);
        setPendingAuthIds(ids);
        setTimeout(() => setShowSignatureModal(true), 300);
      } else {
        showToast('error', data.error || 'Error al autorizar');
      }
    } catch { showToast('error', 'Error de conexión'); }
  };

  const handleOpenConfirmModal   = (grupo: any) => { setSelectedGroup(grupo); setShowConfirmModal(true); };
  const handleConfirmAutorizacion = () => {
    if (selectedGroup) enviarAutorizacion(selectedGroup.estudios.map((e: any) => e.id_solicitud));
  };

  const handleRechazar = (ids: number[]) => {
    if (!user) return;
    setPendingRejectIds(ids);
    setMotivoRechazo('');
    setShowRejectModal(true);
  };

  const handleSubmitRechazo = async (motivo: string) => {
    if (!user) return;
    try {
      const res  = await fetch('/api/coordinacion/laboratorio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids_solicitudes: pendingRejectIds, accion: 'RECHAZAR', id_usuario: user.id_usuario, motivo_rechazo: motivo }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Orden rechazada');
        setShowRejectModal(false);
        fetchSolicitudes();
      } else {
        showToast('error', data.error || 'Error al rechazar');
      }
    } catch { showToast('error', 'Error de conexión'); }
  };

  const handleFirmaGuardada = (base64: string) => {
    updateFirmaDigital(base64);
    enviarAutorizacion(pendingAuthIds, base64);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">

      {/* ── Banner seguimiento ──────────────────────────────────────────────── */}
      {destacadoSeguimiento && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className={`flex items-center gap-3 px-5 py-3 rounded-xl border font-medium text-sm ${
            isDark
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
              : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}
        >
          <RefreshCcw className="w-4 h-4 shrink-0 animate-spin" style={{ animationDuration: '3s' }} />
          <span>
            Seguimiento autorizado — revisa los estudios de laboratorio solicitados por el especialista.
          </span>
        </motion.div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-[#0f83b2] to-[#0db1ec] rounded-2xl shadow-lg shadow-blue-500/20">
            <ClipboardCheck className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#1a365d]'}`}>
              Autorización de Estudios
            </h1>
            <p className={`text-sm mt-0.5 flex items-center gap-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <Clock size={14} className="text-[#0db1ec]" />
              Estudios agrupados por consulta de origen
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'pendientes' && !loading && grupos.length > 0 && (
            <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 text-sm font-semibold
              ${isDark ? 'bg-[#0a1929] border-blue-500/30 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
              </span>
              {grupos.reduce((t, g) => t + g.estudios.length, 0)} estudio(s) en {grupos.length} consulta(s)
            </div>
          )}
          <button
            onClick={() => activeTab === 'pendientes' ? fetchSolicitudes() : fetchAutorizados()}
            className={`p-2 rounded-xl border transition-colors ${isDark
              ? 'border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800'
              : 'border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
            title="Actualizar"
          >
            <RefreshCcw size={16} />
          </button>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className={`flex gap-1 p-1 rounded-xl w-fit ${isDark ? 'bg-[#0d2137]' : 'bg-gray-100'}`}>
        {([
          { key: 'pendientes', label: 'Pendientes',  icon: ClipboardList,
            badge: grupos.length > 0 ? grupos.reduce((t, g) => t + g.estudios.length, 0) : null },
          { key: 'autorizados', label: 'Autorizados', icon: CheckCircle,
            badge: autorizados.length > 0 ? autorizados.length : null },
        ] as const).map(tab => {
          const Icon    = tab.icon;
          const activo  = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
                ${activo
                  ? isDark
                    ? 'bg-[#0db1ec] text-white shadow'
                    : 'bg-white text-[#0f83b2] shadow'
                  : isDark
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Icon size={15} />
              {tab.label}
              {tab.badge !== null && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                  ${activo
                    ? 'bg-white/20 text-white'
                    : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ══════════════════ PESTAÑA: PENDIENTES ══════════════════ */}
      <AnimatePresence mode="wait">
        {activeTab === 'pendientes' && (
          <motion.div
            key="pendientes"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0db1ec] mb-3" />
                <p className="text-gray-500 text-sm">Cargando solicitudes...</p>
              </div>
            ) : grupos.length === 0 ? (
              <div className={`flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed
                ${isDark ? 'border-gray-800 bg-[#0a1929]/50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="p-5 bg-gray-100 dark:bg-gray-800 rounded-full mb-3">
                  <CheckCircle className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Todo al día</h3>
                <p className="text-gray-500 text-sm mt-1">No hay estudios pendientes de autorización.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Búsqueda pendientes */}
                <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm
                  ${isDark ? 'bg-[#0d2137] border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}>
                  <Search size={15} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                  <input
                    type="text"
                    placeholder="Buscar por paciente, nómina, médico o área..."
                    value={busquedaPend}
                    onChange={e => setBusquedaPend(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-400"
                  />
                  {busquedaPend && (
                    <button onClick={() => setBusquedaPend('')}
                      className={`p-0.5 rounded transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                      <XCircle size={14} />
                    </button>
                  )}
                  <span className={`text-xs font-medium shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {gruposFiltradosPend.length} / {grupos.length}
                  </span>
                </div>

                {gruposFiltradosPend.length === 0 && (
                  <div className={`text-center py-10 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Sin resultados para "{busquedaPend}"
                  </div>
                )}

                {gruposPaginadosPend.map((grupo, idx) => {
                  const abierto     = expandidos[grupo.id_consulta] ?? true;
                  const costoTotal  = grupo.estudios.reduce((s, e) => s + (Number(e.costo) || 0), 0);
                  const esDestacado = destacadoSeguimiento && nominaDestacada === grupo.nomina;

                  return (
                    <motion.div
                      key={grupo.id_consulta}
                      id={esDestacado ? 'card-seguimiento-destacado' : undefined}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`rounded-2xl border overflow-hidden shadow-sm transition-all duration-700 hover:shadow-md
                        ${esDestacado
                          ? isDark
                            ? 'bg-[#0a1929] border-amber-500/50 ring-2 ring-amber-400/40 shadow-amber-500/10'
                            : 'bg-white border-amber-400 ring-2 ring-amber-300/60 shadow-amber-100'
                          : isDark ? 'bg-[#0a1929] border-gray-700' : 'bg-white border-gray-200'}`}
                    >
                      {/* Cabecera */}
                      <button
                        onClick={() => toggleExpandir(grupo.id_consulta)}
                        className={`w-full text-left px-5 py-4 flex items-center justify-between gap-3 transition-colors
                          ${esDestacado
                            ? isDark
                              ? 'bg-amber-500/15 hover:bg-amber-500/20 border-b border-amber-500/30'
                              : 'bg-amber-50 hover:bg-amber-100 border-b border-amber-200'
                            : isDark
                              ? 'bg-[#0d2137] hover:bg-[#0f2847] border-b border-gray-700'
                              : 'bg-blue-50 hover:bg-blue-100 border-b border-blue-100'}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`shrink-0 p-2 rounded-xl
                            ${isDark ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                            <Stethoscope size={18} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-bold text-base truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {grupo.paciente}
                              </span>
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                                ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-500 border border-gray-200'}`}>
                                {grupo.folio}
                              </span>
                            </div>
                            <div className={`flex items-center gap-3 text-xs mt-0.5 flex-wrap ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              <span className="flex items-center gap-1"><User size={11} /> {grupo.nomina}</span>
                              <span className="flex items-center gap-1"><BadgeInfo size={11} /> {grupo.depto}</span>
                              <span className="flex items-center gap-1"><Calendar size={11} /> {fmt(grupo.fecha)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5
                            ${isDark ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                            <FlaskConical size={12} />
                            {grupo.estudios.length} {grupo.estudios.length === 1 ? 'estudio' : 'estudios'}
                          </span>
                          {abierto ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                        </div>
                      </button>

                      {/* Cuerpo */}
                      <AnimatePresence initial={false}>
                        {abierto && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pt-4 pb-2">
                              <p className={`text-xs font-medium mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Solicitado por{' '}
                                <span className={`font-bold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Dr. {grupo.medico}</span>
                              </p>

                              <div className={`rounded-xl border divide-y overflow-hidden
                                ${isDark ? 'border-gray-700 divide-gray-700' : 'border-gray-200 divide-gray-100'}`}>
                                {grupo.estudios.map((estudio, i) => (
                                  <div
                                    key={estudio.id_solicitud}
                                    className={`flex items-center gap-3 px-4 py-3 group transition-colors
                                      ${isDark ? 'bg-black/10 hover:bg-black/20' : 'bg-white hover:bg-gray-50'}`}
                                  >
                                    <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                                      ${isDark ? 'bg-purple-900/40 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                                      {i + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <p className={`font-semibold text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                        {estudio.nombre_estudio}
                                      </p>
                                      <div className={`flex items-center gap-3 text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        <span>{estudio.categoria || 'General'}</span>
                                        {estudio.motivo_clinico && (
                                          <span className={`italic ${isDark ? 'text-blue-400' : 'text-blue-500'}`}>
                                            "{estudio.motivo_clinico}"
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    {estudio.costo != null && (
                                      <span className={`text-sm font-bold whitespace-nowrap shrink-0
                                        ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                        ${Number(estudio.costo).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                      </span>
                                    )}
                                    <button
                                      onClick={() => handleRechazar([estudio.id_solicitud])}
                                      className={`shrink-0 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all
                                        ${isDark
                                          ? 'text-gray-500 hover:text-red-400 hover:bg-red-900/20'
                                          : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                                      title="Rechazar este estudio"
                                    >
                                      <XCircle size={16} />
                                    </button>
                                  </div>
                                ))}
                              </div>

                              {costoTotal > 0 && (
                                <div className={`flex justify-end items-center gap-2 mt-2 px-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                  Total:
                                  <span className={`font-bold text-base ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                    ${costoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Historial */}
                            <div className="px-5 pb-3">
                              <button
                                onClick={() => toggleHistorial(grupo.nomina)}
                                className={`w-full flex items-center justify-between gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors border
                                  ${isDark
                                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20'
                                    : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'}`}
                              >
                                <span className="flex items-center gap-1.5"><History size={13} /> Historial de estudios (últimos 30 días)</span>
                                {historialAbierto[grupo.nomina] ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                              </button>

                              <AnimatePresence>
                                {historialAbierto[grupo.nomina] && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className={`mt-2 rounded-xl border overflow-hidden ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                                  >
                                    {historialLoading[grupo.nomina] ? (
                                      <div className="flex items-center justify-center py-5 gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-500" />
                                        <span className="text-xs text-gray-500">Cargando historial...</span>
                                      </div>
                                    ) : !historialData[grupo.nomina] || historialData[grupo.nomina].length === 0 ? (
                                      <div className={`p-3 text-center text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        No se encontraron estudios previos en los últimos 30 días.
                                      </div>
                                    ) : (
                                      <div className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-100'}`}>
                                        {historialData[grupo.nomina].map(est => {
                                          const s = ESTATUS_COLORS[est.estatus] ?? ESTATUS_COLORS.PENDIENTE;
                                          return (
                                            <div key={est.id_solicitud}
                                              className={`px-4 py-2 flex items-center justify-between gap-3 text-xs ${isDark ? 'bg-[#0f1d2e]' : 'bg-white'}`}>
                                              <div className="flex-1 min-w-0">
                                                <p className={`font-medium truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{est.nombre_estudio}</p>
                                                <p className="text-gray-500 mt-0.5">
                                                  {fmt(est.fecha_solicitud)}
                                                  {est.folio_consulta && <> · Folio: {est.folio_consulta}</>}
                                                </p>
                                              </div>
                                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${s.bg} ${s.text}`}>
                                                {s.label}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            {/* Acciones */}
                            <div className={`px-5 py-3 flex justify-between items-center gap-3 border-t
                              ${isDark ? 'border-gray-700 bg-[#060f1a]' : 'border-gray-100 bg-gray-50'}`}>
                              <button
                                onClick={() => handleRechazar(grupo.estudios.map(e => e.id_solicitud))}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors flex items-center gap-2
                                  ${isDark
                                    ? 'border-red-500/30 text-red-400 hover:bg-red-900/20'
                                    : 'border-red-200 text-red-600 hover:bg-red-50'}`}
                              >
                                <XCircle size={16} /> Rechazar orden
                              </button>
                              <button
                                onClick={() => handleOpenConfirmModal(grupo)}
                                className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700
                                  text-white font-bold rounded-xl shadow shadow-green-500/20 transition-all flex items-center gap-2 text-sm"
                              >
                                <CheckCircle size={16} />
                                Autorizar {grupo.estudios.length === 1 ? 'estudio' : `${grupo.estudios.length} estudios`}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}

                <Paginacion
                  total={gruposFiltradosPend.length}
                  porPagina={PAGE_SIZE}
                  pagina={paginaPend}
                  onChange={setPaginaPend}
                  isDark={isDark}
                  label="consultas"
                />
              </div>
            )}
          </motion.div>
        )}

        {/* ══════════════════ PESTAÑA: AUTORIZADOS ══════════════════ */}
        {activeTab === 'autorizados' && (
          <motion.div
            key="autorizados"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-4"
          >
            {/* Barra de filtros */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Búsqueda */}
              <div className={`flex items-center gap-2 flex-1 px-3 py-2 rounded-xl border text-sm
                ${isDark
                  ? 'bg-[#0d2137] border-gray-700 text-gray-300'
                  : 'bg-white border-gray-200 text-gray-700'}`}>
                <Search size={15} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                <input
                  type="text"
                  placeholder="Buscar por paciente, nómina, folio o departamento..."
                  value={busquedaAut}
                  onChange={e => setBusquedaAut(e.target.value)}
                  className="flex-1 bg-transparent outline-none placeholder:text-gray-400"
                />
                {busquedaAut && (
                  <button onClick={() => setBusquedaAut('')}
                    className={`p-0.5 rounded transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                    <XCircle size={14} />
                  </button>
                )}
              </div>

              {/* Filtro estatus */}
              <div className={`flex gap-1 p-1 rounded-xl ${isDark ? 'bg-[#0d2137]' : 'bg-gray-100'}`}>
                {(['TODOS', 'AUTORIZADO', 'ENTREGADO'] as const).map(opt => (
                  <button
                    key={opt}
                    onClick={() => setFiltroEstatus(opt)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                      ${filtroEstatus === opt
                        ? opt === 'AUTORIZADO'
                          ? 'bg-green-500 text-white shadow'
                          : opt === 'ENTREGADO'
                            ? 'bg-blue-500 text-white shadow'
                            : isDark ? 'bg-[#0db1ec] text-white shadow' : 'bg-white text-[#0f83b2] shadow'
                        : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {opt === 'TODOS' ? 'Todos' : opt === 'AUTORIZADO' ? 'Autorizados' : 'Entregados'}
                  </button>
                ))}
              </div>
            </div>

            {/* Contenido */}
            {loadingAut ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mb-3" />
                <p className="text-gray-500 text-sm">Cargando estudios autorizados...</p>
              </div>
            ) : gruposAutFiltrados.length === 0 ? (
              <div className={`flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed
                ${isDark ? 'border-gray-800 bg-[#0a1929]/50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="p-5 bg-gray-100 dark:bg-gray-800 rounded-full mb-3">
                  <FlaskConical className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {busquedaAut || filtroEstatus !== 'TODOS' ? 'Sin resultados' : 'Sin estudios autorizados'}
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  {busquedaAut || filtroEstatus !== 'TODOS'
                    ? 'Ajusta los filtros de búsqueda.'
                    : 'No hay estudios autorizados en los últimos 60 días.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Contador */}
                <p className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {gruposAutFiltrados.length} consulta(s) ·{' '}
                  {gruposAutFiltrados.reduce((t, g) => t + g.estudios.length, 0)} estudio(s)
                </p>

                {gruposAutPaginados.map((grupo, idx) => {
                  const abierto    = expandidosAut[grupo.id_consulta] ?? false;
                  const costoTotal = grupo.estudios.reduce((s, e) => s + (Number(e.costo) || 0), 0);
                  const tieneEntregados = grupo.estudios.some(e => e.estatus === 'ENTREGADO');
                  const todosEntregados = grupo.estudios.every(e => e.estatus === 'ENTREGADO');

                  return (
                    <motion.div
                      key={grupo.id_consulta}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className={`rounded-2xl border overflow-hidden shadow-sm transition-shadow hover:shadow-md
                        ${isDark ? 'bg-[#0a1929] border-gray-700' : 'bg-white border-gray-200'}`}
                    >
                      {/* Cabecera */}
                      <button
                        onClick={() => toggleExpandirAut(grupo.id_consulta)}
                        className={`w-full text-left px-5 py-4 flex items-center justify-between gap-3 transition-colors
                          ${isDark
                            ? 'bg-[#0d2137] hover:bg-[#0f2847] border-b border-gray-700'
                            : 'bg-emerald-50 hover:bg-emerald-100 border-b border-emerald-100'}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`shrink-0 p-2 rounded-xl
                            ${todosEntregados
                              ? isDark ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-100 text-blue-600'
                              : isDark ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                            {todosEntregados ? <FileText size={18} /> : <CheckCircle size={18} />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-bold text-base truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {grupo.paciente}
                              </span>
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                                ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-500 border border-gray-200'}`}>
                                {grupo.folio}
                              </span>
                              {/* Badge global */}
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                                ${todosEntregados
                                  ? isDark ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700'
                                  : isDark ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                                {todosEntregados ? 'Entregado' : tieneEntregados ? 'Parcial' : 'Autorizado'}
                              </span>
                            </div>
                            <div className={`flex items-center gap-3 text-xs mt-0.5 flex-wrap ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              <span className="flex items-center gap-1"><User size={11} /> {grupo.nomina}</span>
                              <span className="flex items-center gap-1"><BadgeInfo size={11} /> {grupo.depto}</span>
                              {grupo.fecha_autorizacion && (
                                <span className="flex items-center gap-1">
                                  <CheckCircle size={11} className="text-emerald-500" />
                                  {fmtHora(grupo.fecha_autorizacion)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5
                            ${isDark ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                            <FlaskConical size={12} />
                            {grupo.estudios.length} {grupo.estudios.length === 1 ? 'estudio' : 'estudios'}
                          </span>
                          {abierto ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                        </div>
                      </button>

                      {/* Cuerpo colapsable */}
                      <AnimatePresence initial={false}>
                        {abierto && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pt-4 pb-5 space-y-4">

                              {/* Meta info */}
                              <div className={`grid grid-cols-2 gap-3 p-3 rounded-xl border text-xs
                                ${isDark ? 'bg-[#0d2137] border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                                <div>
                                  <p className={`font-semibold mb-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Médico solicitante</p>
                                  <p className={`font-bold flex items-center gap-1 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                                    <Stethoscope size={12} /> Dr. {grupo.medico}
                                  </p>
                                </div>
                                {grupo.coordinador && (
                                  <div>
                                    <p className={`font-semibold mb-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Autorizado por</p>
                                    <p className={`font-bold flex items-center gap-1 ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                                      <UserCheck size={12} /> {grupo.coordinador}
                                    </p>
                                  </div>
                                )}
                                <div>
                                  <p className={`font-semibold mb-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Fecha solicitud</p>
                                  <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>{fmt(grupo.fecha_solicitud)}</p>
                                </div>
                                {grupo.fecha_autorizacion && (
                                  <div>
                                    <p className={`font-semibold mb-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Fecha autorización</p>
                                    <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>{fmtHora(grupo.fecha_autorizacion)}</p>
                                  </div>
                                )}
                              </div>

                              {/* Lista estudios */}
                              <div className={`rounded-xl border divide-y overflow-hidden
                                ${isDark ? 'border-gray-700 divide-gray-700' : 'border-gray-200 divide-gray-100'}`}>
                                {grupo.estudios.map((estudio, i) => {
                                  const sc = ESTATUS_COLORS[estudio.estatus];
                                  return (
                                    <div
                                      key={estudio.id_solicitud}
                                      className={`flex items-center gap-3 px-4 py-3 transition-colors
                                        ${isDark ? 'bg-black/10 hover:bg-black/20' : 'bg-white hover:bg-gray-50'}`}
                                    >
                                      <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                                        ${isDark ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                                        {i + 1}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <p className={`font-semibold text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                          {estudio.nombre_estudio}
                                        </p>
                                        <div className={`flex items-center gap-3 text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                          <span>{estudio.categoria || 'General'}</span>
                                          {estudio.motivo_clinico && (
                                            <span className={`italic ${isDark ? 'text-blue-400' : 'text-blue-500'}`}>
                                              "{estudio.motivo_clinico}"
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        {estudio.costo != null && (
                                          <span className={`text-sm font-bold whitespace-nowrap
                                            ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                            ${Number(estudio.costo).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                          </span>
                                        )}
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${sc.bg} ${sc.text}`}>
                                          {sc.label}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}

                                {/* Total */}
                                {costoTotal > 0 && (
                                  <div className={`px-4 py-2.5 flex justify-between items-center font-bold text-sm
                                    ${isDark ? 'bg-[#0d2137]' : 'bg-gray-50'}`}>
                                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Total autorizado</span>
                                    <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>
                                      ${costoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}

                <Paginacion
                  total={gruposAutFiltrados.length}
                  porPagina={PAGE_SIZE}
                  pagina={paginaAut}
                  onChange={setPaginaAut}
                  isDark={isDark}
                  label="consultas"
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modales ─────────────────────────────────────────────────────────── */}
      <SignatureModal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        onSave={handleFirmaGuardada}
        isDark={isDark}
      />
      <ModalAutorizarOrden
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmAutorizacion}
        grupo={selectedGroup}
        firmaBase64={user?.firma_digital}
        doctorName={user?.nombre || ''}
        isDark={isDark}
      />
      <ModalRechazarOrden
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleSubmitRechazo}
        cantidadEstudios={pendingRejectIds.length}
        isDark={isDark}
        motivo={motivoRechazo}
        onMotivoChange={setMotivoRechazo}
      />

      <AppToast toast={toast} isDark={isDark} onClose={clearToast} />
    </div>
  );
}

export default function CoordinacionLabPage() {
  return (
    <Suspense>
      <CoordinacionLabInner />
    </Suspense>
  );
}
