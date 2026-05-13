import { useState, useEffect, useRef } from "react";
import {
  X,
  CheckCircle,
  User,
  Calendar,
  FileText,
  Activity,
  Stethoscope,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Printer,
  Download,
  Eye,
  EyeOff,
  ShieldCheck,
  UserX,
  Clock,
} from "lucide-react";
import type { ReferenciaEspecialidad } from "@/types/referencias";
import { generarPaseEspecialidadPDF } from "@/lib/generar-pase-especialidad-pdf";

interface Props {
  referencia: ReferenciaEspecialidad | null;
  isOpen: boolean;
  onClose: () => void;
  onAtender: () => void;
  isDark: boolean;
}

export default function ModalDetalleReferencia({
  referencia,
  isOpen,
  onClose,
  onAtender,
  isDark,
}: Props) {
  const [detalleCompleto, setDetalleCompleto] = useState<any>(null);
  const [historialPaciente, setHistorialPaciente] = useState<any>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [consultaSeleccionada, setConsultaSeleccionada] = useState<any>(null);
  const [mostrarReferenciaPDF, setMostrarReferenciaPDF] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [loadingPDF, setLoadingPDF] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (isOpen && referencia) {
      cargarDetalleCompleto();
      cargarHistorialPaciente();
      setConsultaSeleccionada(null);
    }
  }, [isOpen, referencia]);

  const parsearPlan = (planString: string | null) => {
    if (!planString) return null;
    try {
      return JSON.parse(planString);
    } catch (e) {
      return null;
    }
  };

  const cargarDetalleCompleto = async () => {
    if (!referencia) return;

    try {
      setLoadingDetalle(true);
      const response = await fetch(
        `/api/referencias/especialista/detalle/${referencia.id_referencia}`
      );
      const data = await response.json();

      if (data.success) {
        setDetalleCompleto(data.referencia);
      }
    } catch (error) {
      console.error("Error al cargar detalle:", error);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const cargarHistorialPaciente = async () => {
    if (!referencia) return;

    try {
      setLoadingHistorial(true);
      let url = `/api/referencias/especialista/historial-paciente/${referencia.no_nomina}`;

      // Si tiene beneficiario, filtramos por él
      if (referencia.id_beneficiario) {
        url += `?idBeneficiario=${referencia.id_beneficiario}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setHistorialPaciente(data.data);
      }
    } catch (error) {
      console.error("Error al cargar historial:", error);
    } finally {
      setLoadingHistorial(false);
    }
  };

  // Construir objeto completo para el PDF usando detalleCompleto (tiene SOAP, vitales, coordinador, etc.)
  const getReferenciaPDF = (): ReferenciaEspecialidad => {
    const base = detalleCompleto || referencia!;
    return {
      ...referencia!,
      ...base,
      // Mapear campo 'plan' de la consulta a 'plan_tratamiento' que espera el PDF
      plan_tratamiento: base.plan || base.plan_tratamiento || referencia!.plan_tratamiento,
      // Mapear diagnósticos del detalle al formato que espera el PDF
      diagnosticos: base.consulta_origen?.diagnosticos?.map((d: any) => ({
        cie11_codigo: d.codigo,
        cie11_titulo: d.titulo,
        es_principal: d.es_principal,
        orden: 0,
      })) || referencia!.diagnosticos || null,
    };
  };

  const handleTogglePDF = async () => {
    if (mostrarReferenciaPDF) {
      setMostrarReferenciaPDF(false);
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl("");
      }
      return;
    }

    try {
      setLoadingPDF(true);
      const refCompleta = getReferenciaPDF();
      const pdfBytes = await generarPaseEspecialidadPDF(refCompleta);
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setMostrarReferenciaPDF(true);
    } catch (error) {
      console.error("Error al generar PDF:", error);
    } finally {
      setLoadingPDF(false);
    }
  };

  const handlePrintPDF = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.print();
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const refCompleta = getReferenciaPDF();
      const pdfBytes = await generarPaseEspecialidadPDF(refCompleta);
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Referencia_${referencia!.folio || referencia!.id_referencia}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error al descargar PDF:", error);
    }
  };

  const handleAtender = () => {
    onAtender();
  };

  /** Retorna true si la fecha de cita ya pasó (antes de hoy). */
  const citaEsVencida = (fechaCita: string | null): boolean => {
    if (!fechaCita) return false;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const cita = new Date(fechaCita);
    cita.setHours(0, 0, 0, 0);
    return cita < hoy;
  };

  if (!isOpen || !referencia) return null;

  const citaVencida = citaEsVencida(referencia.fecha_cita);

  // Render del detalle de una consulta histórica
  if (consultaSeleccionada) {
    const planParsed = parsearPlan(consultaSeleccionada.plan);
    const medicamentos = planParsed?.medicamentos?.medicamentos || [];
    const estudios = planParsed?.laboratorio?.estudios || [];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div
          className={`w-full max-w-5xl rounded-xl shadow-2xl ${isDark ? "bg-[#0a1929]" : "bg-white"
            } max-h-[90vh] overflow-y-auto`}
        >
          {/* Header del Detalle Histórico */}
          <div
            className={`sticky top-0 z-10 flex items-center justify-between p-6 border-b ${isDark ? "bg-[#0a1929] border-[#0f83b2]/30" : "bg-white border-gray-200"
              }`}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => setConsultaSeleccionada(null)}
                className={`p-2 rounded-lg transition-colors mr-2 ${isDark ? "hover:bg-white/10 text-white" : "hover:bg-gray-100 text-gray-600"
                  }`}
              >
                <ChevronDown className="w-6 h-6 rotate-90" />
              </button>
              <div>
                <h2
                  className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"
                    }`}
                >
                  Detalle de Consulta Histórica
                </h2>
                <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  Fecha: {new Date(consultaSeleccionada.fecha_consulta).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${isDark ? "hover:bg-white/10" : "hover:bg-gray-100"
                }`}
            >
              <X className={`w-6 h-6 ${isDark ? "text-gray-400" : "text-gray-600"}`} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Diagnósticos */}
            <div className={`p-4 rounded-lg border ${isDark ? "bg-purple-500/10 border-purple-500/30" : "bg-purple-50 border-purple-200"
              }`}>
              <h3 className={`text-lg font-bold mb-2 ${isDark ? "text-purple-300" : "text-purple-700"}`}>
                Diagnóstico(s)
              </h3>
              {consultaSeleccionada.diagnosticos_json && (typeof consultaSeleccionada.diagnosticos_json === 'string' ? JSON.parse(consultaSeleccionada.diagnosticos_json) : consultaSeleccionada.diagnosticos_json).length > 0 ? (
                <ul className="list-disc pl-5 space-y-1">
                  {(typeof consultaSeleccionada.diagnosticos_json === 'string' ? JSON.parse(consultaSeleccionada.diagnosticos_json) : consultaSeleccionada.diagnosticos_json).map((diag: any, idx: number) => (
                    <li key={idx} className={`${isDark ? "text-white" : "text-gray-900"}`}>
                      <span className="font-bold">{diag.codigo}</span> - {diag.titulo} {diag.es_principal ? <span className="text-xs opacity-70">(Principal)</span> : ''}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={`text-lg ${isDark ? "text-white" : "text-gray-900"}`}>
                  {consultaSeleccionada.cie11_codigo} - {consultaSeleccionada.cie11_titulo || "Sin diagnóstico"}
                </p>
              )}
            </div>

            {/* SOAP */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`p-4 rounded-lg ${isDark ? "bg-[#0d2137]" : "bg-gray-50"}`}>
                <h4 className={`font-bold mb-2 ${isDark ? "text-blue-400" : "text-blue-600"}`}>Subjetivo</h4>
                <p className={`whitespace-pre-wrap ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  {consultaSeleccionada.subjetivo || "No registrado"}
                </p>
              </div>
              <div className={`p-4 rounded-lg ${isDark ? "bg-[#0d2137]" : "bg-gray-50"}`}>
                <h4 className={`font-bold mb-2 ${isDark ? "text-blue-400" : "text-blue-600"}`}>Objetivo / Exploración</h4>
                <p className={`whitespace-pre-wrap ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  {consultaSeleccionada.objetivo || "No registrado"}
                </p>
              </div>
            </div>

            {/* Medicamentos */}
            {medicamentos.length > 0 && (
              <div className={`p-4 rounded-lg border ${isDark ? "border-[#0f83b2]/30" : "border-gray-200"
                }`}>
                <h3 className={`font-bold mb-4 flex items-center gap-2 ${isDark ? "text-white" : "text-gray-900"
                  }`}>
                  <Activity className="w-5 h-5 text-green-500" />
                  Medicamentos Recetados
                </h3>
                <div className="space-y-3">
                  {medicamentos.map((med: any, idx: number) => (
                    <div key={idx} className={`p-3 rounded-lg ${isDark ? "bg-[#0d2137]" : "bg-gray-50"
                      }`}>
                      <p className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                        {med.nombre_medicamento || med.nombre_comercial}
                      </p>
                      <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                        {med.indicaciones}
                      </p>
                      <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                        Cantidad: {med.piezas} | Duración: {med.tratamiento_dias} días
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Laboratorio */}
            {estudios.length > 0 && (
              <div className={`p-4 rounded-lg border ${isDark ? "border-[#0f83b2]/30" : "border-gray-200"
                }`}>
                <h3 className={`font-bold mb-4 flex items-center gap-2 ${isDark ? "text-white" : "text-gray-900"
                  }`}>
                  <Activity className="w-5 h-5 text-orange-500" />
                  Estudios Solicitados
                </h3>
                <ul className="list-disc pl-5 space-y-1">
                  {estudios.map((est: any, idx: number) => (
                    <li key={idx} className={`${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      {est.nombre_estudio || "Estudio de laboratorio"}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`w-full max-w-5xl rounded-xl shadow-2xl ${isDark ? "bg-[#0a1929]" : "bg-white"
          } max-h-[90vh] overflow-y-auto`}
      >
        {/* Header */}
        <div
          className={`sticky top-0 z-10 flex items-center justify-between p-6 border-b ${isDark
            ? "bg-[#0a1929] border-[#0f83b2]/30"
            : "bg-white border-gray-200"
            }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Stethoscope className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h2
                className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"
                  }`}
              >
                Detalle de Referencia
              </h2>
              <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Referencia #{referencia.id_referencia}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDark ? "hover:bg-white/10" : "hover:bg-gray-100"
              }`}
          >
            <X className={`w-6 h-6 ${isDark ? "text-gray-400" : "text-gray-600"}`} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Información del Paciente */}
          <div
            className={`p-4 rounded-lg ${isDark ? "bg-[#0d2137]" : "bg-gray-50"}`}
          >
            <h3
              className={`text-sm font-bold mb-3 flex items-center gap-2 ${isDark ? "text-gray-300" : "text-gray-700"
                }`}
            >
              <User className="w-4 h-4" />
              Información del Paciente
            </h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span
                  className={`font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                >
                  Nombre:
                </span>
                <p className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                  {referencia.nombre_paciente}
                </p>
              </div>
              <div>
                <span
                  className={`font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                >
                  Nómina:
                </span>
                <p className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                  {referencia.no_nomina}
                </p>
              </div>
              <div>
                <span
                  className={`font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                >
                  Teléfono:
                </span>
                <p className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                  {referencia.telefono || "No registrado"}
                </p>
              </div>
            </div>
          </div>

          {/* Datos de la Cita */}
          <div
            className={`p-4 rounded-lg border ${isDark
              ? "bg-blue-500/10 border-blue-500/30"
              : "bg-blue-50 border-blue-200"
              }`}
          >
            <h3
              className={`text-sm font-bold mb-3 flex items-center gap-2 ${isDark ? "text-blue-300" : "text-blue-700"
                }`}
            >
              <Calendar className="w-4 h-4" />
              Datos de la Cita
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span
                  className={`font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                >
                  Fecha y hora:
                </span>
                <p
                  className={`text-lg font-bold ${isDark ? "text-blue-300" : "text-blue-700"
                    }`}
                >
                  {referencia.fecha_cita ? formatDate(referencia.fecha_cita) : "N/A"}
                </p>
              </div>
              <div>
                <span
                  className={`font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                >
                  Especialidad:
                </span>
                <p className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                  {referencia.nombre_especialidad}
                </p>
              </div>
            </div>
          </div>

          {/* Información de la Referencia */}
          <div
            className={`p-4 rounded-lg ${isDark ? "bg-[#0d2137]" : "bg-gray-50"}`}
          >
            <h3
              className={`text-sm font-bold mb-3 flex items-center gap-2 ${isDark ? "text-gray-300" : "text-gray-700"
                }`}
            >
              <FileText className="w-4 h-4" />
              Información de la Referencia
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span
                  className={`font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                >
                  Médico que refiere:
                </span>
                <p className={`${isDark ? "text-white" : "text-gray-900"}`}>
                  {referencia.nombre_medico_refiere}
                </p>
              </div>
              <div>
                <span
                  className={`font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                >
                  Motivo de referencia:
                </span>
                <p className={`${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  {referencia.motivo_referencia}
                </p>
              </div>
            </div>
          </div>

          {/* Detalle de Consulta de Origen */}
          {loadingDetalle ? (
            <div className="text-center py-8">
              <div
                className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto ${isDark ? "border-blue-500" : "border-blue-600"
                  }`}
              ></div>
              <p
                className={`text-sm mt-4 ${isDark ? "text-gray-400" : "text-gray-600"
                  }`}
              >
                Cargando detalle de consulta...
              </p>
            </div>
          ) : (
            detalleCompleto?.consulta_origen && (
              <div
                className={`p-4 rounded-lg ${isDark ? "bg-[#0d2137]" : "bg-gray-50"
                  }`}
              >
                <h3
                  className={`text-sm font-bold mb-3 flex items-center gap-2 ${isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                >
                  <Activity className="w-4 h-4" />
                  Detalle de Consulta de Origen
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className={`font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      Diagnóstico(s):
                    </span>
                    {detalleCompleto.consulta_origen.diagnosticos && detalleCompleto.consulta_origen.diagnosticos.length > 0 ? (
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        {detalleCompleto.consulta_origen.diagnosticos.map((diag: any, idx: number) => (
                          <li key={idx} className={`${isDark ? "text-white" : "text-gray-900"}`}>
                            <span className="font-bold">{diag.codigo}</span> - {diag.titulo} {diag.es_principal ? <span className="text-xs opacity-70">(Principal)</span> : ''}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className={`${isDark ? "text-white" : "text-gray-900"}`}>
                        {detalleCompleto.consulta_origen.diagnostico}
                      </p>
                    )}
                  </div>
                  {detalleCompleto.consulta_origen.subjetivo && (
                    <div>
                      <span
                        className={`font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                          }`}
                      >
                        Subjetivo:
                      </span>
                      <p
                        className={`${isDark ? "text-gray-300" : "text-gray-700"}`}
                      >
                        {detalleCompleto.consulta_origen.subjetivo}
                      </p>
                    </div>
                  )}
                  {detalleCompleto.consulta_origen.objetivo && (
                    <div>
                      <span
                        className={`font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                          }`}
                      >
                        Objetivo:
                      </span>
                      <p
                        className={`${isDark ? "text-gray-300" : "text-gray-700"}`}
                      >
                        {detalleCompleto.consulta_origen.objetivo}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          )}

          {/* Historial del Paciente - Colapsable */}
          <div
            className={`rounded-lg border ${isDark ? "border-[#0f83b2]/30" : "border-gray-200"
              }`}
          >
            <button
              onClick={() => setMostrarHistorial(!mostrarHistorial)}
              className={`w-full flex items-center justify-between p-4 transition-colors ${isDark ? "hover:bg-[#0d2137]" : "hover:bg-gray-50"
                }`}
            >
              <h3
                className={`text-sm font-bold flex items-center gap-2 ${isDark ? "text-gray-300" : "text-gray-700"
                  }`}
              >
                <FileText className="w-4 h-4" />
                Historial del Paciente
              </h3>
              {mostrarHistorial ? (
                <ChevronUp
                  className={`w-5 h-5 ${isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                />
              ) : (
                <ChevronDown
                  className={`w-5 h-5 ${isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                />
              )}
            </button>

            {mostrarHistorial && (
              <div className="p-4 pt-0 space-y-4">
                {loadingHistorial ? (
                  <div className="text-center py-4">
                    <div
                      className={`animate-spin rounded-full h-8 w-8 border-b-2 mx-auto ${isDark ? "border-blue-500" : "border-blue-600"
                        }`}
                    ></div>
                    <p
                      className={`text-sm mt-2 ${isDark ? "text-gray-400" : "text-gray-600"
                        }`}
                    >
                      Cargando historial...
                    </p>
                  </div>
                ) : historialPaciente ? (
                  <>
                    {/* Consultas previas */}
                    {historialPaciente.consultas &&
                      historialPaciente.consultas.length > 0 && (
                        <div>
                          <h4
                            className={`text-xs font-bold uppercase mb-2 ${isDark ? "text-gray-400" : "text-gray-600"
                              }`}
                          >
                            Consultas Anteriores ({historialPaciente.consultas.length})
                          </h4>
                          <div className="space-y-2">
                            {historialPaciente.consultas.slice(0, 5).map((consulta: any) => (
                              <button
                                key={consulta.id_consulta}
                                onClick={() => setConsultaSeleccionada(consulta)}
                                className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${isDark ? "bg-[#0d2137] hover:bg-[#1a2c42]" : "bg-gray-50 hover:bg-gray-100"
                                  }`}
                              >
                                <div className="flex justify-between items-center mb-1">
                                  <span className={`font-bold ${isDark ? "text-blue-400" : "text-blue-600"}`}>
                                    {formatDateShort(consulta.fecha_consulta)}
                                  </span>
                                  <span className="text-xs opacity-70">Clic para ver detalle</span>
                                </div>
                                <p
                                  className={`font-medium ${isDark ? "text-white" : "text-gray-900"
                                    }`}
                                >
                                  {consulta.cie11_titulo || consulta.diagnostico || "Sin diagnóstico"}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Referencias previas */}
                    {historialPaciente.referencias &&
                      historialPaciente.referencias.length > 0 && (
                        <div>
                          <h4
                            className={`text-xs font-bold uppercase mb-2 ${isDark ? "text-gray-400" : "text-gray-600"
                              }`}
                          >
                            Referencias Previas ({historialPaciente.referencias.length})
                          </h4>
                          <div className="space-y-2">
                            {historialPaciente.referencias.map((ref: any) => (
                              <div
                                key={ref.id_referencia}
                                className={`p-3 rounded-lg text-sm ${isDark ? "bg-[#0d2137]" : "bg-gray-50"
                                  }`}
                              >
                                <p
                                  className={`font-medium ${isDark ? "text-white" : "text-gray-900"
                                    }`}
                                >
                                  {ref.nombre_especialidad} - {ref.estatus}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </>
                ) : (
                  <p
                    className={`text-sm text-center ${isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                  >
                    No hay historial disponible
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Info y Botones para referencias atendibles */}
          {(referencia.estatus === "notificada" || referencia.estatus === "asignada") && (
            <>
              {/* Aviso: cita vencida - bloqueo de consulta */}
              {citaVencida && (
                <div
                  className={`p-4 rounded-lg border ${
                    isDark
                      ? "bg-red-500/10 border-red-500/40"
                      : "bg-red-50 border-red-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <UserX className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p
                        className={`text-sm font-bold ${
                          isDark ? "text-red-300" : "text-red-700"
                        }`}
                      >
                        Cita vencida — No se puede iniciar la consulta
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          isDark ? "text-red-200/70" : "text-red-600/80"
                        }`}
                      >
                        La fecha de cita programada ya pasó. Si el paciente no
                        se presentó, utiliza la opción{" "}
                        <strong>"Marcar como inasistencia"</strong> desde la
                        tabla de referencias para registrar el evento y generar
                        la constancia correspondiente.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Aviso si es asignada (hospital asignó, pero admin aún no notifica al paciente) */}
              {referencia.estatus === "asignada" && !citaVencida && (
                <div
                  className={`p-4 rounded-lg border ${isDark
                    ? "bg-amber-500/10 border-amber-500/30"
                    : "bg-amber-50 border-amber-200"
                    }`}
                >
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className={`text-sm font-bold ${isDark ? "text-amber-300" : "text-amber-700"}`}>
                        Referencia Asignada - Pendiente de Notificación
                      </p>
                      <p className={`text-xs mt-1 ${isDark ? "text-amber-200/70" : "text-amber-600/80"}`}>
                        El paciente aún no ha sido notificado formalmente por el gestor, pero ya fue autorizada y asignada a usted. Puede iniciar la consulta e imprimir la referencia si el paciente se presenta directamente.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Vista previa del PDF de referencia */}
              <div className={`rounded-lg border overflow-hidden ${isDark ? "border-[#0f83b2]/30" : "border-gray-200"}`}>
                <button
                  onClick={handleTogglePDF}
                  disabled={loadingPDF || loadingDetalle}
                  className={`w-full flex items-center justify-between p-4 transition-colors ${isDark ? "hover:bg-[#0d2137]" : "hover:bg-gray-50"} disabled:opacity-50`}
                >
                  <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    <FileText className="w-4 h-4" />
                    Documento de Referencia a Especialidad
                  </h3>
                  <div className="flex items-center gap-2">
                    {loadingPDF ? (
                      <div className={`animate-spin rounded-full h-4 w-4 border-b-2 ${isDark ? "border-[#0db1ec]" : "border-blue-600"}`} />
                    ) : mostrarReferenciaPDF ? (
                      <EyeOff className={`w-4 h-4 ${isDark ? "text-gray-400" : "text-gray-600"}`} />
                    ) : (
                      <Eye className={`w-4 h-4 ${isDark ? "text-gray-400" : "text-gray-600"}`} />
                    )}
                  </div>
                </button>

                {mostrarReferenciaPDF && pdfUrl && (
                  <div className="border-t ${isDark ? 'border-[#0f83b2]/30' : 'border-gray-200'}">
                    {/* Toolbar */}
                    <div className={`flex items-center gap-2 px-4 py-2 ${isDark ? "bg-[#0d2137]" : "bg-gray-50"}`}>
                      <button
                        onClick={handlePrintPDF}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${isDark
                          ? "bg-[#0f83b2] hover:bg-[#0db1ec] text-white"
                          : "bg-[#0f83b2] hover:bg-[#0a7aa0] text-white"
                          }`}
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Imprimir
                      </button>
                      <button
                        onClick={handleDownloadPDF}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${isDark
                          ? "bg-blue-500 hover:bg-blue-600 text-white"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                          }`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        Descargar
                      </button>
                    </div>
                    {/* PDF Viewer */}
                    <iframe
                      ref={iframeRef}
                      src={pdfUrl}
                      className="w-full"
                      style={{ height: "500px" }}
                      title="Vista previa de la referencia"
                    />
                  </div>
                )}
              </div>

              {/* Info */}
              <div
                className={`p-4 rounded-lg border ${isDark
                  ? "bg-blue-500/10 border-blue-500/30"
                  : "bg-blue-50 border-blue-200"
                  }`}
              >
                <div className="flex items-start gap-2">
                  <Stethoscope className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p
                    className={`text-sm ${isDark ? "text-blue-300" : "text-blue-700"}`}
                  >
                    Al iniciar la consulta, se abrirá el formulario de signos vitales con el paciente ya asignado por esta referencia. Al guardar, serás redirigido directamente al diagnóstico.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${isDark
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Cerrar
                </button>

                {citaVencida ? (
                  <div
                    className="group relative"
                    title="La fecha de cita ya pasó. Usa 'Inasistencia' desde la tabla."
                  >
                    <button
                      disabled
                      className="px-6 py-3 rounded-lg font-medium flex items-center gap-2 bg-gray-400 text-white cursor-not-allowed opacity-60"
                    >
                      <Clock className="w-5 h-5" />
                      Cita Vencida
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleAtender}
                    disabled={submitting}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${isDark
                      ? "bg-blue-500 hover:bg-blue-600 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Stethoscope className="w-5 h-5" />
                    Iniciar Consulta
                  </button>
                )}
              </div>
            </>
          )}

          {referencia.estatus === "atendida" && (
            <div
              className={`p-4 rounded-lg border ${isDark
                ? "bg-green-500/10 border-green-500/30"
                : "bg-green-50 border-green-200"
                }`}
            >
              <div className="flex items-center gap-2 justify-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <p
                  className={`text-sm font-medium ${isDark ? "text-green-300" : "text-green-700"
                    }`}
                >
                  Esta referencia ya fue marcada como atendida
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
