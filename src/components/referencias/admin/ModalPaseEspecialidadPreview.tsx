'use client';

import { useRef, useState, useEffect } from 'react';
import { X, Printer, FileText, Download, RefreshCcw } from 'lucide-react';
import Swal from 'sweetalert2';
import type { ReferenciaEspecialidad } from '@/types/referencias';
import { generarPaseEspecialidadPDF } from '@/lib/generar-pase-especialidad-pdf';

interface Props {
  referencia: ReferenciaEspecialidad | null;
  datosNotificacion?: {
    medio_notificacion?: string;
    observaciones?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmarNotificacion: () => void;
  isDark: boolean;
}

export default function ModalPaseEspecialidadPreview({
  referencia,
  datosNotificacion,
  isOpen,
  onClose,
  onConfirmarNotificacion,
  isDark,
}: Props) {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
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
  }, [isOpen, referencia, datosNotificacion]);

  const cargarPDF = async () => {
    if (!referencia) return;

    try {
      setLoading(true);

      // Combinar datos de referencia con los nuevos datos de notificación para el preview
      const referenciaCompleta: ReferenciaEspecialidad = {
        ...referencia,
        ...(datosNotificacion ? {
          medio_notificacion: datosNotificacion.medio_notificacion || 'presencial',
          observaciones_notificacion: datosNotificacion.observaciones
        } : {})
      };

      // Generar PDF en el cliente (como se hacía antes)
      const pdfBytes = await generarPaseEspecialidadPDF(referenciaCompleta);
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

  const confirmarEntrega = async (accion: 'imprimir' | 'descargar') => {
    const result = await Swal.fire({
      title: '¿Confirmar Entrega?',
      html: 'Confirma que se le hará <strong>entrega de la referencia al paciente</strong> y se realizará la <strong>notificación al médico especialista</strong>.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: accion === 'imprimir' ? 'Sí, Imprimir y Notificar' : 'Sí, Descargar y Notificar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0f83b2',
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    // Ejecutar la acción (imprimir o descargar)
    if (accion === 'imprimir') {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.print();
      }
    } else {
      await descargarPDF();
    }

    // Confirmar la notificación en el sistema
    setConfirming(true);
    try {
      await onConfirmarNotificacion();
    } finally {
      setConfirming(false);
    }
  };

  const descargarPDF = async () => {
    if (!referencia) return;

    try {
      const referenciaCompleta: ReferenciaEspecialidad = {
        ...referencia,
        ...(datosNotificacion ? {
          medio_notificacion: datosNotificacion.medio_notificacion || 'presencial',
          observaciones_notificacion: datosNotificacion.observaciones
        } : {})
      };

      const pdfBytes = await generarPaseEspecialidadPDF(referenciaCompleta);
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
        <div
          className={`flex items-center justify-between border-b px-6 py-4 ${isDark
            ? 'border-[#0f83b2]/30 bg-[#0a1929]'
            : 'border-gray-200 bg-white'
            }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#0f83b2] to-[#0db1ec]">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Vista Previa - Referencia a Especialidad
                </h2>
                {referencia.tipo_referencia === 'seguimiento' && referencia.numero_consulta && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                    <RefreshCcw className="w-3 h-3" />
                    SEG · {referencia.numero_consulta === 2 ? '2ª' : referencia.numero_consulta === 3 ? '3ª' : `${referencia.numero_consulta}ª`} consulta
                  </span>
                )}
              </div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {referencia.folio || `#${referencia.id_referencia}`} • {referencia.nombre_paciente}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => confirmarEntrega('imprimir')}
              disabled={loading || confirming}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${isDark
                ? 'bg-[#0f83b2] hover:bg-[#0db1ec] text-white'
                : 'bg-[#0f83b2] hover:bg-[#0a7aa0] text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Printer className="h-5 w-5" />
              Imprimir
            </button>
            <button
              onClick={() => confirmarEntrega('descargar')}
              disabled={loading || confirming}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${isDark
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Download className="h-5 w-5" />
              Descargar
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
                  className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4 ${isDark ? 'border-[#0db1ec]' : 'border-[#0f83b2]'
                    }`}
                ></div>
                <p
                  className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}
                >
                  Generando referencia a especialidad...
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

        {/* Footer informativo */}
        <div
          className={`border-t px-6 py-3 flex items-center justify-between ${isDark
            ? 'border-[#0f83b2]/30 bg-[#0d2137]'
            : 'border-gray-200 bg-gray-50'
            }`}
        >
          <p
            className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
          >
            {confirming ? 'Procesando notificación...' : 'Revise la referencia y use Imprimir o Descargar para confirmar la entrega'}
          </p>
          <button
            onClick={onClose}
            disabled={confirming}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${isDark
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
