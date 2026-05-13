import { Eye, Send, Phone, Mail, User as UserIcon, CheckCircle, Calendar, RefreshCcw, Stethoscope, Clock } from "lucide-react";
import type { ReferenciaEspecialidad } from "@/types/referencias";

const TRIAGE_CONFIG: Record<number, { nombre: string; tiempo: string; dot: string; badge: string; shadowRgb: string }> = {
  1: { nombre: 'Emergencia',   tiempo: '< 24h',     dot: 'bg-red-500',    badge: 'bg-red-500/10 text-red-400 border border-red-500/20',         shadowRgb: '239,68,68'  },
  2: { nombre: 'Urgente',      tiempo: '24–72h',    dot: 'bg-orange-500', badge: 'bg-orange-500/10 text-orange-400 border border-orange-500/20', shadowRgb: '249,115,22' },
  3: { nombre: 'Semi-urgente', tiempo: '1–2 sem',   dot: 'bg-yellow-500', badge: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20', shadowRgb: '234,179,8'  },
  4: { nombre: 'Programable',  tiempo: '2–4 sem',   dot: 'bg-green-500',  badge: 'bg-green-500/10 text-green-400 border border-green-500/20',   shadowRgb: '34,197,94'  },
  5: { nombre: 'Electiva',     tiempo: '1–3 meses', dot: 'bg-blue-500',   badge: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',      shadowRgb: '59,130,246' },
};

const getTriageRowStyle = (nivel: number | null | undefined, isDark: boolean) => {
  if (!nivel || !TRIAGE_CONFIG[nivel]) return undefined;
  const { shadowRgb } = TRIAGE_CONFIG[nivel];
  const alpha = isDark ? '0.55' : '0.45';
  return { boxShadow: `inset 3px 0 0 rgba(${shadowRgb},${alpha}), inset 0 0 40px rgba(${shadowRgb},${isDark ? '0.04' : '0.03'})` };
};

interface Props {
  referencias: ReferenciaEspecialidad[];
  onVerDetalle: (referencia: ReferenciaEspecialidad) => void;
  isDark: boolean;
}

export default function TablaReferenciasNotificadas({ referencias, onVerDetalle, isDark }: Props) {
  const referenciasSorted = [...referencias].sort((a, b) => (a.nivel_triage ?? 99) - (b.nivel_triage ?? 99));
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const diasDesde = (dateString: string | null | undefined): number | null => {
    if (!dateString) return null;
    return Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 86400000);
  };

  const diasHasta = (dateString: string | null | undefined): number | null => {
    if (!dateString) return null;
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const cita = new Date(dateString); cita.setHours(0, 0, 0, 0);
    return Math.ceil((cita.getTime() - hoy.getTime()) / 86400000);
  };

  const urgencyConfig = (dias: number | null) => {
    if (dias === null) return { bg: isDark ? "bg-gray-700/40" : "bg-gray-100", text: isDark ? "text-gray-400" : "text-gray-500", dot: "bg-gray-400", label: "Sin fecha" };
    if (dias < 0)   return { bg: isDark ? "bg-purple-500/15" : "bg-purple-50", text: isDark ? "text-purple-300" : "text-purple-700", dot: "bg-purple-500", label: `Hace ${Math.abs(dias)}d` };
    if (dias <= 3)  return { bg: isDark ? "bg-red-500/15" : "bg-red-50",    text: isDark ? "text-red-300" : "text-red-700",    dot: "bg-red-500",    label: dias === 0 ? "Hoy" : `En ${dias}d` };
    if (dias <= 7)  return { bg: isDark ? "bg-orange-500/15" : "bg-orange-50", text: isDark ? "text-orange-300" : "text-orange-700", dot: "bg-orange-500", label: `En ${dias}d` };
    if (dias <= 30) return { bg: isDark ? "bg-amber-500/15" : "bg-amber-50",  text: isDark ? "text-amber-300" : "text-amber-600",  dot: "bg-amber-500",  label: `En ${dias}d` };
    return { bg: isDark ? "bg-emerald-500/10" : "bg-emerald-50", text: isDark ? "text-emerald-400" : "text-emerald-700", dot: "bg-emerald-500", label: `En ${dias}d` };
  };

  const medioConfig = (medio: string | null | undefined) => {
    switch (medio) {
      case "telefono":   return { icon: <Phone className="w-3.5 h-3.5" />, label: "Teléfono",    bg: isDark ? "bg-blue-500/15 text-blue-300" : "bg-blue-50 text-blue-700" };
      case "email":      return { icon: <Mail className="w-3.5 h-3.5" />,  label: "Email",       bg: isDark ? "bg-violet-500/15 text-violet-300" : "bg-violet-50 text-violet-700" };
      case "presencial": return { icon: <UserIcon className="w-3.5 h-3.5" />, label: "Presencial", bg: isDark ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-50 text-emerald-700" };
      default:           return { icon: <Send className="w-3.5 h-3.5" />,  label: medio || "—",  bg: isDark ? "bg-gray-500/15 text-gray-300" : "bg-gray-100 text-gray-600" };
    }
  };

  return (
    <div className="w-full">
      {/* ── Vista Móvil ─────────────────────────────────────────────────────── */}
      <div className="sm:hidden divide-y divide-gray-100/10">
        {referenciasSorted.map((ref) => {
          const medio = medioConfig(ref.medio_notificacion);
          const dias = diasHasta(ref.fecha_cita);
          const urg = urgencyConfig(dias);
          const esSeg = ref.tipo_referencia === "seguimiento";
          const diasAuth = diasDesde(ref.fecha_autorizacion);
          const triage = ref.nivel_triage ? TRIAGE_CONFIG[ref.nivel_triage] : null;
          return (
            <div key={`mob-${ref.id_referencia}`} className={`p-4 transition-colors ${isDark ? "hover:bg-white/5" : "hover:bg-gray-50/80"}`}
              style={triage ? { borderLeft: `3px solid rgba(${triage.shadowRgb},0.6)` } : undefined}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${isDark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
                    {ref.nombre_paciente.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`font-bold text-sm truncate ${isDark ? "text-white" : "text-gray-900"}`}>{ref.nombre_paciente}</p>
                      {esSeg && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-white tracking-wide shrink-0">
                          <RefreshCcw className="w-2.5 h-2.5" /> SEG
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>{ref.no_nomina} · {ref.nombre_especialidad}</p>
                      {triage && (
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${triage.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${triage.dot}`} />
                          {triage.nombre}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0 ${medio.bg}`}>
                  {medio.icon}{medio.label}
                </span>
              </div>

              <div className={`grid grid-cols-3 gap-2 mb-3 px-3 py-2.5 rounded-xl text-xs ${isDark ? "bg-[#0a1929]" : "bg-gray-50"}`}>
                <div>
                  <p className={`text-[9px] uppercase tracking-wide mb-1 font-bold ${isDark ? "text-gray-500" : "text-gray-400"}`}>Autorizada</p>
                  <p className={`font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>{formatDate(ref.fecha_autorizacion) ?? "—"}</p>
                  {diasAuth !== null && <p className={`text-[10px] ${isDark ? "text-gray-500" : "text-gray-400"}`}>hace {diasAuth}d</p>}
                </div>
                <div>
                  <p className={`text-[9px] uppercase tracking-wide mb-1 font-bold ${isDark ? "text-gray-500" : "text-gray-400"}`}>Notificada</p>
                  <p className={`font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>{formatDate(ref.fecha_notificacion) ?? "—"}</p>
                </div>
                <div>
                  <p className={`text-[9px] uppercase tracking-wide mb-1 font-bold ${isDark ? "text-gray-500" : "text-gray-400"}`}>Cita</p>
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-bold text-[10px] ${urg.bg} ${urg.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${urg.dot}`} />{urg.label}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onVerDetalle(ref)}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${isDark
                  ? "bg-[#0f83b2]/10 text-[#0db1ec] hover:bg-[#0f83b2]/20 border border-[#0f83b2]/20"
                  : "bg-white text-blue-600 hover:bg-blue-50 border border-gray-200"}`}
              >
                <Eye className="w-4 h-4" />
                Ver Detalle
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Vista Escritorio ─────────────────────────────────────────────────── */}
      <div className="hidden sm:block overflow-x-auto">
        {/* Toolbar */}
        <div className={`flex items-center justify-between px-6 py-3 border-b text-xs ${isDark ? "border-[#0f83b2]/15 bg-[#0d2137]/60" : "border-gray-100 bg-gray-50/60"}`}>
          <span className={`flex items-center gap-1.5 font-semibold ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            {referencias.length} referencias notificadas
          </span>
        </div>

        <table className="w-full">
          <thead>
            <tr className={`text-left text-[10px] font-bold uppercase tracking-widest border-b ${isDark ? "bg-[#0d2137] border-[#0f83b2]/15 text-gray-500" : "bg-gray-50 border-gray-100 text-gray-400"}`}>
              <th className="px-5 py-3">Paciente</th>
              <th className="px-5 py-3">Especialidad</th>
              <th className="px-5 py-3">Autorizada</th>
              <th className="px-5 py-3">Notificada</th>
              <th className="px-5 py-3">Cita</th>
              <th className="px-5 py-3">Medio</th>
              <th className="px-5 py-3 text-center">Detalle</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? "divide-[#0f83b2]/10" : "divide-gray-100"}`}>
            {referenciasSorted.map((ref) => {
              const medio = medioConfig(ref.medio_notificacion);
              const dias = diasHasta(ref.fecha_cita);
              const urg = urgencyConfig(dias);
              const esSeg = ref.tipo_referencia === "seguimiento";
              const diasAuth = diasDesde(ref.fecha_autorizacion);
              const diasNotif = diasDesde(ref.fecha_notificacion);
              const triage = ref.nivel_triage ? TRIAGE_CONFIG[ref.nivel_triage] : null;
              return (
                <tr key={ref.id_referencia}
                  className={`group transition-colors ${isDark ? "hover:bg-[#0d2137]/70" : "hover:bg-emerald-50/20"}`}
                  style={getTriageRowStyle(ref.nivel_triage, isDark)}>

                  {/* Paciente */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-hover:scale-105 ${isDark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
                        {ref.nombre_paciente.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`font-bold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>{ref.nombre_paciente}</p>
                          {esSeg && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-white tracking-wide">
                              <RefreshCcw className="w-2.5 h-2.5" /> SEG
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>{ref.no_nomina}</p>
                          <span className={`font-mono text-[10px] font-bold ${isDark ? "text-[#0db1ec]/60" : "text-[#0f83b2]/60"}`}>{ref.folio || "S/F"}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Especialidad */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Stethoscope className={`w-3.5 h-3.5 shrink-0 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                      <span className={`text-sm ${isDark ? "text-gray-200" : "text-gray-700"}`}>{ref.nombre_especialidad}</span>
                    </div>
                    {triage && (
                      <span className={`inline-flex items-center gap-1 mt-1 ml-5 px-2 py-0.5 rounded-full text-[9px] font-bold ${triage.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${triage.dot}`} />
                        {triage.nombre} · {triage.tiempo}
                      </span>
                    )}
                    {ref.nombre_medico_asignado && (
                      <p className={`text-[10px] mt-0.5 ml-5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>{ref.nombre_medico_asignado}</p>
                    )}
                  </td>

                  {/* Fecha autorización */}
                  <td className="px-5 py-4">
                    {ref.fecha_autorizacion ? (
                      <div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className={`w-3.5 h-3.5 shrink-0 ${isDark ? "text-emerald-400" : "text-emerald-500"}`} />
                          <span className={`text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-800"}`}>{formatDate(ref.fecha_autorizacion)}</span>
                        </div>
                        {diasAuth !== null && (
                          <p className={`text-[10px] mt-0.5 ml-5 ${isDark ? "text-gray-600" : "text-gray-400"}`}>
                            hace {diasAuth === 0 ? "hoy" : `${diasAuth}d`}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className={`text-xs ${isDark ? "text-gray-600" : "text-gray-400"}`}>—</span>
                    )}
                  </td>

                  {/* Fecha notificación */}
                  <td className="px-5 py-4">
                    {ref.fecha_notificacion ? (
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Clock className={`w-3.5 h-3.5 shrink-0 ${isDark ? "text-[#0db1ec]" : "text-[#0f83b2]"}`} />
                          <span className={`text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-800"}`}>{formatDate(ref.fecha_notificacion)}</span>
                        </div>
                        <p className={`text-[10px] mt-0.5 ml-5 ${isDark ? "text-gray-600" : "text-gray-400"}`}>
                          {ref.nombre_usuario_notifica ? `Por: ${ref.nombre_usuario_notifica}` : diasNotif !== null ? `hace ${diasNotif === 0 ? "hoy" : `${diasNotif}d`}` : ""}
                        </p>
                      </div>
                    ) : (
                      <span className={`text-xs ${isDark ? "text-gray-600" : "text-gray-400"}`}>—</span>
                    )}
                  </td>

                  {/* Cita urgencia */}
                  <td className="px-5 py-4">
                    <div className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold ${urg.bg} ${urg.text}`}>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${urg.dot}`} />
                      <div className="flex flex-col leading-tight">
                        <span>{urg.label}</span>
                        {ref.fecha_cita && (
                          <span className="font-normal opacity-70 text-[10px]">{formatDate(ref.fecha_cita)}</span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Medio */}
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${medio.bg}`}>
                      {medio.icon}
                      {medio.label}
                    </span>
                  </td>

                  {/* Acción */}
                  <td className="px-5 py-4 text-center">
                    <button
                      onClick={() => onVerDetalle(ref)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 ${isDark
                        ? "bg-[#0f83b2]/10 text-[#0db1ec] hover:bg-[#0f83b2]/20 border border-[#0f83b2]/20"
                        : "bg-white text-blue-600 hover:bg-blue-50 border border-gray-200"}`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Detalle
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
