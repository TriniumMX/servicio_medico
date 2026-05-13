// src/components/catalogos/hospitales/FormHospital.tsx

'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Hospital } from '@/types/catalogos/hospitales';
import { Save, X, MapPin } from 'lucide-react';

// Mapa dinámico
const MapaSelector = dynamic(
  () => import('./MapaSelector'), 
  { ssr: false, loading: () => <div className="h-[300px] bg-gray-100 flex items-center justify-center">Cargando mapa...</div> }
);

interface Props {
  onSubmit: (data: Partial<Hospital>) => Promise<void>;
  onCancel: () => void;
  initialData?: Hospital | null;
  loading: boolean;
  isDark: boolean; // Recibimos el tema
}

export default function FormHospital({ onSubmit, onCancel, initialData, loading, isDark }: Props) {
  const [formData, setFormData] = useState<Partial<Hospital>>({
    nombre_hospital: initialData?.nombre_hospital || '',
    razon_social: initialData?.razon_social || '',
    direccion: initialData?.direccion || '',
    contacto: initialData?.contacto || '',
    encargado: initialData?.encargado || '',
    latitud: initialData?.latitud,
    longitud: initialData?.longitud,
  });

  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'direccion') setSearchQuery(value);
  };

  const handleLocationSelect = (lat: number, lng: number, address?: string) => {
    setFormData(prev => ({
      ...prev,
      latitud: lat,
      longitud: lng,
      direccion: address !== undefined ? address : prev.direccion
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  // ESTILOS DE TU REFERENCIA (Usuarios)
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
            {initialData ? 'Editar Hospital' : 'Nuevo Hospital'}
        </h3>
        <button onClick={onCancel} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[#0d2137] text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna Izquierda: Datos */}
          <div className="space-y-5">
            <div>
              <label className={labelClass}>Nombre Hospital *</label>
              <input
                type="text"
                name="nombre_hospital"
                required
                value={formData.nombre_hospital}
                onChange={handleChange}
                className={inputClass}
                placeholder="Ej. Hospital General"
              />
            </div>
            <div>
              <label className={labelClass}>Razón Social</label>
              <input
                type="text"
                name="razon_social"
                value={formData.razon_social}
                onChange={handleChange}
                className={inputClass}
                placeholder="Ej. Servicios Médicos S.A."
              />
            </div>
            
            {/* Input Dirección */}
            <div>
              <label className={labelClass}>Dirección (Buscar en mapa)</label>
              <div className="relative">
                <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  placeholder="Escribe para buscar..."
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Contacto</label>
                <input
                  type="text"
                  name="contacto"
                  value={formData.contacto}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Tel / Email"
                />
              </div>
              <div>
                <label className={labelClass}>Encargado</label>
                <input
                  type="text"
                  name="encargado"
                  value={formData.encargado}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Nombre completo"
                />
              </div>
            </div>
          </div>

          {/* Columna Derecha: Mapa */}
          <div className="space-y-2">
            <label className={labelClass}>Ubicación Geográfica</label>
            <div className={`rounded-lg overflow-hidden border ${isDark ? 'border-[#0f83b2]/30' : 'border-gray-300'}`}>
                <MapaSelector 
                    lat={formData.latitud} 
                    lng={formData.longitud} 
                    searchQuery={searchQuery} 
                    onLocationSelect={handleLocationSelect} 
                />
            </div>
            <div className={`flex gap-4 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <span>Lat: <b>{formData.latitud?.toFixed(6) || '-'}</b></span>
              <span>Lng: <b>{formData.longitud?.toFixed(6) || '-'}</b></span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-[#0f83b2]/20">
          <button
            type="button"
            onClick={onCancel}
            className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
                isDark
                  ? 'bg-[#0d2137] text-gray-300 hover:bg-[#0f83b2]/20'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#0db1ec] hover:bg-[#0a8ec4] text-white rounded-lg font-medium transition-colors shadow-lg shadow-[#0db1ec]/20 disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}