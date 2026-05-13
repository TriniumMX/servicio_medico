// src/components/referencias/admin/TabSeguimientosAdmin.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCcw, Bell, Calendar, User, CheckCircle, Clock, Info } from "lucide-react";
import type { ReferenciaEspecialidad } from "@/types/referencias";

interface Props {
  onNotificar: (referencia: ReferenciaEspecialidad) => void;
  onContadorChange: (count: number) => void;
  isDark: boolean;
}

const ESTATUS_CONFIG: Record<string, { label: string; classes: (dark: boolean) => string }> = {
  autorizada: {
    label: "Autorizada",
    classes: (dark) => dark
      ? "bg-blue-500/15 text-blue-300 border-blue-500/20"
      : "bg-blue-50 text-blue-700 border-blue-100",
  },
  asignada: {
    label: "Lista para notificar",
    classes: (dark) => dark
      ? "bg-green-500/15 text-green-300 border-green-500/20"
      : "bg-green-50 text-green-700 border-green-100",
  },
  notificada: {
    label: "Notificada",
    classes: (dark) => dark
      ? "bg-gray-500/15 text-gray-400 border-gray-500/20"
      : "bg-gray-100 text-gray-500 border-gray-200",
  },
};

export default function TabSeguimientosAdmin({ onNotificar, onContadorChange, isDark }: Props) {
  const [seguimientos, setSeguimientos] = useState<ReferenciaEspecialidad[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/referencias/admin/seguimientos");
      const data = await res.json();
      if (data.success) {
        setSeguimientos(data.referencias || []);
        // Notificar al padre cuántos están "lista para notificar"
        const pendientes = (data.referencias || []).filter(
          (r: ReferenciaEspecialidad) => r.estatus === "asignada"
        ).length;
        onContadorChange(pendientes);
      }
    } catch (e) {
      console.error("Error al cargar seguimientos admin:", e);
    } finally {
      setLoading(false);
    }
  }, [onContadorChange]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const formatDate = (ds: string | null | undefined) => {
    if (!ds) return "—";
    return new Date(ds).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className={`rounded-xl p-12 text-center ${isDark ? "bg-[#0a1929] border border-[#0f83b2]/20" : "bg-white border border-gray-200"}`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto ${isDark ? "border-amber-400" : "border-amber-500"}`} />
        <p className={`mt-4 text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>Cargando seguimientos...</p>
      </div>
    );
  }

  if (seguimientos.length === 0) {
    return (
      <div className={`rounded-xl p-12 text-center ${isDark ? "bg-[#0a1929] border border-[#0f83b2]/20" : "bg-white border border-gray-200"}`}>
        <RefreshCcw className={`w-14 h-14 mx-auto mb-4 ${isDark ? "text-gray-600" : "text-gray-300"}`} />
        <h3 className={`text-lg font-bold mb-1 ${isDark ? "text-gray-300" : "text-gray-600"}`}>Sin seguimientos activos</h3>
        <p className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>
          Los seguimientos autorizados por el coordinador aparecerán aquí.
        </p>
      </div>
    );
  }

  const asignadas = seguimientos.filter((r) => r.estatus === "asignada");
  const otras = seguimientos.filter((r) => r.estatus !== "asignada");
  const ordenadas = [...asignadas, ...otras];

  return (
    <div className="space-y-4">
      {/* Resumen rápido */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Lista para notificar", count: asignadas.length, color: isDark ? "text-green-400" : "text-green-600" },
          { label: "Pendiente de asignación", count: seguimientos.filter(r => r.estatus === "autorizada").length, color: isDark ? "text-blue-400" : "text-blue-600" },
          { label: "Ya notificadas", count: seguimientos.filter(r => r.estatus === "notificada").length, color: isDark ? "text-gray-400" : "text-gray-500" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-3 text-center border ${isDark ? "bg-[#0d2137]/60 border-white/5" : "bg-gray-50 border-gray-100"}`}>
            <p className={`text-xl font-mono font-bold ${s.color}`}>{s.count}</p>
            <p className={`text-[10px] font-medium mt-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Botón actualizar */}
      <div className="flex justify-end">
        <button
          onClick={cargar}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${isDark
            ? "bg-transparent border-amber-500/20 text-amber-400 hover:bg-amber-500/10"
            : "bg-white border-amber-200 text-amber-600 hover:bg-amber-50"}`}
        >
          <RefreshCcw className="w-3 h-3" />
          Actualizar
        </button>
      </div>

      {/* Vista móvil */}
      <div className="sm:hidden space-y-3">
        {ordenadas.map((ref) => {
          const cfg = ESTATUS_CONFIG[ref.estatus] ?? ESTATUS_CONFIG.autorizada;
          const puedeNotificar = ref.estatus === "asignada";
          return (
            <div key={`m-${ref.id_referencia}`} className={`rounded-xl p-4 border ${isDark ? "bg-[#0d1f2d] border-amber-500/15" : "bg-white border-amber-100"}`}>
              {/* badge SEGUIMIENTO */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${isDark ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-700"}`}>
                    {ref.nombre_paciente.charAt(0)}
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>{ref.nombre_paciente}</p>
                    <p className={`text-xs font-mono ${isDark ? "text-gray-400" : "text-gray-500"}`}>{ref.no_nomina}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.classes(isDark)}`}>
                  {cfg.label}
                </span>
              </div>
              <div className={`grid grid-cols-2 gap-2 text-xs mb-3 p-2.5 rounded-lg ${isDark ? "bg-black/20" : "bg-gray-50"}`}>
                <div>
                  <p className={`text-[10px] uppercase tracking-wider mb-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Especialidad</p>
                  <p className={`font-medium ${isDark ? "text-gray-200" : "text-gray-700"}`}>{ref.nombre_especialidad}</p>
                </div>
                <div>
                  <p className={`text-[10px] uppercase tracking-wider mb-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Fecha sugerida</p>
                  <p className={`font-medium ${isDark ? "text-gray-200" : "text-gray-700"}`}>{formatDate(ref.fecha_sugerida_seguimiento)}</p>
                </div>
                <div className="col-span-2">
                  <p className={`text-[10px] uppercase tracking-wider mb-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Médico sugerido</p>
                  <p className={`font-medium ${isDark ? "text-gray-200" : "text-gray-700"}`}>{ref.nombre_medico_sugerido ?? "—"}</p>
                </div>
                {ref.fecha_cita && (
                  <div className="col-span-2">
                    <p className={`text-[10px] uppercase tracking-wider mb-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Cita asignada</p>
                    <p className={`font-medium ${isDark ? "text-green-300" : "text-green-700"}`}>{formatDate(ref.fecha_cita)}</p>
                  </div>
                )}
              </div>
              {puedeNotificar && (
                <button
                  onClick={() => onNotificar(ref)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                >
                  <Bell className="w-3.5 h-3.5" />
                  Notificar al Paciente
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Vista escritorio */}
      <div className={`hidden sm:block rounded-xl overflow-hidden border shadow-sm ${isDark ? "bg-[#0a1929] border-amber-500/15" : "bg-white border-amber-100"}`}>
        <table className="w-full">
          <thead>
            <tr className={`border-b text-left text-[11px] font-bold uppercase tracking-wider ${isDark ? "bg-amber-500/5 border-amber-500/15 text-amber-400/70" : "bg-amber-50/60 border-amber-100 text-amber-700/70"}`}>
              <th className="px-5 py-3.5">Folio</th>
              <th className="px-5 py-3.5">Paciente</th>
              <th className="px-5 py-3.5">Especialidad</th>
              <th className="px-5 py-3.5">Médico sugerido</th>
              <th className="px-5 py-3.5">Fecha sugerida</th>
              <th className="px-5 py-3.5">Cita asignada</th>
              <th className="px-5 py-3.5">Estatus</th>
              <th className="px-5 py-3.5 text-center">Acción</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? "divide-amber-500/10" : "divide-amber-50"}`}>
            {ordenadas.map((ref) => {
              const cfg = ESTATUS_CONFIG[ref.estatus] ?? ESTATUS_CONFIG.autorizada;
              const puedeNotificar = ref.estatus === "asignada";
              return (
                <tr key={ref.id_referencia} className={`transition-colors ${isDark ? "hover:bg-amber-500/5" : "hover:bg-amber-50/30"}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-col gap-0.5">
                      <span className={`font-mono font-bold text-xs ${isDark ? "text-amber-400" : "text-amber-700"}`}>
                        {ref.folio || "—"}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold w-fit bg-amber-500 text-white tracking-wide`}>
                        SEGUIMIENTO
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${isDark ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-700"}`}>
                        {ref.nombre_paciente.charAt(0)}
                      </div>
                      <div>
                        <p className={`font-bold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>{ref.nombre_paciente}</p>
                        <p className={`text-xs font-mono ${isDark ? "text-gray-400" : "text-gray-500"}`}>{ref.no_nomina}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      {ref.nombre_especialidad}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <User className={`w-3.5 h-3.5 shrink-0 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                      <span className={`text-xs ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        {ref.nombre_medico_sugerido ?? "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Calendar className={`w-3.5 h-3.5 shrink-0 ${isDark ? "text-amber-500/60" : "text-amber-400"}`} />
                      <span className={`text-xs ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        {formatDate(ref.fecha_sugerida_seguimiento)}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {ref.fecha_cita ? (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className={`w-3.5 h-3.5 shrink-0 ${isDark ? "text-green-400" : "text-green-500"}`} />
                        <span className={`text-xs font-medium ${isDark ? "text-green-300" : "text-green-700"}`}>
                          {formatDate(ref.fecha_cita)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Clock className={`w-3.5 h-3.5 shrink-0 ${isDark ? "text-gray-600" : "text-gray-300"}`} />
                        <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>Pendiente</span>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.classes(isDark)}`}>
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {puedeNotificar ? (
                      <button
                        onClick={() => onNotificar(ref)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-sm shadow-amber-500/20 hover:scale-105"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        Notificar
                      </button>
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        <Info className={`w-3.5 h-3.5 ${isDark ? "text-gray-600" : "text-gray-300"}`} />
                        <span className={`text-xs ${isDark ? "text-gray-600" : "text-gray-400"}`}>
                          {ref.estatus === "autorizada" ? "Esperando hospital" : "Completada"}
                        </span>
                      </div>
                    )}
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
