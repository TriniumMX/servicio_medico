// src/app/pandora/catalogos/especialidades/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { Stethoscope, Plus } from 'lucide-react';
import TablaEspecialidades from '@/components/catalogos/especialidades/TablaEspecialidades';
import ModalEspecialidad from '@/components/catalogos/especialidades/ModalEspecialidad';
import { useEspecialidades } from '@/hooks/catalogos/useEspecialidades';
import type { Especialidad } from '@/types/catalogos/especialidades';

export default function EspecialidadesPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const {
    especialidades,
    loading,
    fetchEspecialidades,
    createEspecialidad,
    updateEspecialidad,
  } = useEspecialidades();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedEspecialidad, setSelectedEspecialidad] = useState<Especialidad | null>(null);
  
  // ESTADO DE PESTAÑAS
  const [activeTab, setActiveTab] = useState<'activos' | 'inactivos'>('activos');

  useEffect(() => {
    fetchEspecialidades();
  }, [fetchEspecialidades]);

  // FILTRADO DE DATOS SEGÚN PESTAÑA
  const filteredEspecialidades = especialidades.filter(e => 
    activeTab === 'activos' ? e.estatus === true : e.estatus === false
  );

  const handleNew = () => {
    setModalMode('create');
    setSelectedEspecialidad(null);
    setIsModalOpen(true);
  };

  const handleEdit = (especialidad: Especialidad) => {
    setModalMode('edit');
    setSelectedEspecialidad(especialidad);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEspecialidad(null);
  };

  const handleSubmit = async (data: any) => {
    if (modalMode === 'create') {
      return await createEspecialidad(data);
    } else if (selectedEspecialidad) {
      return await updateEspecialidad(selectedEspecialidad.claveespecialidad, data);
    }
    return false;
  };

  // Función unificada para cambiar estatus (Borrar o Reactivar)
  const handleToggleStatus = async (id: number, nuevoEstatus: boolean) => {
    await updateEspecialidad(id, { estatus: nuevoEstatus });
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0a1929]' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-[#0f83b2] to-[#0db1ec] rounded-xl shadow-lg">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Catálogo de Especialidades
              </h1>
              <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Gestión de especialidades médicas
              </p>
            </div>
          </div>

          {/* Botón Nuevo (Solo visible en pestaña Activos) */}
          {activeTab === 'activos' && (
            <button
              onClick={handleNew}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] text-white hover:shadow-lg hover:shadow-[#0db1ec]/30 transition-all"
            >
              <Plus className="h-4 w-4" /> Nueva Especialidad
            </button>
          )}
        </motion.div>

        {/* PESTAÑAS */}
        <div className="flex space-x-1 rounded-xl bg-gray-200 dark:bg-[#0d2137] p-1 w-fit">
          <button
            onClick={() => setActiveTab('activos')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'activos'
                ? 'bg-white dark:bg-[#0f83b2] text-[#0db1ec] dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Activos
          </button>
          <button
            onClick={() => setActiveTab('inactivos')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'inactivos'
                ? 'bg-white dark:bg-[#0f83b2] text-[#0db1ec] dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Inactivos
          </button>
        </div>

        {/* Card con la tabla */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-xl shadow-xl overflow-hidden ${
            isDark ? 'bg-[#0a1929] border border-[#0f83b2]/20' : 'bg-white'
          }`}
        >
          <div className="p-6">
            <TablaEspecialidades
              especialidades={filteredEspecialidades}
              loading={loading}
              onEdit={handleEdit}
              onToggleStatus={handleToggleStatus}
              onNew={handleNew}
              isDark={isDark}
              currentTab={activeTab}
            />
          </div>
        </motion.div>

        {/* Modal */}
        <ModalEspecialidad
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          especialidad={selectedEspecialidad}
          mode={modalMode}
          isDark={isDark}
        />
      </div>
    </div>
  );
}