import { useState, useEffect, useRef } from "react";
import { X, UserPlus, Calendar, AlertCircle, ShieldCheck, MessageSquare, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { es } from "date-fns/locale";
import "react-day-picker/dist/style.css";
import type { ReferenciaEspecialidad, MedicoEspecialista } from "@/types/referencias";

interface Props {
  referencia: ReferenciaEspecialidad | null;
  isOpen: boolean;
  onClose: () => void;
  onAsignar: (data: { id_medico_asignado: number; fecha_cita: string }) => Promise<void>;
  isDark: boolean;
  /** 'asignar' (default) = primera asignación | 'reprogramar' = cambiar cita ya existente */
  modo?: 'asignar' | 'reprogramar';
}

export default function ModalAsignarMedico({
  referencia,
  isOpen,
  onClose,
  onAsignar,
  isDark,
  modo = 'asignar',
}: Props) {
  const [medicos, setMedicos] = useState<MedicoEspecialista[]>([]);
  const [loadingMedicos, setLoadingMedicos] = useState(false);
  const [medicoSeleccionado, setMedicoSeleccionado] = useState("");
  const [fechaCita, setFechaCita] = useState("");
  const [horaCita, setHoraCita] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mostrarFirma, setMostrarFirma] = useState(false);

  // Agenda del médico seleccionado
  type AgendaDia = { dia_semana: number; hora_inicio: string; hora_fin: string };
  const DIAS_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const DIAS_FULL  = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const [agendaMedico, setAgendaMedico] = useState<AgendaDia[]>([]);
  const [errorFecha, setErrorFecha] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Cerrar calendario al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    };
    if (showCalendar) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showCalendar]);

  // Cuando cambia el médico seleccionado → cargar su agenda
  useEffect(() => {
    if (medicoSeleccionado) {
      fetch(`/api/referencias/hospital/agenda-medico/${medicoSeleccionado}`)
        .then(r => r.json())
        .then(d => { if (d.success) setAgendaMedico(d.agenda || []); })
        .catch(() => setAgendaMedico([]));
    } else {
      setAgendaMedico([]);
    }
    setErrorFecha(null);
  }, [medicoSeleccionado]);

  // Genera opciones de hora cada 30 min dentro del rango hora_inicio–hora_fin
  const generarOpcionesHora = (horaInicio: string, horaFin: string): string[] => {
    const opciones: string[] = [];
    const [hI, mI] = horaInicio.split(':').map(Number);
    const [hF, mF] = horaFin.split(':').map(Number);
    let totalMin = hI * 60 + mI;
    const finMin = hF * 60 + mF;
    while (totalMin <= finMin) {
      const h = String(Math.floor(totalMin / 60)).padStart(2, '0');
      const m = String(totalMin % 60).padStart(2, '0');
      opciones.push(`${h}:${m}`);
      totalMin += 30;
    }
    return opciones;
  };

  // Obtiene el slot de agenda para una fecha dada (undefined si el médico no tiene agenda ese día)
  const getSlotParaFecha = (fecha: string): AgendaDia | undefined => {
    if (!fecha || agendaMedico.length === 0) return undefined;
    const d = new Date(fecha + 'T12:00:00');
    return agendaMedico.find(a => a.dia_semana === d.getDay());
  };

  const handleFechaChange = (value: string) => {
    setFechaCita(value);
    setErrorFecha(null);
    if (!value || agendaMedico.length === 0) return;
    const slot = getSlotParaFecha(value);
    if (!slot) {
      const diasDisponibles = agendaMedico.map(a => DIAS_FULL[a.dia_semana]).join(', ');
      setErrorFecha(`El médico no tiene consulta ese día. Días disponibles: ${diasDisponibles}`);
    } else {
      // Sugerir la hora de inicio si la hora actual queda fuera del rango
      if (!horaCita || horaCita < slot.hora_inicio || horaCita > slot.hora_fin) {
        setHoraCita(slot.hora_inicio);
      }
    }
  };

  const esReprogramar = modo === 'reprogramar';

  useEffect(() => {
    if (isOpen && referencia) {
      cargarMedicos();
      setError(null);

      if (esReprogramar && referencia.fecha_cita) {
        // Pre-llenar con la cita actual para que el hospital solo cambie lo necesario
        const fechaActual = new Date(referencia.fecha_cita);
        setFechaCita(fechaActual.toISOString().split('T')[0]);
        setHoraCita(
          `${String(fechaActual.getHours()).padStart(2, '0')}:${String(fechaActual.getMinutes()).padStart(2, '0')}`
        );
        setMedicoSeleccionado(referencia.id_medico_asignado?.toString() ?? "");
      } else if (referencia.tipo_referencia === 'seguimiento' && referencia.id_medico_sugerido) {
        // Pre-seleccionar el médico sugerido por el especialista
        setMedicoSeleccionado(referencia.id_medico_sugerido.toString());
        setFechaCita(
          referencia.fecha_sugerida_seguimiento
            ? new Date(referencia.fecha_sugerida_seguimiento).toISOString().split('T')[0]
            : ""
        );
        setHoraCita("09:00");
      } else {
        setMedicoSeleccionado("");
        setFechaCita("");
        setHoraCita("09:00");
      }
    }
  }, [isOpen, referencia]);

  const cargarMedicos = async () => {
    if (!referencia) return;

    try {
      setLoadingMedicos(true);
      setError(null);

      const response = await fetch(
        `/api/referencias/hospital/medicos-disponibles/${referencia.id_especialidad_solicitada}`
      );
      const data = await response.json();

      if (data.success) {
        setMedicos(data.medicos || []);
        if (data.medicos.length === 0) {
          setError("No hay médicos especialistas disponibles para esta especialidad");
        }
      } else {
        setError(data.error || "Error al cargar médicos");
      }
    } catch (error) {
      console.error("Error al cargar médicos:", error);
      setError("Error de conexión al cargar médicos");
    } finally {
      setLoadingMedicos(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!medicoSeleccionado) {
      setError("Por favor seleccione un médico");
      return;
    }

    if (!fechaCita) {
      setError("Por favor seleccione una fecha para la cita");
      return;
    }

    if (!horaCita) {
      setError("Por favor seleccione una hora para la cita");
      return;
    }

    // Validar que la fecha corresponda a un día disponible del médico
    if (agendaMedico.length > 0) {
      const slot = getSlotParaFecha(fechaCita);
      if (!slot) {
        const diasDisponibles = agendaMedico.map(a => DIAS_FULL[a.dia_semana]).join(', ');
        setError(`La fecha seleccionada no es un día de consulta del médico. Días disponibles: ${diasDisponibles}`);
        return;
      }
      if (horaCita < slot.hora_inicio || horaCita > slot.hora_fin) {
        setError(`El horario del médico ese día es de ${slot.hora_inicio} a ${slot.hora_fin}`);
        return;
      }
    }

    // Validar que la fecha no sea en el pasado
    const fechaHora = new Date(`${fechaCita}T${horaCita}`);
    const ahora = new Date();

    if (fechaHora < ahora) {
      setError("La fecha y hora de la cita no puede ser en el pasado");
      return;
    }

    try {
      setSubmitting(true);
      await onAsignar({
        id_medico_asignado: parseInt(medicoSeleccionado),
        fecha_cita: fechaHora.toISOString(),
      });
    } catch (error) {
      console.error("Error al asignar:", error);
      setError("Error al asignar el médico");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !referencia) return null;

  const medicoElegido = medicos.find(
    (m) => m.id_usuario.toString() === medicoSeleccionado
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 ${isDark ? "bg-[#0a1929] border border-[#0f83b2]/20" : "bg-white"
          } max-h-[90vh] flex flex-col`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b shrink-0 ${isDark
            ? "bg-[#0d2137] border-[#0f83b2]/20"
            : "bg-gray-50 border-gray-100"
            }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${esReprogramar
              ? (isDark ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-600")
              : (isDark ? "bg-[#0f83b2]/20 text-[#0db1ec]" : "bg-blue-100 text-blue-600")}`}>
              {esReprogramar ? <RefreshCw className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
            </div>
            <div>
              <h2
                className={`text-xl font-bold leading-tight ${isDark ? "text-white" : "text-gray-900"
                  }`}
              >
                {esReprogramar ? "Reprogramar Cita" : "Asignar Médico"}
              </h2>
              <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Referencia #{referencia.id_referencia} · Folio {referencia.folio}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${isDark ? "hover:bg-white/5 text-gray-400" : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Información de la referencia */}
          <div
            className={`p-4 rounded-xl border ${isDark ? "bg-[#0d2137]/50 border-[#0f83b2]/20" : "bg-blue-50/50 border-blue-100"
              }`}
          >
            <h3
              className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? "text-[#0db1ec]" : "text-blue-700"
                }`}
            >
              Detalles del Paciente
            </h3>
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-4 text-sm`}>
              <div>
                <span className={`text-xs block mb-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Paciente</span>
                <p className={`font-semibold ${isDark ? "text-gray-200" : "text-gray-900"}`}>{referencia.nombre_paciente}</p>
              </div>
              <div>
                <span className={`text-xs block mb-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Nómina</span>
                <p className={`font-mono font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>{referencia.no_nomina}</p>
              </div>
              <div>
                <span className={`text-xs block mb-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Solicitado por</span>
                <p className={`font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>{referencia.nombre_medico_refiere}</p>
              </div>
              <div>
                <span className={`text-xs block mb-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Especialidad</span>
                <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${isDark ? "bg-purple-500/20 text-purple-300" : "bg-purple-100 text-purple-700"
                  }`}>
                  {referencia.nombre_especialidad}
                </div>
              </div>
              <div className={`sm:col-span-2 pt-2 border-t border-dashed ${isDark ? "border-gray-700/50" : "border-gray-200"}`}>
                <span className={`text-xs block mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Motivo de Referencia</span>
                <p className={`text-sm italic leading-relaxed ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                  "{referencia.motivo_referencia}"
                </p>
              </div>
            </div>
          </div>

          {/* Autorización del Coordinador */}
          {referencia.fecha_autorizacion && (
            <div
              className={`p-4 rounded-xl border ${isDark ? "bg-emerald-500/5 border-emerald-500/20" : "bg-emerald-50/50 border-emerald-100"}`}
            >
              <h3
                className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${isDark ? "text-emerald-400" : "text-emerald-700"}`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Autorización del Coordinador
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-sm">
                <div>
                  <span className={`text-xs block mb-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Autorizado por</span>
                  <p className={`font-semibold ${isDark ? "text-emerald-300" : "text-emerald-700"}`}>
                    {referencia.nombre_coordinador || 'Coordinador'}
                  </p>
                </div>
                <div>
                  <span className={`text-xs block mb-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Fecha de Autorización</span>
                  <p className={`font-medium ${isDark ? "text-gray-200" : "text-gray-700"}`}>
                    {new Date(referencia.fecha_autorizacion).toLocaleDateString("es-MX", {
                      year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                </div>
                {referencia.observaciones_coordinador && (
                  <div className="sm:col-span-2">
                    <span className={`text-xs block mb-1 flex items-center gap-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      <MessageSquare className="w-3 h-3" />
                      Observaciones
                    </span>
                    <p className={`text-sm italic leading-relaxed ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                      &ldquo;{referencia.observaciones_coordinador}&rdquo;
                    </p>
                  </div>
                )}
                {referencia.firma_digital && (
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={() => setMostrarFirma(!mostrarFirma)}
                      className={`flex items-center gap-2 text-xs font-bold transition-colors ${isDark ? "text-emerald-400 hover:text-emerald-300" : "text-emerald-600 hover:text-emerald-700"}`}
                    >
                      {mostrarFirma ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {mostrarFirma ? "Ocultar firma" : "Ver firma digital"}
                    </button>
                    {mostrarFirma && (
                      <div className={`mt-2 p-3 rounded-lg border ${isDark ? "bg-[#050b14] border-emerald-500/20" : "bg-white border-emerald-100"}`}>
                        <img
                          src={referencia.firma_digital}
                          alt="Firma del coordinador"
                          className="max-h-24 w-auto mx-auto"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Banner: seguimiento sugerido por especialista */}
          {referencia.tipo_referencia === 'seguimiento' && referencia.id_medico_sugerido && (
            <div className={`p-4 rounded-xl border ${isDark ? "bg-amber-500/10 border-amber-500/30" : "bg-amber-50 border-amber-200"}`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2 ${isDark ? "text-amber-400" : "text-amber-700"}`}>
                <RefreshCw className="w-3.5 h-3.5" />
                Seguimiento — Médico Sugerido
              </h3>
              <p className={`text-sm ${isDark ? "text-amber-200" : "text-amber-800"}`}>
                El especialista sugiere asignar a{" "}
                <span className="font-bold">{referencia.nombre_medico_sugerido || "el mismo especialista"}</span>
                {referencia.fecha_sugerida_seguimiento && (
                  <>
                    {" "}con fecha tentativa el{" "}
                    <span className="font-bold">
                      {new Date(referencia.fecha_sugerida_seguimiento).toLocaleDateString("es-MX", {
                        day: "numeric", month: "long", year: "numeric"
                      })}
                    </span>
                  </>
                )}.
              </p>
            </div>
          )}

          {/* Banner: cita actual (solo en modo reprogramar) */}
          {esReprogramar && referencia.fecha_cita && (
            <div className={`p-4 rounded-xl border ${isDark ? "bg-amber-500/10 border-amber-500/30" : "bg-amber-50 border-amber-200"}`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2 ${isDark ? "text-amber-400" : "text-amber-700"}`}>
                <Calendar className="w-3.5 h-3.5" />
                Cita Actual (a Reprogramar)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm">
                <div>
                  <span className={`text-xs block mb-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Médico asignado</span>
                  <p className={`font-semibold ${isDark ? "text-amber-300" : "text-amber-700"}`}>
                    {referencia.nombre_medico_asignado || "Sin nombre"}
                  </p>
                </div>
                <div>
                  <span className={`text-xs block mb-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Fecha y hora</span>
                  <p className={`font-medium ${isDark ? "text-amber-200" : "text-amber-800"}`}>
                    {new Date(referencia.fecha_cita).toLocaleDateString("es-MX", {
                      weekday: "short", year: "numeric", month: "short", day: "numeric",
                      hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                </div>
              </div>
              {referencia.estatus === 'notificada' && (
                <p className={`mt-2 text-xs font-medium ${isDark ? "text-amber-300" : "text-amber-700"}`}>
                  El paciente ya fue notificado de esta cita. Al reprogramar, el notificador deberá avisarle nuevamente.
                </p>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${isDark
                ? "bg-red-500/10 border-red-500/30 text-red-200"
                : "bg-red-50 border-red-200 text-red-700"
                }`}
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Selección de médico */}
          <div className="space-y-4">
            <div>
              <label
                className={`block text-sm font-bold mb-2 ${isDark ? "text-gray-300" : "text-gray-700"
                  }`}
              >
                Médico Especialista *
              </label>
              {loadingMedicos ? (
                <div className={`p-4 rounded-xl border text-center ${isDark ? "border-[#0f83b2]/20 bg-[#0d2137]" : "border-gray-200 bg-gray-50"}`}>
                  <div
                    className={`animate-spin rounded-full h-6 w-6 border-b-2 mx-auto mb-2 ${isDark ? "border-[#0db1ec]" : "border-blue-600"
                      }`}
                  ></div>
                  <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Buscando especialistas disponibles...</p>
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={medicoSeleccionado}
                    onChange={(e) => setMedicoSeleccionado(e.target.value)}
                    disabled={medicos.length === 0}
                    className={`w-full appearance-none px-4 py-3 rounded-xl border transition-all ${isDark
                      ? "bg-[#050b14] border-[#0f83b2]/30 text-white focus:border-[#0db1ec] focus:ring-1 focus:ring-[#0db1ec]"
                      : "bg-white border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <option value="">Seleccione un médico...</option>
                    {medicos.map((medico) => (
                      <option key={medico.id_usuario} value={medico.id_usuario}>
                        {medico.nombre} {medico.cedula_profesional ? `(Cédula: ${medico.cedula_profesional})` : ""}
                      </option>
                    ))}
                  </select>
                  {/* Custom Arrow */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <UserPlus className={`w-4 h-4 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                  </div>
                </div>
              )}

              {/* Información del médico seleccionado */}
              {medicoElegido && (
                <div
                  className={`mt-3 p-3 rounded-xl ${isDark ? "bg-[#0f83b2]/10 border border-[#0f83b2]/20" : "bg-blue-50 border border-blue-100"}`}
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div className={`p-1.5 rounded-lg ${isDark ? "bg-[#0a1929]" : "bg-white"}`}>
                      <UserPlus className={`w-4 h-4 ${isDark ? "text-[#0db1ec]" : "text-blue-600"}`} />
                    </div>
                    <div className="text-sm">
                      <p className={`font-medium ${isDark ? "text-[#0db1ec]" : "text-blue-700"}`}>
                        {medicoElegido.nombre}
                      </p>
                      <p className={`text-xs mt-0.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        {medicoElegido.email || "Sin correo registrado"}
                      </p>
                    </div>
                  </div>

                  {/* Días de consulta del médico */}
                  {agendaMedico.length > 0 ? (
                    <div>
                      <p className={`text-xs font-semibold mb-1.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                        Días de consulta:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {DIAS_CORTO.map((d, i) => {
                          const slot = agendaMedico.find(a => a.dia_semana === i);
                          return (
                            <span
                              key={i}
                              title={slot ? `${slot.hora_inicio} – ${slot.hora_fin}` : "No disponible"}
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                slot
                                  ? isDark ? "bg-[#0db1ec]/20 text-[#0db1ec]" : "bg-blue-100 text-blue-700"
                                  : isDark ? "bg-gray-800/60 text-gray-600" : "bg-gray-100 text-gray-400"
                              }`}
                            >
                              {d}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                      Sin agenda configurada — puedes elegir cualquier fecha
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Fecha y Hora Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div ref={calendarRef} className="relative">
                <label className={`block text-sm font-bold mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  Fecha de Cita *
                </label>

                {/* Botón que muestra la fecha seleccionada y abre el calendario */}
                <button
                  type="button"
                  onClick={() => setShowCalendar(v => !v)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-sm ${
                    fechaCita
                      ? isDark ? "border-[#0db1ec]/60 text-white" : "border-blue-400 text-gray-900"
                      : isDark ? "border-[#0f83b2]/30 text-gray-500" : "border-gray-200 text-gray-400"
                  } ${isDark ? "bg-[#050b14]" : "bg-white"}`}
                >
                  <span>
                    {fechaCita
                      ? new Date(fechaCita + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                      : 'Seleccionar fecha...'}
                  </span>
                  <Calendar className="w-4 h-4 shrink-0" />
                </button>

                {/* Popover del calendario */}
                {showCalendar && (
                  <div className={`absolute z-50 bottom-full mb-2 left-0 rounded-2xl shadow-2xl border p-3 ${
                    isDark ? "bg-[#0a1929] border-[#0f83b2]/30" : "bg-white border-gray-200"
                  }`}
                    style={{
                      '--rdp-accent-color': '#0db1ec',
                      '--rdp-accent-background-color': 'rgba(13,177,236,0.15)',
                      '--rdp-background-color': isDark ? '#0d2137' : '#f0f9ff',
                      colorScheme: isDark ? 'dark' : 'light',
                    } as React.CSSProperties}
                  >
                    <DayPicker
                      mode="single"
                      locale={es}
                      selected={fechaCita ? new Date(fechaCita + 'T12:00:00') : undefined}
                      onSelect={(date) => {
                        if (!date) return;
                        const iso = date.toISOString().split('T')[0];
                        handleFechaChange(iso);
                        setShowCalendar(false);
                      }}
                      disabled={[
                        { before: new Date() },
                        ...(agendaMedico.length > 0
                          ? [{ dayOfWeek: ([0,1,2,3,4,5,6] as number[]).filter(d => !agendaMedico.some(a => a.dia_semana === d)) }]
                          : [])
                      ]}
                      classNames={{
                        day_selected: 'bg-[#0db1ec] text-white rounded-lg',
                        day_disabled: isDark ? 'text-gray-700 line-through' : 'text-gray-300 line-through',
                        day_today: isDark ? 'font-bold text-[#0db1ec]' : 'font-bold text-blue-600',
                        caption_label: isDark ? 'text-white font-semibold' : 'text-gray-900 font-semibold',
                        nav_button: isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900',
                        head_cell: isDark ? 'text-gray-500 text-xs' : 'text-gray-400 text-xs',
                        cell: isDark ? 'text-gray-300' : 'text-gray-700',
                        day: 'rounded-lg hover:bg-[#0db1ec]/20 transition-colors',
                      }}
                    />
                  </div>
                )}

                {errorFecha && (
                  <p className={`mt-1.5 text-xs font-medium flex items-center gap-1 ${isDark ? "text-amber-400" : "text-amber-600"}`}>
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {errorFecha}
                  </p>
                )}
              </div>

              <div>
                {(() => {
                  const slot = getSlotParaFecha(fechaCita);
                  const opciones = slot
                    ? generarOpcionesHora(slot.hora_inicio, slot.hora_fin)
                    : generarOpcionesHora('00:00', '23:30');
                  return (
                    <>
                      <label className={`block text-sm font-bold mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        Hora *
                        {slot && (
                          <span className={`ml-2 text-xs font-normal ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                            ({slot.hora_inicio} – {slot.hora_fin})
                          </span>
                        )}
                      </label>
                      <select
                        value={horaCita}
                        onChange={(e) => setHoraCita(e.target.value)}
                        disabled={!fechaCita}
                        className={`w-full px-4 py-3 rounded-xl border transition-all text-sm ${isDark
                          ? "bg-[#050b14] border-[#0f83b2]/30 text-white focus:border-[#0db1ec] focus:ring-1 focus:ring-[#0db1ec]"
                          : "bg-white border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        {!fechaCita && <option value="">Primero elige una fecha</option>}
                        {opciones.map(op => (
                          <option key={op} value={op}>{op}</option>
                        ))}
                      </select>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </form>

        {/* Footer Buttons */}
        <div className={`p-6 border-t flex flex-col-reverse sm:flex-row gap-3 sm:justify-end shrink-0 ${isDark ? "border-gray-800 bg-[#0d2137]/50" : "border-gray-100 bg-gray-50/50"
          }`}>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm transition-colors ${isDark
              ? "hover:bg-white/5 text-gray-400 hover:text-white"
              : "hover:bg-gray-200 text-gray-600 hover:text-gray-900"
              } disabled:opacity-50`}
          >
            Cancelar
          </button>
          <button
            onClick={(e) => handleSubmit(e as any)}
            disabled={submitting || medicos.length === 0}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 ${isDark
              ? "bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] hover:to-[#0a8ab5] text-white"
              : "bg-gradient-to-r from-blue-600 to-blue-500 hover:to-blue-700 text-white"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{esReprogramar ? "Reprogramando..." : "Asignando..."}</span>
              </>
            ) : (
              <>
                {esReprogramar ? <RefreshCw className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                <span>{esReprogramar ? "Confirmar Reprogramación" : "Confirmar Asignación"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
