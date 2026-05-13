// src/components/referencias/especialista/ModalInasistencia.tsx
"use client";

import { useState } from "react";
import {
  X,
  UserX,
  AlertTriangle,
  FileText,
  Download,
  Printer,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import type { ReferenciaEspecialidad } from "@/types/referencias";
import { generarInasistenciaPDF } from "@/lib/generar-inasistencia-pdf";

interface Props {
  referencia: ReferenciaEspecialidad | null;
  isOpen: boolean;
  onClose: () => void;
  onInasistenciaRegistrada: () => void;
  isDark: boolean;
}

type Paso = "formulario" | "completado";

export default function ModalInasistencia({
  referencia,
  isOpen,
  onClose,
  onInasistenciaRegistrada,
  isDark,
}: Props) {
  const [motivo, setMotivo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paso, setPaso] = useState<Paso>("formulario");
  const [datosEmision, setDatosEmision] = useState<{
    fecha: string;
    nombreEmisor: string;
  } | null>(null);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>("");

  const handleClose = () => {
    setMotivo("");
    setError(null);
    setPaso("formulario");
    setDatosEmision(null);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfBlob(null);
    setPdfUrl("");
    onClose();
  };

  const generarYGuardarPDF = async (
    ref: ReferenciaEspecialidad,
    motivoTexto: string,
    fechaGenerado: string,
    nombreEmisor: string,
  ) => {
    const pdfBytes = await generarInasistenciaPDF({
      referencia: ref,
      motivo: motivoTexto,
      fechaGenerado,
      nombreEmisor,
    });
    const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    setPdfBlob(blob);
    setPdfUrl(url);
  };

  const handleSubmit = async () => {
    if (!referencia) return;

    if (motivo.trim().length < 10) {
      setError("Por favor ingresa un motivo con al menos 10 caracteres.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch(
        "/api/referencias/especialista/marcar-inasistencia",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_referencia: referencia.id_referencia,
            motivo_inasistencia: motivo.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Ocurrió un error al registrar la inasistencia.");
        return;
      }

      // Guardar datos de emisión para el PDF
      const emision = {
        fecha: data.data.fecha_inasistencia,
        nombreEmisor: data.data.nombre_usuario_inasistencia,
      };
      setDatosEmision(emision);

      // Generar PDF automáticamente
      setGenerandoPDF(true);
      try {
        await generarYGuardarPDF(
          referencia,
          motivo.trim(),
          emision.fecha,
          emision.nombreEmisor,
        );
      } finally {
        setGenerandoPDF(false);
      }

      setPaso("completado");
      onInasistenciaRegistrada();
    } catch (err) {
      console.error("Error al registrar inasistencia:", err);
      setError("Error de conexión. Por favor intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDescargar = () => {
    if (!pdfBlob || !referencia) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = `Inasistencia_${referencia.folio || referencia.id_referencia}_${referencia.nombre_paciente.replace(/\s+/g, "_")}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImprimir = () => {
    if (!pdfUrl) return;
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = pdfUrl;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    };
  };

  if (!isOpen || !referencia) return null;

  const formatFechaCita = (dateStr: string | null) => {
    if (!dateStr) return "No establecida";
    return new Date(dateStr).toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className={`w-full max-w-2xl rounded-xl shadow-2xl ${
          isDark ? "bg-[#0a1929]" : "bg-white"
        } max-h-[90vh] overflow-y-auto`}
      >
        {/* Header */}
        <div
          className={`sticky top-0 z-10 flex items-center justify-between p-6 border-b ${
            isDark
              ? "bg-[#0a1929] border-red-500/30"
              : "bg-white border-red-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20">
              <UserX className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2
                className={`text-xl font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Registrar Inasistencia
              </h2>
              <p
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Referencia #{referencia.id_referencia} ·{" "}
                {referencia.folio || "Sin folio"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? "hover:bg-white/10" : "hover:bg-gray-100"
            }`}
          >
            <X
              className={`w-6 h-6 ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* ===== PASO: FORMULARIO ===== */}
          {paso === "formulario" && (
            <>
              {/* Aviso */}
              <div
                className={`flex gap-3 p-4 rounded-lg border ${
                  isDark
                    ? "bg-amber-500/10 border-amber-500/30"
                    : "bg-amber-50 border-amber-200"
                }`}
              >
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p
                  className={`text-sm ${
                    isDark ? "text-amber-200" : "text-amber-800"
                  }`}
                >
                  Al registrar la inasistencia, la referencia quedará marcada y
                  se generará automáticamente una constancia en PDF con la
                  información del paciente y el motivo.
                </p>
              </div>

              {/* Datos del paciente */}
              <div
                className={`p-4 rounded-lg ${
                  isDark ? "bg-[#0d2137]" : "bg-gray-50"
                }`}
              >
                <p
                  className={`text-xs font-bold uppercase mb-3 ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Datos del paciente
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span
                      className={`block text-xs ${
                        isDark ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      Nombre
                    </span>
                    <span
                      className={`font-bold ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {referencia.nombre_paciente}
                    </span>
                  </div>
                  <div>
                    <span
                      className={`block text-xs ${
                        isDark ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      Nómina
                    </span>
                    <span
                      className={`font-bold ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {referencia.no_nomina}
                    </span>
                  </div>
                  <div>
                    <span
                      className={`block text-xs ${
                        isDark ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      Especialidad
                    </span>
                    <span
                      className={`${isDark ? "text-gray-200" : "text-gray-700"}`}
                    >
                      {referencia.nombre_especialidad}
                    </span>
                  </div>
                  <div>
                    <span
                      className={`block text-xs ${
                        isDark ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      Fecha de cita programada
                    </span>
                    <span className="text-red-500 font-medium">
                      {formatFechaCita(referencia.fecha_cita)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Campo de motivo */}
              <div>
                <label
                  className={`block text-sm font-bold mb-2 ${
                    isDark ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  Motivo de inasistencia{" "}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={motivo}
                  onChange={(e) => {
                    setMotivo(e.target.value);
                    if (error) setError(null);
                  }}
                  rows={5}
                  placeholder="Describe el motivo por el cual el paciente no se presentó a la cita con el especialista..."
                  className={`w-full px-4 py-3 rounded-lg border text-sm resize-none transition-colors focus:outline-none focus:ring-2 ${
                    isDark
                      ? "bg-[#0d2137] border-[#0f83b2]/40 text-white placeholder-gray-500 focus:ring-[#0f83b2]/50 focus:border-[#0f83b2]"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500/30 focus:border-blue-500"
                  } ${error ? (isDark ? "border-red-500/70" : "border-red-400") : ""}`}
                />
                <div className="flex items-center justify-between mt-1">
                  {error ? (
                    <p className="text-xs text-red-500">{error}</p>
                  ) : (
                    <span />
                  )}
                  <p
                    className={`text-xs ${
                      motivo.length < 10
                        ? "text-red-400"
                        : isDark
                          ? "text-gray-500"
                          : "text-gray-400"
                    }`}
                  >
                    {motivo.length} caracteres (mínimo 10)
                  </p>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={submitting}
                  className={`px-5 py-2.5 rounded-lg font-medium transition-colors ${
                    isDark
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                  } disabled:opacity-50`}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || motivo.trim().length < 10}
                  className="px-5 py-2.5 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <UserX className="w-4 h-4" />
                      Registrar Inasistencia
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* ===== PASO: COMPLETADO ===== */}
          {paso === "completado" && (
            <>
              {/* Banner de éxito */}
              <div
                className={`flex gap-3 p-5 rounded-lg border ${
                  isDark
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-green-50 border-green-200"
                }`}
              >
                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                <div>
                  <p
                    className={`font-bold ${
                      isDark ? "text-green-300" : "text-green-700"
                    }`}
                  >
                    Inasistencia registrada exitosamente
                  </p>
                  <p
                    className={`text-sm mt-1 ${
                      isDark ? "text-green-200/70" : "text-green-600"
                    }`}
                  >
                    La referencia ha sido marcada como inasistencia y se generó
                    la constancia correspondiente.
                  </p>
                </div>
              </div>

              {/* Resumen */}
              <div
                className={`p-4 rounded-lg ${
                  isDark ? "bg-[#0d2137]" : "bg-gray-50"
                }`}
              >
                <p
                  className={`text-xs font-bold uppercase mb-3 flex items-center gap-2 ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Resumen de la constancia
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span
                      className={isDark ? "text-gray-400" : "text-gray-600"}
                    >
                      Paciente:
                    </span>
                    <span
                      className={`font-bold ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {referencia.nombre_paciente}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span
                      className={isDark ? "text-gray-400" : "text-gray-600"}
                    >
                      Especialidad:
                    </span>
                    <span className={isDark ? "text-gray-200" : "text-gray-700"}>
                      {referencia.nombre_especialidad}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span
                      className={isDark ? "text-gray-400" : "text-gray-600"}
                    >
                      Emitido por:
                    </span>
                    <span className={isDark ? "text-gray-200" : "text-gray-700"}>
                      {datosEmision?.nombreEmisor}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span
                      className={isDark ? "text-gray-400" : "text-gray-600"}
                    >
                      Fecha/hora:
                    </span>
                    <span className={isDark ? "text-gray-200" : "text-gray-700"}>
                      {datosEmision
                        ? new Date(datosEmision.fecha).toLocaleString("es-MX")
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Motivo registrado */}
              <div
                className={`p-4 rounded-lg border ${
                  isDark
                    ? "bg-red-500/10 border-red-500/30"
                    : "bg-red-50 border-red-100"
                }`}
              >
                <p
                  className={`text-xs font-bold mb-2 ${
                    isDark ? "text-red-300" : "text-red-700"
                  }`}
                >
                  Motivo registrado:
                </p>
                <p className={`text-sm ${isDark ? "text-gray-200" : "text-gray-700"}`}>
                  {motivo}
                </p>
              </div>

              {/* Acciones del PDF */}
              {generandoPDF ? (
                <div className="flex items-center justify-center gap-2 py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  <span
                    className={`text-sm ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Generando constancia PDF...
                  </span>
                </div>
              ) : pdfUrl ? (
                <div
                  className={`flex gap-3 p-4 rounded-lg border ${
                    isDark ? "border-[#0f83b2]/30" : "border-gray-200"
                  }`}
                >
                  <FileText className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p
                      className={`text-sm font-bold mb-3 ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Constancia de Inasistencia generada
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={handleDescargar}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Descargar PDF
                      </button>
                      <button
                        onClick={handleImprimir}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isDark
                            ? "bg-gray-700 hover:bg-gray-600 text-white"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                        }`}
                      >
                        <Printer className="w-4 h-4" />
                        Imprimir
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Botón de cierre */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleClose}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
                    isDark
                      ? "bg-[#0f83b2] hover:bg-[#0db1ec] text-white"
                      : "bg-[#0f83b2] hover:bg-[#0a7aa0] text-white"
                  }`}
                >
                  Cerrar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
