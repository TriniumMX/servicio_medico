'use client';

import { useState, useEffect } from 'react';
import { EnfermedadCronica, KpiEnfermedad } from '@/types/catalogos/enfermedades';
import { Save, X, Plus, Trash2, Target } from 'lucide-react';

interface Props {
  onSubmit: (data: Partial<EnfermedadCronica>) => Promise<void>;
  onCancel: () => void;
  initialData?: EnfermedadCronica | null;
  loading: boolean;
  isDark: boolean;
}

export default function FormEnfermedades({ onSubmit, onCancel, initialData, loading, isDark }: Props) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  // Solo guardamos el nombre del indicador
  const [kpis, setKpis] = useState<KpiEnfermedad[]>([{ nombre_indicador: '' }]);

  useEffect(() => {
    if (initialData) {
      setNombre(initialData.nombre);
      setDescripcion(initialData.descripcion || '');
      if (initialData.kpis && initialData.kpis.length > 0) {
        setKpis(initialData.kpis.map(k => ({ nombre_indicador: k.nombre_indicador })));
      } else {
        setKpis([{ nombre_indicador: '' }]);
      }
    } else {
      setNombre('');
      setDescripcion('');
      setKpis([{ nombre_indicador: '' }]);
    }
  }, [initialData]);

  const handleKpiChange = (index: number, value: string) => {
    const newKpis = [...kpis];
    newKpis[index] = { ...newKpis[index], nombre_indicador: value };
    setKpis(newKpis);
  };

  const addKpiRow = () => {
    setKpis([...kpis, { nombre_indicador: '' }]);
  };

  const removeKpiRow = (index: number) => {
    const newKpis = kpis.filter((_, i) => i !== index);
    setKpis(newKpis);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const kpisValidos = kpis.filter(k => k.nombre_indicador.trim() !== '');
    await onSubmit({ nombre, descripcion, kpis: kpisValidos });
  };

  const inputClass = `w-full px-4 py-2 rounded-lg border transition-colors ${
    isDark
      ? 'bg-[#0d2137] border-[#0f83b2]/30 text-white placeholder-gray-500 focus:border-[#0db1ec]'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#0db1ec]'
  } focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20`;

  return (
    <div className={`p-6 rounded-xl border ${isDark ? 'bg-[#0a1929] border-[#0f83b2]/20' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {initialData ? 'Editar Enfermedad' : 'Nueva Enfermedad Crónica'}
        </h3>
        <button onClick={onCancel} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#0d2137]">
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Nombre de la Patología *</label>
            <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputClass} placeholder="Ej. Hipertensión Arterial" />
          </div>
          <div className="md:col-span-2">
            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Descripción</label>
            <textarea rows={2} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${isDark ? 'border-[#0f83b2]/30 bg-[#0d2137]/30' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center justify-between mb-4">
            <h4 className={`font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              <Target className="h-4 w-4 text-[#0db1ec]" />
              Indicadores a Monitorear
            </h4>
            <button type="button" onClick={addKpiRow} className="text-xs flex items-center gap-1 px-3 py-1.5 bg-[#0db1ec] text-white rounded hover:bg-[#0a8ec4]">
              <Plus className="h-3 w-3" /> Agregar
            </button>
          </div>

          <div className="space-y-3">
            {kpis.map((kpi, index) => (
              <div key={index} className="flex gap-3 items-center">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Nombre del Indicador (Ej. Presión Sistólica, Glucosa, Peso)"
                    value={kpi.nombre_indicador}
                    onChange={(e) => handleKpiChange(index, e.target.value)}
                    className={`${inputClass} text-sm`}
                  />
                </div>
                <button type="button" onClick={() => removeKpiRow(index)} className="p-2 text-red-500 hover:bg-red-100 rounded">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {kpis.length === 0 && <p className="text-sm text-gray-500 text-center">Sin indicadores.</p>}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onCancel} className={`px-4 py-2 rounded-lg ${isDark ? 'text-gray-300 hover:bg-[#0d2137]' : 'text-gray-700 hover:bg-gray-100'}`}>Cancelar</button>
          <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2 bg-[#0db1ec] text-white rounded-lg hover:bg-[#0a8ec4] disabled:opacity-50">
            <Save className="h-4 w-4" /> {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}