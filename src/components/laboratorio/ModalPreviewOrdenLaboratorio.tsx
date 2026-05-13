import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Download, FileText } from 'lucide-react';
import { useEffect } from 'react';

interface ModalPreviewOrdenLaboratorioProps {
    isOpen: boolean;
    onClose: () => void;
    pdfUrl: string | null;
    pacienteNombre: string;
    folio: string;
}

export default function ModalPreviewOrdenLaboratorio({
    isOpen,
    onClose,
    pdfUrl,
    pacienteNombre,
    folio
}: ModalPreviewOrdenLaboratorioProps) {
    // Prevent scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                        onClick={onClose}
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-full max-w-4xl h-[85vh] flex flex-col bg-white dark:bg-[#0a1929] rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-[#0f83b2]/30"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-[#0f83b2]/20 bg-gray-50/50 dark:bg-[#0d2137]">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-[#0f83b2]/20 rounded-lg text-blue-600 dark:text-[#0db1ec]">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Vista Previa de Orden</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {pacienteNombre} • {folio}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700/50 rounded-full text-gray-500 dark:text-gray-400 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content (Iframe) */}
                        <div className="flex-1 bg-gray-100 dark:bg-[#0a1520] relative">
                            {pdfUrl ? (
                                <iframe
                                    src={pdfUrl}
                                    className="w-full h-full"
                                    title="PDF Preview"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full flex-col gap-3">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0db1ec]"></div>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Generando vista previa...</span>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 border-t border-gray-100 dark:border-[#0f83b2]/20 bg-white dark:bg-[#0a1929] flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                Cerrar
                            </button>
                            <a
                                href={pdfUrl || '#'}
                                download={`Orden_${folio}.pdf`}
                                className={`flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#0d2137] border border-gray-200 dark:border-[#0f83b2]/30 text-gray-700 dark:text-gray-200 rounded-lg transition-colors
                                    ${!pdfUrl ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-50 dark:hover:bg-[#0f83b2]/10'}
                                `}
                            >
                                <Download size={16} />
                                Descargar
                            </a>
                            <button
                                onClick={() => {
                                    if (pdfUrl) {
                                        // Open standard print dialog via new window or iframe contentWindow print
                                        // Opening in new window is safer for styles
                                        const w = window.open(pdfUrl, '_blank');
                                    }
                                }}
                                disabled={!pdfUrl}
                                className="flex items-center gap-2 px-6 py-2 bg-[#0db1ec] hover:bg-[#0f83b2] text-white font-bold rounded-lg shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                            >
                                <Printer size={18} />
                                Imprimir
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
