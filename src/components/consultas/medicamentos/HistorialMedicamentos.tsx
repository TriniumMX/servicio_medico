'use client';

import { HistorialMedicamento } from '@/types/consultas';
import { Calendar, Pill, FileText, User } from 'lucide-react';

interface HistorialMedicamentosProps {
  historial: HistorialMedicamento[];
  isDark: boolean;
  loading: boolean;
}

export default function HistorialMedicamentos({ historial, isDark, loading }: HistorialMedicamentosProps) {
  if (loading) {
    return (
      <div className={`rounded-xl shadow-lg p-6 ${
        isDark ? 'bg-[#0a1929] border border-[#0f83b2]/20' : 'bg-white border border-gray-200'
      }`}>
        <div className="flex items-center justify-center py-8">
          <div className={`animate-spin rounded-full h-10 w-10 border-b-2 ${
            isDark ? 'border-[#0db1ec]' : 'border-[#0f83b2]'
          }`}></div>
        </div>
      </div>
    );
  }

  if (historial.length === 0) {
    return (
      <div className={`rounded-xl shadow-lg p-6 ${
        isDark ? 'bg-[#0a1929] border border-[#0f83b2]/20' : 'bg-white border border-gray-200'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <Pill className={`w-6 h-6 ${isDark ? 'text-[#0db1ec]' : 'text-[#0f83b2]'}`} />
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Historial de Medicamentos
          </h2>
        </div>
        <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          No hay historial de medicamentos del último mes
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl shadow-lg p-6 ${
      isDark ? 'bg-[#0a1929] border border-[#0f83b2]/20' : 'bg-white border border-gray-200'
    }`}>
      <div className="flex items-center gap-3 mb-6">
        <Pill className={`w-6 h-6 ${isDark ? 'text-[#0db1ec]' : 'text-[#0f83b2]'}`} />
        <div>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Historial de Medicamentos
          </h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Últimas prescripciones del mes
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {historial.map((item, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${
              isDark
                ? 'bg-[#0d1f2d] border-[#0f83b2]/20'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Medicamento */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Pill className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  <span className={`text-xs font-medium ${
                    isDark ? 'text-gray-500' : 'text-gray-600'
                  }`}>
                    Medicamento
                  </span>
                </div>
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {item.medicamento}
                </p>
              </div>

              {/* Indicaciones */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                  <span className={`text-xs font-medium ${
                    isDark ? 'text-gray-500' : 'text-gray-600'
                  }`}>
                    Indicaciones
                  </span>
                </div>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {item.indicaciones}
                </p>
              </div>

              {/* Tratamiento y Piezas */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    Tratamiento:
                  </span>
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {item.tratamiento}
                  </p>
                </div>
                <div>
                  <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    Piezas:
                  </span>
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {item.piezas}
                  </p>
                </div>
              </div>

              {/* Doctor y Fecha */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {item.nombreproveedor}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className={`w-4 h-4 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {item.fechaemision}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
