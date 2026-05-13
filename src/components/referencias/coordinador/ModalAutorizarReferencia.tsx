import { useState, useEffect } from "react";
import { X, CheckCircle, XCircle, AlertCircle, User, FileText, Calendar, Hash, RefreshCcw, Stethoscope, Pill, Activity, ChevronDown, ChevronUp, Loader2, Printer, FlaskConical, Share2, Clock } from "lucide-react";
import type { ReferenciaEspecialidad } from "@/types/referencias";
import FirmaDigitalCanvas from "./FirmaDigitalCanvas";

interface SoapData {
  id_consulta: number;
  folio: string;
  nombre: string;
  fecha_consulta: string;
  nombre_medico: string;
  subjetivo: string | null;
  objetivo: string | null;
  analisis: string | null;
  plan: string | null;
  temperatura_c: number | null;
  ta_sistolica: number | null;
  ta_diastolica: number | null;
  frecuencia_cardiaca: number | null;
  oxigenacion: number | null;
  altura_cm: number | null;
  peso_kg: number | null;
  glucosa_mg_dl: number | null;
  se_asigno_incapacidad: boolean;
  tiene_estudios_laboratorio: boolean;
  diagnosticos: Array<{
    cie11_codigo: string;
    cie11_titulo: string;
    es_principal: boolean;
    orden: number;
  }>;
  medicamentos: Array<{
    nombre_comercial: string;
    sustancia_activa: string;
    dosis: string;
    cantidad_total: number;
    duracion_tratamiento_dias: number;
    indicaciones: string | null;
  }>;
  incapacidad: {
    fecha_inicio: string;
    fecha_fin: string;
    dias_sugeridos: number;
    diagnostico_titulo: string | null;
  } | null;
  estudios: Array<{
    nombre_estudio: string;
    motivo: string | null;
    estatus: string;
  }>;
  referencia: {
    folio: string;
    nombre_especialidad: string;
    motivo_referencia: string;
    estatus: string;
  } | null;
}

interface Props {
  referencia: ReferenciaEspecialidad | null;
  isOpen: boolean;
  onClose: () => void;
  onAutorizar: (data: { observaciones?: string; firma_digital?: string }) => Promise<void>;
  onRechazar: (motivo: string) => Promise<void>;
  isDark: boolean;
}

export default function ModalAutorizarReferencia({ referencia, isOpen, onClose, onAutorizar, onRechazar, isDark }: Props) {
  const [observaciones, setObservaciones] = useState("");
  const [firmaDigital, setFirmaDigital] = useState("");
  const [firmaExistente, setFirmaExistente] = useState<string | null>(null);
  const [vistaActual, setVistaActual] = useState<"detalle" | "rechazo">("detalle");
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // SOAP del especialista (solo para seguimientos)
  const [soapData, setSoapData] = useState<SoapData | null>(null);
  const [loadingSOAP, setLoadingSOAP] = useState(false);
  const [soapExpandido, setSoapExpandido] = useState(true);

  const esSeguimiento = referencia?.tipo_referencia === 'seguimiento';

  const diasHastaCitaVal = esSeguimiento && referencia?.fecha_sugerida_seguimiento
    ? (() => {
        const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
        const cita = new Date(referencia.fecha_sugerida_seguimiento!); cita.setHours(0, 0, 0, 0);
        return Math.ceil((cita.getTime() - hoy.getTime()) / 86400000);
      })()
    : 0;
  const bloqueadoPorFecha = esSeguimiento && diasHastaCitaVal > 30;
  const diasParaHabilitar = Math.max(0, diasHastaCitaVal - 30);

  // Cargar firma existente del coordinador al abrir el modal
  useEffect(() => {
    if (isOpen) {
      cargarFirmaExistente();
      setSoapData(null);
      setSoapExpandido(true);
      if (referencia) {
        cargarSOAP(referencia.id_consulta_origen);
      }
    }
  }, [isOpen, referencia]);

  const cargarSOAP = async (idConsulta: number) => {
    setLoadingSOAP(true);
    try {
      const response = await fetch(`/api/consultas/${idConsulta}/soap`);
      const data = await response.json();
      if (data.success) {
        setSoapData(data.soap);
      }
    } catch (error) {
      console.error('Error al cargar SOAP:', error);
    } finally {
      setLoadingSOAP(false);
    }
  };

  const cargarFirmaExistente = async () => {
    try {
      const response = await fetch('/api/firmas/obtener');
      const data = await response.json();

      if (data.success && data.firma) {
        setFirmaExistente(data.firma.firma_base64);
        console.log('✅ Firma existente cargada');
      }
    } catch (error) {
      console.error('Error al cargar firma existente:', error);
    }
  };

  const handleFirmaGuardada = async (firmaBase64: string) => {
    // Guardar firma en el estado local
    setFirmaDigital(firmaBase64);

    // Guardar firma en la base de datos para reutilización futura
    try {
      const response = await fetch('/api/firmas/guardar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firma_base64: firmaBase64 }),
      });

      const data = await response.json();
      if (data.success) {
        console.log('✅ Firma guardada en BD:', data.data.hash_firma);
      }
    } catch (error) {
      console.error('Error al guardar firma:', error);
    }
  };

  if (!isOpen || !referencia) return null;

  const handleAutorizar = async () => {
    setSubmitting(true);
    try {
      await onAutorizar({ observaciones: observaciones || undefined, firma_digital: firmaDigital || undefined });
      // Limpiar estados después de autorizar
      setObservaciones("");
      setFirmaDigital("");
      // No limpiar firmaExistente porque se reutiliza
    } finally {
      setSubmitting(false);
    }
  };

  const handleRechazar = async () => {
    if (!motivoRechazo.trim()) {
      alert("El motivo de rechazo es obligatorio");
      return;
    }
    setSubmitting(true);
    try {
      await onRechazar(motivoRechazo);
      setMotivoRechazo("");
      setVistaActual("detalle");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`w-full ${esSeguimiento ? 'max-w-3xl' : 'max-w-2xl'} rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 ${isDark ? "bg-[#0a1929] border border-[#0f83b2]/20" : "bg-white"
          } max-h-[90vh] flex flex-col`}
      >
        {/* Barra de color superior */}
        <div className={`h-1 ${esSeguimiento
          ? 'bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500'
          : 'bg-gradient-to-r from-[#0f83b2] via-[#0db1ec] to-[#0f83b2]'}`}
        />

        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${isDark
            ? "bg-[#0d2137] border-[#0f83b2]/20"
            : "bg-gray-50 border-gray-100"
            }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${esSeguimiento
              ? isDark ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-600"
              : isDark ? "bg-[#0f83b2]/20 text-[#0db1ec]" : "bg-blue-100 text-[#0f83b2]"}`}>
              {esSeguimiento ? <RefreshCcw className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-xl font-bold leading-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                  {vistaActual === "detalle"
                    ? esSeguimiento ? "Autorizar Seguimiento" : "Autorizar Referencia"
                    : esSeguimiento ? "Rechazar Seguimiento" : "Rechazar Referencia"}
                </h2>
                {esSeguimiento && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white tracking-wide">
                    SEGUIMIENTO
                  </span>
                )}
              </div>
              <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                {referencia.folio} · #{referencia.id_referencia}
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
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {vistaActual === "detalle" ? (
            <>
              {/* Banner: autorización bloqueada por fecha */}
              {bloqueadoPorFecha && (
                <div className={`flex items-start gap-3 p-4 rounded-xl border ${isDark ? "bg-amber-500/10 border-amber-500/30" : "bg-amber-50 border-amber-200"}`}>
                  <Clock className={`w-5 h-5 shrink-0 mt-0.5 ${isDark ? "text-amber-400" : "text-amber-600"}`} />
                  <div>
                    <p className={`text-sm font-bold ${isDark ? "text-amber-300" : "text-amber-700"}`}>
                      Autorización no disponible aún
                    </p>
                    <p className={`text-xs mt-0.5 ${isDark ? "text-amber-400/80" : "text-amber-600"}`}>
                      La consulta de seguimiento está programada en <strong>{diasHastaCitaVal} días</strong>. Solo se puede autorizar dentro de los 30 días previos a la cita.
                      {diasParaHabilitar > 0 && <> Disponible en <strong>{diasParaHabilitar} días</strong>.</>}
                    </p>
                  </div>
                </div>
              )}

              {/* Folio y Fecha */}
              {(referencia.folio || referencia.creado_en) && (
                <div className={`flex flex-wrap items-center gap-3 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  {referencia.folio && (
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono font-bold ${isDark ? "bg-[#0f83b2]/10 text-[#0db1ec]" : "bg-blue-50 text-blue-600"}`}>
                      <Hash className="w-3 h-3" />
                      {referencia.folio}
                    </div>
                  )}
                  {referencia.creado_en && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      Solicitada el {formatDate(referencia.creado_en)}
                    </div>
                  )}
                </div>
              )}

              {/* ══════ BLOQUE SOAP ══════ */}
              <div className={`rounded-xl border overflow-hidden ${esSeguimiento
                ? isDark ? "border-amber-500/30" : "border-amber-200"
                : isDark ? "border-[#0f83b2]/30" : "border-blue-200"}`}>
                  {/* Header colapsable */}
                  <button
                    type="button"
                    onClick={() => setSoapExpandido(!soapExpandido)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${esSeguimiento
                      ? isDark ? "bg-amber-500/10 hover:bg-amber-500/15" : "bg-amber-50 hover:bg-amber-100"
                      : isDark ? "bg-[#0f83b2]/10 hover:bg-[#0f83b2]/15" : "bg-blue-50 hover:bg-blue-100"}`}
                  >
                    <div className="flex items-center gap-2">
                      <Stethoscope className={`w-4 h-4 ${esSeguimiento
                        ? isDark ? "text-amber-400" : "text-amber-600"
                        : isDark ? "text-[#0db1ec]" : "text-[#0f83b2]"}`} />
                      <span className={`text-xs font-bold uppercase tracking-wider ${esSeguimiento
                        ? isDark ? "text-amber-400" : "text-amber-700"
                        : isDark ? "text-[#0db1ec]" : "text-[#0f83b2]"}`}>
                        {esSeguimiento ? "Consulta del Especialista — Nota SOAP y Plan" : "Consulta de Origen — Nota SOAP y Plan"}
                      </span>
                      {soapData && (
                        <span className={`text-xs ${esSeguimiento
                          ? isDark ? "text-amber-300/70" : "text-amber-600/70"
                          : isDark ? "text-[#0db1ec]/70" : "text-[#0f83b2]/70"}`}>
                          · {soapData.nombre_medico} · {new Date(soapData.fecha_consulta).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      )}
                    </div>
                    {soapExpandido
                      ? <ChevronUp className={`w-4 h-4 shrink-0 ${esSeguimiento ? isDark ? "text-amber-400" : "text-amber-600" : isDark ? "text-[#0db1ec]" : "text-[#0f83b2]"}`} />
                      : <ChevronDown className={`w-4 h-4 shrink-0 ${esSeguimiento ? isDark ? "text-amber-400" : "text-amber-600" : isDark ? "text-[#0db1ec]" : "text-[#0f83b2]"}`} />}
                  </button>

                  {soapExpandido && (
                    <div className={`p-4 space-y-4 ${esSeguimiento
                      ? isDark ? "bg-amber-500/5" : "bg-amber-50/40"
                      : isDark ? "bg-[#0f83b2]/5" : "bg-blue-50/30"}`}>
                      {loadingSOAP ? (
                        <div className="flex items-center justify-center gap-2 py-6">
                          <Loader2 className={`w-5 h-5 animate-spin ${isDark ? "text-amber-400" : "text-amber-600"}`} />
                          <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>Cargando nota clínica...</span>
                        </div>
                      ) : soapData ? (
                        <>
                          {/* Diagnósticos */}
                          {soapData.diagnosticos.length > 0 && (
                            <div>
                              <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? "text-amber-400/70" : "text-amber-700/70"}`}>Diagnósticos CIE-11</p>
                              <div className="flex flex-wrap gap-2">
                                {soapData.diagnosticos.map((d, i) => (
                                  <span key={i} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${d.es_principal
                                    ? isDark ? "bg-amber-500/25 text-amber-300 ring-1 ring-amber-500/40" : "bg-amber-100 text-amber-800 ring-1 ring-amber-300"
                                    : isDark ? "bg-white/5 text-gray-300" : "bg-white text-gray-600 border border-gray-200"
                                  }`}>
                                    <span className={`font-mono text-[10px] ${isDark ? "text-amber-400/80" : "text-amber-700"}`}>{d.cie11_codigo}</span>
                                    {d.cie11_titulo}
                                    {d.es_principal && <span className={`text-[9px] font-bold ${isDark ? "text-amber-400" : "text-amber-600"}`}>PRINCIPAL</span>}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* SOAP — S, O, A únicamente (P se muestra como medicamentos/incapacidad abajo) */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {soapData.subjetivo && (
                              <div className={`p-3 rounded-lg ${isDark ? "bg-white/5" : "bg-white border border-gray-100"}`}>
                                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${isDark ? "text-blue-400/80" : "text-blue-600"}`}>S — Subjetivo</p>
                                <p className={`text-xs leading-relaxed ${isDark ? "text-gray-300" : "text-gray-700"}`}>{soapData.subjetivo}</p>
                              </div>
                            )}
                            {soapData.objetivo && (
                              <div className={`p-3 rounded-lg ${isDark ? "bg-white/5" : "bg-white border border-gray-100"}`}>
                                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${isDark ? "text-green-400/80" : "text-green-600"}`}>O — Objetivo</p>
                                <p className={`text-xs leading-relaxed ${isDark ? "text-gray-300" : "text-gray-700"}`}>{soapData.objetivo}</p>
                              </div>
                            )}
                            {soapData.analisis && (
                              <div className={`p-3 rounded-lg sm:col-span-2 ${isDark ? "bg-white/5" : "bg-white border border-gray-100"}`}>
                                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${isDark ? "text-purple-400/80" : "text-purple-600"}`}>A — Análisis / Impresión diagnóstica</p>
                                <p className={`text-xs leading-relaxed ${isDark ? "text-gray-300" : "text-gray-700"}`}>{soapData.analisis}</p>
                              </div>
                            )}
                          </div>

                          {/* Signos vitales (si existen) */}
                          {(soapData.temperatura_c || soapData.ta_sistolica || soapData.frecuencia_cardiaca || soapData.oxigenacion) && (
                            <div>
                              <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Signos Vitales</p>
                              <div className="flex flex-wrap gap-2">
                                {soapData.temperatura_c && (
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${isDark ? "bg-white/5 text-gray-300" : "bg-white border border-gray-200 text-gray-600"}`}>
                                    🌡 {soapData.temperatura_c}°C
                                  </span>
                                )}
                                {soapData.ta_sistolica && (
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${isDark ? "bg-white/5 text-gray-300" : "bg-white border border-gray-200 text-gray-600"}`}>
                                    ❤️ {soapData.ta_sistolica}/{soapData.ta_diastolica} mmHg
                                  </span>
                                )}
                                {soapData.frecuencia_cardiaca && (
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${isDark ? "bg-white/5 text-gray-300" : "bg-white border border-gray-200 text-gray-600"}`}>
                                    <Activity className="w-3 h-3 inline mr-1" />{soapData.frecuencia_cardiaca} lpm
                                  </span>
                                )}
                                {soapData.oxigenacion && (
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${isDark ? "bg-white/5 text-gray-300" : "bg-white border border-gray-200 text-gray-600"}`}>
                                    💨 {soapData.oxigenacion}% SpO₂
                                  </span>
                                )}
                                {soapData.peso_kg && soapData.altura_cm && (
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${isDark ? "bg-white/5 text-gray-300" : "bg-white border border-gray-200 text-gray-600"}`}>
                                    ⚖️ {soapData.peso_kg} kg · {soapData.altura_cm} cm
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Plan: medicamentos */}
                          {soapData.medicamentos.length > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <p className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                                  <Pill className="w-3 h-3" />Medicamentos Recetados
                                </p>
                                <a
                                  href={`/api/recetas/generar-pdf-consulta/${soapData.id_consulta}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${isDark
                                    ? "bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/20"
                                    : "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200"}`}
                                >
                                  <Printer className="w-3 h-3" />
                                  Imprimir Receta
                                </a>
                              </div>
                              <div className="space-y-1.5">
                                {soapData.medicamentos.map((med, i) => {
                                  const sustanciaDistinta = med.sustancia_activa && med.sustancia_activa !== med.nombre_comercial;
                                  const indicacionesDistintas = med.indicaciones && med.indicaciones !== med.dosis;
                                  return (
                                    <div key={i} className={`flex items-start gap-3 p-2.5 rounded-lg ${isDark ? "bg-white/5" : "bg-white border border-gray-100"}`}>
                                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${isDark ? "bg-[#0f83b2]/20 text-[#0db1ec]" : "bg-blue-50 text-blue-600"}`}>
                                        {i + 1}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-semibold ${isDark ? "text-white" : "text-gray-800"}`}>{med.nombre_comercial}</p>
                                        {sustanciaDistinta && (
                                          <p className={`text-[10px] ${isDark ? "text-gray-400" : "text-gray-500"}`}>{med.sustancia_activa}</p>
                                        )}
                                        <p className={`text-[10px] mt-0.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                          {med.dosis} · {med.duracion_tratamiento_dias} días · {med.cantidad_total} piezas
                                        </p>
                                        {indicacionesDistintas && (
                                          <p className={`text-[10px] italic mt-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>{med.indicaciones}</p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Plan: incapacidad */}
                          {soapData.incapacidad && (
                            <div className={`flex items-start gap-2 p-3 rounded-lg ${isDark ? "bg-red-500/10 border border-red-500/20" : "bg-red-50 border border-red-100"}`}>
                              <FileText className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? "text-red-400" : "text-red-500"}`} />
                              <div>
                                <p className={`text-xs font-bold ${isDark ? "text-red-300" : "text-red-700"}`}>Incapacidad</p>
                                <p className={`text-xs ${isDark ? "text-red-300/80" : "text-red-600"}`}>
                                  {soapData.incapacidad.dias_sugeridos} días
                                  {soapData.incapacidad.diagnostico_titulo && ` · ${soapData.incapacidad.diagnostico_titulo}`}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Plan: estudios de laboratorio */}
                          {soapData.estudios.length > 0 && (
                            <div>
                              <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                                <FlaskConical className="w-3 h-3" />Estudios de Laboratorio
                              </p>
                              <div className="space-y-1.5">
                                {soapData.estudios.map((est, i) => (
                                  <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-lg ${isDark ? "bg-white/5" : "bg-white border border-gray-100"}`}>
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${isDark ? "bg-purple-500/20 text-purple-400" : "bg-purple-50 text-purple-600"}`}>
                                      {i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-xs font-semibold ${isDark ? "text-white" : "text-gray-800"}`}>{est.nombre_estudio}</p>
                                      {est.motivo && (
                                        <p className={`text-[10px] italic mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{est.motivo}</p>
                                      )}
                                    </div>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                                      (est.estatus || '').toUpperCase() === 'ENTREGADO'
                                        ? isDark ? "bg-green-500/15 text-green-400" : "bg-green-50 text-green-600"
                                        : (est.estatus || '').toUpperCase() === 'AUTORIZADO'
                                        ? isDark ? "bg-blue-500/15 text-blue-400" : "bg-blue-50 text-blue-600"
                                        : (est.estatus || '').toUpperCase() === 'RECHAZADO' || (est.estatus || '').toUpperCase() === 'CANCELADO'
                                        ? isDark ? "bg-red-500/15 text-red-400" : "bg-red-50 text-red-600"
                                        : isDark ? "bg-yellow-500/15 text-yellow-400" : "bg-yellow-50 text-yellow-600"
                                    }`}>
                                      {(est.estatus || 'PENDIENTE').toUpperCase()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Plan: referencia a otro especialista */}
                          {soapData.referencia && (
                            <div className={`flex items-start gap-2 p-3 rounded-lg ${isDark ? "bg-indigo-500/10 border border-indigo-500/20" : "bg-indigo-50 border border-indigo-100"}`}>
                              <Share2 className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? "text-indigo-400" : "text-indigo-500"}`} />
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-bold ${isDark ? "text-indigo-300" : "text-indigo-700"}`}>
                                  Referencia a otro especialista
                                </p>
                                <p className={`text-xs font-semibold mt-0.5 ${isDark ? "text-indigo-200" : "text-indigo-800"}`}>
                                  {soapData.referencia.nombre_especialidad}
                                  <span className={`ml-2 font-mono text-[10px] ${isDark ? "text-indigo-400/70" : "text-indigo-500"}`}>
                                    {soapData.referencia.folio}
                                  </span>
                                </p>
                                <p className={`text-[10px] italic mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                  "{soapData.referencia.motivo_referencia}"
                                </p>
                              </div>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 self-start mt-0.5 ${
                                ['asignada','notificada','atendida'].includes(soapData.referencia.estatus)
                                  ? isDark ? "bg-green-500/15 text-green-400" : "bg-green-50 text-green-600"
                                  : soapData.referencia.estatus === 'autorizada'
                                    ? isDark ? "bg-blue-500/15 text-blue-400" : "bg-blue-50 text-blue-600"
                                    : isDark ? "bg-yellow-500/15 text-yellow-400" : "bg-yellow-50 text-yellow-600"
                              }`}>
                                {soapData.referencia.estatus === 'pendiente_autorizar' ? 'PENDIENTE'
                                  : soapData.referencia.estatus === 'autorizada' ? 'AUTORIZADA'
                                  : soapData.referencia.estatus === 'asignada' ? 'ASIGNADA'
                                  : soapData.referencia.estatus === 'notificada' ? 'NOTIFICADA'
                                  : soapData.referencia.estatus === 'atendida' ? 'ATENDIDA'
                                  : soapData.referencia.estatus.toUpperCase()}
                              </span>
                            </div>
                          )}

                          {/* Fecha sugerida de seguimiento */}
                          {referencia.fecha_sugerida_seguimiento && (
                            <div className={`flex items-center gap-2 p-3 rounded-lg ${isDark ? "bg-amber-500/10 border border-amber-500/20" : "bg-amber-50 border border-amber-100"}`}>
                              <Calendar className={`w-4 h-4 shrink-0 ${isDark ? "text-amber-400" : "text-amber-600"}`} />
                              <div>
                                <p className={`text-xs font-bold ${isDark ? "text-amber-300" : "text-amber-700"}`}>Fecha Sugerida para el Seguimiento</p>
                                <p className={`text-xs ${isDark ? "text-amber-300/80" : "text-amber-600"}`}>
                                  {new Date(referencia.fecha_sugerida_seguimiento).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                                  {referencia.nombre_medico_sugerido && ` · con ${referencia.nombre_medico_sugerido}`}
                                </p>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className={`text-xs text-center py-4 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                          No se pudo cargar la nota clínica del especialista.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              {/* ══════ FIN BLOQUE SOAP ══════ */}

              {/* Información del Paciente */}
              <div className={`p-4 rounded-xl border ${isDark ? "bg-[#0d2137]/50 border-[#0f83b2]/20" : "bg-gray-50 border-gray-100"}`}>
                <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  <User className="w-3.5 h-3.5" />
                  Información del Paciente
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div className="col-span-2 sm:col-span-2">
                    <span className={`text-xs block mb-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Nombre</span>
                    <p className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{referencia.nombre_paciente}</p>
                  </div>
                  <div>
                    <span className={`text-xs block mb-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Nómina</span>
                    <p className={`font-mono font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>{referencia.no_nomina}</p>
                  </div>
                  {referencia.edad && (
                    <div>
                      <span className={`text-xs block mb-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Edad</span>
                      <p className={`font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>{referencia.edad} años</p>
                    </div>
                  )}
                  {referencia.sexo && (
                    <div>
                      <span className={`text-xs block mb-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Sexo</span>
                      <p className={`font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>{referencia.sexo === 'M' ? 'Masculino' : 'Femenino'}</p>
                    </div>
                  )}
                  {referencia.departamento && (
                    <div className="col-span-2 sm:col-span-1">
                      <span className={`text-xs block mb-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Departamento</span>
                      <p className={`font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>{referencia.departamento}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Datos de la Referencia */}
              <div className={`p-4 rounded-xl border ${isDark ? "bg-[#0d2137]/50 border-[#0f83b2]/20" : "bg-gray-50 border-gray-100"}`}>
                <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  <FileText className="w-3.5 h-3.5" />
                  Datos de la Referencia
                </h3>
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className={`text-xs block mb-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Médico que refiere</span>
                      <p className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{referencia.nombre_medico_refiere}</p>
                    </div>
                    <div>
                      <span className={`text-xs block mb-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Especialidad</span>
                      <div className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${isDark ? "bg-[#0f83b2]/10 text-[#0db1ec]" : "bg-blue-50 text-blue-700"}`}>
                        {referencia.nombre_especialidad}
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-dashed dark:border-gray-700/50 border-gray-200">
                    <span className={`text-xs block mb-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Motivo</span>
                    <p className={`text-sm italic leading-relaxed ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                      "{referencia.motivo_referencia}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Formulario de Autorización */}
              <div className="space-y-4">
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Observaciones (Opcional)</label>
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Agregue comentarios sobre la autorización..."
                    rows={3}
                    className={`w-full px-4 py-3 rounded-xl border transition-colors resize-none ${isDark
                      ? "bg-[#050b14] border-[#0f83b2]/30 text-white placeholder-gray-600 focus:border-[#0f83b2] focus:ring-1 focus:ring-[#0f83b2]"
                      : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#0f83b2] focus:ring-1 focus:ring-[#0f83b2]"
                      }`}
                  />
                </div>

                {/* Componente de Firma Digital */}
                <div className={`rounded-xl border overflow-hidden ${isDark ? "border-[#0f83b2]/30 bg-[#050b14]" : "border-gray-200 bg-white"}`}>
                  <FirmaDigitalCanvas
                    isDark={isDark}
                    onFirmaGuardada={handleFirmaGuardada}
                    firmaExistente={firmaExistente}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col h-full">
              {/* Vista de Rechazo */}
              <div className={`p-4 rounded-xl border mb-6 ${isDark ? "bg-red-500/10 border-red-500/30" : "bg-red-50 border-red-200"}`}>
                <div className="flex items-center gap-3 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <h3 className={`font-bold ${isDark ? "text-red-300" : "text-red-700"}`}>Confirmar Rechazo</h3>
                </div>
                <p className={`text-sm ${isDark ? "text-red-200/80" : "text-red-600/80"}`}>
                  Esta acción cancelará la referencia de forma permanente.
                </p>
              </div>

              <div className="flex-1">
                <label className={`block text-sm font-bold mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Motivo del Rechazo *</label>
                <textarea
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  placeholder="Explique por qué se rechaza esta referencia..."
                  className={`w-full h-40 px-4 py-3 rounded-xl border transition-colors resize-none ${isDark
                    ? "bg-[#050b14] border-red-500/30 text-white placeholder-gray-600 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    }`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className={`p-6 border-t flex flex-col-reverse sm:flex-row gap-3 sm:justify-end shrink-0 ${isDark ? "border-gray-800 bg-[#0d2137]/50" : "border-gray-100 bg-gray-50/50"
          }`}>
          {vistaActual === "detalle" ? (
            <>
              <button
                onClick={() => setVistaActual("rechazo")}
                disabled={submitting}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 ${isDark
                  ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                  : "bg-red-50 hover:bg-red-100 text-red-600 border border-red-100"
                  } disabled:opacity-50`}
              >
                <XCircle className="w-4 h-4" />
                <span>Rechazar</span>
              </button>
              <button
                onClick={handleAutorizar}
                disabled={submitting || bloqueadoPorFecha}
                title={bloqueadoPorFecha ? `Disponible en ${diasParaHabilitar} días` : undefined}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 ${isDark
                  ? "bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] hover:to-[#0db1ec] text-white"
                  : "bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] hover:to-[#0a7aa0] text-white"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Procesando...</span>
                  </>
                ) : bloqueadoPorFecha ? (
                  <>
                    <Clock className="w-4 h-4" />
                    <span>No disponible ({diasParaHabilitar}d)</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Autorizar Referencia</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setVistaActual("detalle"); setMotivoRechazo(""); }}
                disabled={submitting}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm transition-colors ${isDark
                  ? "hover:bg-white/5 text-gray-400 hover:text-white"
                  : "hover:bg-gray-200 text-gray-600 hover:text-gray-900"
                  } disabled:opacity-50`}
              >
                Cancelar
              </button>
              <button
                onClick={handleRechazar}
                disabled={submitting || !motivoRechazo.trim()}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Rechazando...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>Confirmar Rechazo</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
