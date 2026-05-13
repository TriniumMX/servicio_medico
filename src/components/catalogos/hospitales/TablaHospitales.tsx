// src/components/catalogos/hospitales/TablaHospitales.tsx

import { Hospital } from '@/types/catalogos/hospitales';
import { Edit, Phone, MapPin, User, Trash2, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  data: Hospital[];
  onEdit: (hospital: Hospital) => void;
  isDark: boolean;
    onDelete: (id: number) => void; // Nueva prop

}

export default function TablaHospitales({ data, onEdit, onDelete, isDark }: Props) {
  return (
    <div className={`rounded-xl border overflow-hidden ${
      isDark ? 'bg-[#0a1929] border-[#0f83b2]/20' : 'bg-white border-gray-200'
    }`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={isDark ? 'bg-[#0d2137]' : 'bg-gray-50'}>
            <tr>
              <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Hospital / Razón Social</th>
              <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Dirección</th>
              <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Contacto</th>
              <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Encargado</th>
              <th className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Acciones</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-[#0f83b2]/20' : 'divide-gray-200'}`}>
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Building2 className={`h-12 w-12 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                    <p className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>No hay hospitales registrados</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((hospital) => (
                <motion.tr 
                  key={hospital.id_hospital} 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`transition-colors ${isDark ? 'hover:bg-[#0d2137]' : 'hover:bg-gray-50'}`}
                >
                  <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                    <div className="font-medium">{hospital.nombre_hospital}</div>
                    <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{hospital.razon_social}</div>
                  </td>
                  <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#0db1ec]" />
                      <span className="truncate max-w-[200px]" title={hospital.direccion}>{hospital.direccion || '-'}</span>
                    </div>
                  </td>
                  <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-[#0db1ec]" />
                      {hospital.contacto || '-'}
                    </div>
                  </td>
                  <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-[#0db1ec]" />
                      {hospital.encargado || '-'}
                    </div>
                  </td>
                                    <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => onEdit(hospital)}
                        className={`p-2 rounded-lg transition-colors ${
                          isDark ? 'hover:bg-[#0db1ec]/10 text-gray-400 hover:text-[#0db1ec]' : 'hover:bg-blue-50 text-gray-600 hover:text-blue-600'
                        }`}
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                      
                      {/* Botón Eliminar */}
                      <button 
                        onClick={() => onDelete(hospital.id_hospital)}
                        className={`p-2 rounded-lg transition-colors ${
                          isDark ? 'hover:bg-red-500/10 text-gray-400 hover:text-red-400' : 'hover:bg-red-50 text-gray-600 hover:text-red-600'
                        }`}
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
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
  );
}