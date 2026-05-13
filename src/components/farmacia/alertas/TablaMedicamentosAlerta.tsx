// src/components/farmacia/alertas/TablaMedicamentosAlerta.tsx

'use client';

import { useState } from 'react';
import { Package, AlertTriangle, Search, ChevronDown, ChevronUp } from 'lucide-react';
import type { MedicamentoAlerta, EstadoAlerta } from '@/types/alertas-fondos';

interface TablaMedicamentosAlertaProps {
  medicamentos: MedicamentoAlerta[];
  loading: boolean;
  isDark: boolean;
}

const COLORES_ESTADO: Record<EstadoAlerta, { light: { bg: string; text: string; border: string }; dark: { bg: string; text: string; border: string } }> = {
  CRITICO: {
    light: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
    dark: { bg: 'bg-red-900/30', text: 'text-red-300', border: 'border-red-800' },
  },
  BAJO: {
    light: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
    dark: { bg: 'bg-amber-900/30', text: 'text-amber-300', border: 'border-amber-800' },
  },
  MEDIO: {
    light: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
    dark: { bg: 'bg-blue-900/30', text: 'text-blue-300', border: 'border-blue-800' },
  },
  NORMAL: {
    light: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    dark: { bg: 'bg-green-900/30', text: 'text-green-300', border: 'border-green-800' },
  },
};

export function TablaMedicamentosAlerta({
  medicamentos,
  loading,
  isDark,
}: TablaMedicamentosAlertaProps) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<EstadoAlerta | 'TODOS'>('TODOS');
  const [ordenAsc, setOrdenAsc] = useState(true);

  // Filtrar medicamentos
  const medicamentosFiltrados = medicamentos.filter((med) => {
    const coincideBusqueda =
      med.nombre_comercial.toLowerCase().includes(busqueda.toLowerCase()) ||
      med.sustancia_activa.toLowerCase().includes(busqueda.toLowerCase());

    const coincideEstado = filtroEstado === 'TODOS' || med.estado === filtroEstado;

    return coincideBusqueda && coincideEstado;
  });

  // Ordenar
  const medicamentosOrdenados = [...medicamentosFiltrados].sort((a, b) => {
    const multiplicador = ordenAsc ? 1 : -1;
    return (a.porcentaje - b.porcentaje) * multiplicador;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className={`animate-spin rounded-full h-10 w-10 border-b-2 ${isDark ? 'border-blue-400' : 'border-blue-600'}`}></div>
        <span className={`mt-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Analizando inventario...</span>
      </div>
    );
  }

  if (medicamentos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className={`p-4 rounded-full mb-4 ${isDark ? 'bg-green-900/20' : 'bg-green-50'}`}>
          <Package className={`h-12 w-12 ${isDark ? 'text-green-400' : 'text-green-500'}`} />
        </div>
        <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
          Inventario Saludable
        </h3>
        <p className={`mt-2 max-w-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Excelente trabajo. No hay medicamentos por debajo de su fondo fijo en este momento.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Busqueda */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o sustancia..."
            className={`w-full pl-11 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-400 border ${
              isDark
                ? 'bg-slate-900/50 border-slate-700 text-white'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          />
        </div>

        {/* Filtro por estado */}
        <div className="relative min-w-[200px]">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as EstadoAlerta | 'TODOS')}
            className={`w-full appearance-none px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all cursor-pointer border ${
              isDark
                ? 'bg-slate-900/50 border-slate-700 text-white'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <option value="TODOS">Todos los estados</option>
            <option value="CRITICO">CRÍTICOS</option>
            <option value="BAJO">BAJOS</option>
            <option value="MEDIO">MEDIOS</option>
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Tabla */}
      <div className={`overflow-hidden rounded-2xl shadow-sm border ${
        isDark ? 'border-white/10' : 'border-slate-200'
      }`}>
        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${isDark ? 'divide-white/5' : 'divide-slate-200'}`}>
            <thead className={`${isDark ? 'bg-slate-900/40' : 'bg-slate-50'}`}>
              <tr>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                  isDark ? 'text-slate-300' : 'text-slate-500'
                }`}>
                  Medicamento
                </th>
                <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider ${
                  isDark ? 'text-slate-300' : 'text-slate-500'
                }`}>
                  Existencia
                </th>
                <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider ${
                  isDark ? 'text-slate-300' : 'text-slate-500'
                }`}>
                  Fondo Fijo
                </th>
                <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider ${
                  isDark ? 'text-slate-300' : 'text-slate-500'
                }`}>
                  Faltante
                </th>
                <th
                  className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors group ${
                    isDark ? 'text-slate-400 hover:text-blue-400' : 'text-slate-500 hover:text-blue-600'
                  }`}
                  onClick={() => setOrdenAsc(!ordenAsc)}
                >
                  <div className="flex items-center justify-center">
                    Nivel %
                    {ordenAsc ? (
                      <ChevronUp className="h-3 w-3 ml-1 group-hover:-translate-y-0.5 transition-transform" />
                    ) : (
                      <ChevronDown className="h-3 w-3 ml-1 group-hover:translate-y-0.5 transition-transform" />
                    )}
                  </div>
                </th>
                <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider ${
                  isDark ? 'text-slate-300' : 'text-slate-500'
                }`}>
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'bg-transparent divide-white/5' : 'bg-white divide-slate-100'}`}>
              {medicamentosOrdenados.map((med, index) => {
                const colores = COLORES_ESTADO[med.estado][isDark ? 'dark' : 'light'];
                return (
                  <tr
                    key={med.id_inventario}
                    className={`transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          <div className={`w-2 h-2 rounded-full mr-3 ${med.estado === 'CRITICO' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                            med.estado === 'BAJO' ? 'bg-amber-500' : 'bg-blue-500'
                            }`}></div>
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            {med.nombre_comercial}
                          </p>
                          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{med.sustancia_activa}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {med.existencia_actual}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {med.fondo_fijo}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-sm font-bold ${isDark ? 'text-red-400' : 'text-red-500'}`}>
                        -{med.faltante}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <div className={`w-16 rounded-full h-2 overflow-hidden mr-2 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                          <div
                            className={`h-full rounded-full ${med.estado === 'CRITICO' ? 'bg-red-500' :
                              med.estado === 'BAJO' ? 'bg-amber-500' : 'bg-blue-500'
                              }`}
                            style={{ width: `${Math.min(med.porcentaje, 100)}%` }}
                          ></div>
                        </div>
                        <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          {med.porcentaje}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${colores.bg} ${colores.text} border ${colores.border}`}
                      >
                        {med.estado}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumen */}
      <div className={`mt-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        Mostrando {medicamentosOrdenados.length} de {medicamentos.length} medicamentos
        con alerta
      </div>
    </div>
  );
}
