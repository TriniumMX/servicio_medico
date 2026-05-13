// src/components/farmacia/alertas/TablaCorreos.tsx

'use client';

import { useState } from 'react';
import { Mail, Trash2, Edit2, ToggleLeft, ToggleRight, UserCircle } from 'lucide-react';
import type { CorreoAlerta } from '@/types/alertas-fondos';

interface TablaCorreosProps {
  correos: CorreoAlerta[];
  loading: boolean;
  onEditar: (correo: CorreoAlerta) => void;
  onEliminar: (idCorreo: number) => void;
  onToggleActivo: (idCorreo: number) => void;
  isDark: boolean;
}

export function TablaCorreos({
  correos,
  loading,
  onEditar,
  onEliminar,
  onToggleActivo,
  isDark,
}: TablaCorreosProps) {
  const [confirmandoEliminar, setConfirmandoEliminar] = useState<number | null>(null);

  const handleEliminar = (idCorreo: number) => {
    if (confirmandoEliminar === idCorreo) {
      onEliminar(idCorreo);
      setConfirmandoEliminar(null);
    } else {
      setConfirmandoEliminar(idCorreo);
      setTimeout(() => setConfirmandoEliminar(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className={`ml-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Cargando correos...</span>
      </div>
    );
  }

  if (correos.length === 0) {
    return (
      <div className={`text-center py-12 px-4 rounded-2xl border border-dashed ${
        isDark ? 'bg-transparent border-slate-700' : 'bg-white border-slate-300'
      }`}>
        <Mail className={`mx-auto h-12 w-12 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
        <h3 className={`mt-4 text-lg font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>No hay correos configurados</h3>
        <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Agrega destinatarios para recibir alertas de fondos bajos.
        </p>
      </div>
    );
  }

  return (
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
                Destinatario
              </th>
              <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                isDark ? 'text-slate-300' : 'text-slate-500'
              }`}>
                Correo
              </th>
              <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider ${
                isDark ? 'text-slate-300' : 'text-slate-500'
              }`}>
                Estado
              </th>
              <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider ${
                isDark ? 'text-slate-300' : 'text-slate-500'
              }`}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'bg-transparent divide-white/5' : 'bg-white divide-slate-100'}`}>
            {correos.map((correo) => (
              <tr
                key={correo.id_correo}
                className={`transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white font-bold text-sm shadow-md">
                      {correo.nombre_destinatario.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-4">
                      <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {correo.nombre_destinatario}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`flex items-center text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    <Mail className="h-4 w-4 mr-2 text-slate-400" />
                    {correo.correo}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button
                    onClick={() => onToggleActivo(correo.id_correo)}
                    className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm backdrop-blur-sm border ${
                      correo.activo
                        ? isDark
                          ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                          : 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                        : isDark
                          ? 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:bg-slate-800/60'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {correo.activo ? (
                      <>
                        <ToggleRight className="h-4 w-4 mr-1.5" />
                        Activo
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="h-4 w-4 mr-1.5" />
                        Inactivo
                      </>
                    )}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() => onEditar(correo)}
                      className={`p-2 rounded-xl transition-colors ${
                        isDark
                          ? 'text-blue-400 hover:bg-blue-500/10'
                          : 'text-blue-600 hover:bg-blue-50'
                      }`}
                      title="Editar correo"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEliminar(correo.id_correo)}
                      className={`p-2 rounded-xl transition-colors ${
                        confirmandoEliminar === correo.id_correo
                          ? isDark
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-red-100 text-red-700'
                          : isDark
                            ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
                            : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                      }`}
                      title={confirmandoEliminar === correo.id_correo ? 'Confirmar eliminacion' : 'Eliminar correo'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
