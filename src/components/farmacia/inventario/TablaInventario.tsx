// src/components/farmacia/inventario/TablaInventario.tsx

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Edit, CheckCircle, Package, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from 'next-themes';
import type { InventarioMedicamento } from '@/types/farmacia/medicamentos';

interface TablaInventarioProps {
  inventario: InventarioMedicamento[];
  onEdit: (item: InventarioMedicamento) => void;
  loading: boolean;
}

export default function TablaInventario({ inventario, onEdit, loading }: TablaInventarioProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => { setCurrentPage(1); }, [inventario]);

  const totalPages = Math.ceil(inventario.length / itemsPerPage);
  const paginatedInventario = inventario.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getEstadoFondo = (item: InventarioMedicamento) => {
    const { existencia_actual, fondo_fijo } = item;

    if (existencia_actual >= fondo_fijo) {
      return {
        label: 'Completo',
        color: 'text-green-600',
        bgColor: isDark ? 'bg-green-900/20' : 'bg-green-50',
        borderColor: 'border-green-500',
        icon: CheckCircle,
      };
    } else {
      return {
        label: 'Requiere Reposición',
        color: 'text-red-600',
        bgColor: isDark ? 'bg-red-900/20' : 'bg-red-50',
        borderColor: 'border-red-500',
        icon: AlertCircle,
      };
    }
  };

  const getPorcentajeFondo = (item: InventarioMedicamento) => {
    const { existencia_actual, fondo_fijo } = item;

    if (fondo_fijo === 0) return 0;

    const porcentaje = (existencia_actual / fondo_fijo) * 100;
    return Math.min(porcentaje, 100);
  };

  const getColorBarra = (item: InventarioMedicamento) => {
    const { existencia_actual, fondo_fijo } = item;

    if (existencia_actual >= fondo_fijo) return 'bg-green-500';
    return 'bg-red-500';
  };

  const getPiezasPorReponer = (item: InventarioMedicamento) => {
    const { existencia_actual, fondo_fijo } = item;
    if (existencia_actual >= fondo_fijo) return 0;
    return fondo_fijo - existencia_actual;
  };

  if (loading) {
    return (
      <div className={`rounded-xl shadow-lg overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="p-8 text-center">
          <div className="inline-block w-8 h-8 border-4 border-[#0db1ec] border-t-transparent rounded-full animate-spin" />
          <p className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Cargando inventario...
          </p>
        </div>
      </div>
    );
  }

  if (inventario.length === 0) {
    return (
      <div className={`rounded-xl shadow-lg overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="p-8 text-center">
          <Package className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            No se encontraron registros en el inventario
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl shadow-lg overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={`${isDark ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
            <tr>
              <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Medicamento
              </th>
              <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Clasificación
              </th>
              <th className={`px-6 py-4 text-center text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Existencia / Fondo Fijo
              </th>
              <th className={`px-6 py-4 text-center text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Estado
              </th>
              <th className={`px-6 py-4 text-center text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Cuadro Básico
              </th>
              <th className={`px-6 py-4 text-center text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedInventario.map((item, index) => {
              const estadoFondo = getEstadoFondo(item);
              const IconoEstado = estadoFondo.icon;
              const porcentaje = getPorcentajeFondo(item);
              const colorBarra = getColorBarra(item);
              const piezasPorReponer = getPiezasPorReponer(item);

              return (
                <motion.tr
                  key={item.id_inventario}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`${
                    isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
                  } transition-colors`}
                >
                  {/* Medicamento */}
                  <td className="px-6 py-4">
                    <div>
                      <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {item.nombre_comercial}
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {item.sustancia_activa}
                      </p>
                    </div>
                  </td>

                  {/* Clasificación */}
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      item.clasificacion === 'CONTROLADO'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                        : item.clasificacion === 'PATENTE'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    }`}>
                      {item.clasificacion}
                    </span>
                  </td>

                  {/* Existencia / Fondo Fijo con barra de progreso */}
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      {/* Cantidad */}
                      <div className="flex items-center justify-center gap-2">
                        <p className={`text-2xl font-bold ${estadoFondo.color}`}>
                          {item.existencia_actual}
                        </p>
                        <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>/</span>
                        <p className={`text-lg font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {item.fondo_fijo}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {item.abreviatura || 'pzs'}
                        </p>
                      </div>

                      {/* Barra de progreso */}
                      <div className="w-full">
                        <div className={`w-full h-2 rounded-full overflow-hidden ${
                          isDark ? 'bg-gray-700' : 'bg-gray-200'
                        }`}>
                          <div
                            className={`h-full ${colorBarra} transition-all duration-500 ease-out`}
                            style={{ width: `${Math.min(porcentaje, 100)}%` }}
                          />
                        </div>
                        <p className={`text-xs text-center mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          {porcentaje.toFixed(0)}% del fondo
                        </p>
                      </div>

                      {/* Piezas por reponer */}
                      {piezasPorReponer > 0 && (
                        <p className="text-xs text-center text-red-500 font-medium">
                          Faltan {piezasPorReponer} piezas
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Estado con badge */}
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border-l-4 ${estadoFondo.bgColor} ${estadoFondo.borderColor}`}>
                        <IconoEstado className={`w-5 h-5 ${estadoFondo.color}`} />
                        <span className={`text-sm font-bold ${estadoFondo.color}`}>
                          {estadoFondo.label}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Cuadro Básico */}
                  <td className="px-6 py-4 text-center">
                    {item.es_cuadro_basico ? (
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 text-sm font-semibold border border-purple-300 dark:border-purple-700">
                        <CheckCircle className="w-4 h-4" />
                        Sí
                      </div>
                    ) : (
                      <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        —
                      </span>
                    )}
                  </td>

                  {/* Acciones */}
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onEdit(item)}
                        className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg"
                        title="Editar inventario"
                      >
                        <Edit className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className={`flex items-center justify-between px-6 py-5 border-t-2 ${
          isDark ? 'border-[#0db1ec]/30 bg-gray-800' : 'border-[#0db1ec]/20 bg-white'
        }`}>
          <p className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
            Mostrando <span className="text-[#0db1ec]">{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, inventario.length)}</span> de <span className="text-[#0db1ec]">{inventario.length}</span> medicamentos
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg border transition-colors ${
                currentPage === 1
                  ? 'opacity-40 cursor-not-allowed'
                  : isDark ? 'hover:bg-[#0db1ec]/20 hover:border-[#0db1ec]' : 'hover:bg-[#0db1ec]/10 hover:border-[#0db1ec]'
              } ${isDark ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-700'}`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className={`text-sm font-bold px-3 py-1 rounded-lg ${
              isDark ? 'bg-[#0db1ec]/20 text-[#0db1ec]' : 'bg-[#0db1ec]/10 text-[#0db1ec]'
            }`}>
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg border transition-colors ${
                currentPage === totalPages
                  ? 'opacity-40 cursor-not-allowed'
                  : isDark ? 'hover:bg-[#0db1ec]/20 hover:border-[#0db1ec]' : 'hover:bg-[#0db1ec]/10 hover:border-[#0db1ec]'
              } ${isDark ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-700'}`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
