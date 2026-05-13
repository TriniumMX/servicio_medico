'use client';

import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import BuscadorPacientes from '@/components/pacientes/BuscadorPacientes';

export default function PacientesPage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className="min-h-screen p-4 sm:p-6 md:p-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-7xl mx-auto"
            >
                <div className="text-center mb-6 sm:mb-10">
                    <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 ${isDark
                        ? 'bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400'
                        : 'bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-teal-600'
                    }`}>
                        Expediente Digital
                    </h1>
                    <p className={`text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-2 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                        Accede al historial clínico completo, recetas, estudios e incapacidades de cualquier paciente.
                    </p>
                </div>

                <BuscadorPacientes />

            </motion.div>
        </div>
    );
}
