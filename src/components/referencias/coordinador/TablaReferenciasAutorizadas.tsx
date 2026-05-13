import { useState, useMemo, useEffect } from "react";
import { Eye, CheckCircle, Send, UserCheck, RefreshCcw, Search, XCircle } from "lucide-react";
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

interface Props {
  referencias: ReferenciaEspecialidad[];
  onVerDetalle: (referencia: ReferenciaEspecialidad) => void;
  isDark: boolean;
}

const PAGE_SIZE = 12;

export default function TablaReferenciasAutorizadas({ referencias, onVerDetalle, isDark }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina]     = useState(1);

  const referenciasFiltradas = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    const filtradas = !q ? referencias : referencias.filter(r =>
      r.nombre_paciente.toLowerCase().includes(q) ||
      r.no_nomina.toLowerCase().includes(q) ||
      (r.nombre_medico_asignado ?? '').toLowerCase().includes(q) ||
      r.nombre_especialidad.toLowerCase().includes(q)
    );
    // Ordenar: más urgente (nivel_triage más bajo) arriba; sin triage al final
    return [...filtradas].sort((a, b) => {
      const nA = a.nivel_triage ?? null;
      const nB = b.nivel_triage ?? null;
      if (nA === null && nB === null) return 0;
      if (nA === null) return 1;
      if (nB === null) return -1;
      return nA - nB;
    });
  }, [referencias, busqueda]);

  const referenciasPaginadas = useMemo(() =>
    referenciasFiltradas.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE),
    [referenciasFiltradas, pagina]
  );

  useEffect(() => { setPagina(1); }, [busqueda]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getEstatusInfo = (estatus: string) => {
    switch (estatus) {
      case "autorizada":
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          label: "Autorizada",
          bgColor: isDark ? "bg-green-500/10" : "bg-green-100",
          textColor: isDark ? "text-green-300" : "text-green-700",
          borderColor: isDark ? "border-green-500/20" : "border-green-200"
        };
      case "notificada":
        return {
          icon: <Send className="w-4 h-4" />,
          label: "Notificada al Paciente",
          bgColor: isDark ? "bg-blue-500/10" : "bg-blue-100",
          textColor: isDark ? "text-blue-300" : "text-blue-700",
          borderColor: isDark ? "border-blue-500/20" : "border-blue-200"
        };
      case "atendida":
        return {
          icon: <UserCheck className="w-4 h-4" />,
          label: "Atendida",
          bgColor: isDark ? "bg-purple-500/10" : "bg-purple-100",
          textColor: isDark ? "text-purple-300" : "text-purple-700",
          borderColor: isDark ? "border-purple-500/20" : "border-purple-200"
        };
      default:
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          label: estatus,
          bgColor: isDark ? "bg-gray-500/10" : "bg-gray-100",
          textColor: isDark ? "text-gray-300" : "text-gray-700",
          borderColor: isDark ? "border-gray-500/20" : "border-gray-200"
        };
    }
  };

  return (
    <div className="w-full">

      {/* ── Búsqueda ────────────────────────────────────────────────────── */}
      <div className={`flex items-center gap-2 m-4 px-3 py-2.5 rounded-xl border text-sm
        ${isDark ? 'bg-[#0d2137] border-[#0f83b2]/20 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}>
        <Search size={15} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
        <input
          type="text"
          placeholder="Buscar por paciente, nómina, médico o especialidad..."
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
          {referenciasFiltradas.length} / {referencias.length}
        </span>
      </div>

      {/* Vista Móvil (Tarjetas) */}
      <div className="sm:hidden space-y-4 px-4 pb-2">
        {referenciasPaginadas.map((referencia) => {
          const estatusInfo = getEstatusInfo(referencia.estatus);
          return (
            <div
              key={`mobile-${referencia.id_referencia}`}
              className={`rounded-xl p-4 border transition-all active:scale-[0.98] ${isDark ? "bg-[#0d1f2d] border-[#0f83b2]/20" : "bg-white border-gray-100"}`}
              style={referencia.nivel_triage ? { boxShadow: getTriageShadow(referencia.nivel_triage, isDark) } : undefined}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm ${isDark ? "bg-green-500/10 text-green-400" : "bg-green-100 text-green-600"
                      }`}
                  >
                    {referencia.nombre_paciente.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`font-bold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>
                        {referencia.nombre_paciente}
                      </h4>
                      {referencia.tipo_referencia === 'seguimiento' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-white tracking-wide">
                          <RefreshCcw className="w-2.5 h-2.5" />
                          SEGUIMIENTO
                        </span>
                      )}
                    </div>
                    <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      Nómina: {referencia.no_nomina}
                    </span>
                  </div>
                </div>
                <div
                  className={`px-2.5 py-1 rounded-lg border flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${estatusInfo.bgColor} ${estatusInfo.textColor} ${estatusInfo.borderColor}`}
                >
                  {estatusInfo.icon}
                  {estatusInfo.label}
                </div>
              </div>

              <div className={`p-3 rounded-xl mb-4 grid grid-cols-2 gap-3 ${isDark ? "bg-[#0a1929]" : "bg-gray-50"}`}>
                <div className="col-span-2 sm:col-span-1">
                  <span className={`text-[10px] uppercase tracking-wider block mb-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                    Especialidad
                  </span>
                  <div className={`text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-700"}`}>
                    {referencia.nombre_especialidad}
                  </div>
                  {referencia.nivel_triage && TRIAGE_CONFIG[referencia.nivel_triage] && (() => {
                    const t = TRIAGE_CONFIG[referencia.nivel_triage!];
                    return (
                      <span className={`mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${isDark ? t.dark : t.light}`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.dot}`} />
                        {t.nombre} · {t.tiempo}
                      </span>
                    );
                  })()}
                </div>
                <div>
                  <span className={`text-[10px] uppercase tracking-wider block mb-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                    Médico
                  </span>
                  <div className="flex items-center gap-1.5">
                    <UserCheck className={`w-3.5 h-3.5 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                    <span className={`text-sm font-medium truncate ${isDark ? "text-gray-200" : "text-gray-700"}`}>
                      {referencia.nombre_medico_asignado || "N/A"}
                    </span>
                  </div>
                </div>
                <div>
                  <span className={`text-[10px] uppercase tracking-wider block mb-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                    Autorizado
                  </span>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className={`w-3.5 h-3.5 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                    <span className={`text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-700"}`}>
                      {formatDate(referencia.fecha_autorizacion).split(",")[0]}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onVerDetalle(referencia)}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${isDark
                    ? "bg-[#0f83b2]/10 text-[#0db1ec] hover:bg-[#0f83b2]/20 border border-[#0f83b2]/20"
                    : "bg-white text-blue-600 hover:bg-blue-50 border border-gray-200"
                  }`}
              >
                <Eye className="w-4 h-4" />
                Ver Detalle
              </button>
            </div>
          );
        })}
      </div>

      {/* Vista Escritorio (Tabla) */}
      <div className={`hidden sm:block overflow-hidden rounded-xl border shadow-sm ${isDark ? "bg-[#0a1929] border-[#0f83b2]/20" : "bg-white border-gray-200"
        }`}>
        <table className="w-full">
          <thead>
            <tr className={`border-b text-left text-xs font-bold uppercase tracking-wider ${isDark ? "bg-[#0d1f2d] border-[#0f83b2]/20 text-gray-400" : "bg-gray-50 border-gray-100 text-gray-500"
              }`}>
              <th className="px-6 py-4">Paciente</th>
              <th className="px-6 py-4">Especialidad</th>
              <th className="px-6 py-4">Médico Especialista</th>
              <th className="px-6 py-4">Fecha de Autorización</th>
              <th className="px-6 py-4">Estatus</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? "divide-[#0f83b2]/10" : "divide-gray-100"}`}>
            {referenciasPaginadas.map((referencia) => {
              const estatusInfo = getEstatusInfo(referencia.estatus);
              const triageCfg = referencia.nivel_triage ? TRIAGE_CONFIG[referencia.nivel_triage] : null;
              return (
                <tr
                  key={referencia.id_referencia}
                  className={`transition-all duration-200 group ${isDark
                      ? "hover:bg-[#0d1f2d]"
                      : "hover:bg-gray-50/60"
                    }`}
                  style={triageCfg ? {
                    boxShadow: `inset 3px 0 0 rgba(${triageCfg.shadowRgb},0.7)`,
                    backgroundColor: `rgba(${triageCfg.shadowRgb},${isDark ? '0.04' : '0.03'})`,
                  } : undefined}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shadow-sm transition-transform group-hover:scale-110 ${isDark ? "bg-green-500/10 text-green-400" : "bg-green-100 text-green-600"
                        }`}>
                        {referencia.nombre_paciente.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-bold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>
                            {referencia.nombre_paciente}
                          </p>
                          {referencia.tipo_referencia === 'seguimiento' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-white tracking-wide">
                              <RefreshCcw className="w-2.5 h-2.5" />
                              SEGUIMIENTO
                            </span>
                          )}
                        </div>
                        <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                          {referencia.no_nomina}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      {referencia.nombre_especialidad}
                    </p>
                    {referencia.nivel_triage && TRIAGE_CONFIG[referencia.nivel_triage] && (() => {
                      const t = TRIAGE_CONFIG[referencia.nivel_triage!];
                      return (
                        <span className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${isDark ? t.dark : t.light}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.dot}`} />
                          {t.nombre} · {t.tiempo}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <UserCheck className={`w-4 h-4 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                      <div>
                        <p className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                          {referencia.nombre_medico_asignado || "N/A"}
                        </p>
                        {referencia.fecha_cita && (
                          <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                            Cita: {formatDate(referencia.fecha_cita).split(",")[0]}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        {formatDate(referencia.fecha_autorizacion).split(",")[0]}
                      </span>
                      <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                        {formatDate(referencia.fecha_autorizacion).split(",")[1]}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border uppercase tracking-wide ${estatusInfo.bgColor} ${estatusInfo.textColor} ${estatusInfo.borderColor}`}
                    >
                      {estatusInfo.icon}
                      {estatusInfo.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => onVerDetalle(referencia)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${isDark
                          ? "bg-[#0f83b2]/10 text-[#0db1ec] hover:bg-[#0f83b2]/20 border border-[#0f83b2]/20"
                          : "bg-white text-blue-600 hover:bg-blue-50 border border-gray-200"
                        }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Ver Detalle
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-4">
        <Paginacion
          total={referenciasFiltradas.length}
          porPagina={PAGE_SIZE}
          pagina={pagina}
          onChange={setPagina}
          isDark={isDark}
          label="referencias"
        />
      </div>
    </div>
  );
}
