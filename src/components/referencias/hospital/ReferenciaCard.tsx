import { Calendar, UserPlus, RefreshCw, User, ClipboardList, ShieldCheck } from "lucide-react";
import type { ReferenciaEspecialidad } from "@/types/referencias";

const TRIAGE: Record<number, { nombre: string; tiempo: string; dot: string; badge: string; bannerDark: string; bannerLight: string; shadowRgb: string }> = {
  1: { nombre: 'Emergencia',   tiempo: '< 24h',     dot: 'bg-red-500',    badge: 'bg-red-500/10 text-red-400 border-red-500/20',     bannerDark: 'bg-red-500',    bannerLight: 'bg-red-500',    shadowRgb: '239,68,68'    },
  2: { nombre: 'Urgente',      tiempo: '24–72h',    dot: 'bg-orange-500', badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20', bannerDark: 'bg-orange-500', bannerLight: 'bg-orange-500', shadowRgb: '249,115,22' },
  3: { nombre: 'Semi-urgente', tiempo: '1–2 sem',   dot: 'bg-yellow-500', badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', bannerDark: 'bg-yellow-500', bannerLight: 'bg-yellow-500', shadowRgb: '234,179,8'  },
  4: { nombre: 'Programable',  tiempo: '2–4 sem',   dot: 'bg-green-500',  badge: 'bg-green-500/10 text-green-400 border-green-500/20',  bannerDark: 'bg-green-500',  bannerLight: 'bg-green-500',  shadowRgb: '34,197,94'  },
  5: { nombre: 'Electiva',     tiempo: '1–3 meses', dot: 'bg-blue-500',   badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',    bannerDark: 'bg-blue-500',   bannerLight: 'bg-blue-500',   shadowRgb: '59,130,246' },
};

interface ReferenciaCardProps {
    referencia: ReferenciaEspecialidad;
    variant: "pending" | "assigned";
    onAction: (referencia: ReferenciaEspecialidad) => void;
    isDark: boolean;
}

export default function ReferenciaCard({
    referencia,
    variant,
    onAction,
    isDark,
}: ReferenciaCardProps) {
    const formatDate = (dateString: string) => {
        if (!dateString) return "Fecha no disponible";
        const date = new Date(dateString);
        return date.toLocaleDateString("es-MX", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const formatDateTime = (dateString: string) => {
        if (!dateString) return "Fecha no disponible";
        const date = new Date(dateString);
        return date.toLocaleDateString("es-MX", {
            weekday: "short",
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const isPending = variant === "pending";
    const triage = referencia.nivel_triage ? TRIAGE[referencia.nivel_triage] : null;
    const shadowStyle = triage
        ? { boxShadow: `0 0 0 1px rgba(${triage.shadowRgb},0.15), 0 8px 28px -4px rgba(${triage.shadowRgb},${isDark ? '0.35' : '0.22'})` }
        : undefined;

    return (
        <div
            className={`group relative flex flex-col h-full rounded-2xl transition-all duration-300 border backdrop-blur-sm ${isDark
                    ? "bg-white/[0.03] border-white/5 hover:border-[#0f83b2]/30"
                    : "bg-white border-gray-100 hover:border-blue-200"
                }`}
            style={shadowStyle}
        >
            {/* Top Banner — color del triage si existe, si no el color del variant */}
            <div
                className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl ${
                    triage
                        ? triage.bannerDark
                        : isPending
                            ? "bg-[#0db1ec]"
                            : "bg-amber-500"
                }`}
            />

            <div className="p-5 flex flex-col h-full">
                {/* Header: Patient & Avatar */}
                <div className="flex items-start justify-between gap-3 mb-4 mt-2">
                    <div className="flex items-center gap-3">
                        <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${isDark
                                    ? "bg-[#0f83b2]/20 text-[#0db1ec]"
                                    : "bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 border border-blue-200/50"
                                }`}
                        >
                            {referencia.nombre_paciente.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3
                                className={`font-bold text-sm leading-tight line-clamp-1 ${isDark ? "text-gray-100" : "text-gray-900"
                                    }`}
                                title={referencia.nombre_paciente}
                            >
                                {referencia.nombre_paciente}
                            </h3>
                            <div
                                className={`mt-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium font-mono ${isDark
                                        ? "bg-white/5 text-gray-400 border border-white/10"
                                        : "bg-gray-100 text-gray-500 border border-gray-200"
                                    }`}
                            >
                                #{referencia.no_nomina}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content: Info Blocks */}
                <div className="flex-1 space-y-4">
                    {/* Specialty Badge + Triage */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${isDark
                                    ? "bg-purple-500/10 text-purple-300 border border-purple-500/20"
                                    : "bg-purple-50 text-purple-700 border border-purple-100"
                                }`}
                        >
                            {referencia.nombre_especialidad}
                        </span>
                        {triage && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${triage.badge}`}>
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${triage.dot}`} />
                                {triage.nombre} · {triage.tiempo}
                            </span>
                        )}
                    </div>

                    {/* Reason / Context */}
                    <div
                        className={`p-3 rounded-xl text-xs leading-relaxed border ${isDark
                                ? "bg-black/20 border-white/5 text-gray-400"
                                : "bg-gray-50 border-gray-100 text-gray-600"
                            }`}
                    >
                        <div className="flex items-center gap-1.5 mb-1.5 opacity-75">
                            <User className="w-3 h-3" />
                            <span className="text-[10px] uppercase tracking-wider font-bold">
                                Refiere: {referencia.nombre_medico_refiere}
                            </span>
                        </div>
                        <p className="line-clamp-3 italic">"{referencia.motivo_referencia}"</p>
                    </div>

                    {/* Additional Info for Assigned */}
                    {!isPending && (
                        <div className="space-y-2">
                            <div className={`flex items-center gap-2 text-xs ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                                <User className="w-3.5 h-3.5 opacity-70" />
                                <span className="font-medium">
                                    Dr. {referencia.nombre_medico_asignado || "Sin asignar"}
                                </span>
                            </div>
                            {referencia.fecha_cita && (
                                <div
                                    className={`flex items-center gap-2 text-xs font-medium ${isDark ? "text-amber-400" : "text-amber-600"
                                        }`}
                                >
                                    <Calendar className="w-3.5 h-3.5" />
                                    {formatDateTime(referencia.fecha_cita)}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer: Metadata & Action */}
                <div className="mt-5 pt-4 border-t border-dashed border-gray-500/20 flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-1">
                        {referencia.nombre_coordinador && isPending && (
                            <div
                                className={`flex items-center gap-1.5 text-[10px] font-bold ${isDark ? "text-emerald-400" : "text-emerald-600"
                                    }`}
                                title={`Autorizado por: ${referencia.nombre_coordinador}`}
                            >
                                <ShieldCheck className="w-3 h-3" />
                                <span className="truncate max-w-[80px]">
                                    {referencia.nombre_coordinador.split(' ')[0]}
                                </span>
                            </div>
                        )}
                        <div
                            className={`flex items-center gap-1.5 text-[10px] ${isDark ? "text-gray-500" : "text-gray-400"
                                }`}
                        >
                            <Calendar className="w-3 h-3" />
                            {formatDate(referencia.fecha_autorizacion || referencia.creado_en)}
                        </div>
                    </div>

                    <button
                        onClick={() => onAction(referencia)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${isPending
                                ? isDark
                                    ? "bg-[#0db1ec] hover:bg-[#0a8ab5] text-[#0a1929] shadow-[#0db1ec]/20"
                                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200"
                                : isDark
                                    ? "bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                                    : "bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100"
                            }`}
                    >
                        {isPending ? (
                            <>
                                <UserPlus className="w-3.5 h-3.5" />
                                Asignar
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reprogramar
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
