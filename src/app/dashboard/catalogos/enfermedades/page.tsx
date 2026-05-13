'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { Activity, Plus } from 'lucide-react';
import { useEnfermedades } from '@/hooks/catalogos/useEnfermedades';
import TablaEnfermedades from '@/components/catalogos/enfermedades/TablaEnfermedades';
import FormEnfermedades from '@/components/catalogos/enfermedades/FormEnfermedades';
import { EnfermedadCronica } from '@/types/catalogos/enfermedades';

export default function EnfermedadesPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { enfermedades, loading, fetchEnfermedades, guardarEnfermedad, toggleStatus } = useEnfermedades();

  const [mostrarForm, setMostrarForm] = useState(false);
  const [itemEditar, setItemEditar] = useState<EnfermedadCronica | null>(null);
  const [activeTab, setActiveTab] = useState<'activos' | 'inactivos'>('activos');

  useEffect(() => {
    fetchEnfermedades();
  }, [fetchEnfermedades]);

  const filteredData = enfermedades.filter(e => 
    activeTab === 'activos' ? e.activo === true : e.activo === false
  );

  const handleGuardar = async (data: Partial<EnfermedadCronica>) => {
    const dataToSave = itemEditar ? { ...data, id_enfermedad: itemEditar.id_enfermedad } : data;
    const exito = await guardarEnfermedad(dataToSave);
    if (exito) {
      setMostrarForm(false);
      setItemEditar(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-[#0f83b2] to-[#0db1ec] rounded-xl shadow-lg">
            <Activity className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Enfermedades Crónicas</h1>
            <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Gestión de patologías y KPIs</p>
          </div>
        </div>
        
        {!mostrarForm && activeTab === 'activos' && (
          <button onClick={() => { setItemEditar(null); setMostrarForm(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-[#0db1ec] text-white rounded-lg hover:bg-[#0a8ec4]">
            <Plus className="h-4 w-4" /> Nueva Enfermedad
          </button>
        )}
      </div>

      {/* Pestañas */}
      <div className="flex space-x-1 rounded-xl bg-gray-200 dark:bg-[#0d2137] p-1 w-fit">
        {['activos', 'inactivos'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
              activeTab === tab ? 'bg-white dark:bg-[#0f83b2] text-[#0db1ec] dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {mostrarForm ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <FormEnfermedades 
              onSubmit={handleGuardar} 
              onCancel={() => { setMostrarForm(false); setItemEditar(null); }} 
              initialData={itemEditar}
              loading={loading}
              isDark={isDark}
            />
          </motion.div>
        ) : (
          <TablaEnfermedades 
            data={filteredData} 
            onEdit={(item) => { setItemEditar(item); setMostrarForm(true); }} 
            onToggleStatus={toggleStatus}
            isDark={isDark} 
          />
        )}
      </div>
    </div>
  );
}