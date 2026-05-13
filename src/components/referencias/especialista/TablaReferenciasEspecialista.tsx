"use client";

import { useState } from "react";
import {
  Eye,
  Calendar,
  User,
  ArrowLeftCircle,
  UserX,
  AlertTriangle,
  FileDown,
  Loader2,
  Stethoscope,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import type { ReferenciaEspecialidad } from "@/types/referencias";
import { generarInasistenciaPDF } from "@/lib/generar-inasistencia-pdf";

interface Props {
  referencias: ReferenciaEspecialidad[];
  onVerDetalle: (referencia: ReferenciaEspecialidad) => void;
  onContrareferir?: (referencia: ReferenciaEspecialidad) => void;
  onSolicitarSeguimiento?: (referencia: ReferenciaEspecialidad) => void;
  onMarcarInasistencia?: (referencia: ReferenciaEspecialidad) => void;
  isDark: boolean;
}

function esCitaPasada(fechaCita: string | null): boolean {
  if (!fechaCita) return false;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const cita = new Date(fechaCita);
  cita.setHours(0, 0, 0, 0);
  return cita < hoy;
}

function esCandidataInasistencia(ref: ReferenciaEspecialidad): boolean {
  return (
    (ref.estatus === "notificada" || ref.estatus === "asignada") &&
    esCitaPasada(ref.fecha_cita)
  );
}

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
  const alpha = isDark ? '0.6' : '0.5';
  return { boxShadow: `inset 3px 0 0 rgba(${shadowRgb},${alpha}), inset 0 0 40px rgba(${shadowRgb},${isDark ? '0.05' : '0.03'})` };
};

const ESTATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; dark: string; light: string }
> = {
  notificada: {
    label: "Notificada",
    icon: Clock,
    dark: "bg-blue-500/15 text-blue-300 border-blue-500/25",
    light: "bg-blue-50 text-blue-700 border-blue-200",
  },
  asignada: {
    label: "Asignada",
    icon: Clock,
    dark: "bg-sky-500/15 text-sky-300 border-sky-500/25",
    light: "bg-sky-50 text-sky-700 border-sky-200",
  },
  atendida: {
    label: "Atendida",
    icon: CheckCircle2,
    dark: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
    light: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  autorizada: {
    label: "Autorizada",
    icon: CheckCircle2,
    dark: "bg-purple-500/15 text-purple-300 border-purple-500/25",
    light: "bg-purple-50 text-purple-700 border-purple-200",
  },
  inasistencia: {
    label: "Inasistencia",
    icon: XCircle,
    dark: "bg-red-500/15 text-red-300 border-red-500/25",
    light: "bg-red-50 text-red-700 border-red-200",
  },
};

export default function TablaReferenciasEspecialista({
  referencias,
  onVerDetalle,
  onContrareferir,
  onSolicitarSeguimiento,
  onMarcarInasistencia,
  isDark,
}: Props) {
  const [descargando, setDescargando] = useState<number | null>(null);

  const referenciasSorted = [...referencias].sort((a, b) => (a.nivel_triage ?? 99) - (b.nivel_triage ?? 99));

  const handleDescargarConstancia = async (ref: ReferenciaEspecialidad) => {
    if (!ref.motivo_inasistencia || !ref.fecha_inasistencia) return;
    setDescargando(ref.id_referencia);
    try {
      const pdfBytes = await generarInasistenciaPDF({
        referencia: ref,
        motivo: ref.motivo_inasistencia,
        fechaGenerado: ref.fecha_inasistencia,
        nombreEmisor: ref.nombre_usuario_inasistencia || "Médico Especialista",
      });
      const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Inasistencia_${ref.folio || ref.id_referencia}_${ref.nombre_paciente.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Error al generar constancia:", e);
    } finally {
      setDescargando(null);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="w-full">
      <table className="w-full border-separate border-spacing-0">
        {/* ── CABECERA ── */}
        <thead>
          <tr
            className={`${
              isDark ? "bg-[#071520]" : "bg-gray-50"
            }`}
          >
            {["Paciente", "Médico que Refiere", "Fecha de Cita", "Motivo", "Estatus", "Acciones"].map(
              (col, i) => (
                <th
                  key={col}
                  className={`px-3 py-3 text-xs font-bold uppercase tracking-wider border-b ${
                    i === 5 ? "text-center" : "text-left"
                  } ${
                    isDark
                      ? "text-[#0db1ec]/80 border-[#0f83b2]/20"
                      : "text-gray-500 border-gray-200"
                  }`}
                >
                  {col}
                </th>
              )
            )}
          </tr>
        </thead>

        {/* ── CUERPO ── */}
        <tbody>
          {referenciasSorted.map((ref) => {
            const citaPasada = esCandidataInasistencia(ref);
            const esInasistencia = ref.estatus === "inasistencia";
            const triage = ref.nivel_triage ? TRIAGE_CONFIG[ref.nivel_triage] : null;
            const estatusCfg = ESTATUS_CONFIG[ref.estatus] ?? {
              label: ref.estatus,
              icon: Clock,
              dark: "bg-gray-500/15 text-gray-300 border-gray-500/25",
              light: "bg-gray-50 text-gray-600 border-gray-200",
            };
            const EstatusIcon = estatusCfg.icon;

            const rowBase = citaPasada
              ? isDark
                ? "bg-red-950/20 hover:bg-red-950/35"
                : "bg-red-50/60 hover:bg-red-100/70"
              : isDark
              ? "bg-[#0a1929]/60 hover:bg-[#0f2744]/60"
              : "bg-white hover:bg-blue-50/40";

            const borderColor = citaPasada
              ? isDark ? "border-red-500/15" : "border-red-200/70"
              : isDark ? "border-[#0f83b2]/10" : "border-gray-100";

            const triageRowStyle = !citaPasada ? getTriageRowStyle(ref.nivel_triage, isDark) : undefined;

            return (
              <tr
                key={ref.id_referencia}
                className={`transition-colors duration-150 ${rowBase}`}
                style={triageRowStyle}
              >
                {/* ── Paciente ── */}
                <td className={`px-3 py-3 border-b ${borderColor}`}>
                  <div className="flex items-start gap-2.5">
                    {/* Avatar inicial */}
                    <div
                      className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                        citaPasada
                          ? "bg-red-500/20 text-red-500"
                          : esInasistencia
                          ? isDark ? "bg-red-500/10 text-red-400" : "bg-red-100 text-red-600"
                          : isDark
                          ? "bg-[#0f83b2]/20 text-[#0db1ec]"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {ref.nombre_paciente.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`font-semibold text-sm leading-tight ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {ref.nombre_paciente}
                      </p>
                      <p
                        className={`text-xs mt-0.5 ${
                          isDark ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        Nómina: <span className="font-medium">{ref.no_nomina}</span>
                      </p>
                      {citaPasada && (
                        <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-red-500">
                          <AlertTriangle className="w-3 h-3" />
                          Cita vencida
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* ── Médico ── */}
                <td className={`px-3 py-3 border-b ${borderColor}`}>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isDark ? "bg-[#0f83b2]/15" : "bg-gray-100"
                      }`}
                    >
                      <User className={`w-3.5 h-3.5 ${isDark ? "text-[#0db1ec]" : "text-gray-500"}`} />
                    </div>
                    <span
                      className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}
                    >
                      {ref.nombre_medico_refiere}
                    </span>
                  </div>
                </td>

                {/* ── Fecha ── */}
                <td className={`px-3 py-3 border-b ${borderColor}`}>
                  <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ${
                      citaPasada
                        ? isDark
                          ? "bg-red-500/15 text-red-400"
                          : "bg-red-50 text-red-600"
                        : isDark
                        ? "bg-[#0f83b2]/10 text-[#0db1ec]"
                        : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="whitespace-nowrap">
                      {ref.fecha_cita ? formatDate(ref.fecha_cita) : "N/A"}
                    </span>
                  </div>
                </td>

                {/* ── Motivo ── */}
                <td className={`px-3 py-3 border-b ${borderColor} max-w-[160px]`}>
                  <p
                    className={`text-xs leading-relaxed line-clamp-2 ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                    title={ref.motivo_referencia}
                  >
                    {ref.motivo_referencia}
                  </p>
                  {triage && (
                    <span className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold ${triage.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${triage.dot}`} />
                      {triage.nombre} · {triage.tiempo}
                    </span>
                  )}
                  {esInasistencia && ref.motivo_inasistencia && (
                    <p
                      className={`text-xs mt-1.5 line-clamp-1 italic ${
                        isDark ? "text-red-400/80" : "text-red-500"
                      }`}
                      title={ref.motivo_inasistencia}
                    >
                      ↳ {ref.motivo_inasistencia}
                    </p>
                  )}
                </td>

                {/* ── Estatus ── */}
                <td className={`px-3 py-3 border-b ${borderColor}`}>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      isDark ? estatusCfg.dark : estatusCfg.light
                    }`}
                  >
                    <EstatusIcon className="w-3 h-3" />
                    {estatusCfg.label}
                  </span>
                </td>

                {/* ── Acciones ── */}
                <td className={`px-3 py-3 border-b ${borderColor}`}>
                  <div className="flex flex-col items-stretch gap-1.5 min-w-[110px]">

                    {/* Ver Detalle */}
                    <ActionButton
                      onClick={() => onVerDetalle(ref)}
                      tooltip="Ver detalle de la referencia"
                      isDark={isDark}
                      variant="primary"
                      icon={<Eye className="w-3.5 h-3.5" />}
                      label="Detalle"
                    />

                    {/* Contrareferir */}
                    {ref.estatus === "atendida" &&
                      !ref.tiene_contrareferencia &&
                      onContrareferir && (
                        <ActionButton
                          onClick={() => onContrareferir(ref)}
                          tooltip="Devolver paciente al médico que refirió"
                          isDark={isDark}
                          variant="purple"
                          icon={<ArrowLeftCircle className="w-3.5 h-3.5" />}
                          label="Contrareferir"
                        />
                      )}

                    {/* Solicitar Seguimiento */}
                    {ref.estatus === "atendida" &&
                      !ref.tiene_contrareferencia &&
                      !ref.tiene_seguimiento &&
                      onSolicitarSeguimiento && (
                        <ActionButton
                          onClick={() => onSolicitarSeguimiento(ref)}
                          tooltip="Solicitar seguimiento para este paciente"
                          isDark={isDark}
                          variant="amber"
                          icon={<RefreshCw className="w-3.5 h-3.5" />}
                          label="Seguimiento"
                        />
                      )}

                    {/* Marcar Inasistencia */}
                    {citaPasada && onMarcarInasistencia && (
                      <ActionButton
                        onClick={() => onMarcarInasistencia(ref)}
                        tooltip="Registrar inasistencia del paciente"
                        isDark={isDark}
                        variant="danger"
                        icon={<UserX className="w-3.5 h-3.5" />}
                        label="Inasistencia"
                      />
                    )}

                    {/* Descargar Constancia */}
                    {esInasistencia && ref.motivo_inasistencia && (
                      <ActionButton
                        onClick={() => handleDescargarConstancia(ref)}
                        tooltip="Descargar constancia de inasistencia"
                        isDark={isDark}
                        variant="amber"
                        disabled={descargando === ref.id_referencia}
                        icon={
                          descargando === ref.id_referencia
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <FileDown className="w-3.5 h-3.5" />
                        }
                        label="Constancia"
                      />
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── Componente botón de acción reutilizable ── */
type ActionVariant = "primary" | "purple" | "danger" | "amber";

const VARIANT_STYLES: Record<ActionVariant, { dark: string; light: string }> = {
  primary: {
    dark:  "bg-[#0f83b2]/20 hover:bg-[#0f83b2]/40 text-[#0db1ec] border-[#0f83b2]/30 hover:border-[#0f83b2]/60 hover:shadow-[0_0_12px_rgba(15,131,178,0.25)]",
    light: "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 hover:border-blue-400 hover:shadow-[0_2px_8px_rgba(37,99,235,0.15)]",
  },
  purple: {
    dark:  "bg-purple-500/20 hover:bg-purple-500/35 text-purple-300 border-purple-500/30 hover:border-purple-400/60 hover:shadow-[0_0_12px_rgba(168,85,247,0.2)]",
    light: "bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 hover:border-purple-400 hover:shadow-[0_2px_8px_rgba(147,51,234,0.15)]",
  },
  danger: {
    dark:  "bg-red-500/20 hover:bg-red-500/35 text-red-400 border-red-500/30 hover:border-red-400/60 hover:shadow-[0_0_12px_rgba(239,68,68,0.2)]",
    light: "bg-red-50 hover:bg-red-100 text-red-600 border-red-200 hover:border-red-400 hover:shadow-[0_2px_8px_rgba(220,38,38,0.15)]",
  },
  amber: {
    dark:  "bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border-amber-500/30 hover:border-amber-400/60 hover:shadow-[0_0_12px_rgba(245,158,11,0.2)]",
    light: "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 hover:border-amber-400 hover:shadow-[0_2px_8px_rgba(217,119,6,0.15)]",
  },
};

interface ActionButtonProps {
  onClick: () => void;
  tooltip: string;
  isDark: boolean;
  variant: ActionVariant;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
}

function ActionButton({ onClick, tooltip, isDark, variant, icon, label, disabled }: ActionButtonProps) {
  const styles = VARIANT_STYLES[variant];
  return (
    <div className="relative group w-full">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5
          rounded-lg border text-xs font-semibold
          transition-all duration-200 ease-out
          active:scale-95
          disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
          ${isDark ? styles.dark : styles.light}
        `}
      >
        {icon}
        <span>{label}</span>
      </button>
      {/* Tooltip */}
      <div className={`
        pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2
        px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap
        opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0
        transition-all duration-150 z-50
        ${isDark
          ? "bg-gray-700 text-white shadow-lg"
          : "bg-gray-900 text-white shadow-lg"
        }
      `}>
        {tooltip}
        {/* Flecha del tooltip */}
        <span className={`
          absolute top-full left-1/2 -translate-x-1/2
          border-4 border-transparent
          ${isDark ? "border-t-gray-700" : "border-t-gray-900"}
        `} />
      </div>
    </div>
  );
}
