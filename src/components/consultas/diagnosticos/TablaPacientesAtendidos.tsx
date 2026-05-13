'use client';

import { FileText, Printer, User, Clock, AlertCircle } from 'lucide-react';

interface ConsultaAtendida {
  id_consulta: number;
  folio: string | null;
  nombre: string;
  edad: number | null;
  no_nomina: string | null;
  departamento: string | null;
  es_empleado: boolean;
  cie11_codigo: string | null;
  cie11_titulo: string | null;
  fecha_atencion: Date;
  id_receta: number | null;
  folio_receta: string | null;
  tiene_receta: number | null;
}

interface TablaPacientesAtendidosProps {
  consultas: ConsultaAtendida[];
  isDark: boolean;
  onImprimirReceta: (consulta: ConsultaAtendida) => void;
}

export default function TablaPacientesAtendidos({
  consultas,
  isDark,
  onImprimirReceta,
}: TablaPacientesAtendidosProps) {
  const formatearFecha = (fecha: Date) => {
    const date = new Date(fecha);
    return date.toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (consultas.length === 0) {
    return (
      <div className={`rounded-xl shadow-lg p-8 text-center ${isDark ? 'bg-[#0a1929] border border-[#0f83b2]/20' : 'bg-white border border-gray-200'
        }`}>
        <FileText className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'
          }`} />
        <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
          No hay pacientes atendidos
        </h3>
        <p className={isDark ? 'text-gray-500' : 'text-gray-500'}>
          Las consultas finalizadas aparecerán aquí
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl shadow-lg overflow-hidden ${isDark ? 'bg-[#0a1929] border border-[#0f83b2]/20' : 'bg-white border border-gray-200'
      }`}>
      {/* Vista Móvil (Tarjetas) */}
      <div className="sm:hidden p-4 space-y-4">
        {consultas.map((consulta, index) => (
          <div
            key={`${consulta.id_consulta}-${index}-mobile`}
            className={`rounded-xl p-4 shadow-sm border transition-all ${isDark ? 'bg-[#0d1f2d] border-[#0f83b2]/20' : 'bg-white border-gray-100'
              }`}
          >
            {/* Encabezado Tarjeta */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl flex-shrink-0 ${consulta.es_empleado
                  ? isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                  : isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600'
                  }`}>
                  <User className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className={`font-bold text-sm truncate max-w-[150px] ${isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                    {consulta.nombre}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                      {consulta.es_empleado ? 'Emp' : 'Ben'}
                    </span>
                    {consulta.no_nomina && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-md font-mono ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                        }`}>
                        {consulta.no_nomina}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className={`font-mono text-xs font-bold block ${isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                  {consulta.folio || '-'}
                </span>
              </div>
            </div>

            {/* Diagnóstico */}
            <div className={`p-3 rounded-lg mb-4 ${isDark ? 'bg-[#0a1929]' : 'bg-gray-50'}`}>
              <h5 className={`text-[10px] uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Diagnóstico</h5>
              {consulta.cie11_codigo ? (
                <div>
                  <div className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold mb-1 ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-700'
                    }`}>
                    {consulta.cie11_codigo}
                  </div>
                  <p className={`text-xs line-clamp-2 leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                    {consulta.cie11_titulo}
                  </p>
                </div>
              ) : (
                <span className={`text-xs italic ${isDark ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                  Sin diagnóstico registrado
                </span>
              )}
            </div>

            {/* Footer Items */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex flex-col gap-1">
                <span className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Fecha</span>
                <div className={`flex items-center gap-1.5 text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                  <Clock className="w-3.5 h-3.5 opacity-70" />
                  {new Date(consulta.fecha_atencion).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Receta</span>
                {consulta.tiene_receta ? (
                  <div className="flex items-center gap-1.5">
                    <FileText className={`w-3.5 h-3.5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                    <span className={`text-[10px] font-mono ${isDark ? 'text-green-400/70' : 'text-green-600/70'}`}>
                      {consulta.folio_receta}
                    </span>
                  </div>
                ) : (
                  <span className={`text-xs italic ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>No generada</span>
                )}
              </div>
            </div>

            {/* Acciones */}
            <button
              onClick={() => onImprimirReceta(consulta)}
              className={`w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${isDark
                ? 'bg-[#0f83b2]/10 text-[#0db1ec] hover:bg-[#0f83b2]/20 border border-[#0f83b2]/20'
                : 'bg-white text-blue-600 hover:bg-blue-50 border border-gray-200'
                }`}
            >
              <Printer className="w-4 h-4" />
              {consulta.tiene_receta ? 'Reimprimir Receta' : 'Imprimir Comprobante'}
            </button>
          </div>
        ))}
      </div>

      {/* Vista Escritorio (Tabla) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full min-w-[1000px] table-fixed">
          <thead>
            <tr className={isDark ? 'bg-[#0d1f2d] border-b border-[#0f83b2]/10' : 'bg-gray-50 border-b border-gray-200'}>
              <th className={`w-[25%] px-8 py-5 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                Paciente
              </th>
              <th className={`w-[15%] px-4 py-5 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                Folio
              </th>
              <th className={`w-[25%] px-4 py-5 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                Diagnóstico
              </th>
              <th className={`w-[15%] px-4 py-5 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                Fecha
              </th>
              <th className={`w-[10%] px-4 py-5 text-center text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                Receta
              </th>
              <th className={`w-[10%] px-4 py-5 text-center text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-[#0f83b2]/10' : 'divide-gray-100'}`}>
            {consultas.map((consulta, index) => (
              <tr
                key={`${consulta.id_consulta}-${index}`}
                className={`transition-colors ${isDark
                  ? 'hover:bg-[#0d1f2d] hover:shadow-lg'
                  : 'hover:bg-blue-50/20 hover:shadow-md'
                  }`}
              >
                {/* Paciente */}
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl flex-shrink-0 ${consulta.es_empleado
                      ? isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                      : isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600'
                      }`}>
                      <User className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className={`font-bold text-base truncate ${isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                        {consulta.nombre}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-500'
                          }`}>
                          {consulta.es_empleado ? 'Empleado' : 'Beneficiario'}
                        </span>
                        {consulta.no_nomina && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-md font-mono ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                            }`}>
                            {consulta.no_nomina}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Folio */}
                <td className="px-4 py-5">
                  <span className={`font-mono text-sm font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                    {consulta.folio || '-'}
                  </span>
                </td>

                {/* Diagnóstico */}
                <td className="px-4 py-5">
                  {consulta.cie11_codigo ? (
                    <div>
                      <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold mb-1.5 ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-700'
                        }`}>
                        {consulta.cie11_codigo}
                      </div>
                      <p className={`text-xs line-clamp-2 leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                        {consulta.cie11_titulo}
                      </p>
                    </div>
                  ) : (
                    <span className={`text-xs italic ${isDark ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                      Sin diagnóstico registrado
                    </span>
                  )}
                </td>

                {/* Fecha */}
                <td className="px-4 py-5">
                  <div className="flex flex-col gap-0.5">
                    <div className={`flex items-center gap-1.5 text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                      <Clock className="w-3.5 h-3.5 opacity-70" />
                      {new Date(consulta.fecha_atencion).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                    </div>
                    <span className={`text-xs pl-5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      {new Date(consulta.fecha_atencion).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </td>

                {/* Receta */}
                <td className="px-4 py-5 text-center">
                  {consulta.tiene_receta ? (
                    <div className="flex flex-col items-center gap-1">
                      <div className={`p-1.5 rounded-full ${isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-100 text-green-600'
                        }`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className={`text-[10px] font-mono ${isDark ? 'text-green-400/70' : 'text-green-600/70'}`}>
                        {consulta.folio_receta}
                      </span>
                    </div>
                  ) : (
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${isDark ? 'bg-gray-800 text-gray-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                      <AlertCircle className="w-4 h-4" />
                    </span>
                  )}
                </td>

                {/* Acciones */}
                <td className="px-4 py-5 text-center">
                  <div className="flex justify-center">
                    <button
                      onClick={() => onImprimirReceta(consulta)}
                      className={`p-2.5 rounded-xl transition-all shadow-sm ${isDark
                        ? 'bg-[#0f83b2]/10 text-[#0db1ec] hover:bg-[#0f83b2]/20 border border-[#0f83b2]/20'
                        : 'bg-white text-blue-600 hover:bg-blue-50 border border-gray-200'
                        }`}
                      title={consulta.tiene_receta ? 'Reimprimir receta' : 'Imprimir comprobante'}
                    >
                      <Printer className="w-4 h-4" />
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
