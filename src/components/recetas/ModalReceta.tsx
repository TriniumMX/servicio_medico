'use client';

import { useRef, useState, useEffect } from 'react';
import { X, Printer, FileText, Download } from 'lucide-react';

interface ModalRecetaProps {
  isOpen: boolean;
  onClose: () => void;
  recetaData: {
    folio_receta: string;
    folio_consulta: string;
    fecha_emision: string;
    paciente: {
      nombre: string;
      edad?: number;
      no_nomina: string;
      departamento?: string;
      es_empleado: boolean;
    };
    medico: {
      nombre: string;
      cedula?: string;
    };
    medicamentos: Array<{
      nombre_comercial: string;
      sustancia_activa: string;
      dosis: string;
      duracion_tratamiento_dias: number;
      cantidad_total: number;
      indicaciones?: string;
      realizar_resurtimiento: boolean;
      meses_resurtimiento?: number;
    }>;
    diagnostico?: {
      codigo: string;
      titulo: string;
    };
  };
  isDark: boolean;
}

export default function ModalReceta({
  isOpen,
  onClose,
  recetaData,
  isDark,
}: ModalRecetaProps) {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (isOpen) {
      cargarPDF();
    }

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [isOpen]);

  const cargarPDF = async () => {
    try {
      setLoading(true);
      const idConsulta = (recetaData as any).id_consulta;

      if (!idConsulta) {
        alert('No se pudo obtener el ID de la consulta');
        return;
      }

      const response = await fetch(`/api/recetas/generar-pdf-consulta/${idConsulta}`);

      if (!response.ok) {
        throw new Error('Error al generar el PDF');
      }

      const blob = await response.blob();
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
    try {
      const idConsulta = (recetaData as any).id_consulta;

      if (!idConsulta) {
        alert('No se pudo obtener el ID de la consulta');
        return;
      }

      const response = await fetch(`/api/recetas/generar-pdf-consulta/${idConsulta}`);

      if (!response.ok) {
        throw new Error('Error al generar el PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receta-${recetaData.folio_consulta}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      alert('Error al generar el PDF. Por favor intente nuevamente.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-5xl h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border transition-all ${isDark
          ? 'bg-[#0a1929] border-[#0f83b2]/30 text-white'
          : 'bg-white border-gray-200 text-gray-900'
          }`}
      >
        {/* Header */}
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b shrink-0 ${isDark
            ? 'bg-[#0d1f2d] border-[#0f83b2]/10'
            : 'bg-gray-50/80 border-gray-100'
            }`}
        >
          <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-xl ${isDark ? 'bg-[#0f83b2]/20' : 'bg-blue-50'}`}>
              <FileText className={`w-6 h-6 ${isDark ? 'text-[#0db1ec]' : 'text-blue-600'}`} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold leading-tight">
                Receta Médica Generada
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${isDark ? 'bg-[#0f83b2]/20 text-[#0db1ec]' : 'bg-blue-100 text-blue-700'
                  }`}>
                  Folio
                </span>
                <span className={`font-mono text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {recetaData.folio_receta}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:self-center self-end">
            <button
              onClick={handlePrint}
              disabled={loading || !pdfUrl}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${isDark
                ? 'bg-[#0f83b2] text-white hover:bg-[#0d6f97] disabled:opacity-50 disabled:cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-blue-200'
                }`}
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={loading || !pdfUrl}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${isDark
                ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                }`}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Descargar</span>
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-all ${isDark
                ? 'hover:bg-red-500/20 text-gray-400 hover:text-red-400'
                : 'hover:bg-red-50 text-gray-400 hover:text-red-500'
                }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className={`flex-1 relative w-full overflow-hidden ${isDark ? 'bg-[#050b14]' : 'bg-gray-100'}`}>
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div
                className={`w-12 h-12 border-4 border-t-transparent rounded-full animate-spin ${isDark ? 'border-[#0db1ec]' : 'border-blue-600'
                  }`}
              />
              <p className={`text-sm font-medium animate-pulse ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Generando documento PDF...
              </p>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              src={pdfUrl}
              className="w-full h-full border-none"
              title="Vista previa de la receta"
            />
          )}
        </div>
      </div>
    </div>
  );
}
