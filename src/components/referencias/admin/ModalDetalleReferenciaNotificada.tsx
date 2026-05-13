import { useRef, useState, useEffect } from "react";
import { X, Printer, Download, FileText } from "lucide-react";
import type { ReferenciaEspecialidad } from "@/types/referencias";
import { generarPaseEspecialidadPDF } from "@/lib/generar-pase-especialidad-pdf";

interface Props {
  referencia: ReferenciaEspecialidad | null;
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

export default function ModalDetalleReferenciaNotificada({ referencia, isOpen, onClose, isDark }: Props) {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (isOpen && referencia) {
      cargarPDF();
    }

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [isOpen, referencia]);

  const cargarPDF = async () => {
    if (!referencia) return;

    try {
      setLoading(true);
      // Generar PDF en el cliente
      const pdfBytes = await generarPaseEspecialidadPDF(referencia);
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar PDF:', error);
      alert('Error al generar el PDF. Por favor intente nuevamente.');
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.print();
    }
  };

  const handleDownloadPDF = async () => {
    if (!referencia) return;

    try {
      const pdfBytes = await generarPaseEspecialidadPDF(referencia);
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Referencia_Especialidad_${referencia.folio || referencia.id_referencia}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      alert('Error al descargar el PDF. Por favor intente nuevamente.');
    }
  };

  if (!isOpen || !referencia) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className={`relative w-full max-w-6xl max-h-[95vh] overflow-hidden rounded-2xl shadow-2xl ${isDark ? 'bg-[#0a1929]' : 'bg-white'
          }`}
      >
        {/* Header */}
        {/* Header */}
        <div
          className={`flex items-center justify-between border-b px-4 py-3 sm:px-6 sm:py-4 ${isDark
            ? 'border-[#0f83b2]/20 bg-[#0a1929]'
            : 'border-gray-200 bg-white'
            }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2 rounded-lg shrink-0 ${isDark ? "bg-[#0f83b2]/20" : "bg-blue-100"}`}>
              <FileText className={`h-5 w-5 sm:h-6 sm:w-6 ${isDark ? "text-[#0db1ec]" : "text-[#0f83b2]"}`} />
            </div>
            <div className="min-w-0">
              <h2
                className={`text-lg sm:text-xl font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'
                  }`}
              >
                Detalle de Referencia
              </h2>
              <p
                className={`text-xs sm:text-sm truncate ${isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}
              >
                #{referencia.id_referencia} • {referencia.nombre_paciente}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <button
              onClick={handlePrint}
              disabled={loading}
              className={`flex items-center gap-2 rounded-lg p-2 sm:px-4 sm:py-2 font-medium transition-colors ${isDark
                ? 'bg-[#0f83b2]/10 text-[#0db1ec] hover:bg-[#0f83b2]/20'
                : 'bg-blue-50 text-[#0f83b2] hover:bg-blue-100'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Imprimir"
            >
              <Printer className="h-5 w-5" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={loading}
              className={`flex items-center gap-2 rounded-lg p-2 sm:px-4 sm:py-2 font-medium transition-colors ${isDark
                ? 'bg-[#0f83b2] hover:bg-[#0db1ec] text-white'
                : 'bg-[#0f83b2] hover:bg-[#0a7aa0] text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Descargar"
            >
              <Download className="h-5 w-5" />
              <span className="hidden sm:inline">Descargar</span>
            </button>
            <button
              onClick={onClose}
              className={`rounded-lg p-2 transition-colors ${isDark
                ? 'hover:bg-white/10 text-gray-400'
                : 'hover:bg-gray-100 text-gray-600'
                }`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Preview del PDF */}
        <div className="relative" style={{ height: 'calc(95vh - 160px)' }}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div
                  className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4 ${isDark ? 'border-[#0db1ec]' : 'border-blue-600'
                    }`}
                ></div>
                <p
                  className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}
                >
                  Generando vista previa...
                </p>
              </div>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              src={pdfUrl}
              className="w-full h-full"
              title="Vista previa de la referencia a especialidad"
            />
          )}
        </div>

        {/* Footer */}
        <div
          className={`border-t px-6 py-4 flex items-center justify-end ${isDark
            ? 'border-[#0f83b2]/30 bg-[#0d2137]'
            : 'border-gray-200 bg-gray-50'
            }`}
        >
          <button
            onClick={onClose}
            className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${isDark
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
