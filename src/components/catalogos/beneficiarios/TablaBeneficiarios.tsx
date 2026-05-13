// src/components/catalogos/beneficiarios/TablaBeneficiarios.tsx

'use client';

import { motion } from 'framer-motion';
import { Eye, Users, CheckCircle2, XCircle, Edit, Trash2 } from 'lucide-react';
import type { Beneficiario } from '@/types/catalogos/beneficiarios';

interface TablaBeneficiariosProps {
  beneficiarios: Beneficiario[];
  isDark: boolean;
  onVerDetalles: (beneficiario: Beneficiario) => void;
  onEditar: (beneficiario: Beneficiario) => void;
  onEliminar: (beneficiario: Beneficiario) => void;
}

export default function TablaBeneficiarios({ beneficiarios, isDark, onVerDetalles, onEditar, onEliminar }: TablaBeneficiariosProps) {
  // Debug: Ver qué beneficiarios se reciben
  console.log('📋 Beneficiarios en tabla:', beneficiarios);

  const calcularEdad = (fechaNacimiento: string): number => {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const getNombreCompleto = (ben: Beneficiario): string => {
    return [ben.NOMBRE, ben.A_PATERNO, ben.A_MATERNO].filter(Boolean).join(' ');
  };

  if (beneficiarios.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`text-center py-12 rounded-xl border ${
          isDark ? 'bg-[#0a1929] border-[#0f83b2]/20 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'
        }`}
      >
        <Users size={48} className="mx-auto mb-4 opacity-30" />
        <p className="text-lg">No se encontraron beneficiarios registrados</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl shadow-lg border overflow-hidden ${
        isDark ? 'bg-[#0a1929] border-[#0f83b2]/30' : 'bg-white border-gray-200'
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] px-6 py-4">
        <div className="flex items-center gap-3">
          <Users size={24} className="text-white" />
          <div>
            <h3 className="text-xl font-bold text-white">Beneficiarios Registrados</h3>
            <p className="text-white/80 text-sm">{beneficiarios.length} beneficiario(s) encontrado(s)</p>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={isDark ? 'bg-[#0d1f2d]' : 'bg-gray-50'}>
            <tr>
              <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Nombre Completo
              </th>
              <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Parentesco
              </th>
              <th className={`px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Sexo
              </th>
              <th className={`px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Edad
              </th>
              <th className={`px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Estatus
              </th>
              <th className={`px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/20">
            {beneficiarios.map((beneficiario) => (
              <motion.tr
                key={beneficiario.ID_BENEFICIARIO}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`transition-colors ${
                  isDark ? 'hover:bg-[#0d1f2d]' : 'hover:bg-gray-50'
                }`}
              >
                <td className={`px-6 py-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <div className="font-semibold">{getNombreCompleto(beneficiario)}</div>
                </td>
                <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {beneficiario.PARENTESCO_NOMBRE || 'N/A'}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-semibold ${
                    beneficiario.SEXO === '2' 
                      ? 'bg-blue-500/20 text-blue-400' 
                      : 'bg-pink-500/20 text-pink-400'
                  }`}>
                    {beneficiario.SEXO === '2' ? 'M' : 'F'}
                  </span>
                </td>
                <td className={`px-6 py-4 text-center font-semibold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {calcularEdad(beneficiario.F_NACIMIENTO)} años
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    beneficiario.ACTIVO === 'A'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {beneficiario.ACTIVO === 'A' ? (
                      <>
                        <CheckCircle2 size={14} />
                        Activo
                      </>
                    ) : (
                      <>
                        <XCircle size={14} />
                        Inactivo
                      </>
                    )}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onVerDetalles(beneficiario)}
                      className={`p-2 rounded-lg transition-all ${
                        isDark
                          ? 'bg-[#0f83b2]/20 text-[#0db1ec] hover:bg-[#0f83b2]/30'
                          : 'bg-[#0f83b2]/10 text-[#0f83b2] hover:bg-[#0f83b2]/20'
                      }`}
                      title="Ver detalles"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => onEditar(beneficiario)}
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
                      onClick={() => onEliminar(beneficiario)}
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
    </motion.div>
  );
}