'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, FileText, Activity, Pill, AlertCircle,
    Thermometer, Heart, User, CheckCircle, Clock,
    ChevronDown, Stethoscope, FlaskConical, Weight,
    Droplets, XCircle, Hash, TrendingUp, Link2, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';

// ─── Interfaces ───────────────────────────────────────────────
interface HistorialItem {
    idConsulta: number;
    folio: string;
    fechaConsulta: string;
    nombre: string;
    edad: number;
    sexo: string;
    departamento: string;
    noNomina: string;
    motivoConsulta: string;
    subjetivo: string;
    objetivo: string;
    analisis: string;
    plan: string;
    idReferenciaOrigen: number | null;
    temperaturaC: number;
    taSistolica: number;
    taDiastolica: number;
    frecuenciaCardiaca: number;
    oxigenacion: number;
    pesoKg: number;
    alturaCm: number;
    glucosaMgDl: number;
    diagnosticos: any[];
    medicamentos: any[];
    referencias: any[];
    incapacidades: any[];
    estudiosLaboratorio: any[];
    tieneReceta: boolean;
    tieneIncapacidad: boolean;
    tieneReferencia: boolean;
    tieneLaboratorio: boolean;
}

// ─── StatusBadge ──────────────────────────────────────────────
const statusConfig: Record<string, { bg: string; dot: string }> = {
    PENDIENTE: { bg: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-800', dot: 'bg-amber-500' },
    PENDIENTE_ASIGNAR: { bg: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-800', dot: 'bg-amber-500' },
    ASIGNADA: { bg: 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:ring-sky-800', dot: 'bg-sky-500' },
    AUTORIZADO: { bg: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-800', dot: 'bg-emerald-500' },
    AUTORIZADA: { bg: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-800', dot: 'bg-emerald-500' },
    NOTIFICADA: { bg: 'bg-cyan-50 text-cyan-700 ring-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:ring-cyan-800', dot: 'bg-cyan-500' },
    ATENDIDA: { bg: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-800', dot: 'bg-emerald-500' },
    ENTREGADO: { bg: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-800', dot: 'bg-emerald-500' },
    RECHAZADO: { bg: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:ring-rose-800', dot: 'bg-rose-500' },
    RECHAZADA: { bg: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:ring-rose-800', dot: 'bg-rose-500' },
    CANCELADA: { bg: 'bg-slate-50 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700', dot: 'bg-slate-400' },
};

function StatusBadge({ status }: { status: string }) {
    const s = status?.toUpperCase() || '';
    const cfg = statusConfig[s] || { bg: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', dot: 'bg-slate-400' };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ring-1 ${cfg.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {status}
        </span>
    );
}

// ─── CollapsibleSection ───────────────────────────────────────
function Section({ title, count, icon, children, accent, defaultOpen = false }: {
    title: string; count: number; icon: React.ReactNode; children: React.ReactNode;
    accent: string; defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    if (count === 0) return null;
    return (
        <div className="mt-5">
            <button onClick={() => setOpen(!open)}
                className="w-full group flex items-center gap-3 py-2.5 px-1 text-left transition-colors">
                <div className={`${accent} shrink-0`}>{icon}</div>
                <span className="text-[13px] font-bold uppercase tracking-[0.08em] opacity-70">{title}</span>
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${accent.replace('text-', 'bg-').replace('500', '500/10')}`}>
                    {count}
                </span>
                <div className="flex-1" />
                <ChevronDown className={`h-4 w-4 opacity-40 transition-transform duration-300 group-hover:opacity-70 ${open ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <div className={`ml-2 pl-4 border-l-2 ${accent.replace('text-', 'border-').replace('500', '500/30')} space-y-3 pb-1`}>
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Helper: format date ──────────────────────────────────────
const fmtDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return '-'; }
};

// ─── Página Principal ─────────────────────────────────────────
export default function PacienteHistorialPage() {
    const params = useParams();
    const id = params?.id;
    const router = useRouter();
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const isDark = theme === 'dark';

    const [historial, setHistorial] = useState<HistorialItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<Set<number>>(new Set());

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const res = await fetch(`/api/pacientes/${id}/historial`);
                const data = await res.json();
                if (data.success) {
                    setHistorial(data.data);
                    if (data.data.length > 0) setExpanded(new Set([data.data[0].idConsulta]));
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        })();
    }, [id]);

    // Build a map: referenciaId -> follow-up consulta folio (to show relationships)
    const refFollowUpMap = useMemo(() => {
        const map = new Map<number, string>();
        for (const c of historial) {
            for (const ref of c.referencias) {
                // Find if any consultation in historial has this ref as idReferenciaOrigen
                const followUp = historial.find(h => h.idReferenciaOrigen === ref.idReferencia);
                if (followUp) map.set(ref.idReferencia, followUp.folio);
            }
        }
        return map;
    }, [historial]);

    const toggle = (id: number) => setExpanded(prev => {
        const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
    });

    // ─── Loading ──────────────────────────────────────────────
    if (!mounted || loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-5">
                <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center shadow-xl shadow-sky-500/20">
                        <Activity className="h-7 w-7 text-white animate-pulse" />
                    </div>
                </div>
                <p className="text-xl font-medium text-slate-500">Cargando expediente...</p>
            </motion.div>
        </div>
    );

    const p = historial[0];
    if (!p) return (
        <div className={`min-h-screen flex items-center justify-center ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <div className="text-center space-y-3">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                    <User className="h-8 w-8 text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold">Paciente no encontrado</h2>
                <button onClick={() => router.back()} className="text-sm text-sky-500 hover:underline">Volver</button>
            </div>
        </div>
    );

    const kpis = [
        { label: 'Consultas', val: historial.length, icon: <FileText className="h-4 w-4" />, color: 'from-sky-500 to-blue-600' },
        { label: 'Medicamentos', val: historial.reduce((a, h) => a + h.medicamentos.length, 0), icon: <Pill className="h-4 w-4" />, color: 'from-emerald-500 to-green-600' },
        { label: 'Referencias', val: historial.reduce((a, h) => a + h.referencias.length, 0), icon: <Stethoscope className="h-4 w-4" />, color: 'from-violet-500 to-purple-600' },
        { label: 'Incapacidades', val: historial.reduce((a, h) => a + h.incapacidades.length, 0), icon: <AlertCircle className="h-4 w-4" />, color: 'from-amber-500 to-orange-600' },
        { label: 'Laboratorio', val: historial.reduce((a, h) => a + h.estudiosLaboratorio.length, 0), icon: <FlaskConical className="h-4 w-4" />, color: 'from-cyan-500 to-teal-600' },
    ];

    return (
        <div className={`min-h-screen ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>

            {/* ═══ HEADER ═══════════════════════════════════════ */}
            <div className={`sticky top-0 z-40 backdrop-blur-xl border-b ${isDark ? 'bg-slate-900/80 border-white/5' : 'bg-white/80 border-slate-200'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
                    <button onClick={() => router.back()}
                        className={`p-2 sm:p-2.5 rounded-xl transition-all shrink-0 ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100'}`}>
                        <ArrowLeft className="h-5 w-5" />
                    </button>

                    {/* Avatar */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg shadow-sky-500/20 shrink-0">
                        {p.nombre?.charAt(0) || '?'}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg sm:text-xl md:text-2xl font-bold leading-tight truncate">
                            {p.nombre}
                        </h1>
                        <div className={`flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs mt-0.5 flex-wrap ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            <span>{p.sexo === 'M' ? 'Masculino' : p.sexo === 'F' ? 'Femenino' : p.sexo}</span>
                            <span className="opacity-30">|</span>
                            <span>{p.edad} a.</span>
                            {p.noNomina && (<>
                                <span className="opacity-30">|</span>
                                <span className="font-bold text-sky-500">#{p.noNomina}</span>
                            </>)}
                            {p.departamento && (<>
                                <span className="opacity-30 hidden sm:inline">|</span>
                                <span className="truncate hidden sm:inline">{p.departamento}</span>
                            </>)}
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ KPIs ═════════════════════════════════════════ */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                    {kpis.map(k => (
                        <motion.div key={k.label} whileHover={{ y: -2 }}
                            className={`relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-4 ${isDark ? 'bg-white/[0.03] ring-1 ring-white/[0.06]' : 'bg-white ring-1 ring-slate-200/60 shadow-sm'}`}>
                            <div className={`absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r ${k.color}`} />
                            <div className="flex items-center gap-2.5 sm:gap-3">
                                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-br ${k.color} flex items-center justify-center text-white shadow-lg`}>
                                    {k.icon}
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold leading-none">{k.val}</p>
                                    <p className="text-[10px] sm:text-[11px] uppercase tracking-wider opacity-50 mt-0.5">{k.label}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* ═══ TIMELINE ═════════════════════════════════════ */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
                <div className="relative">
                    {/* Vertical line - hidden on mobile */}
                    <div className={`absolute left-[23px] top-0 bottom-0 w-px hidden sm:block ${isDark ? 'bg-gradient-to-b from-sky-500/40 via-slate-700/40 to-transparent' : 'bg-gradient-to-b from-sky-400/30 via-slate-300/50 to-transparent'}`} />

                    <div className="space-y-4 sm:space-y-5">
                        {historial.map((c, idx) => {
                            const isOpen = expanded.has(c.idConsulta);
                            const isSpecialty = !!c.idReferenciaOrigen;
                            const dotColor = isSpecialty ? 'bg-violet-500 ring-violet-500/20' : 'bg-sky-500 ring-sky-500/20';
                            const cardBorder = isSpecialty
                                ? (isDark ? 'ring-violet-500/20' : 'ring-violet-200')
                                : (isDark ? 'ring-white/[0.06]' : 'ring-slate-200/60');

                            return (
                                <motion.div key={c.idConsulta}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05, duration: 0.4 }}
                                    className="relative sm:pl-14"
                                >
                                    {/* Timeline dot - hidden on mobile */}
                                    <div className={`absolute left-[15px] top-6 w-[17px] h-[17px] rounded-full ${dotColor} ring-4 z-10 transition-all hidden sm:block ${isOpen ? 'scale-125' : ''}`} />

                                    {/* Date label on timeline */}
                                    <div className={`absolute left-0 top-[30px] -translate-y-full text-[10px] font-bold uppercase tracking-wider ${isSpecialty ? 'text-violet-500' : 'text-sky-500'} whitespace-nowrap hidden sm:block`}
                                        style={{ writingMode: 'initial' }}>
                                    </div>

                                    {/* Card */}
                                    <div className={`rounded-2xl overflow-hidden ring-1 transition-all duration-300 ${cardBorder} ${isOpen ? 'shadow-xl shadow-black/5 dark:shadow-black/30' : 'shadow-sm hover:shadow-md'} ${isDark ? 'bg-slate-800/50' : 'bg-white'}`}>

                                        {/* Top accent bar */}
                                        {isSpecialty && <div className="h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />}

                                        {/* Header */}
                                        <button onClick={() => toggle(c.idConsulta)} className="w-full text-left p-3 sm:p-5 flex items-start gap-3 sm:gap-4">

                                            {/* Date block */}
                                            <div className="shrink-0 text-center w-12 sm:w-14">
                                                <p className={`text-2xl sm:text-3xl font-bold leading-none ${isSpecialty ? 'text-violet-500' : 'text-sky-500'}`}>
                                                    {new Date(c.fechaConsulta).getDate()}
                                                </p>
                                                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest opacity-50 mt-1">
                                                    {new Date(c.fechaConsulta).toLocaleDateString('es-MX', { month: 'short' })}
                                                </p>
                                                <p className="text-[9px] sm:text-[10px] opacity-30">{new Date(c.fechaConsulta).getFullYear()}</p>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                {/* Type badge + Title */}
                                                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                                    {isSpecialty ? (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-500 ring-1 ring-violet-500/20">
                                                            <Stethoscope className="h-3 w-3" /> Especialidad
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-500 ring-1 ring-sky-500/20">
                                                            <FileText className="h-3 w-3" /> General
                                                        </span>
                                                    )}
                                                    {c.folio && (
                                                        <span className="text-[10px] opacity-30 font-mono">{c.folio}</span>
                                                    )}
                                                </div>

                                                <h3 className="text-base sm:text-lg font-semibold leading-snug mb-2">
                                                    {c.motivoConsulta || 'Consulta general'}
                                                </h3>

                                                {/* Diagnóstico codes */}
                                                <div className="flex flex-wrap gap-1.5 mb-2.5">
                                                    {c.diagnosticos.map((d: any, i: number) => (
                                                        <span key={i} className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${d.esPrincipal
                                                            ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 ring-1 ring-sky-500/20 font-bold'
                                                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                                            {d.cie11Codigo}
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* Indicator pills */}
                                                <div className="flex flex-wrap gap-2">
                                                    {c.tieneReceta && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/8 px-2 py-0.5 rounded-full">
                                                            <Pill className="h-3 w-3" /> Receta
                                                        </span>
                                                    )}
                                                    {c.tieneReferencia && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-500/8 px-2 py-0.5 rounded-full">
                                                            <Stethoscope className="h-3 w-3" /> Referencia
                                                        </span>
                                                    )}
                                                    {c.tieneIncapacidad && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/8 px-2 py-0.5 rounded-full">
                                                            <AlertCircle className="h-3 w-3" /> Incapacidad
                                                        </span>
                                                    )}
                                                    {c.tieneLaboratorio && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-500/8 px-2 py-0.5 rounded-full">
                                                            <FlaskConical className="h-3 w-3" /> Lab
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <ChevronDown className={`h-5 w-5 shrink-0 opacity-30 transition-transform duration-300 mt-2 ${isOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {/* ═══ EXPANDED BODY ═══ */}
                                        <AnimatePresence initial={false}>
                                            {isOpen && (
                                                <motion.div key="body"
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className={`px-3 sm:px-5 pb-4 sm:pb-6 space-y-0 ${isDark ? 'border-t border-white/5' : 'border-t border-slate-100'}`}>

                                                        {/* ── Referencia origen banner ── */}
                                                        {isSpecialty && (
                                                            <div className="mt-5 flex items-center gap-3 p-3 rounded-xl bg-violet-500/5 ring-1 ring-violet-500/10">
                                                                <Link2 className="h-4 w-4 text-violet-500 shrink-0" />
                                                                <p className="text-xs text-violet-600 dark:text-violet-400">
                                                                    Seguimiento de <span className="font-bold">referencia a especialidad</span>
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* ── Signos Vitales ── */}
                                                        <div className={`mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-px rounded-xl sm:rounded-2xl overflow-hidden ring-1 ${isDark ? 'ring-white/5 bg-white/5' : 'ring-slate-200 bg-slate-100'}`}>
                                                            {[
                                                                { label: 'Temp', val: c.temperaturaC, unit: '°C', icon: <Thermometer className="h-3.5 w-3.5" />, color: 'text-rose-500' },
                                                                { label: 'T/A', val: c.taSistolica ? `${c.taSistolica}/${c.taDiastolica}` : null, unit: 'mmHg', icon: <Heart className="h-3.5 w-3.5" />, color: 'text-pink-500' },
                                                                { label: 'FC', val: c.frecuenciaCardiaca, unit: 'lpm', icon: <Activity className="h-3.5 w-3.5" />, color: 'text-orange-500' },
                                                                { label: 'SpO₂', val: c.oxigenacion, unit: '%', icon: <Droplets className="h-3.5 w-3.5" />, color: 'text-blue-500' },
                                                                { label: 'Peso', val: c.pesoKg, unit: 'kg', icon: <Weight className="h-3.5 w-3.5" />, color: 'text-emerald-500' },
                                                                { label: 'Glucosa', val: c.glucosaMgDl, unit: 'mg/dL', icon: <TrendingUp className="h-3.5 w-3.5" />, color: 'text-amber-500' },
                                                            ].map(v => (
                                                                <div key={v.label} className={`text-center py-3 sm:py-4 px-1.5 sm:px-2 ${isDark ? 'bg-slate-800/50' : 'bg-white'}`}>
                                                                    <div className={`${v.color} flex justify-center mb-1.5`}>{v.icon}</div>
                                                                    <p className="text-[10px] uppercase tracking-wider opacity-40 mb-0.5">{v.label}</p>
                                                                    <p className={`text-lg font-bold leading-none ${v.val ? '' : 'opacity-20'}`}>
                                                                        {v.val || '—'}
                                                                    </p>
                                                                    {v.val && <p className="text-[9px] opacity-30 mt-0.5">{v.unit}</p>}
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* ── SOA (Plan se muestra en las secciones expandidas) ── */}
                                                        <div className="mt-4 sm:mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                                                            {[
                                                                { l: 'S', label: 'Subjetivo', text: c.subjetivo, gradient: 'from-blue-500 to-blue-600' },
                                                                { l: 'O', label: 'Objetivo', text: c.objetivo, gradient: 'from-emerald-500 to-green-600' },
                                                                { l: 'A', label: 'Análisis', text: c.analisis, gradient: 'from-amber-500 to-orange-600' },
                                                            ].map(soap => (
                                                                <div key={soap.l} className={`rounded-xl p-4 ${isDark ? 'bg-white/[0.02] ring-1 ring-white/5' : 'bg-slate-50 ring-1 ring-slate-100'}`}>
                                                                    <div className="flex items-center gap-2.5 mb-2">
                                                                        <span className={`bg-gradient-to-br ${soap.gradient} text-white text-[11px] font-bold w-6 h-6 rounded-lg flex items-center justify-center shadow-sm`}>
                                                                            {soap.l}
                                                                        </span>
                                                                        <span className="text-[11px] font-bold uppercase tracking-[0.1em] opacity-40">{soap.label}</span>
                                                                    </div>
                                                                    <p className={`text-sm leading-relaxed ${soap.text ? 'opacity-80' : 'opacity-25 italic'}`}>
                                                                        {soap.text || 'Sin datos'}
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* ── Diagnósticos ── */}
                                                        {c.diagnosticos.length > 0 && (
                                                            <div className="mt-5">
                                                                <p className="text-[11px] font-bold uppercase tracking-[0.1em] opacity-40 mb-3">Diagnósticos CIE-11</p>
                                                                <div className="space-y-2">
                                                                    {c.diagnosticos.map((d: any, i: number) => (
                                                                        <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${d.esPrincipal
                                                                            ? 'bg-sky-500/5 ring-1 ring-sky-500/15'
                                                                            : isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
                                                                            <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 mt-0.5 ${d.esPrincipal
                                                                                ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                                                                                : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                                                                                {d.cie11Codigo}
                                                                            </span>
                                                                            <div>
                                                                                <p className="text-sm font-medium leading-snug">{d.cie11Titulo}</p>
                                                                                {d.esPrincipal && <p className="text-[10px] text-sky-500 font-bold mt-0.5 uppercase tracking-wider">Principal</p>}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* ── Medicamentos ── */}
                                                        <Section title="Medicamentos" count={c.medicamentos.length} icon={<Pill className="h-4 w-4" />} accent="text-emerald-500" defaultOpen>
                                                            {c.medicamentos.map((m: any, i: number) => (
                                                                <div key={i} className={`p-3.5 rounded-xl ${isDark ? 'bg-white/[0.02] ring-1 ring-white/5' : 'bg-slate-50 ring-1 ring-slate-100'}`}>
                                                                    <div className="flex items-start gap-3">
                                                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                                                                            <Pill className="h-3.5 w-3.5" />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="font-bold text-sm leading-snug">{m.nombreMedicamento}</p>
                                                                            <p className="text-[11px] opacity-40">{m.presentacion}</p>
                                                                            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                                                                                <div><span className="opacity-40">Dosis:</span> <span className="font-semibold">{m.dosis || '—'}</span></div>
                                                                                <div><span className="opacity-40">Cantidad:</span> <span className="font-semibold">{m.cantidad}</span></div>
                                                                                {m.duracion && <div><span className="opacity-40">Duración:</span> <span className="font-semibold">{m.duracion} días</span></div>}
                                                                                {m.indicaciones && <div className="col-span-2"><span className="opacity-40">Indicaciones:</span> <span className="font-medium">{m.indicaciones}</span></div>}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </Section>

                                                        {/* ── Referencias ── */}
                                                        <Section title="Referencias" count={c.referencias.length} icon={<Stethoscope className="h-4 w-4" />} accent="text-violet-500" defaultOpen>
                                                            {c.referencias.map((r: any) => {
                                                                const followUpFolio = refFollowUpMap.get(r.idReferencia);
                                                                return (
                                                                    <div key={r.idReferencia} className={`p-4 rounded-xl border-l-[3px] border-violet-500 ${isDark ? 'bg-white/[0.02] ring-1 ring-white/5' : 'bg-slate-50 ring-1 ring-slate-100'}`}>
                                                                        <div className="flex justify-between items-start mb-2">
                                                                            <div>
                                                                                <h4 className="font-bold text-sm text-violet-600 dark:text-violet-400">{r.nombreEspecialidad}</h4>
                                                                                <p className="text-[10px] font-mono opacity-40 mt-0.5">
                                                                                    <Hash className="inline h-2.5 w-2.5" />{r.folio}
                                                                                </p>
                                                                            </div>
                                                                            <StatusBadge status={r.estatus} />
                                                                        </div>
                                                                        <p className="text-sm opacity-70 mb-3">{r.motivoReferencia}</p>
                                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2 text-xs">
                                                                            {r.fechaCita && <div><span className="opacity-40">Cita:</span> <span className="font-semibold">{fmtDate(r.fechaCita)}</span></div>}
                                                                            {r.fechaAutorizacion && <div><span className="opacity-40">Autorización:</span> <span className="font-semibold">{fmtDate(r.fechaAutorizacion)}</span></div>}
                                                                            {r.fechaAtencion && <div><span className="opacity-40">Atención:</span> <span className="font-semibold">{fmtDate(r.fechaAtencion)}</span></div>}
                                                                        </div>
                                                                        {r.observacionesCoordinador && (
                                                                            <div className="mt-3 p-2.5 rounded-lg bg-sky-500/5 ring-1 ring-sky-500/10 text-xs">
                                                                                <span className="font-bold text-sky-600 dark:text-sky-400">Coordinador:</span> {r.observacionesCoordinador}
                                                                            </div>
                                                                        )}
                                                                        {/* ── Relationship link ── */}
                                                                        {followUpFolio && (
                                                                            <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-violet-500/5 ring-1 ring-violet-500/10">
                                                                                <Link2 className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                                                                                <p className="text-xs text-violet-600 dark:text-violet-400">
                                                                                    Consulta de seguimiento: <span className="font-bold font-mono">{followUpFolio}</span>
                                                                                </p>
                                                                                <ExternalLink className="h-3 w-3 text-violet-400 opacity-50" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </Section>

                                                        {/* ── Incapacidades ── */}
                                                        <Section title="Incapacidades" count={c.incapacidades.length} icon={<AlertCircle className="h-4 w-4" />} accent="text-amber-500" defaultOpen>
                                                            {c.incapacidades.map((inc: any, i: number) => {
                                                                const border = inc.estatus === 'AUTORIZADA' ? 'border-emerald-500' : inc.estatus === 'RECHAZADA' ? 'border-rose-500' : 'border-amber-500';
                                                                return (
                                                                    <div key={i} className={`p-4 rounded-xl border-l-[3px] ${border} ${isDark ? 'bg-white/[0.02] ring-1 ring-white/5' : 'bg-slate-50 ring-1 ring-slate-100'}`}>
                                                                        <div className="flex items-center justify-between mb-3">
                                                                            <div className="flex items-center gap-2">
                                                                                {inc.estatus === 'AUTORIZADA' && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                                                                                {inc.estatus === 'PENDIENTE' && <Clock className="h-4 w-4 text-amber-500" />}
                                                                                {inc.estatus === 'RECHAZADA' && <XCircle className="h-4 w-4 text-rose-500" />}
                                                                                <span className="font-bold text-sm">Incapacidad</span>
                                                                            </div>
                                                                            <StatusBadge status={inc.estatus} />
                                                                        </div>
                                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs">
                                                                            <div><span className="opacity-40 block mb-0.5">Inicio</span><span className="font-semibold">{fmtDate(inc.fecha_inicio)}</span></div>
                                                                            <div><span className="opacity-40 block mb-0.5">Fin</span><span className="font-semibold">{fmtDate(inc.fecha_fin)}</span></div>
                                                                            <div><span className="opacity-40 block mb-0.5">Días sugeridos</span><span className="text-lg font-bold leading-none">{inc.dias_sugeridos}</span></div>
                                                                            <div><span className="opacity-40 block mb-0.5">Días autorizados</span><span className={`text-lg font-bold leading-none ${inc.dias_autorizados ? 'text-emerald-500' : 'opacity-25'}`}>{inc.dias_autorizados || '—'}</span></div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </Section>

                                                        {/* ── Estudios de Laboratorio ── */}
                                                        <Section title="Laboratorio" count={c.estudiosLaboratorio.length} icon={<FlaskConical className="h-4 w-4" />} accent="text-cyan-500" defaultOpen>
                                                            {c.estudiosLaboratorio.map((e: any) => (
                                                                <div key={e.id_solicitud} className={`p-4 rounded-xl ${isDark ? 'bg-white/[0.02] ring-1 ring-white/5' : 'bg-slate-50 ring-1 ring-slate-100'}`}>
                                                                    <div className="flex justify-between items-start mb-2">
                                                                        <div>
                                                                            <h4 className="font-bold text-sm">{e.nombre_estudio}</h4>
                                                                            <p className="text-[10px] opacity-40 mt-0.5">{e.categoria}</p>
                                                                        </div>
                                                                        <StatusBadge status={e.estatus} />
                                                                    </div>
                                                                    {e.motivo_clinico && (
                                                                        <p className="text-xs opacity-60 mb-2"><span className="opacity-50">Motivo:</span> {e.motivo_clinico}</p>
                                                                    )}
                                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                                                        <div><span className="opacity-40">Solicitado:</span> <span className="font-semibold">{fmtDate(e.fecha_solicitud)}</span></div>
                                                                        {e.fecha_autorizacion && <div><span className="opacity-40">Autorizado:</span> <span className="font-semibold">{fmtDate(e.fecha_autorizacion)}</span></div>}
                                                                        {e.fecha_entrega && <div><span className="opacity-40">Entregado:</span> <span className="font-semibold">{fmtDate(e.fecha_entrega)}</span></div>}
                                                                        <div><span className="opacity-40">Costo:</span> <span className="font-semibold">${parseFloat(e.costo || 0).toFixed(2)}</span></div>
                                                                    </div>
                                                                    {e.motivo_rechazo && (
                                                                        <div className="mt-2.5 p-2.5 rounded-lg bg-rose-500/5 ring-1 ring-rose-500/10 text-xs text-rose-600 dark:text-rose-400">
                                                                            <span className="font-bold">Rechazo:</span> {e.motivo_rechazo}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </Section>

                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {historial.length === 0 && (
                    <div className="py-24 text-center">
                        <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-5">
                            <FileText className="h-8 w-8 opacity-30" />
                        </div>
                        <p className="text-xl font-medium opacity-50">Sin consultas registradas</p>
                    </div>
                )}
            </div>
        </div>
    );
}
