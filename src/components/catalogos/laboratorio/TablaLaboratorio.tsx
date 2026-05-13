'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Edit, Trash2, RefreshCcw, ChevronLeft, ChevronRight, Tag, DollarSign, Building2, Filter, X } from 'lucide-react';
import type { EstudioLaboratorio } from '@/types/catalogos/laboratorio';

interface Props {
  data: EstudioLaboratorio[];
  onEdit: (item: EstudioLaboratorio) => void;
  onToggleStatus: (id: number, status: boolean) => void;
  isDark: boolean;
  currentTab: 'activos' | 'inactivos';
}

const CATEGORIAS = ['Laboratorio', 'Gabinete'];

export default function TablaLaboratorio({ data, onEdit, onToggleStatus, isDark, currentTab }: Props) {
  const [search, setSearch]           = useState('');
  const [filterCat, setFilterCat]     = useState('');
  const [filterHosp, setFilterHosp]   = useState('');
  const [priceMin, setPriceMin]       = useState('');
  const [priceMax, setPriceMax]       = useState('');
  const [page, setPage]               = useState(1);
  const rowsPerPage = 10;

  // Hospitales únicos derivados de los datos
  const hospitales = useMemo(() => {
    const map = new Map<number, string>();
    data.forEach(d => { if (d.id_hospital && d.nombre_hospital) map.set(d.id_hospital, d.nombre_hospital); });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [data]);

  const hasFilters = search || filterCat || filterHosp || priceMin || priceMax;

  const resetFilters = () => {
    setSearch(''); setFilterCat(''); setFilterHosp('');
    setPriceMin(''); setPriceMax(''); setPage(1);
  };

  const filteredItems = useMemo(() => {
    const min = priceMin ? parseFloat(priceMin) : null;
    const max = priceMax ? parseFloat(priceMax) : null;
    return data.filter(item => {
      if (search && !item.nombre_estudio.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCat && item.categoria !== filterCat) return false;
      if (filterHosp && String(item.id_hospital) !== filterHosp) return false;
      if (min !== null && Number(item.costo) < min) return false;
      if (max !== null && Number(item.costo) > max) return false;
      return true;
    });
  }, [data, search, filterCat, filterHosp, priceMin, priceMax]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);
  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredItems.slice(start, start + rowsPerPage);
  }, [page, filteredItems]);

  const inputClass = `px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20 ${
    isDark
      ? 'bg-[#0d2137] border-[#0f83b2]/30 text-white placeholder-gray-500 focus:border-[#0db1ec]'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#0db1ec]'
  }`;

  const catColors: Record<string, string> = {
    'Laboratorio': isDark ? 'bg-[#0f83b2]/20 text-[#0db1ec]' : 'bg-blue-50 text-blue-700',
    'Gabinete':    isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-700',
  };

  return (
    <div className="w-full space-y-4">
      {/* Barra de filtros */}
      <div className={`p-4 rounded-xl border space-y-3 ${isDark ? 'bg-[#0a1929] border-[#0f83b2]/20' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center gap-2 mb-1">
          <Filter size={15} className="text-[#0db1ec]" />
          <span className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Filtros</span>
          {hasFilters && (
            <button onClick={resetFilters} className="ml-auto flex items-center gap-1 text-xs text-red-400 hover:text-red-500 transition-colors">
              <X size={12} /> Limpiar filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Búsqueda por nombre */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className={`${inputClass} w-full pl-9`}
            />
          </div>

          {/* Filtro categoría */}
          <select
            value={filterCat}
            onChange={(e) => { setFilterCat(e.target.value); setPage(1); }}
            className={`${inputClass} w-full`}
          >
            <option value="">Todas las categorías</option>
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Filtro hospital */}
          <select
            value={filterHosp}
            onChange={(e) => { setFilterHosp(e.target.value); setPage(1); }}
            className={`${inputClass} w-full`}
          >
            <option value="">Todos los hospitales</option>
            {hospitales.map(([id, nombre]) => (
              <option key={id} value={String(id)}>{nombre}</option>
            ))}
          </select>

          {/* Rango de precio */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="number" min="0" placeholder="Mín"
                value={priceMin}
                onChange={(e) => { setPriceMin(e.target.value); setPage(1); }}
                className={`${inputClass} w-full pl-7`}
              />
            </div>
            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>—</span>
            <div className="relative flex-1">
              <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="number" min="0" placeholder="Máx"
                value={priceMax}
                onChange={(e) => { setPriceMax(e.target.value); setPage(1); }}
                className={`${inputClass} w-full pl-7`}
              />
            </div>
          </div>
        </div>

        {/* Resumen de resultados */}
        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          {filteredItems.length} de {data.length} estudios
        </p>
      </div>

      {/* Tabla */}
      <div className={`rounded-lg border overflow-hidden ${isDark ? 'border-[#0f83b2]/20' : 'border-gray-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDark ? 'bg-[#0d2137]' : 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-semibold uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Estudio</th>
                <th className={`px-6 py-3 text-left text-xs font-semibold uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Categoría</th>
                <th className={`px-6 py-3 text-left text-xs font-semibold uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Hospital</th>
                <th className={`px-6 py-3 text-right text-xs font-semibold uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Costo</th>
                <th className={`px-6 py-3 text-center text-xs font-semibold uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Acciones</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-[#0f83b2]/20' : 'divide-gray-200'}`}>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No hay estudios con los filtros aplicados
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <motion.tr
                    key={item.id_estudio}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.03 }}
                    className={`transition-colors ${isDark ? 'bg-[#0a1929] hover:bg-[#0d2137]' : 'bg-white hover:bg-gray-50'}`}
                  >
                    <td className={`px-6 py-4 font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                      {item.nombre_estudio}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${catColors[item.categoria || ''] ?? (isDark ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-600')}`}>
                        <Tag size={12} /> {item.categoria || 'Sin categoría'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-50 text-purple-700'}`}>
                        <Building2 size={12} /> {item.nombre_hospital || 'Sin asignar'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-right font-medium ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                      <span className="inline-flex items-center gap-1">
                        <DollarSign size={14} />
                        {Number(item.costo || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {currentTab === 'activos' && (
                          <button onClick={() => onEdit(item)} className={`p-2 rounded-lg transition-colors ${isDark ? 'text-blue-400 hover:bg-blue-500/10' : 'text-blue-600 hover:bg-blue-50'}`}>
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onToggleStatus(item.id_estudio, item.activo)}
                          className={`p-2 rounded-lg transition-colors ${
                            currentTab === 'activos'
                              ? (isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50')
                              : (isDark ? 'text-green-400 hover:bg-green-500/10' : 'text-green-600 hover:bg-green-50')
                          }`}
                          title={currentTab === 'activos' ? 'Desactivar' : 'Reactivar'}
                        >
                          {currentTab === 'activos' ? <Trash2 className="h-4 w-4" /> : <RefreshCcw className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded bg-gray-100 dark:bg-[#0d2137] disabled:opacity-50">
            <ChevronLeft size={20} />
          </button>
          <span className="px-4 py-2 text-sm">{page} de {pages}</span>
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="p-2 rounded bg-gray-100 dark:bg-[#0d2137] disabled:opacity-50">
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
