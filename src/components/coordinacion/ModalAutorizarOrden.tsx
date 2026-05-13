'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, FileText, User, Calendar, FileSignature } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    grupo: any;
    firmaBase64?: string;
    isDark: boolean;
    doctorName: string;
}

export default function ModalAutorizarOrden({
    isOpen,
    onClose,
    onConfirm,
    grupo,
    firmaBase64,
    isDark,
    doctorName
}: Props) {
    if (!isOpen || !grupo) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${isDark ? 'bg-[#0a1929] border border-gray-700' : 'bg-white'
                        }`}
                >
                    {/* Header */}
                    <div className={`p-6 border-b flex justify-between items-start ${isDark ? 'border-gray-700 bg-[#0d2137]' : 'border-gray-100 bg-gray-50'}`}>
                        <div>
                            <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                <CheckCircle className="text-green-500" /> Confirmar Autorización
                            </h2>
                            <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Revise los detalles de la orden antes de firmar.
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-full hover:bg-gray-200/20 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 overflow-y-auto space-y-6">

                        {/* Paciente y Detalles */}
                        <div className={`p-4 rounded-xl border ${isDark ? 'bg-blue-900/10 border-blue-500/20' : 'bg-blue-50 border-blue-100'}`}>
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-full ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                                    <User size={24} />
                                </div>
                                <div>
                                    <h3 className={`font-bold text-lg ${isDark ? 'text-blue-100' : 'text-blue-900'}`}>{grupo.paciente}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 mt-2 text-sm opacity-80">
                                        <span className="block">Folio: <strong>{grupo.folio}</strong></span>
                                        <span className="block">Nómina: {grupo.nomina}</span>
                                        <span className="block">Depto: {grupo.depto}</span>
                                        <span className="block flex items-center gap-1"><Calendar size={12} /> {new Date(grupo.fecha).toLocaleDateString()}</span>
                                    </div>
                                    <p className={`mt-2 text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                                        Dr. Solicitante: {grupo.medico}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Lista de Estudios */}
                        <div>
                            <h4 className={`text-sm font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Estudios Solicitados ({grupo.estudios.length})
                            </h4>
                            <div className={`rounded-xl border divide-y overflow-hidden ${isDark ? 'border-gray-700 divide-gray-700' : 'border-gray-200 divide-gray-100'}`}>
                                {grupo.estudios.map((est: any, idx: number) => (
                                    <div key={idx} className={`p-3 flex justify-between items-center ${isDark ? 'bg-[#0f1d2e]' : 'bg-white'}`}>
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{est.nombre_estudio}</p>
                                            <p className="text-xs text-gray-500">{est.categoria || 'General'}</p>
                                        </div>
                                        <div className="flex items-center gap-3 ml-2">
                                            {est.motivo_clinico && (
                                                <div className={`text-xs px-2 py-1 rounded max-w-[150px] truncate ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                                                    {est.motivo_clinico}
                                                </div>
                                            )}
                                            {est.costo != null && (
                                                <span className={`text-sm font-bold whitespace-nowrap ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                                    ${Number(est.costo).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {/* Total */}
                                {(() => {
                                    const total = grupo.estudios.reduce((sum: number, e: any) => sum + (Number(e.costo) || 0), 0);
                                    return total > 0 ? (
                                        <div className={`p-3 flex justify-between items-center font-bold ${isDark ? 'bg-[#0d2137]' : 'bg-gray-50'}`}>
                                            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Total</span>
                                            <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>
                                                ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    ) : null;
                                })()}
                            </div>
                        </div>

                        {/* Preview de Firma */}
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <h4 className={`text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                <FileSignature size={16} /> Firma de Autorización
                            </h4>
                            <div className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl ${isDark
                                ? 'bg-gray-800/50 border-gray-700'
                                : 'bg-[#f9f7f2] border-[#e6e2dd]'
                                }`}>
                                {firmaBase64 ? (
                                    <div className="text-center">
                                        <img src={firmaBase64} alt="Firma Digital" className={`h-24 object-contain mx-auto mb-2 ${isDark ? 'filter invert' : ''}`} />
                                        <div className="w-48 h-px bg-gray-400 mx-auto my-1"></div>
                                        <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Dr. {doctorName}</p>
                                        <p className={`text-xs font-bold uppercase tracking-wider mt-1 ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>Coordinador Médico</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <FileSignature className="text-gray-400" size={32} />
                                        </div>
                                        <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                            Sin firma digital registrada
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Se le solicitará su firma en el siguiente paso.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Footer */}
                    <div className={`p-6 border-t flex justify-end gap-3 ${isDark ? 'border-gray-700 bg-[#0d2137]' : 'border-gray-100 bg-gray-50'}`}>
                        <button
                            onClick={onClose}
                            className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${isDark
                                ? 'text-gray-300 hover:bg-white/5'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onConfirm}
                            className="px-6 py-2.5 bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] hover:from-[#0d729c] hover:to-[#0b9bcf] text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-transform active:scale-95 flex items-center gap-2"
                        >
                            <CheckCircle size={18} />
                            {firmaBase64 ? 'Firmar y Autorizar' : 'Continuar a Firma'}
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
