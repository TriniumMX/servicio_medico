// src/components/farmacia/medicamentos/TablaMedicamentos.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Trash2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Medicamento } from '@/types/farmacia/medicamentos';
import Swal from 'sweetalert2';
import { useTheme } from 'next-themes';

interface TablaMedicamentosProps {
  medicamentos: Medicamento[];
  onEdit: (medicamento: Medicamento) => void;
  onDelete: (id: number) => void;
  loading: boolean;
}

type SortField = 'nombre_comercial' | 'clasificacion' | 'precio_unitario' | 'activo';
type SortDirection = 'asc' | 'desc';

export default function TablaMedicamentos({
  medicamentos,
  onEdit,
  onDelete,
  loading,
}: TablaMedicamentosProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [sortField, setSortField] = useState<SortField>('nombre_comercial');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => { setCurrentPage(1); }, [medicamentos]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const sortedMedicamentos = [...medicamentos].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (sortField === 'precio_unitario') {
      aValue = parseFloat(aValue);
      bValue = parseFloat(bValue);
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedMedicamentos.length / itemsPerPage);
  const paginatedMedicamentos = sortedMedicamentos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDeleteClick = (medicamento: Medicamento) => {
    Swal.fire({
      title: '¿Desactivar medicamento?',
      html: `
        <div class="text-left">
          <p class="mb-2">¿Estás seguro de que deseas desactivar este medicamento?</p>
          <p class="font-semibold">${medicamento.nombre_comercial}</p>
          <p class="text-sm text-gray-600 dark:text-gray-400">${medicamento.sustancia_activa}</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
      background: isDark ? '#1f2937' : '#ffffff',
      color: isDark ? '#f9fafb' : '#111827',
    }).then((result) => {
      if (result.isConfirmed) {
        onDelete(medicamento.id_medicamento);
      }
    });
  };

  const getClasificacionColor = (clasificacion: string) => {
    switch (clasificacion) {
      case 'PATENTE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'GENERICO':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'CONTROLADO':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0db1ec]"></div>
      </div>
    );
  }

  if (medicamentos.length === 0) {
    return (
      <div className={`text-center py-12 rounded-xl border-2 border-dashed ${
        isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-300 bg-gray-50'
      }`}>
        <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          No se encontraron medicamentos
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl shadow-lg">
      <table className="w-full">
        <thead className={isDark ? 'bg-gray-800' : 'bg-gray-50'}>
          <tr>
            <th
              className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-opacity-80 transition-colors ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}
              onClick={() => handleSort('nombre_comercial')}
            >
              <div className="flex items-center gap-2">
                Medicamento
                <SortIcon field="nombre_comercial" />
              </div>
            </th>
            <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Sustancia Activa
            </th>
            <th
              className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-opacity-80 transition-colors ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}
              onClick={() => handleSort('clasificacion')}
            >
              <div className="flex items-center gap-2">
                Clasificación
                <SortIcon field="clasificacion" />
              </div>
            </th>
            <th
              className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-opacity-80 transition-colors ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}
              onClick={() => handleSort('precio_unitario')}
            >
              <div className="flex items-center gap-2">
                Precio
                <SortIcon field="precio_unitario" />
              </div>
            </th>
            <th
              className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-opacity-80 transition-colors ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}
              onClick={() => handleSort('activo')}
            >
              <div className="flex items-center gap-2">
                Estado
                <SortIcon field="activo" />
              </div>
            </th>
            <th className={`px-6 py-4 text-center text-xs font-medium uppercase tracking-wider ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className={`divide-y ${isDark ? 'divide-gray-700 bg-gray-900' : 'divide-gray-200 bg-white'}`}>
          <AnimatePresence>
            {paginatedMedicamentos.map((medicamento, index) => (
              <motion.tr
                key={medicamento.id_medicamento}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className={`hover:bg-opacity-50 transition-colors ${
                  isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                }`}
              >
                <td className={`px-6 py-4 whitespace-nowrap ${
                  isDark ? 'text-gray-200' : 'text-gray-900'
                }`}>
                  <div className="font-medium">{medicamento.nombre_comercial}</div>
                  {medicamento.codigo_ean && (
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      EAN: {medicamento.codigo_ean}
                    </div>
                  )}
                </td>
                <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <div className="max-w-xs truncate">{medicamento.sustancia_activa}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    getClasificacionColor(medicamento.clasificacion)
                  }`}>
                    {medicamento.clasificacion}
                  </span>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap font-medium ${
                  isDark ? 'text-gray-200' : 'text-gray-900'
                }`}>
                  ${parseFloat(medicamento.precio_unitario).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    medicamento.activo
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  }`}>
                    {medicamento.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onEdit(medicamento)}
                      className={`p-2 rounded-lg transition-colors ${
                        isDark
                          ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50'
                          : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                      }`}
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </motion.button>
                    {medicamento.activo && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteClick(medicamento)}
                        className={`p-2 rounded-lg transition-colors ${
                          isDark
                            ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                            : 'bg-red-100 text-red-600 hover:bg-red-200'
                        }`}
                        title="Desactivar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className={`flex items-center justify-between px-6 py-5 border-t-2 ${
          isDark ? 'border-[#0db1ec]/30 bg-gray-800' : 'border-[#0db1ec]/20 bg-white'
        }`}>
          <p className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
            Mostrando <span className="text-[#0db1ec]">{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, sortedMedicamentos.length)}</span> de <span className="text-[#0db1ec]">{sortedMedicamentos.length}</span> medicamentos
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
