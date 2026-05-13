"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  RefreshCw,
  Stethoscope,
  Clock,
  FileText,
  CalendarDays,
} from "lucide-react";
import type { MedicoAgenda, CitaAgenda } from "@/app/api/referencias/hospital/agenda/route";

interface Props {
  isDark: boolean;
}

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function generarCeldasMes(anio: number, mes: number): (number | null)[] {
  // getDay() retorna 0=Dom, ajustamos para semana que inicia lunes
  const primerDia = new Date(anio, mes, 1).getDay();
  const offset = primerDia === 0 ? 6 : primerDia - 1;
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const celdas: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= diasEnMes; d++) celdas.push(d);
  return celdas;
}

function citasDelDia(citas: CitaAgenda[], anio: number, mes: number, dia: number): CitaAgenda[] {
  return citas.filter((c) => {
    const f = new Date(c.fecha_cita);
    return f.getFullYear() === anio && f.getMonth() === mes && f.getDate() === dia;
  });
}

function formatHora(fechaIso: string): string {
  const f = new Date(fechaIso);
  return f.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export default function AgendaMedicos({ isDark }: Props) {
  const [medicos, setMedicos] = useState<MedicoAgenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [medicoId, setMedicoId] = useState<number | null>(null);

  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth());
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [diaSeleccionado, setDiaSeleccionado] = useState<number | null>(null);

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/referencias/hospital/agenda");
      const data = await res.json();
      if (data.success) {
        setMedicos(data.medicos || []);
        if (data.medicos?.length > 0) setMedicoId(data.medicos[0].id_usuario);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const medicoActivo = medicos.find((m) => m.id_usuario === medicoId) ?? null;
  const celdas = generarCeldasMes(anio, mes);
  const citasDiaActivo = diaSeleccionado !== null
    ? citasDelDia(medicoActivo?.citas ?? [], anio, mes, diaSeleccionado)
    : [];

  const prevMes = () => {
    setDiaSeleccionado(null);
    if (mes === 0) { setMes(11); setAnio((a) => a - 1); }
    else setMes((m) => m - 1);
  };
  const nextMes = () => {
    setDiaSeleccionado(null);
    if (mes === 11) { setMes(0); setAnio((a) => a + 1); }
    else setMes((m) => m + 1);
  };

  // ─── LOADING ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`rounded-2xl border p-12 text-center ${isDark ? "bg-[#0a1929] border-[#0f83b2]/20" : "bg-white border-gray-200"}`}>
        <div className={`animate-spin rounded-full h-10 w-10 border-b-2 mx-auto ${isDark ? "border-[#0db1ec]" : "border-blue-500"}`} />
        <p className={`mt-4 text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>Cargando agenda...</p>
      </div>
    );
  }

  // ─── VACÍO ────────────────────────────────────────────────────────────────
  if (medicos.length === 0) {
    return (
      <div className={`rounded-2xl border p-12 text-center ${isDark ? "bg-[#0a1929] border-[#0f83b2]/20" : "bg-white border-gray-200"}`}>
        <CalendarDays className={`w-14 h-14 mx-auto mb-4 ${isDark ? "text-gray-600" : "text-gray-300"}`} />
        <h3 className={`text-lg font-bold mb-1 ${isDark ? "text-gray-300" : "text-gray-600"}`}>Sin citas agendadas</h3>
        <p className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>
          Aún no hay referencias asignadas con fecha de cita.
        </p>
        <button
          onClick={cargar}
          className={`mt-6 flex items-center gap-2 mx-auto px-4 py-2 rounded-xl text-sm font-bold transition-colors ${isDark ? "bg-[#0f83b2]/20 text-[#0db1ec] hover:bg-[#0f83b2]/30" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>
    );
  }

  // ─── MAIN ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">

      {/* Barra superior: título + actualizar */}
      <div className="flex items-center justify-between">
        <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          {medicos.length} {medicos.length === 1 ? "médico con agenda" : "médicos con agenda"}
        </p>
        <button
          onClick={cargar}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border ${isDark ? "bg-[#0d1f2d] border-[#0f83b2]/20 text-[#0db1ec] hover:bg-[#0f83b2]/10" : "bg-white border-gray-200 text-blue-600 hover:bg-gray-50"}`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Actualizar
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">

        {/* ── PANEL MÉDICOS ────────────────────────────────────────────────── */}
        <div className="lg:w-72 shrink-0">
          <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-[#0a1929] border-[#0f83b2]/20" : "bg-white border-gray-200"}`}>
            <div className={`px-4 py-3 border-b ${isDark ? "bg-[#0d2137]/60 border-[#0f83b2]/20" : "bg-gray-50 border-gray-100"}`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-[#0db1ec]" : "text-blue-700"}`}>
                Médicos Especialistas
              </h3>
            </div>
            <div className="divide-y">
              {medicos.map((m) => {
                const activo = m.id_usuario === medicoId;
                return (
                  <button
                    key={m.id_usuario}
                    onClick={() => { setMedicoId(m.id_usuario); setDiaSeleccionado(null); }}
                    className={`w-full text-left px-4 py-3.5 flex items-start gap-3 transition-colors ${
                      activo
                        ? isDark
                          ? "bg-[#0f83b2]/15 border-l-2 border-[#0db1ec]"
                          : "bg-blue-50 border-l-2 border-blue-500"
                        : isDark
                        ? "hover:bg-white/[0.03] border-l-2 border-transparent divide-[#0f83b2]/10"
                        : "hover:bg-gray-50/70 border-l-2 border-transparent divide-gray-100"
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${activo
                      ? isDark ? "bg-[#0db1ec]/20 text-[#0db1ec]" : "bg-blue-100 text-blue-600"
                      : isDark ? "bg-white/5 text-gray-500" : "bg-gray-100 text-gray-400"
                    }`}>
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${activo
                        ? isDark ? "text-[#0db1ec]" : "text-blue-700"
                        : isDark ? "text-gray-200" : "text-gray-800"
                      }`}>
                        {m.nombre}
                      </p>
                      <p className={`text-xs truncate mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                        {m.especialidad}
                      </p>
                      <div className={`mt-1.5 inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                        activo
                          ? isDark ? "bg-[#0db1ec]/20 text-[#0db1ec]" : "bg-blue-100 text-blue-700"
                          : isDark ? "bg-white/5 text-gray-400" : "bg-gray-100 text-gray-500"
                      }`}>
                        <Calendar className="w-3 h-3" />
                        {m.total_citas} {m.total_citas === 1 ? "cita" : "citas"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── PANEL CALENDARIO ─────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col gap-4">

          {medicoActivo ? (
            <>
              {/* Calendario */}
              <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-[#0a1929] border-[#0f83b2]/20" : "bg-white border-gray-200"}`}>

                {/* Header mes */}
                <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? "bg-[#0d2137]/60 border-[#0f83b2]/20" : "bg-gray-50 border-gray-100"}`}>
                  <button
                    onClick={prevMes}
                    className={`p-1.5 rounded-lg transition-colors ${isDark ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-200 text-gray-500"}`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="text-center">
                    <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                      {MESES[mes]} {anio}
                    </h3>
                    <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      {medicoActivo.nombre}
                    </p>
                  </div>
                  <button
                    onClick={nextMes}
                    className={`p-1.5 rounded-lg transition-colors ${isDark ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-200 text-gray-500"}`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Grid días semana */}
                <div className="p-4">
                  <div className="grid grid-cols-7 mb-1">
                    {DIAS_SEMANA.map((d) => (
                      <div key={d} className={`text-center text-xs font-bold py-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Grid celdas */}
                  <div className="grid grid-cols-7 gap-1">
                    {celdas.map((dia, i) => {
                      if (dia === null) {
                        return <div key={`empty-${i}`} />;
                      }

                      const citasHoy = citasDelDia(medicoActivo.citas, anio, mes, dia);
                      const tieneAsignada  = citasHoy.some((c) => c.estatus === "asignada");
                      const tieneNotificada = citasHoy.some((c) => c.estatus === "notificada");
                      const esHoy = hoy.getDate() === dia && hoy.getMonth() === mes && hoy.getFullYear() === anio;
                      const esSeleccionado = diaSeleccionado === dia;

                      return (
                        <button
                          key={dia}
                          onClick={() => setDiaSeleccionado(esSeleccionado ? null : dia)}
                          className={`
                            relative flex flex-col items-center justify-start pt-1.5 pb-2 rounded-xl
                            min-h-[52px] transition-all text-xs font-medium
                            ${esSeleccionado
                              ? isDark
                                ? "bg-[#0f83b2]/30 ring-1 ring-[#0db1ec] text-white"
                                : "bg-blue-100 ring-1 ring-blue-500 text-blue-800"
                              : esHoy
                              ? isDark
                                ? "bg-[#0f83b2]/10 text-[#0db1ec] font-bold"
                                : "bg-blue-50 text-blue-600 font-bold"
                              : isDark
                              ? "hover:bg-white/5 text-gray-300"
                              : "hover:bg-gray-50 text-gray-700"
                            }
                          `}
                        >
                          <span>{dia}</span>

                          {/* Puntos de citas */}
                          {citasHoy.length > 0 && (
                            <div className="flex items-center gap-0.5 mt-1 flex-wrap justify-center">
                              {tieneAsignada && (
                                <span className={`w-1.5 h-1.5 rounded-full ${isDark ? "bg-[#0db1ec]" : "bg-blue-500"}`} />
                              )}
                              {tieneNotificada && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              )}
                              {citasHoy.length > 1 && (
                                <span className={`text-[9px] font-bold leading-none ${isDark ? "text-gray-400" : "text-gray-400"}`}>
                                  {citasHoy.length}
                                </span>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Leyenda */}
                  <div className={`flex items-center gap-4 mt-4 pt-3 border-t text-xs ${isDark ? "border-[#0f83b2]/10 text-gray-500" : "border-gray-100 text-gray-400"}`}>
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${isDark ? "bg-[#0db1ec]" : "bg-blue-500"}`} />
                      Asignada
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Notificada
                    </span>
                    <span className={`flex items-center gap-1.5 ml-auto ${isDark ? "text-[#0db1ec]" : "text-blue-600"}`}>
                      Total: {medicoActivo.total_citas} {medicoActivo.total_citas === 1 ? "cita" : "citas"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Panel detalle del día */}
              {diaSeleccionado !== null && (
                <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-[#0a1929] border-[#0f83b2]/20" : "bg-white border-gray-200"}`}>
                  <div className={`px-5 py-3.5 border-b flex items-center gap-3 ${isDark ? "bg-[#0d2137]/60 border-[#0f83b2]/20" : "bg-gray-50 border-gray-100"}`}>
                    <CalendarDays className={`w-4 h-4 ${isDark ? "text-[#0db1ec]" : "text-blue-600"}`} />
                    <h3 className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                      {diaSeleccionado} de {MESES[mes]} {anio}
                    </h3>
                    <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${
                      citasDiaActivo.length === 0
                        ? isDark ? "bg-gray-500/20 text-gray-400" : "bg-gray-100 text-gray-500"
                        : isDark ? "bg-[#0db1ec]/20 text-[#0db1ec]" : "bg-blue-100 text-blue-700"
                    }`}>
                      {citasDiaActivo.length} {citasDiaActivo.length === 1 ? "cita" : "citas"}
                    </span>
                  </div>

                  {citasDiaActivo.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                      <Calendar className={`w-10 h-10 mx-auto mb-3 ${isDark ? "text-gray-600" : "text-gray-300"}`} />
                      <p className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                        Sin citas en este día para {medicoActivo.nombre}
                      </p>
                    </div>
                  ) : (
                    <div className={`divide-y ${isDark ? "divide-[#0f83b2]/10" : "divide-gray-100"}`}>
                      {citasDiaActivo
                        .sort((a, b) => new Date(a.fecha_cita).getTime() - new Date(b.fecha_cita).getTime())
                        .map((cita) => (
                          <div key={cita.id_referencia} className={`flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50/50"}`}>
                            {/* Hora */}
                            <div className={`flex items-center gap-2 shrink-0 w-20 ${isDark ? "text-[#0db1ec]" : "text-blue-600"}`}>
                              <Clock className="w-4 h-4 shrink-0" />
                              <span className="text-sm font-bold tabular-nums">{formatHora(cita.fecha_cita)}</span>
                            </div>

                            {/* Info paciente */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className={`font-semibold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>
                                  {cita.nombre_paciente}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                  cita.estatus === "notificada"
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : isDark ? "bg-[#0db1ec]/20 text-[#0db1ec]" : "bg-blue-100 text-blue-700"
                                }`}>
                                  {cita.estatus === "notificada" ? "Notificada" : "Asignada"}
                                </span>
                              </div>
                              <div className={`flex flex-wrap gap-x-4 gap-y-0.5 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                <span className="flex items-center gap-1">
                                  <Stethoscope className="w-3 h-3" />
                                  {cita.nombre_especialidad}
                                </span>
                                <span className="flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  Folio {cita.folio}
                                </span>
                                <span className="font-mono">Nómina: {cita.no_nomina}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className={`rounded-2xl border p-12 text-center ${isDark ? "bg-[#0a1929] border-[#0f83b2]/20" : "bg-white border-gray-200"}`}>
              <Calendar className={`w-14 h-14 mx-auto mb-4 ${isDark ? "text-gray-600" : "text-gray-300"}`} />
              <p className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                Selecciona un médico para ver su agenda
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
