// src/app/dashboard/consultas/diagnosticos-prueba/page.tsx

'use client';

import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { Stethoscope, AlertTriangle } from 'lucide-react';
import FormularioPruebaCIE11 from '@/components/consultas/diagnosticos/FormularioPruebaCIE11';

export default function DiagnosticosPruebaPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-gradient-to-br from-[#0f83b2] to-[#0db1ec]">
              <Stethoscope size={28} className="text-white" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Diagnósticos CIE-11 - Prueba
              </h1>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Formulario de prueba para consultar API de CIE-11
              </p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-xl border-2 ${
            isDark
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
              : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}>
            <div className="flex items-center gap-2">
              <AlertTriangle size={20} />
              <span className="font-bold text-sm">MODO PRUEBA</span>
            </div>
          </div>
        </motion.div>

        {/* Formulario */}
        <FormularioPruebaCIE11 isDark={isDark} />
      </div>
    </div>
  );
}
