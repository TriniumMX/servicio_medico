'use client';

import { EnfermedadCronica } from '@/types/catalogos/enfermedades';
import { Edit, Activity, ChevronDown, ChevronUp, Trash2, RefreshCcw } from 'lucide-react';
import { useState } from 'react';

interface Props {
  data: EnfermedadCronica[];
  onEdit: (item: EnfermedadCronica) => void;
  onToggleStatus: (id: number, status: boolean) => void;
  isDark: boolean;
}

export default function TablaEnfermedades({ data, onEdit, onToggleStatus, isDark }: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-[#0f83b2]/20' : 'border-gray-200'}`}>
      <table className="w-full">
        <thead className={isDark ? 'bg-[#0d2137]' : 'bg-gray-50'}>
          <tr>
            <th className={`px-6 py-3 text-left text-xs font-semibold uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Enfermedad</th>
            <th className={`px-6 py-3 text-left text-xs font-semibold uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Indicadores</th>
            <th className={`px-6 py-3 text-center text-xs font-semibold uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Acciones</th>
          </tr>
        </thead>
        <tbody className={`divide-y ${isDark ? 'divide-[#0f83b2]/20' : 'divide-gray-200'}`}>
          {data.length === 0 ? (
            <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-500">No hay registros en esta pestaña</td></tr>
          ) : (
            data.map((item) => (
              <>
                <tr key={item.id_enfermedad} className={isDark ? 'hover:bg-[#0d2137]' : 'hover:bg-gray-50'}>
                  {/* Nombre y Descripción */}
                  <td className={`px-6 py-4 font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-[#0db1ec]" />
                      {item.nombre}
                    </div>
                    {item.descripcion && <p className="text-xs text-gray-500 ml-6">{item.descripcion}</p>}
                  </td>

                  {/* Botón para expandir KPIs */}
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => toggleExpand(item.id_enfermedad)}
                      className={`text-xs flex items-center gap-1 px-2 py-1 rounded ${isDark ? 'bg-[#0f83b2]/20 text-[#0db1ec]' : 'bg-blue-50 text-blue-600'}`}
                    >
                      {item.kpis.length} Indicadores
                      {expandedId === item.id_enfermedad ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                    </button>
                  </td>

                  {/* Acciones (Editar / Borrar / Restaurar) */}
                  <td className="px-6 py-4 text-center flex justify-center gap-2">
                    
                    {/* Solo mostramos Editar si está activo */}
                    {item.activo && (
                      <button 
                        onClick={() => onEdit(item)} 
                        className={`p-2 rounded-lg transition-colors ${isDark ? 'text-blue-400 hover:bg-blue-500/10' : 'text-blue-600 hover:bg-blue-50'}`}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}

                    {/* Botón Dinámico: Basura (si activo) o Restaurar (si inactivo) */}
                    <button
                      onClick={() => onToggleStatus(item.id_enfermedad, item.activo)}
                      className={`p-2 rounded-lg transition-colors ${
                        item.activo 
                          ? (isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50')
                          : (isDark ? 'text-green-400 hover:bg-green-500/10' : 'text-green-600 hover:bg-green-50')
                      }`}
                      title={item.activo ? "Desactivar" : "Reactivar"}
                    >
                      {item.activo ? <Trash2 className="h-4 w-4" /> : <RefreshCcw className="h-4 w-4" />}
                    </button>
                  </td>
                </tr>

                {/* Fila expandible con los KPIs */}
                {expandedId === item.id_enfermedad && (
                  <tr className={isDark ? 'bg-[#0a1929]/50' : 'bg-gray-50/50'}>
                    <td colSpan={3} className="px-6 py-4">
                      <div className="ml-6 border-l-2 border-[#0db1ec] pl-4">
                        <h5 className={`text-xs font-bold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>INDICADORES A MONITOREAR:</h5>
                        <div className="flex flex-wrap gap-2">
                          {item.kpis.map((k, idx) => (
                            <span key={idx} className={`text-xs px-2 py-1 rounded border ${isDark ? 'border-gray-700 bg-gray-800 text-gray-300' : 'border-gray-200 bg-white text-gray-700'}`}>
                              {k.nombre_indicador}
                            </span>
                          ))}
                          {item.kpis.length === 0 && <span className="text-xs text-gray-400">Sin indicadores registrados.</span>}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}