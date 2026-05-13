// src/components/consultas/diagnosticos/TablaPacientesEspera.tsx

'use client';

import { motion } from 'framer-motion';
import { Activity, User, Eye, Clock, Stethoscope } from 'lucide-react';
import type { PacienteEnEspera } from '@/types/consultas';

interface TablaPacientesEsperaProps {
  pacientes: PacienteEnEspera[];
  isDark: boolean;
  onAtender: (paciente: PacienteEnEspera) => void;
}

export default function TablaPacientesEspera({ pacientes, isDark, onAtender }: TablaPacientesEsperaProps) {
  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (pacientes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`text-center py-12 rounded-xl border ${isDark ? 'bg-[#0a1929] border-[#0f83b2]/20 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'
          }`}
      >
        <Activity size={48} className="mx-auto mb-4 opacity-30" />
        <p className="text-lg font-semibold">No hay pacientes en espera</p>
        <p className="text-sm mt-2">Los pacientes que completen signos vitales aparecerán aquí</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl shadow-lg border overflow-hidden ${isDark ? 'bg-[#0a1929] border-[#0f83b2]/30' : 'bg-white border-gray-200'
        }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] px-6 py-4">
        <div className="flex items-center gap-3">
          <Stethoscope size={24} className="text-white" />
          <div>
            <h3 className="text-xl font-bold text-white">Pacientes en Espera</h3>
            <p className="text-white/80 text-sm">{pacientes.length} paciente(s) listo(s) para diagnóstico</p>
          </div>
        </div>
      </div>

      {/* Tabla */}
      {/* Vista Móvil (Tarjetas) */}
      <div className="sm:hidden p-4 space-y-4">
        {pacientes.map((paciente) => {
          const nombre = paciente.nombre || paciente.nombrepaciente || '';
          const nomina = paciente.no_nomina || paciente.clavenomina || '';
          const esEmpleado = paciente.es_empleado ?? paciente.elpacienteesempleado ?? false;
          const fechaRegistro = paciente.fecha_consulta || paciente.fecha_registro || '';
          const idKey = paciente.id_consulta || paciente.id_signo_vital || 0;

          return (
            <div
              key={idKey}
              onClick={() => onAtender(paciente)}
              className={`rounded-xl p-4 shadow-sm border transition-all active:scale-[0.98] ${isDark ? 'bg-[#0d1f2d] border-[#0f83b2]/20' : 'bg-white border-gray-100'
                }`}
            >
              {/* Encabezado Tarjeta */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${isDark ? 'bg-[#0f83b2]/20 text-[#0db1ec]' : 'bg-blue-50 text-[#0f83b2]'
                    }`}>
                    {nombre.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className={`font-bold text-sm line-clamp-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{nombre}</h4>
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{nomina}</span>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-lg text-xs font-bold ${esEmpleado
                  ? isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                  : isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-700'
                  }`}>
                  {paciente.parentesco_desc || 'N/A'}
                </div>
              </div>

              {/* Información Principal */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-[#0a1929]' : 'bg-gray-50'}`}>
                  <span className={`text-[10px] uppercase tracking-wider block mb-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Edad</span>
                  <span className={`font-semibold text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{paciente.edad || '-'} a</span>
                </div>
                <div className={`p-2 rounded-lg ${isDark ? 'bg-[#0a1929]' : 'bg-gray-50'}`}>
                  <span className={`text-[10px] uppercase tracking-wider block mb-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Depto</span>
                  <span className={`font-semibold text-sm truncate block ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{paciente.departamento || '-'}</span>
                </div>
              </div>

              {/* Signos Vitales Compactos */}
              <div className="mb-4">
                <h5 className={`text-xs font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Signos Vitales</h5>
                <div className="grid grid-cols-4 gap-2">
                  <div className={`text-center p-1.5 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                    <span className="block text-[10px] text-gray-400">PA</span>
                    <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{paciente.presion_arterial?.split('/')[0] || '-'}</span>
                  </div>
                  <div className={`text-center p-1.5 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                    <span className="block text-[10px] text-gray-400">Temp</span>
                    <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{paciente.temperatura || '-'}</span>
                  </div>
                  <div className={`text-center p-1.5 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                    <span className="block text-[10px] text-gray-400">FC</span>
                    <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{paciente.frecuencia_cardiaca || '-'}</span>
                  </div>
                  <div className={`text-center p-1.5 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                    <span className="block text-[10px] text-gray-400">Sat</span>
                    <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{paciente.saturacion_oxigeno || paciente.oxigenacion || '-'}%</span>
                  </div>
                </div>
              </div>

              {/* Footer Tarjeta */}
              <div className="flex items-center justify-between pt-3 border-t border-dashed border-gray-200 dark:border-gray-700">
                <div className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Clock size={12} />
                  {formatearFecha(fechaRegistro)}
                </div>
                <button
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${isDark ? 'bg-[#0f83b2] text-white' : 'bg-blue-600 text-white'}`}
                >
                  <Eye size={12} />
                  Atender
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Vista Escritorio (Tabla) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full min-w-[1000px] table-fixed">
          <thead className={isDark ? 'bg-[#0d1f2d]' : 'bg-gray-50'}>
            <tr>
              <th className={`w-[25%] px-8 py-5 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                Paciente
              </th>
              <th className={`w-[8%] px-4 py-5 text-center text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                Edad
              </th>
              <th className={`w-[15%] px-4 py-5 text-center text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                Tipo
              </th>
              <th className={`w-[15%] px-4 py-5 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                Departamento
              </th>
              <th className={`w-[20%] px-4 py-5 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                Signos Vitales
              </th>
              <th className={`w-[17%] px-4 py-5 text-center text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                Hora Registro
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-[#0f83b2]/10' : 'divide-gray-100'}`}>
            {pacientes.map((paciente) => {
              // Usar campos nuevos con fallback a campos antiguos para compatibilidad
              const nombre = paciente.nombre || paciente.nombrepaciente || '';
              const nomina = paciente.no_nomina || paciente.clavenomina || '';
              const esEmpleado = paciente.es_empleado ?? paciente.elpacienteesempleado ?? false;
              const fechaRegistro = paciente.fecha_consulta || paciente.fecha_registro || '';
              const idKey = paciente.id_consulta || paciente.id_signo_vital || 0;

              return (
                <motion.tr
                  key={idKey}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => onAtender(paciente)}
                  className={`cursor-pointer transition-all duration-200 group ${isDark ? 'hover:bg-[#0d1f2d] hover:shadow-lg' : 'hover:bg-blue-50/30 hover:shadow-md'
                    }`}
                >
                  {/* Nombre del paciente */}
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className={`flex-shrink-0 h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm transition-transform group-hover:scale-110 ${isDark ? 'bg-[#0f83b2]/20 text-[#0db1ec]' : 'bg-white shadow-md text-[#0f83b2]'
                        }`}>
                        {nombre.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className={`font-bold text-base truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {nombre}
                        </div>
                        <div className={`text-xs font-medium flex items-center gap-1.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          <span className="opacity-70">Nómina:</span>
                          <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{nomina}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Edad */}
                  <td className={`px-4 py-5 text-center font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'
                    }`}>
                    {paciente.edad || '-'}
                  </td>

                  {/* Tipo de paciente */}
                  <td className="px-4 py-5 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${esEmpleado
                      ? isDark
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : isDark
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-purple-50 text-purple-700 border border-purple-100'
                      }`}>
                      <User size={14} />
                      {paciente.parentesco_desc || 'N/A'}
                    </span>
                  </td>

                  {/* Departamento */}
                  <td className={`px-4 py-5 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {paciente.departamento || 'No especificado'}
                  </td>

                  {/* Signos Vitales */}
                  <td className={`px-4 py-5`}>
                    <div className={`grid grid-cols-2 gap-x-4 gap-y-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <div className="flex justify-between"><span>PA:</span> <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{paciente.presion_arterial || '-'}</span></div>
                      <div className="flex justify-between"><span>Temp:</span> <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{paciente.temperatura}°C</span></div>
                      <div className="flex justify-between"><span>FC:</span> <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{paciente.frecuencia_cardiaca}</span></div>
                      <div className="flex justify-between"><span>Sat:</span> <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{paciente.saturacion_oxigeno || paciente.oxigenacion || '-'}%</span></div>
                    </div>
                  </td>

                  {/* Hora de registro y Accion */}
                  <td className="px-4 py-5">
                    <div className="flex flex-col items-center gap-3">
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold ${isDark ? 'bg-[#0f83b2]/10 text-[#0db1ec]' : 'bg-blue-50 text-blue-600'
                        }`}>
                        <Clock size={14} />
                        {formatearFecha(fechaRegistro)}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Evitar doble evento
                          onAtender(paciente);
                        }}
                        className={`w-full max-w-[140px] px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wide transition-all flex items-center justify-center gap-2 shadow-sm ${isDark
                          ? 'bg-[#0f83b2] text-white hover:bg-[#0d6f97] shadow-blue-900/20'
                          : 'bg-[#0f83b2] text-white hover:bg-[#0d6f97] shadow-blue-200'
                          }`}
                      >
                        <Eye size={16} />
                        Atender
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
