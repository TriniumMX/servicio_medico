'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { FlaskConical, Plus } from 'lucide-react';
import { useLaboratorio } from '@/hooks/catalogos/useLaboratorio';
import TablaLaboratorio from '@/components/catalogos/laboratorio/TablaLaboratorio';
import FormLaboratorio from '@/components/catalogos/laboratorio/FormLaboratorio';
import { EstudioLaboratorio } from '@/types/catalogos/laboratorio';

export default function LaboratorioPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { estudios, loading, fetchEstudios, guardarEstudio, toggleStatus } = useLaboratorio();

  const [mostrarForm, setMostrarForm] = useState(false);
  const [itemEditar, setItemEditar] = useState<EstudioLaboratorio | null>(null);
  const [activeTab, setActiveTab] = useState<'activos' | 'inactivos'>('activos');

  useEffect(() => {
    fetchEstudios();
  }, [fetchEstudios]);

  const filteredData = estudios.filter(e => 
    activeTab === 'activos' ? e.activo === true : e.activo === false
  );

  const handleGuardar = async (data: Partial<EstudioLaboratorio>) => {
    const dataToSave = itemEditar ? { ...data, id_estudio: itemEditar.id_estudio } : data;
    const exito = await guardarEstudio(dataToSave);
    if (exito) {
      setMostrarForm(false);
      setItemEditar(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-[#0f83b2] to-[#0db1ec] rounded-xl shadow-lg">
            <FlaskConical className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Catálogo de Laboratorio</h1>
            <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Gestión de estudios disponibles</p>
          </div>
        </div>
        
        {!mostrarForm && activeTab === 'activos' && (
          <button onClick={() => { setItemEditar(null); setMostrarForm(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-[#0db1ec] text-white rounded-lg hover:bg-[#0a8ec4]">
            <Plus className="h-4 w-4" /> Nuevo Estudio
          </button>
        )}
      </div>

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
            <FormLaboratorio 
              onSubmit={handleGuardar} 
              onCancel={() => { setMostrarForm(false); setItemEditar(null); }} 
              initialData={itemEditar}
              loading={loading}
              isDark={isDark}
            />
          </motion.div>
        ) : (
          <TablaLaboratorio 
            data={filteredData} 
            onEdit={(item) => { setItemEditar(item); setMostrarForm(true); }} 
            onToggleStatus={toggleStatus}
            isDark={isDark} 
            currentTab={activeTab}
          />
        )}
      </div>
    </div>
  );
}