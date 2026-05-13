// src/app/dashboard/catalogos/hospitales/page.tsx
'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { Plus, Search } from 'lucide-react';
import { useHospitales } from '@/hooks/catalogos/useHospitales';
import TablaHospitales from '@/components/catalogos/hospitales/TablaHospitales';
import FormHospital from '@/components/catalogos/hospitales/FormHospital'; // El de crear (viejo)
import FormEditarHospital from '@/components/catalogos/hospitales/FormEditarHospital'; // El de editar (NUEVO)
import { Hospital } from '@/types/catalogos/hospitales';

export default function HospitalesPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const { hospitales, loading, guardarHospital, eliminarHospital } = useHospitales();

  // Modos: 'tabla', 'crear', 'editar'
  const [modo, setModo] = useState<'tabla' | 'crear' | 'editar'>('tabla');
  const [hospitalSeleccionado, setHospitalSeleccionado] = useState<Hospital | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHospitales = hospitales.filter(h => 
    h.nombre_hospital.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.direccion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- ACCIONES ---

  const irACrear = () => {
    setHospitalSeleccionado(null);
    setModo('crear');
  };

  const irAEditar = (hospital: Hospital) => {
    setHospitalSeleccionado(hospital);
    setModo('editar');
  };

  const irATabla = () => {
    setHospitalSeleccionado(null);
    setModo('tabla');
  };

  const handleGuardar = async (data: Partial<Hospital>) => {
    const exito = await guardarHospital(data);
    if (exito) irATabla();
  };

  const handleDelete = (id: number) => {
    eliminarHospital(id, 'logico'); 
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Hospitales</h1>
          <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Gestión de centros médicos</p>
        </div>
        
        {modo === 'tabla' && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={irACrear}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0db1ec] hover:bg-[#0a8ec4] text-white rounded-lg font-medium transition-colors shadow-lg shadow-[#0db1ec]/20"
          >
            <Plus className="h-5 w-5" />
            Nuevo Hospital
          </motion.button>
        )}
      </div>

      {/* CONTENIDO DINÁMICO */}
      <div className="mt-6">
        
        {/* MODO CREAR */}
        {modo === 'crear' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <FormHospital 
              onSubmit={handleGuardar} 
              onCancel={irATabla} 
              loading={loading}
              isDark={isDark}
              initialData={null} // Aseguramos que esté vacío
            />
          </motion.div>
        )}

        {/* MODO EDITAR (NUEVO COMPONENTE) */}
        {modo === 'editar' && hospitalSeleccionado && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* LA CLAVE: key={id}. Si cambia el ID, React destruye y crea el componente de cero. */}
            <FormEditarHospital 
              key={hospitalSeleccionado.id_hospital} 
              hospital={hospitalSeleccionado}
              onSubmit={handleGuardar} 
              onCancel={irATabla} 
              loading={loading}
              isDark={isDark}
            />
          </motion.div>
        )}

        {/* MODO TABLA */}
        {modo === 'tabla' && (
          <div className="space-y-6">
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0a1929] border-[#0f83b2]/20' : 'bg-white border-gray-200'}`}>
                <div className="relative">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-lg border transition-colors ${isDark ? 'bg-[#0d2137] border-[#0f83b2]/30 text-white placeholder-gray-500 focus:border-[#0db1ec]' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#0db1ec]'} focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20`}
                    />
                </div>
            </div>

            <TablaHospitales 
              data={filteredHospitales} 
              onEdit={irAEditar} 
              onDelete={handleDelete} 
              isDark={isDark}
            />
          </div>
        )}
      </div>
    </div>
  );
}