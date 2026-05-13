import { useMemo, useState, useEffect } from "react";
import { Eye, Clock, Stethoscope, User, BadgeInfo, Calendar, ChevronDown, ChevronUp, RefreshCcw, Search, XCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { ReferenciaEspecialidad } from "@/types/referencias";
import Paginacion from "@/components/ui/Paginacion";

const TRIAGE_CONFIG: Record<number, { nombre: string; tiempo: string; dot: string; dark: string; light: string; shadowRgb: string }> = {
  1: { nombre: 'Emergencia',   tiempo: '< 24h',     dot: 'bg-red-500',    dark: 'bg-red-500/10 text-red-400 border-red-500/20',    light: 'bg-red-50 text-red-700 border-red-200',    shadowRgb: '239,68,68'    },
  2: { nombre: 'Urgente',      tiempo: '24–72h',    dot: 'bg-orange-500', dark: 'bg-orange-500/10 text-orange-400 border-orange-500/20', light: 'bg-orange-50 text-orange-700 border-orange-200', shadowRgb: '249,115,22' },
  3: { nombre: 'Semi-urgente', tiempo: '1–2 sem',   dot: 'bg-yellow-500', dark: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', light: 'bg-yellow-50 text-yellow-700 border-yellow-200', shadowRgb: '234,179,8'  },
  4: { nombre: 'Programable',  tiempo: '2–4 sem',   dot: 'bg-green-500',  dark: 'bg-green-500/10 text-green-400 border-green-500/20',  light: 'bg-green-50 text-green-700 border-green-200',  shadowRgb: '34,197,94'  },
  5: { nombre: 'Electiva',     tiempo: '1–3 meses', dot: 'bg-blue-500',   dark: 'bg-blue-500/10 text-blue-400 border-blue-500/20',   light: 'bg-blue-50 text-blue-700 border-blue-200',   shadowRgb: '59,130,246' },
};

const getTriageShadow = (nivel: number, dark: boolean): string => {
  const cfg = TRIAGE_CONFIG[nivel];
  if (!cfg) return '';
  const opacity = dark ? '0.35' : '0.22';
  return `0 0 0 1px rgba(${cfg.shadowRgb},0.15), 0 6px 24px -4px rgba(${cfg.shadowRgb},${opacity})`;
};

const diasHastaSeg = (fecha: string): number => {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const cita = new Date(fecha); cita.setHours(0, 0, 0, 0);
  return Math.ceil((cita.getTime() - hoy.getTime()) / 86400000);
};

interface Props {
  referencias: ReferenciaEspecialidad[];
  onVerDetalle: (referencia: ReferenciaEspecialidad) => void;
  isDark: boolean;
}

const PAGE_SIZE = 12;

export default function TablaReferenciasAutorizar({ referencias, onVerDetalle, isDark }: Props) {
  const [expandidos, setExpandidos] = useState<Record<number, boolean>>(() => {
    const init: Record<number, boolean> = {};
    referencias.forEach(r => { init[r.id_consulta_origen] = true; });
    return init;
  });
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina]     = useState(1);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("es-MX", {
      day: "2-digit", month: "short", year: "numeric",
    });

  // ── Agrupar por consulta de origen ────────────────────────────────────
  const grupos = useMemo(() => {
    const map: Record<number, {
      id_consulta_origen: number;
      paciente: string;
      nomina: string;
      depto: string | undefined;
      medico: string;
      fecha: string;
      referencias: ReferenciaEspecialidad[];
    }> = {};

    referencias.forEach(ref => {
      if (!map[ref.id_consulta_origen]) {
        map[ref.id_consulta_origen] = {
          id_consulta_origen: ref.id_consulta_origen,
          paciente: ref.nombre_paciente,
          nomina:   ref.no_nomina,
          depto:    ref.departamento,
          medico:   ref.nombre_medico_refiere,
          fecha:    ref.creado_en,
          referencias: [],
        };
      }
      map[ref.id_consulta_origen].referencias.push(ref);
    });

    // Ordenar: más urgente (nivel_triage más bajo) arriba; sin triage al final
    return Object.values(map).sort((a, b) => {
      const nivelA = a.referencias.reduce<number | null>((min, r) =>
        r.nivel_triage != null && (min === null || r.nivel_triage < min) ? r.nivel_triage : min, null);
      const nivelB = b.referencias.reduce<number | null>((min, r) =>
        r.nivel_triage != null && (min === null || r.nivel_triage < min) ? r.nivel_triage : min, null);
      if (nivelA === null && nivelB === null) return 0;
      if (nivelA === null) return 1;
      if (nivelB === null) return -1;
      return nivelA - nivelB;
    });
  }, [referencias]);

  const gruposFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return grupos;
    return grupos.filter(g =>
      g.paciente.toLowerCase().includes(q) ||
      g.nomina.toLowerCase().includes(q) ||
      g.medico.toLowerCase().includes(q) ||
      g.depto?.toLowerCase().includes(q)
    );
  }, [grupos, busqueda]);

  const gruposPaginados = useMemo(() =>
    gruposFiltrados.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE),
    [gruposFiltrados, pagina]
  );

  useEffect(() => { setPagina(1); }, [busqueda]);

  const toggleExpandir = (id: number) =>
    setExpandidos(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-3 p-4">

      {/* ── Búsqueda ────────────────────────────────────────────────────── */}
      <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm
        ${isDark ? 'bg-[#0d2137] border-[#0f83b2]/20 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}>
        <Search size={15} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
        <input
          type="text"
          placeholder="Buscar por paciente, nómina, médico o área..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-400"
        />
        {busqueda && (
          <button onClick={() => setBusqueda('')}
            className={`p-0.5 rounded transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
            <XCircle size={14} />
          </button>
        )}
        <span className={`text-xs font-medium shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          {gruposFiltrados.length} / {grupos.length}
        </span>
      </div>

      {gruposFiltrados.length === 0 ? (
        <div className={`text-center py-10 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          Sin resultados para "{busqueda}"
        </div>
      ) : null}

      {gruposPaginados.map((grupo, idx) => {
        const abierto = expandidos[grupo.id_consulta_origen] ?? true;

        // Nivel más urgente del grupo (número más bajo)
        const nivelGrupo = grupo.referencias.reduce<number | null>((min, r) => {
          if (!r.nivel_triage) return min;
          return min === null || r.nivel_triage < min ? r.nivel_triage : min;
        }, null);

        return (
          <motion.div
            key={grupo.id_consulta_origen}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`rounded-2xl border overflow-hidden transition-shadow
              ${isDark ? "bg-[#0a1929] border-[#0f83b2]/20" : "bg-white border-gray-200"}`}
            style={nivelGrupo ? { boxShadow: getTriageShadow(nivelGrupo, isDark) } : undefined}
          >
            {/* ── Cabecera de consulta ──────────────────────────────── */}
            <button
              onClick={() => toggleExpandir(grupo.id_consulta_origen)}
              className={`w-full text-left px-5 py-4 flex items-center justify-between gap-3 transition-colors
                ${isDark
                  ? "bg-[#0d2137] hover:bg-[#0f2847] border-b border-[#0f83b2]/20"
                  : "bg-blue-50 hover:bg-blue-100 border-b border-blue-100"}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Ícono */}
                <div className={`shrink-0 p-2 rounded-xl
                  ${isDark ? "bg-[#0f83b2]/20 text-[#0db1ec]" : "bg-blue-100 text-blue-600"}`}>
                  <Stethoscope size={18} />
                </div>

                {/* Info paciente */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-bold text-base truncate ${isDark ? "text-white" : "text-gray-900"}`}>
                      {grupo.paciente}
                    </span>
                  </div>
                  <div className={`flex items-center gap-3 text-xs mt-0.5 flex-wrap
                    ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    <span className="flex items-center gap-1"><User size={11} /> {grupo.nomina}</span>
                    {grupo.depto && (
                      <span className="flex items-center gap-1"><BadgeInfo size={11} /> {grupo.depto}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar size={11} /> {formatDate(grupo.fecha)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {/* Badge cantidad referencias */}
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5
                  ${isDark ? "bg-purple-900/30 text-purple-300" : "bg-purple-100 text-purple-700"}`}>
                  {grupo.referencias.length} {grupo.referencias.length === 1 ? "referencia" : "referencias"}
                </span>
                {abierto
                  ? <ChevronUp size={16} className="text-gray-400" />
                  : <ChevronDown size={16} className="text-gray-400" />}
              </div>
            </button>

            {/* ── Cuerpo: referencias de esta consulta ─────────────── */}
            <AnimatePresence initial={false}>
              {abierto && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {/* Médico que refiere */}
                  <div className={`px-5 pt-3 pb-1 text-xs font-medium
                    ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    Referido por&nbsp;
                    <span className={`font-bold ${isDark ? "text-[#0db1ec]" : "text-[#0f83b2]"}`}>
                      Dr. {grupo.medico}
                    </span>
                  </div>

                  {/* Lista de referencias */}
                  <div className={`mx-5 mb-4 rounded-xl border divide-y overflow-hidden
                    ${isDark ? "border-gray-700 divide-gray-700" : "border-gray-200 divide-gray-100"}`}>
                    {grupo.referencias.map((ref, i) => {
                      const esSeg = ref.tipo_referencia === 'seguimiento';
                      const diasHasta = esSeg && ref.fecha_sugerida_seguimiento
                        ? diasHastaSeg(ref.fecha_sugerida_seguimiento)
                        : 0;
                      const bloqueado = esSeg && diasHasta > 30;
                      const faltan = Math.max(0, diasHasta - 30);

                      return (
                        <div
                          key={ref.id_referencia}
                          className={`flex items-center gap-3 px-4 py-3 transition-colors
                            ${esSeg
                              ? isDark ? "bg-amber-500/5 hover:bg-amber-500/10" : "bg-amber-50/40 hover:bg-amber-50"
                              : isDark ? "bg-black/10 hover:bg-black/20" : "bg-white hover:bg-gray-50"}`}
                        >
                          {/* Número */}
                          <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                            ${isDark ? "bg-purple-900/40 text-purple-400" : "bg-purple-100 text-purple-600"}`}>
                            {i + 1}
                          </span>

                          {/* Info referencia */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold border
                                ${isDark
                                  ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                  : "bg-purple-50 text-purple-700 border-purple-100"}`}>
                                {ref.nombre_especialidad}
                              </span>
                              {ref.nivel_triage && TRIAGE_CONFIG[ref.nivel_triage] && (() => {
                                const t = TRIAGE_CONFIG[ref.nivel_triage!];
                                return (
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${isDark ? t.dark : t.light}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.dot}`} />
                                    {t.nombre}
                                    <span className="opacity-70">·</span>
                                    {t.tiempo}
                                  </span>
                                );
                              })()}
                              {esSeg && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white leading-none">
                                  <RefreshCcw size={9} />
                                  SEG
                                </span>
                              )}
                              {ref.folio && (
                                <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                                  {ref.folio}
                                </span>
                              )}
                            </div>
                            {ref.motivo_referencia && (
                              <p className={`mt-1 text-xs italic truncate
                                ${isDark ? "text-blue-300" : "text-blue-600"}`}>
                                "{ref.motivo_referencia}"
                              </p>
                            )}
                            {esSeg && ref.fecha_sugerida_seguimiento && (
                              <p className={`mt-0.5 text-[10px] flex items-center gap-1
                                ${isDark ? "text-amber-400/70" : "text-amber-600/70"}`}>
                                <Calendar size={9} />
                                Cita sugerida: {formatDate(ref.fecha_sugerida_seguimiento)}
                                {bloqueado && <span className="ml-1 text-gray-400">· disponible en {faltan}d</span>}
                              </p>
                            )}
                          </div>

                          {/* Fecha */}
                          <div className={`hidden sm:flex items-center gap-1.5 text-xs shrink-0
                            ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                            <Clock size={12} />
                            {formatDate(ref.creado_en)}
                          </div>

                          {/* Botón */}
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <button
                              onClick={() => onVerDetalle(ref)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all
                                ${isDark
                                  ? "bg-[#0f83b2] hover:bg-[#0d6f97] text-white shadow shadow-blue-900/20"
                                  : "bg-[#0f83b2] hover:bg-[#0a7aa0] text-white shadow shadow-blue-200"}`}
                            >
                              <Eye size={13} />
                              <span className="hidden sm:inline">Revisar</span>
                            </button>
                            {bloqueado && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md
                                ${isDark ? "bg-amber-500/15 text-amber-400" : "bg-amber-50 text-amber-600"}`}>
                                Autorizar en {faltan}d
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      <Paginacion
        total={gruposFiltrados.length}
        porPagina={PAGE_SIZE}
        pagina={pagina}
        onChange={setPagina}
        isDark={isDark}
        label="consultas"
      />
    </div>
  );
}
