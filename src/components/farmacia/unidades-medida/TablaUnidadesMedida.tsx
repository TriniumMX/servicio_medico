// src/components/farmacia/unidades-medida/TablaUnidadesMedida.tsx

'use client';

import { motion } from 'framer-motion';
import { Edit, Trash2, Ruler } from 'lucide-react';
import type { UnidadMedida } from '@/types/farmacia/unidades-medida';

interface TablaUnidadesMedidaProps {
  unidades: UnidadMedida[];
  onEditar: (unidad: UnidadMedida) => void;
  onEliminar: (unidad: UnidadMedida) => void;
  isDark: boolean;
}

export default function TablaUnidadesMedida({
  unidades,
  onEditar,
  onEliminar,
  isDark,
}: TablaUnidadesMedidaProps) {
  if (unidades.length === 0) {
    return (
      <div className={`text-center py-16 rounded-2xl ${
        isDark ? 'bg-[#0d1f2d]' : 'bg-gray-50'
      }`}>
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 ${
          isDark ? 'bg-[#0f83b2]/10' : 'bg-blue-50'
        }`}>
          <Ruler size={40} className={isDark ? 'text-[#0db1ec]' : 'text-blue-500'} />
        </div>
        <h4 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          No hay unidades de medida registradas
        </h4>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
          Crea la primera unidad de medida para comenzar
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl overflow-hidden border ${
      isDark ? 'bg-[#0d1f2d] border-[#0f83b2]/20' : 'bg-white border-gray-200'
    }`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={isDark ? 'bg-[#0a1929]' : 'bg-gray-50'}>
            <tr>
              <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                ID
              </th>
              <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Medida
              </th>
              <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Abreviatura
              </th>
              <th className={`px-6 py-4 text-center text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/20">
            {unidades.map((unidad, index) => (
              <motion.tr
                key={unidad.id_medida}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`transition-colors ${
                  isDark ? 'hover:bg-[#0a1929]' : 'hover:bg-gray-50'
                }`}
              >
                <td className={`px-6 py-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  #{unidad.id_medida}
                </td>
                <td className={`px-6 py-4 font-semibold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {unidad.medida}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold ${
                    isDark
                      ? 'bg-[#0f83b2]/20 text-[#0db1ec]'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {unidad.abreviatura}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onEditar(unidad)}
                      className={`p-2 rounded-lg transition-all ${
                        isDark
                          ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                          : 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20'
                      }`}
                      title="Editar"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => onEliminar(unidad)}
                      className={`p-2 rounded-lg transition-all ${
                        isDark
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          : 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
                      }`}
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
