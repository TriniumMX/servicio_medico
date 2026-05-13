"use client";

import { useState, useEffect } from "react";
import { X, Printer, CheckCircle, FileText, User, Calendar, Loader2 } from "lucide-react";

interface Incapacidad {
  id_incapacidad: number;
  folio_consulta: string;
  no_nomina: string;
  nombre_paciente: string;
  departamento: string;
  diagnostico: string;
  codigo_cie: string;
  dias_autorizados?: number;
  fecha_inicio: string;
  fecha_fin: string;
  nombre_doctor?: string;
  fecha_autorizacion?: string;
  nombre_autorizador?: string;
}

interface ModalVistaPreviaProps {
  isOpen: boolean;
  onClose: () => void;
  data: Incapacidad | null;
  onImprimir: () => void;
  onMarcarEntregada: () => void;
  isDark?: boolean;
  loading?: boolean;
}

export default function ModalVistaPrevia({
  isOpen,
  onClose,
  data,
  onImprimir,
  onMarcarEntregada,
  isDark = false,
  loading = false
}: ModalVistaPreviaProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [generando, setGenerando] = useState(false);

  useEffect(() => {
    if (isOpen && data) {
      generarVistaPrevia();
    }
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [isOpen, data]);

  const generarVistaPrevia = async () => {
    if (!data) return;
    setGenerando(true);
    try {
      const { generarIncapacidadPDF } = await import("@/lib/generar-incapacidad-pdf");
      const pdfBytes = await generarIncapacidadPDF({
        id_incapacidad: data.id_incapacidad,
        folio_consulta: data.folio_consulta,
        no_nomina: data.no_nomina,
        nombre_paciente: data.nombre_paciente,
        departamento: data.departamento,
        diagnostico: `${data.codigo_cie} - ${data.diagnostico}`,
        dias_autorizados: data.dias_autorizados || 0,
        fecha_inicio: data.fecha_inicio,
        fecha_fin: data.fecha_fin,
        nombre_doctor: data.nombre_doctor || "Dr. Desconocido",
        fecha_autorizacion: data.fecha_autorizacion || new Date().toISOString(),
        nombre_autorizador: data.nombre_autorizador
      });

      const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error("Error generando vista previa:", error);
    } finally {
      setGenerando(false);
    }
  };

  if (!isOpen || !data) return null;

  const handleImprimir = () => {
    onImprimir();
  };

  const handleImprimirYMarcar = () => {
    onImprimir();
    onMarcarEntregada();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
      <div className={`w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all animate-in zoom-in-95 duration-200 ${
        isDark
          ? "bg-[#0a1929] border border-[#0f83b2]/30"
          : "bg-white shadow-xl"
      }`}>

        {/* Header */}
        <div className={`px-4 sm:px-6 py-4 flex justify-between items-center border-b shrink-0 ${
          isDark
            ? "border-[#0f83b2]/20 bg-gradient-to-r from-[#0f83b2]/10 to-[#0db1ec]/5"
            : "border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              isDark
                ? "bg-[#0f83b2]/20 text-[#0db1ec]"
                : "bg-blue-100 text-blue-600"
            }`}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base sm:text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                Vista Previa - Incapacidad
              </h3>
              <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Folio: {data.folio_consulta} | ID: {data.id_incapacidad}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-all ${
              isDark
                ? "hover:bg-white/10 text-gray-400 hover:text-white"
                : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info del Paciente - Resumen */}
        <div className={`px-4 sm:px-6 py-3 border-b shrink-0 ${
          isDark ? "border-[#0f83b2]/20 bg-[#0d2137]/50" : "border-gray-100 bg-gray-50"
        }`}>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <User className={`w-4 h-4 ${isDark ? "text-[#0db1ec]" : "text-blue-600"}`} />
              <span className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                {data.nombre_paciente}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>Nómina:</span>
              <span className={`text-sm font-mono font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                {data.no_nomina}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className={`w-4 h-4 ${isDark ? "text-green-400" : "text-green-600"}`} />
              <span className={`text-sm font-bold ${isDark ? "text-green-400" : "text-green-600"}`}>
                {data.dias_autorizados || 0} Días
              </span>
            </div>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 min-h-0 p-4">
          {generando ? (
            <div className={`h-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed ${
              isDark ? "border-[#0f83b2]/30 bg-[#0d2137]" : "border-gray-200 bg-gray-50"
            }`}>
              <Loader2 className={`w-12 h-12 animate-spin mb-4 ${isDark ? "text-[#0db1ec]" : "text-blue-500"}`} />
              <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Generando vista previa...
              </p>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full rounded-xl border"
              style={{ border: isDark ? "1px solid rgba(15, 131, 178, 0.3)" : "1px solid #e5e7eb" }}
            />
          ) : (
            <div className={`h-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed ${
              isDark ? "border-red-500/30 bg-[#0d2137]" : "border-red-200 bg-red-50"
            }`}>
              <FileText className={`w-12 h-12 mb-4 ${isDark ? "text-red-400" : "text-red-400"}`} />
              <p className={`text-sm font-medium ${isDark ? "text-red-400" : "text-red-600"}`}>
                Error al generar la vista previa
              </p>
            </div>
          )}
        </div>

        {/* Footer con botones */}
        <div className={`px-4 sm:px-6 py-4 border-t flex flex-col sm:flex-row sm:justify-between gap-3 shrink-0 ${
          isDark
            ? "border-[#0f83b2]/20 bg-[#050b14]/50"
            : "border-gray-100 bg-gray-50/80"
        }`}>
          <button
            onClick={onClose}
            className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${
              isDark
                ? "text-gray-300 hover:bg-white/5 border border-gray-700"
                : "text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            Cancelar
          </button>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Solo Imprimir */}
            <button
              onClick={handleImprimir}
              disabled={loading || generando}
              className={`px-5 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                isDark
                  ? "bg-[#0d2137] text-[#0db1ec] border border-[#0f83b2]/30 hover:bg-[#0f83b2]/20"
                  : "bg-white text-blue-600 border border-blue-200 hover:bg-blue-50"
              } disabled:opacity-50`}
            >
              <Printer className="w-4 h-4" />
              <span>Solo Imprimir</span>
            </button>

            {/* Imprimir y Marcar como Entregada */}
            <button
              onClick={handleImprimirYMarcar}
              disabled={loading || generando}
              className={`px-6 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-green-500/25 disabled:opacity-50`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              <span>Imprimir y Marcar Entregada</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
