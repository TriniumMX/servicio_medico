// src/components/catalogos/especialidades/TablaEspecialidades.tsx

'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Edit, Trash2, RefreshCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Especialidad } from '@/types/catalogos/especialidades';

interface TablaEspecialidadesProps {
  especialidades: Especialidad[];
  loading: boolean;
  onEdit: (especialidad: Especialidad) => void;
  onToggleStatus: (id: number, nuevoEstatus: boolean) => void; // Sirve para borrar (false) y reactivar (true)
  isDark: boolean;
  onNew: () => void;
  currentTab: 'activos' | 'inactivos';
}

export default function TablaEspecialidades({
  especialidades,
  loading,
  onEdit,
  onToggleStatus,
  isDark = false,
  currentTab
}: TablaEspecialidadesProps) {
  const [filterValue, setFilterValue] = useState('');
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Filtrado local por nombre
  const filteredItems = useMemo(() => {
    if (!filterValue) return especialidades;
    return especialidades.filter((item) =>
      item.especialidad.toLowerCase().includes(filterValue.toLowerCase())
    );
  }, [especialidades, filterValue]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);
  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredItems.slice(start, start + rowsPerPage);
  }, [page, filteredItems]);

  return (
    <div className="w-full space-y-4">
      {/* Buscador */}
      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar especialidad..."
          value={filterValue}
          onChange={(e) => { setFilterValue(e.target.value); setPage(1); }}
          className={`w-full pl-10 pr-10 py-2.5 rounded-lg border transition-colors ${
            isDark
              ? 'bg-[#0d2137] border-[#0f83b2]/30 text-white placeholder-gray-500 focus:border-[#0db1ec]'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#0db1ec]'
          } focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20`}
        />
      </div>

      {/* Tabla */}
      <div className={`rounded-lg border overflow-hidden ${isDark ? 'border-[#0f83b2]/20' : 'border-gray-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDark ? 'bg-[#0d2137]' : 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>ID</th>
                <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Especialidad</th>
                <th className={`px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Acciones</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-[#0f83b2]/20' : 'divide-gray-200'}`}>
              {loading ? (
                <tr><td colSpan={3} className="px-6 py-12 text-center">Cargando...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-500">No hay registros en esta pestaña</td></tr>
              ) : (
                items.map((item, index) => (
                  <motion.tr
                    key={item.claveespecialidad}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 }}
                    className={`transition-colors ${isDark ? 'bg-[#0a1929] hover:bg-[#0d2137]' : 'bg-white hover:bg-gray-50'}`}
                  >
                    <td className={`px-6 py-4 text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{item.claveespecialidad}</td>
                    <td className={`px-6 py-4 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>{item.especialidad}</td>
                    
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Si estamos en ACTIVOS: Mostrar Editar y Borrar */}
                        {currentTab === 'activos' && (
                          <>
                            <button onClick={() => onEdit(item)} className={`p-2 rounded-lg transition-colors ${isDark ? 'text-blue-400 hover:bg-blue-500/10' : 'text-blue-600 hover:bg-blue-50'}`} title="Editar">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => onToggleStatus(item.claveespecialidad, false)} 
                              className={`p-2 rounded-lg transition-colors ${isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'}`}
                              title="Desactivar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}

                        {/* Si estamos en INACTIVOS: Mostrar Reactivar */}
                        {currentTab === 'inactivos' && (
                          <button 
                            onClick={() => onToggleStatus(item.claveespecialidad, true)} 
                            className={`p-2 rounded-lg transition-colors ${isDark ? 'text-green-400 hover:bg-green-500/10' : 'text-green-600 hover:bg-green-50'}`}
                            title="Reactivar"
                          >
                            <RefreshCcw className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Paginación */}
      {pages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded bg-gray-100 dark:bg-[#0d2137] disabled:opacity-50"><ChevronLeft size={20}/></button>
            <span className="px-4 py-2 text-sm">{page} de {pages}</span>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="p-2 rounded bg-gray-100 dark:bg-[#0d2137] disabled:opacity-50"><ChevronRight size={20}/></button>
        </div>
      )}
    </div>
  );
}