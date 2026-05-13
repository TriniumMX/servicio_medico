"use client";

import {
  Eye,
  FileText,
  Calendar,
  User,
  ArrowLeftCircle,
  Clock,
  CheckCircle2,
  BookOpen,
} from "lucide-react";
import type { Contrareferencia } from "@/types/contrareferencias";

interface Props {
  contrareferencias: Contrareferencia[];
  onVerDetalle: (contrareferencia: Contrareferencia) => void;
  isDark: boolean;
}

const ESTATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; dark: string; light: string }
> = {
  pendiente: {
    label: "Pendiente",
    icon: Clock,
    dark: "bg-yellow-500/15 text-yellow-300 border-yellow-500/25",
    light: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  vista: {
    label: "Vista",
    icon: BookOpen,
    dark: "bg-blue-500/15 text-blue-300 border-blue-500/25",
    light: "bg-blue-50 text-blue-700 border-blue-200",
  },
  cerrada: {
    label: "Cerrada",
    icon: CheckCircle2,
    dark: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
    light: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

function ActionButton({
  onClick,
  tooltip,
  isDark,
  icon,
  label,
}: {
  onClick: () => void;
  tooltip: string;
  isDark: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="relative group w-full">
      <button
        onClick={onClick}
        className={`
          w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5
          rounded-lg border text-xs font-semibold
          transition-all duration-200 ease-out active:scale-95
          ${isDark
            ? "bg-[#0f83b2]/20 hover:bg-[#0f83b2]/40 text-[#0db1ec] border-[#0f83b2]/30 hover:border-[#0f83b2]/60 hover:shadow-[0_0_12px_rgba(15,131,178,0.25)]"
            : "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 hover:border-blue-400 hover:shadow-[0_2px_8px_rgba(37,99,235,0.15)]"
          }
        `}
      >
        {icon}
        <span>{label}</span>
      </button>
      <div className={`
        pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2
        px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap z-50
        opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0
        transition-all duration-150
        ${isDark ? "bg-gray-700 text-white shadow-lg" : "bg-gray-900 text-white shadow-lg"}
      `}>
        {tooltip}
        <span className={`absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent ${isDark ? "border-t-gray-700" : "border-t-gray-900"}`} />
      </div>
    </div>
  );
}

export default function TablaContrareferencias({
  contrareferencias,
  onVerDetalle,
  isDark,
}: Props) {
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
          <tr className={isDark ? "bg-[#071520]" : "bg-gray-50"}>
            {["Folio", "Paciente", "Especialista Remitente", "Fecha de Creación", "Estatus", "Acciones"].map(
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
          {contrareferencias.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center">
                <div className="flex flex-col items-center gap-3">
                  <ArrowLeftCircle className={`w-12 h-12 ${isDark ? "text-gray-600" : "text-gray-400"}`} />
                  <p className={`text-lg font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    No tienes contrareferencias
                  </p>
                  <p className={`text-sm ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                    Aquí aparecerán las contrareferencias que los especialistas te devuelvan
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            contrareferencias.map((contra) => {
              const estatusCfg = ESTATUS_CONFIG[contra.estatus] ?? {
                label: contra.estatus,
                icon: Clock,
                dark: "bg-gray-500/15 text-gray-300 border-gray-500/25",
                light: "bg-gray-50 text-gray-600 border-gray-200",
              };
              const EstatusIcon = estatusCfg.icon;
              const borderColor = isDark ? "border-[#0f83b2]/10" : "border-gray-100";

              return (
                <tr
                  key={contra.id_contrareferencia}
                  className={`transition-colors duration-150 ${
                    isDark
                      ? "bg-[#0a1929]/60 hover:bg-[#0f2744]/60"
                      : "bg-white hover:bg-blue-50/40"
                  }`}
                >
                  {/* ── Folio ── */}
                  <td className={`px-3 py-3 border-b ${borderColor}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isDark ? "bg-[#0f83b2]/15" : "bg-blue-50"
                      }`}>
                        <FileText className={`w-3.5 h-3.5 ${isDark ? "text-[#0db1ec]" : "text-blue-500"}`} />
                      </div>
                      <div>
                        <span className={`font-bold text-sm ${isDark ? "text-[#0db1ec]" : "text-blue-600"}`}>
                          {contra.folio}
                        </span>
                        {contra.es_parte_cascada && (
                          <p className={`text-xs italic ${isDark ? "text-purple-400" : "text-purple-600"}`}>
                            Cascada niv. {contra.nivel_cascada}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* ── Paciente ── */}
                  <td className={`px-3 py-3 border-b ${borderColor}`}>
                    <div className="flex items-start gap-2.5">
                      <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                        isDark ? "bg-[#0f83b2]/20 text-[#0db1ec]" : "bg-blue-100 text-blue-700"
                      }`}>
                        {contra.nombre_paciente.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className={`font-semibold text-sm leading-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                          {contra.nombre_paciente}
                        </p>
                        <p className={`text-xs mt-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                          Nómina: <span className="font-medium">{contra.no_nomina}</span>
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* ── Especialista Remitente ── */}
                  <td className={`px-3 py-3 border-b ${borderColor}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isDark ? "bg-[#0f83b2]/15" : "bg-gray-100"
                      }`}>
                        <User className={`w-3.5 h-3.5 ${isDark ? "text-[#0db1ec]" : "text-gray-500"}`} />
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                          {contra.nombre_medico_contrarrefiere}
                        </p>
                        <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                          {contra.nombre_especialidad_remitente}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* ── Fecha ── */}
                  <td className={`px-3 py-3 border-b ${borderColor}`}>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ${
                      isDark ? "bg-[#0f83b2]/10 text-[#0db1ec]" : "bg-blue-50 text-blue-700"
                    }`}>
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="whitespace-nowrap">{formatDate(contra.creado_en)}</span>
                    </div>
                  </td>

                  {/* ── Estatus ── */}
                  <td className={`px-3 py-3 border-b ${borderColor}`}>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      isDark ? estatusCfg.dark : estatusCfg.light
                    }`}>
                      <EstatusIcon className="w-3 h-3" />
                      {estatusCfg.label}
                    </span>
                  </td>

                  {/* ── Acciones ── */}
                  <td className={`px-3 py-3 border-b ${borderColor}`}>
                    <div className="flex flex-col items-stretch gap-1.5 min-w-[110px]">
                      <ActionButton
                        onClick={() => onVerDetalle(contra)}
                        tooltip="Ver detalle de la contrareferencia"
                        isDark={isDark}
                        icon={<Eye className="w-3.5 h-3.5" />}
                        label="Ver Detalle"
                      />
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
