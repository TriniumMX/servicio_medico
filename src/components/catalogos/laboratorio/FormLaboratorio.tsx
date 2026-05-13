'use client';

import { useState, useEffect } from 'react';
import { EstudioLaboratorio, Hospital } from '@/types/catalogos/laboratorio';
import { Save, X, FlaskConical, DollarSign, Building2 } from 'lucide-react';

interface Props {
  onSubmit: (data: Partial<EstudioLaboratorio>) => Promise<void>;
  onCancel: () => void;
  initialData?: EstudioLaboratorio | null;
  loading: boolean;
  isDark: boolean;
}

const CATEGORIAS_COMUNES = ["Laboratorio", "Gabinete"];

export default function FormLaboratorio({ onSubmit, onCancel, initialData, loading, isDark }: Props) {
  const [formData, setFormData] = useState<Partial<EstudioLaboratorio>>({
    nombre_estudio: '',
    categoria: 'Laboratorio',
    costo: 0,
    id_hospital: 5,
  });
  const [hospitales, setHospitales] = useState<Hospital[]>([]);

  useEffect(() => {
    const fetchHospitales = async () => {
      try {
        const res = await fetch('/api/catalogos/hospitales');
        const data = await res.json();
        if (data.success) setHospitales(data.data);
      } catch (error) {
        console.error('Error al cargar hospitales:', error);
      }
    };
    fetchHospitales();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre_estudio: initialData.nombre_estudio,
        categoria: initialData.categoria || 'Laboratorio',
        costo: initialData.costo || 0,
        id_hospital: initialData.id_hospital || 5,
      });
    } else {
      setFormData({ nombre_estudio: '', categoria: 'Laboratorio', costo: 0, id_hospital: 5 });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const inputClass = `w-full px-4 py-2.5 rounded-lg border transition-colors ${
    isDark
      ? 'bg-[#0d2137] border-[#0f83b2]/30 text-white placeholder-gray-500 focus:border-[#0db1ec]'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#0db1ec]'
  } focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20`;

  const labelClass = `block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;

  return (
    <div className={`p-6 rounded-xl border ${isDark ? 'bg-[#0a1929] border-[#0f83b2]/20' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {initialData ? 'Editar Estudio' : 'Nuevo Estudio de Laboratorio'}
        </h3>
        <button onClick={onCancel} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[#0d2137] text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className={labelClass}>Nombre del Estudio *</label>
          <div className="relative">
            <FlaskConical className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="text"
              required
              value={formData.nombre_estudio}
              onChange={(e) => setFormData({ ...formData, nombre_estudio: e.target.value })}
              className={`${inputClass} pl-10`}
              placeholder="Ej. Biometría Hemática Completa"
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Categoría</label>
          <select
            value={formData.categoria}
            onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
            className={inputClass}
          >
            {CATEGORIAS_COMUNES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Costo (MXN)</label>
          <div className="relative">
            <DollarSign className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.costo || ''}
              onChange={(e) => setFormData({ ...formData, costo: parseFloat(e.target.value) || 0 })}
              className={`${inputClass} pl-10`}
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Hospital *</label>
          <div className="relative">
            <Building2 className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <select
              required
              value={formData.id_hospital}
              onChange={(e) => setFormData({ ...formData, id_hospital: parseInt(e.target.value) })}
              className={`${inputClass} pl-10`}
            >
              <option value="">Seleccionar hospital...</option>
              {hospitales.map(h => (
                <option key={h.id_hospital} value={h.id_hospital}>{h.nombre_hospital}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-[#0f83b2]/20">
          <button type="button" onClick={onCancel} className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${isDark ? 'bg-[#0d2137] text-gray-300 hover:bg-[#0f83b2]/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            Cancelar
          </button>
          <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-[#0db1ec] hover:bg-[#0a8ec4] text-white rounded-lg font-medium transition-colors shadow-lg shadow-[#0db1ec]/20 disabled:opacity-50">
            <Save className="h-5 w-5" />
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}