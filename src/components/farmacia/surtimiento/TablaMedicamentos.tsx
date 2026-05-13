// src/components/farmacia/surtimiento/TablaMedicamentos.tsx
'use client';

import { MedicamentoReceta } from '@/types/farmacia/surtimiento';
import { Pill, CheckCircle, AlertTriangle, Clock, ArrowRight } from 'lucide-react';

interface TablaMedicamentosProps {
  medicamentos: MedicamentoReceta[];
  isDark: boolean;
  onSurtirMedicamento: (medicamento: MedicamentoReceta) => void;
  recetaVencidaPrimerSurtimiento?: boolean;
}

export default function TablaMedicamentos({
  medicamentos,
  isDark,
  onSurtirMedicamento,
  recetaVencidaPrimerSurtimiento = false,
}: TablaMedicamentosProps) {
  return (
    <div className={`rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden
      ${isDark ? 'bg-[#0a1929] shadow-black/40 border border-gray-800' : 'bg-white shadow-gray-200/50 border border-gray-100'}
    `}>
      <div className="flex items-center gap-3 mb-8">
        <div className={`p-3 rounded-xl ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
          <Pill size={24} />
        </div>
        <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Medicamentos Solicitados
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
              <th className={`text-left py-4 pl-4 pr-8 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Medicamento
              </th>
              <th className={`text-center py-4 px-4 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Cantidad
              </th>
              <th className={`text-center py-4 px-4 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Progreso
              </th>
              <th className={`text-center py-4 px-4 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Estado
              </th>
              <th className={`text-right py-4 pl-8 pr-4 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Acción
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {medicamentos.map((med) => {
              const porcentaje = Math.round(
                (med.surtimientos.total_surtido / med.prescripcion.cantidad_total) * 100
              );

              return (
                <tr
                  key={med.id_detalle}
                  className={`group transition-colors ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50'
                    }`}
                >
                  {/* Medicamento */}
                  <td className="py-6 pl-4 pr-8">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-1
                           ${med.surtimientos.completado
                          ? (isDark ? 'bg-green-500/10 text-green-500' : 'bg-green-50 text-green-600')
                          : (isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600')
                        }
                        `}>
                        {med.surtimientos.completado ? <CheckCircle size={20} /> : <Pill size={20} />}
                      </div>
                      <div>
                        <p className={`text-base font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {med.medicamento.nombre_comercial}
                        </p>
                        <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {med.medicamento.sustancia_activa}
                        </p>
                        {med.medicamento.codigo_ean && (
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono tracking-wide
                                 ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}
                              `}>
                            EAN: {med.medicamento.codigo_ean}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Cantidad */}
                  <td className="py-6 px-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className={`text-xl font-bold tabular-nums ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {med.prescripcion.cantidad_total}
                      </span>
                      <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Pzas</span>
                    </div>
                  </td>

                  {/* Progreso */}
                  <td className="py-6 px-4">
                    <div className="w-full max-w-[120px] mx-auto">
                      <div className="flex justify-between text-xs mb-2">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Surtido</span>
                        <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {med.surtimientos.total_surtido}/{med.prescripcion.cantidad_total}
                        </span>
                      </div>
                      <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${med.surtimientos.completado ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                          style={{ width: `${porcentaje}%` }}
                        />
                      </div>
                    </div>
                    {med.resurtimiento.realizar_resurtimiento && (
                      <div className="flex justify-center mt-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded">
                          Resurtimiento
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Estado */}
                  <td className="py-6 px-4">
                    <div className="flex justify-center">
                      {med.surtimientos.completado ? (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold
                              ${isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-700'}
                           `}>
                          <CheckCircle size={14} /> Completado
                        </span>
                      ) : porcentaje > 0 ? (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold
                              ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-700'}
                           `}>
                          <Clock size={14} /> En Proceso
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold
                              ${isDark ? 'bg-yellow-500/10 text-yellow-400' : 'bg-yellow-50 text-yellow-700'}
                           `}>
                          <Clock size={14} /> Pendiente
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Acción */}
                  <td className="py-6 pl-8 pr-4 text-right">
                    <button
                      onClick={() => onSurtirMedicamento(med)}
                      disabled={med.surtimientos.completado || recetaVencidaPrimerSurtimiento}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all
                           ${med.surtimientos.completado || recetaVencidaPrimerSurtimiento
                          ? (isDark ? 'bg-gray-800 text-gray-600' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                          : (isDark
                            ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20 active:scale-95'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-95')
                        }
                        `}
                    >
                      {med.surtimientos.completado ? (
                        <>Surtido <CheckCircle size={16} /></>
                      ) : recetaVencidaPrimerSurtimiento ? (
                        <>Bloqueado <AlertTriangle size={16} /></>
                      ) : (
                        <>Surtir <ArrowRight size={16} /></>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {medicamentos.length === 0 && (
        <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          <div className="mb-4 text-6xl opacity-20">💊</div>
          <p className="font-medium">No hay medicamentos en esta receta</p>
        </div>
      )}
    </div>
  );
}

