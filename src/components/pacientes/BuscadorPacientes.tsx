'use client';

import { useState, useEffect } from 'react';
import { Search, User, Loader2, ChevronRight, Activity, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';

// Tipos básicos para el resultado de búsqueda
interface PacienteResultado {
    idBeneficiario: number;
    nombre: string;
    noNomina: string;
    departamento: string | null;
    edad: number | null;
    sexo: string | null;
    ultimaConsulta: string | null;
}

export default function BuscadorPacientes() {
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [query, setQuery] = useState('');
    const [resultados, setResultados] = useState<PacienteResultado[]>([]);
    const [loading, setLoading] = useState(false);
    const [debouncedQuery, setDebouncedQuery] = useState(query);

    // Debounce del input de búsqueda
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    // Efecto para buscar cuando cambia el debouncedQuery
    useEffect(() => {
        if (debouncedQuery.length >= 2) {
            buscarPacientes(debouncedQuery);
        } else {
            setResultados([]);
        }
    }, [debouncedQuery]);

    const buscarPacientes = async (q: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/pacientes/buscar?q=${encodeURIComponent(q)}`);
            const data = await res.json();
            if (data.success) {
                setResultados(data.data);
            }
        } catch (error) {
            console.error('Error buscando pacientes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPaciente = (id: number) => {
        router.push(`/dashboard/pacientes/${id}`);
    };

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">
            {/* Barra de Búsqueda */}
            <div className="relative">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                    <Search className="h-5 w-5" />
                </div>
                <input
                    type="text"
                    className={`block w-full pl-11 pr-4 py-3 sm:py-4 rounded-xl border transition-all duration-300 outline-none focus:ring-2 focus:ring-[#0db1ec]/20
            ${isDark
                            ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-[#0db1ec] focus:bg-gray-800'
                            : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#0db1ec] shadow-sm'
                        }
          `}
                    placeholder="Buscar por nombre, nómina o folio..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                {loading && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    </div>
                )}
            </div>

            {/* Resultados */}
            <div className="min-h-[200px]">
                <AnimatePresence mode="popLayout">
                    {resultados.length > 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
                        >
                            {resultados.map((paciente) => (
                                <motion.div
                                    key={paciente.idBeneficiario}
                                    layout
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.95, opacity: 0 }}
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    onClick={() => handleSelectPaciente(paciente.idBeneficiario)}
                                    className={`cursor-pointer rounded-xl p-3.5 sm:p-5 border transition-all hover:shadow-lg
                    ${isDark
                                            ? 'bg-gray-800 border-gray-700 hover:border-blue-500/50 shadow-sm'
                                            : 'bg-white border-slate-200 hover:border-[#0db1ec]/40 shadow-sm'
                                        }
                  `}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 sm:p-3 rounded-full shrink-0 ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-sky-100 text-sky-700'}`}>
                                                <User className="h-5 w-5 sm:h-6 sm:w-6" />
                                            </div>
                                            <div>
                                                <h3 className={`font-bold text-base sm:text-lg ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                                    {paciente.nombre}
                                                </h3>
                                                {paciente.noNomina && (
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold mt-1
                            ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-slate-100 text-slate-700'}
                          `}>
                                                        Nómina: {paciente.noNomina}
                                                    </span>
                                                )}
                                                <p className={`text-sm mt-2 flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                                    <Activity className="h-3 w-3" />
                                                    {paciente.departamento || 'Sin departamento'}
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight className={`h-5 w-5 ${isDark ? 'text-gray-600' : 'text-slate-400'}`} />
                                    </div>

                                    <div className={`mt-4 pt-4 border-t flex justify-between items-center text-xs
                    ${isDark ? 'border-gray-700 text-gray-500' : 'border-slate-200 text-slate-500'}
                  `}>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            Última visita: {paciente.ultimaConsulta ? new Date(paciente.ultimaConsulta).toLocaleDateString() : 'N/A'}
                                        </div>
                                        {paciente.edad && (
                                            <span>{paciente.edad} años • {paciente.sexo}</span>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        query.length >= 2 && !loading && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center py-10"
                            >
                                <div className={`mx-auto h-16 w-16 mb-4 rounded-full flex items-center justify-center
                  ${isDark ? 'bg-gray-800 text-gray-600' : 'bg-slate-100 text-slate-400'}
                `}>
                                    <Search className="h-8 w-8" />
                                </div>
                                <h3 className={`text-lg font-medium ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                                    Sin resultados
                                </h3>
                                <p className={`mt-1 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                                    Intenta buscar por otro nombre o número de nómina
                                </p>
                            </motion.div>
                        )
                    )}
                </AnimatePresence>

                {query.length < 2 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12 sm:py-20"
                    >
                        <h2 className={`text-xl sm:text-2xl font-bold mb-2 ${isDark ? 'text-gray-700' : 'text-slate-300'}`}>
                            Búsqueda de Pacientes
                        </h2>
                        <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-600' : 'text-slate-400'}`}>
                            Ingresa el nombre del paciente para ver su historial clínico
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
