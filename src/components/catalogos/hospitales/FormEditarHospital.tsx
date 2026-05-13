'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Hospital } from '@/types/catalogos/hospitales';
import { Save, X, MapPin } from 'lucide-react';

// Importamos el mapa nuevo
const MapaEdicion = dynamic(
  () => import('./MapaEdicion'), 
  { ssr: false, loading: () => <div className="h-[300px] bg-gray-100 flex items-center justify-center">Cargando mapa...</div> }
);

interface Props {
  hospital: Hospital; // Dato obligatorio
  onSubmit: (data: Partial<Hospital>) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isDark: boolean;
}

export default function FormEditarHospital({ hospital, onSubmit, onCancel, loading, isDark }: Props) {
  // Inicializamos DIRECTAMENTE con los datos del hospital.
  // Al usar "key" en el padre, este componente se destruye y crea de nuevo si cambia el hospital.
  const [formData, setFormData] = useState<Partial<Hospital>>({
    id_hospital: hospital.id_hospital,
    nombre_hospital: hospital.nombre_hospital,
    razon_social: hospital.razon_social || '',
    direccion: hospital.direccion || '',
    contacto: hospital.contacto || '',
    encargado: hospital.encargado || '',
    latitud: hospital.latitud ? Number(hospital.latitud) : 0,
    longitud: hospital.longitud ? Number(hospital.longitud) : 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

const handleMapChange = (lat: number, lng: number, address?: string) => {
    setFormData(prev => ({ 
      ...prev, 
      latitud: lat, 
      longitud: lng,
      direccion: address ? address : prev.direccion 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  // Estilos
  const inputClass = `w-full px-4 py-2.5 rounded-lg border transition-colors ${
    isDark
      ? 'bg-[#0d2137] border-[#0f83b2]/30 text-white placeholder-gray-500 focus:border-[#0db1ec]'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#0db1ec]'
  } focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20`;

  const labelClass = `block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;

  return (
    <div className={`p-6 rounded-xl border ${
        isDark ? 'bg-[#0a1929] border-[#0f83b2]/20' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Editar Hospital: {hospital.nombre_hospital}
        </h3>
        <button onClick={onCancel} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[#0d2137] text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Datos */}
          <div className="space-y-5">
            <div>
              <label className={labelClass}>Nombre Hospital *</label>
              <input type="text" name="nombre_hospital" required value={formData.nombre_hospital} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Razón Social</label>
              <input type="text" name="razon_social" value={formData.razon_social} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Dirección (Texto)</label>
              <div className="relative">
                <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} className={`${inputClass} pl-10`} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Contacto</label>
                <input type="text" name="contacto" value={formData.contacto} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Encargado</label>
                <input type="text" name="encargado" value={formData.encargado} onChange={handleChange} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Mapa */}
          <div className="space-y-2">
            <label className={labelClass}>Ubicación (Clic para mover)</label>
            <div className={`rounded-lg overflow-hidden border ${isDark ? 'border-[#0f83b2]/30' : 'border-gray-300'}`}>
                <MapaEdicion 
                    lat={Number(formData.latitud) || 0} 
                    lng={Number(formData.longitud) || 0} 
                    onLocationSelect={handleMapChange} 
                />
            </div>
            <div className={`flex gap-4 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <span>Lat: <b>{Number(formData.latitud).toFixed(6)}</b></span>
              <span>Lng: <b>{Number(formData.longitud).toFixed(6)}</b></span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-[#0f83b2]/20">
          <button type="button" onClick={onCancel} className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${isDark ? 'bg-[#0d2137] text-gray-300 hover:bg-[#0f83b2]/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Cancelar</button>
          <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-[#0db1ec] hover:bg-[#0a8ec4] text-white rounded-lg font-medium transition-colors shadow-lg shadow-[#0db1ec]/20 disabled:opacity-50">
            <Save className="h-5 w-5" />
            {loading ? 'Guardando...' : 'Actualizar Hospital'}
          </button>
        </div>
      </form>
    </div>
  );
}