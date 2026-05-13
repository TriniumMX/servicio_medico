'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, Download, ArrowLeft, FileText } from 'lucide-react';

interface ModalImprimirResurtimientoProps {
  isOpen: boolean;
  onClose: () => void;
  idReceta: number;
  folioReceta: string;
  folioRecetaOriginal: string;
  isDark: boolean;
}

type Vista = 'receta' | 'preview';

export default function ModalImprimirResurtimiento({
  isOpen,
  onClose,
  idReceta,
  folioReceta,
  folioRecetaOriginal,
  isDark,
}: ModalImprimirResurtimientoProps) {
  const [descargando, setDescargando] = useState(false);
  const [vista, setVista] = useState<Vista>('receta');


  const pdfUrl = `/api/recetas/generar-pdf/${idReceta}`;
  const pdfPreviewUrl = `/api/recetas/generar-pdf/${idReceta}?preview=true`;

  const handleImprimirReceta = () => {
    window.open(pdfPreviewUrl, '_blank');
  };

  const handleDescargarPDF = async () => {
    setDescargando(true);
    try {
      const response = await fetch(pdfUrl);
      if (!response.ok) throw new Error('Error al generar PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resurtimiento-${folioReceta}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      alert('Error al descargar el PDF. Intente nuevamente.');
    } finally {
      setDescargando(false);
    }
  };

  const handleCerrar = () => {
    setVista('receta');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={vista === 'receta' ? handleCerrar : undefined}
      />

      <AnimatePresence mode="wait">

        {/* ── Vista: ¡Receta Generada! ── */}
        {vista === 'receta' && (
          <motion.div
            key="receta"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className={`relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border ${
              isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-white'
            }`}
          >
            {/* Header */}
            <div className={`p-8 text-center bg-gradient-to-br ${isDark ? 'from-emerald-900/50 to-teal-900/30' : 'from-emerald-50 to-teal-50'}`}>
              <div className="w-20 h-20 mx-auto bg-emerald-500 rounded-full flex items-center justify-center shadow-lg transform -rotate-12 mb-6 text-4xl">
                📄
              </div>
              <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                ¡Receta Generada!
              </h2>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                La receta de resurtimiento{' '}
                <span className="font-mono font-bold text-emerald-500">{folioReceta}</span>{' '}
                ha sido creada exitosamente.
              </p>
            </div>

            {/* Body */}
            <div className="p-8 space-y-6">
              <div className={`rounded-2xl p-4 text-sm ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <h3 className={`font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Pasos siguientes:
                </h3>
                <ul className={`space-y-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <li className="flex gap-2">
                    <span>1.</span> Descargue o imprima el archivo PDF.
                  </li>
                  <li className="flex gap-2">
                    <span>2.</span> Entregue la hoja impresa al paciente.
                  </li>
                  <li className="flex gap-2">
                    <span>3.</span> El código de barras será escaneado en farmacia.
                  </li>
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                {/* Imprimir Receta */}
                <button
                  onClick={handleImprimirReceta}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-lg shadow-lg transform transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Printer className="w-5 h-5" />
                  <span>Imprimir Receta</span>
                </button>

                <div className="grid grid-cols-2 gap-3">
                  {/* Vista Previa */}
                  <button
                    onClick={() => setVista('preview')}
                    className={`py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                      isDark
                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Vista Previa
                  </button>

                  {/* Cerrar */}
                  <button
                    onClick={handleCerrar}
                    className={`py-3 px-4 rounded-xl font-medium transition-colors border ${
                      isDark
                        ? 'border-gray-700 hover:bg-gray-800 text-gray-400'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Vista: Vista Previa PDF ── */}
        {vista === 'preview' && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.2 }}
            className={`relative w-full max-w-4xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden border flex flex-col ${
              isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
            }`}
          >
            {/* Header de preview */}
            <div className={`flex items-center justify-between px-6 py-4 border-b flex-shrink-0 ${
              isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <FileText className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <div>
                  <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Vista Previa — Receta de Resurtimiento
                  </p>
                  <p className={`text-xs font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    {folioReceta}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Descargar */}
                <button
                  onClick={handleDescargarPDF}
                  disabled={descargando}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-colors active:scale-95 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {descargando ? 'Descargando...' : 'Descargar'}
                </button>

                {/* Atrás */}
                <button
                  onClick={() => setVista('receta')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors border ${
                    isDark
                      ? 'border-gray-600 hover:bg-gray-700 text-gray-300'
                      : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Atrás
                </button>
              </div>
            </div>

            {/* iframe PDF */}
            <div className="flex-1 overflow-hidden">
              <iframe
                src={pdfPreviewUrl}
                className="w-full h-full"
                title={`Receta ${folioReceta}`}
              />
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
