// src/components/referencias/coordinador/TabSeguimientos.tsx
"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Calendar, User, Stethoscope, AlertCircle, RefreshCcw } from "lucide-react";
import type { ReferenciaEspecialidad } from "@/types/referencias";

interface Props {
  onVerDetalle: (referencia: ReferenciaEspecialidad) => void;
  onContadorChange: (count: number) => void;
  isDark: boolean;
  refreshKey?: number;
}

const diasHastaCita = (fecha: string): number => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const cita = new Date(fecha);
  cita.setHours(0, 0, 0, 0);
  return Math.ceil((cita.getTime() - hoy.getTime()) / 86400000);
};

const puedeAutorizar = (seg: ReferenciaEspecialidad): boolean => {
  if (!seg.fecha_sugerida_seguimiento) return true;
  return diasHastaCita(seg.fecha_sugerida_seguimiento) <= 30;
};

export default function TabSeguimientos({ onVerDetalle, onContadorChange, isDark, refreshKey }: Props) {
  const [seguimientos, setSeguimientos] = useState<ReferenciaEspecialidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarSeguimientos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const cargarSeguimientos = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/referencias/coordinador/seguimientos");
      const data = await response.json();

      if (data.success) {
        setSeguimientos(data.referencias || []);
        onContadorChange(data.referencias?.length || 0);
      } else {
        setError(data.error || "Error al cargar seguimientos");
      }
    } catch {
      setError("Error de conexión al cargar seguimientos");
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div
        className={`rounded-xl shadow-lg p-12 text-center ${
          isDark
            ? "bg-[#0a1929] border border-[#0f83b2]/20"
            : "bg-white border border-gray-200"
        }`}
      >
        <div
          className={`animate-spin rounded-full h-16 w-16 border-b-2 mx-auto ${
            isDark ? "border-amber-400" : "border-amber-500"
          }`}
        />
        <p className={`mt-4 font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}>
          Cargando seguimientos...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`rounded-xl p-6 border ${
          isDark
            ? "bg-red-500/10 border-red-500/30"
            : "bg-red-50 border-red-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className={`text-sm ${isDark ? "text-red-300" : "text-red-700"}`}>{error}</p>
          <button
            onClick={cargarSeguimientos}
            className="ml-auto text-xs underline opacity-70 hover:opacity-100"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (seguimientos.length === 0) {
    return (
      <div
        className={`rounded-xl shadow-lg p-12 text-center ${
          isDark
            ? "bg-[#0a1929] border border-[#0f83b2]/20"
            : "bg-white border border-gray-200"
        }`}
      >
        <RefreshCcw
          className={`w-16 h-16 mx-auto mb-4 ${
            isDark ? "text-gray-600" : "text-gray-300"
          }`}
        />
        <h3
          className={`text-xl font-bold mb-2 ${
            isDark ? "text-gray-300" : "text-gray-600"
          }`}
        >
          No hay seguimientos pendientes
        </h3>
        <p className={`${isDark ? "text-gray-500" : "text-gray-400"}`}>
          Los seguimientos solicitados por especialistas aparecerán aquí
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl shadow-lg overflow-hidden ${
        isDark
          ? "bg-[#0a1929] border border-[#0f83b2]/20"
          : "bg-white border border-gray-200"
      }`}
    >
      {/* Toolbar */}
      <div
        className={`flex items-center justify-between px-6 py-4 border-b ${
          isDark ? "border-[#0f83b2]/20" : "border-gray-100"
        }`}
      >
        <div className="flex items-center gap-2">
          <RefreshCcw className={`w-5 h-5 ${isDark ? "text-amber-400" : "text-amber-600"}`} />
          <span className={`font-bold ${isDark ? "text-white" : "text-gray-800"}`}>
            Seguimientos por Autorizar
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              isDark
                ? "bg-amber-500/20 text-amber-400"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {seguimientos.length}
          </span>
        </div>
        <button
          onClick={cargarSeguimientos}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            isDark
              ? "text-gray-400 hover:bg-white/5 hover:text-white"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr
              className={`text-xs font-bold uppercase tracking-wider ${
                isDark
                  ? "bg-[#0d2137] text-gray-400"
                  : "bg-gray-50 text-gray-500"
              }`}
            >
              <th className="px-6 py-3 text-left">Paciente</th>
              <th className="px-6 py-3 text-left">Especialidad</th>
              <th className="px-6 py-3 text-left">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Médico sugerido
                </div>
              </th>
              <th className="px-6 py-3 text-left">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Fecha sugerida
                </div>
              </th>
              <th className="px-6 py-3 text-left">Solicitado</th>
              <th className="px-6 py-3 text-center">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100/10">
            {seguimientos.map((seg) => (
              <tr
                key={seg.id_referencia}
                className={`transition-colors ${
                  isDark ? "hover:bg-amber-500/5" : "hover:bg-amber-50/50"
                }`}
              >
                {/* Paciente */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isDark
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {seg.nombre_paciente?.charAt(0) ?? "?"}
                    </div>
                    <div>
                      <p
                        className={`font-semibold text-sm ${
                          isDark ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {seg.nombre_paciente}
                      </p>
                      <p
                        className={`text-xs ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {seg.no_nomina}
                        {seg.departamento && ` · ${seg.departamento}`}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Especialidad */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Stethoscope
                      className={`w-4 h-4 shrink-0 ${
                        isDark ? "text-amber-400" : "text-amber-600"
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        isDark ? "text-gray-200" : "text-gray-700"
                      }`}
                    >
                      {seg.nombre_especialidad}
                    </span>
                  </div>
                </td>

                {/* Médico sugerido */}
                <td className="px-6 py-4">
                  {seg.nombre_medico_sugerido ? (
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        isDark
                          ? "bg-[#0f83b2]/15 text-[#0db1ec]"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      <User className="w-3 h-3" />
                      {seg.nombre_medico_sugerido}
                    </div>
                  ) : (
                    <span
                      className={`text-xs ${
                        isDark ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      —
                    </span>
                  )}
                </td>

                {/* Fecha sugerida */}
                <td className="px-6 py-4">
                  {seg.fecha_sugerida_seguimiento ? (
                    <div className="flex items-center gap-1.5">
                      <Calendar
                        className={`w-4 h-4 ${
                          isDark ? "text-amber-400" : "text-amber-600"
                        }`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          isDark ? "text-amber-300" : "text-amber-700"
                        }`}
                      >
                        {formatearFecha(seg.fecha_sugerida_seguimiento)}
                      </span>
                    </div>
                  ) : (
                    <span
                      className={`text-xs ${
                        isDark ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      —
                    </span>
                  )}
                </td>

                {/* Fecha de solicitud */}
                <td className="px-6 py-4">
                  <span
                    className={`text-xs ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {formatearFecha(seg.creado_en)}
                  </span>
                </td>

                {/* Acción */}
                <td className="px-6 py-4 text-center">
                  {(() => {
                    const puede = puedeAutorizar(seg);
                    const dias = seg.fecha_sugerida_seguimiento ? diasHastaCita(seg.fecha_sugerida_seguimiento) : 0;
                    const faltan = Math.max(0, dias - 30);
                    return (
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => puede && onVerDetalle(seg)}
                          disabled={!puede}
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            puede
                              ? isDark
                                ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/40 border border-amber-500/30"
                                : "bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200"
                              : isDark
                                ? "bg-gray-800/60 text-gray-500 border border-gray-700/50 cursor-not-allowed"
                                : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                          }`}
                        >
                          {puede ? "Revisar" : "Bloqueado"}
                        </button>
                        {!puede && faltan > 0 && (
                          <span className={`text-[10px] font-medium ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                            Disponible en {faltan}d
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
