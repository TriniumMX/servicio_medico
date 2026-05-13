// src/components/consultas/signos-vitales/TablaConsultas.tsx

'use client';

import { motion } from 'framer-motion';
import { Activity, Clock, User, Users, Stethoscope } from 'lucide-react';
import type { SignosVitales } from '@/types/consultas';

interface TablaConsultasProps {
  consultas: SignosVitales[];
  isDark: boolean;
}

export default function TablaConsultas({ consultas, isDark }: TablaConsultasProps) {
  const formatearHora = (fecha: string) => {
    return new Date(fecha).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (consultas.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`text-center py-16 rounded-2xl border-2 border-dashed ${isDark
            ? 'bg-gradient-to-br from-[#0a1929] to-[#0d1f2d] border-[#0f83b2]/30 text-gray-400'
            : 'bg-gradient-to-br from-gray-50 to-white border-gray-300 text-gray-600'
          }`}
      >
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${isDark ? 'bg-[#0f83b2]/10' : 'bg-blue-50'
          }`}>
          <Activity size={40} className={isDark ? 'text-[#0db1ec]' : 'text-blue-500'} />
        </div>
        <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          No hay pacientes en espera
        </h3>
        <p className="text-sm opacity-70 max-w-md mx-auto">
          Utiliza el botón "Agregar paciente por nómina" para registrar los signos vitales de un nuevo paciente
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl shadow-2xl border overflow-hidden ${isDark ? 'bg-[#0a1929] border-[#0f83b2]/30' : 'bg-white border-gray-200'
        }`}
    >
      {/* Header con diseño profesional */}
      <div className={`px-4 sm:px-8 py-6 border-b ${isDark
          ? 'bg-gradient-to-r from-[#0d1f2d] to-[#0a1929] border-[#0f83b2]/20'
          : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-gray-200'
        }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${isDark ? 'bg-[#0f83b2]/20' : 'bg-white shadow-md'
              }`}>
              <Stethoscope size={28} className={isDark ? 'text-[#0db1ec]' : 'text-blue-600'} />
            </div>
            <div>
              <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Pacientes en Espera
              </h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Signos vitales registrados hoy
              </p>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${isDark ? 'bg-[#0f83b2]/20' : 'bg-white shadow-sm'
            }`}>
            <Users size={20} className={isDark ? 'text-[#0db1ec]' : 'text-blue-600'} />
            <span className={`text-2xl font-bold ${isDark ? 'text-[#0db1ec]' : 'text-blue-600'}`}>
              {consultas.length}
            </span>
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {consultas.length === 1 ? 'paciente' : 'pacientes'}
            </span>
          </div>
        </div>
      </div>

      {/* Lista mobile */}
      <div className={`sm:hidden divide-y ${isDark ? 'divide-[#0f83b2]/10' : 'divide-gray-100'}`}>
        {consultas.map((consulta, index) => (
          <div
            key={consulta.id_consulta || consulta.id_signo_vital || index}
            className={`p-4 ${isDark ? 'bg-[#0a1929]' : 'bg-white'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-[#0f83b2]/10' : 'bg-blue-100'}`}>
                  <Clock size={16} className={isDark ? 'text-[#0db1ec]' : 'text-blue-600'} />
                </div>
                <div>
                  <div className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {formatearHora(consulta.fecha_consulta || consulta.fecha_registro || '')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatearFecha(consulta.fecha_consulta || consulta.fecha_registro || '')}
                  </div>
                </div>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-lg font-mono text-xs font-bold ${isDark
                  ? 'bg-[#0f83b2]/10 text-[#0db1ec]'
                  : 'bg-blue-100 text-blue-700'
                }`}>
                {consulta.no_nomina || consulta.clavenomina}
              </span>
            </div>

            <div className="mt-3 flex items-start gap-3">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-[#0f83b2]/10' : 'bg-blue-100'}`}>
                <User size={16} className={isDark ? 'text-[#0db1ec]' : 'text-blue-600'} />
              </div>
              <div className="flex-1">
                <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {consulta.nombre || consulta.nombrepaciente}
                </div>
                <div className="text-xs text-gray-500">
                  {consulta.edad || 'Edad no especificada'}
                </div>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold shadow-sm ${consulta.parentesco_desc === 'EMPLEADO'
                  ? isDark
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : isDark
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-purple-100 text-purple-700 border border-purple-200'
                }`}>
                {consulta.parentesco_desc || 'N/A'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla con diseño moderno */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead className={`${isDark ? 'bg-[#0d1f2d]' : 'bg-gray-50'}`}>
            <tr className={`border-b ${isDark ? 'border-[#0f83b2]/10' : 'border-gray-200'}`}>
              <th className={`px-8 py-4 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  Hora
                </div>
              </th>
              <th className={`px-8 py-4 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                Nómina
              </th>
              <th className={`px-8 py-4 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                <div className="flex items-center gap-2">
                  <User size={16} />
                  Paciente
                </div>
              </th>
              <th className={`px-8 py-4 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                Parentesco
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-[#0f83b2]/10' : 'divide-gray-100'}`}>
            {consultas.map((consulta, index) => (
              <motion.tr
                key={consulta.id_consulta || consulta.id_signo_vital || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03, duration: 0.3 }}
                className={`transition-all duration-200 ${isDark
                    ? 'hover:bg-[#0d1f2d] hover:shadow-lg'
                    : 'hover:bg-blue-50/50 hover:shadow-md'
                  }`}
              >
                {/* Hora */}
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-[#0f83b2]/10' : 'bg-blue-100'
                      }`}>
                      <Clock size={18} className={isDark ? 'text-[#0db1ec]' : 'text-blue-600'} />
                    </div>
                    <div>
                      <div className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                        {formatearHora(consulta.fecha_consulta || consulta.fecha_registro || '')}
                      </div>
                      <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        {formatearFecha(consulta.fecha_consulta || consulta.fecha_registro || '')}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Nómina */}
                <td className="px-8 py-5">
                  <div className={`inline-flex items-center px-3 py-1.5 rounded-lg font-mono text-sm font-bold ${isDark
                      ? 'bg-[#0f83b2]/10 text-[#0db1ec]'
                      : 'bg-blue-100 text-blue-700'
                    }`}>
                    {consulta.no_nomina || consulta.clavenomina}
                  </div>
                </td>

                {/* Paciente */}
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-[#0f83b2]/10' : 'bg-blue-100'
                      }`}>
                      <User size={18} className={isDark ? 'text-[#0db1ec]' : 'text-blue-600'} />
                    </div>
                    <div>
                      <div className={`font-semibold text-base ${isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                        {consulta.nombre || consulta.nombrepaciente}
                      </div>
                      <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        {consulta.edad || 'Edad no especificada'}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Parentesco */}
                <td className="px-8 py-5">
                  <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold shadow-sm ${consulta.parentesco_desc === 'EMPLEADO'
                      ? isDark
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : isDark
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'bg-purple-100 text-purple-700 border border-purple-200'
                    }`}>
                    {consulta.parentesco_desc || 'N/A'}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer con información adicional */}
      <div className={`px-4 sm:px-8 py-4 border-t ${isDark
          ? 'bg-[#0d1f2d] border-[#0f83b2]/10'
          : 'bg-gray-50 border-gray-200'
        }`}>
        <p className={`text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
          Mostrando {consultas.length} {consultas.length === 1 ? 'registro' : 'registros'} de signos vitales del día
        </p>
      </div>
    </motion.div>
  );
}
