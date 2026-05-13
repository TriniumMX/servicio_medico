// src/app/dashboard/farmacia/unidades-medida/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { Ruler, Plus, Search } from 'lucide-react';
import { useUnidadesMedida } from '@/hooks/farmacia/useUnidadesMedida';
import TablaUnidadesMedida from '@/components/farmacia/unidades-medida/TablaUnidadesMedida';
import ModalUnidadMedida from '@/components/farmacia/unidades-medida/ModalUnidadMedida';
import type { UnidadMedida } from '@/types/farmacia/unidades-medida';
import Swal from 'sweetalert2';

export default function UnidadesMedidaPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const {
    unidades,
    loading,
    obtenerUnidades,
    crearUnidad,
    actualizarUnidad,
    eliminarUnidad,
  } = useUnidadesMedida();

  const [modalOpen, setModalOpen] = useState(false);
  const [unidadEditar, setUnidadEditar] = useState<UnidadMedida | null>(null);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    obtenerUnidades();
  }, [obtenerUnidades]);

  const handleNuevo = () => {
    setUnidadEditar(null);
    setModalOpen(true);
  };

  const handleEditar = (unidad: UnidadMedida) => {
    setUnidadEditar(unidad);
    setModalOpen(true);
  };

  const handleSubmit = async (formData: any) => {
    if (unidadEditar) {
      await actualizarUnidad(unidadEditar.id_medida, formData);
      await Swal.fire({
        icon: 'success',
        title: 'Actualizado',
        text: 'Unidad de medida actualizada exitosamente',
        confirmButtonColor: '#0f83b2',
        background: isDark ? '#0a1929' : '#ffffff',
        color: isDark ? '#ffffff' : '#000000',
      });
    } else {
      await crearUnidad(formData);
      await Swal.fire({
        icon: 'success',
        title: 'Creado',
        text: 'Unidad de medida creada exitosamente',
        confirmButtonColor: '#0f83b2',
        background: isDark ? '#0a1929' : '#ffffff',
        color: isDark ? '#ffffff' : '#000000',
      });
    }
  };

  const handleEliminar = async (unidad: UnidadMedida) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: '¿Estás seguro?',
      html: `
        <p>¿Deseas eliminar la unidad de medida <strong>"${unidad.medida}"</strong>?</p>
        <p class="text-sm text-gray-500 mt-2">Esta acción no se puede deshacer.</p>
      `,
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: isDark ? '#0a1929' : '#ffffff',
      color: isDark ? '#ffffff' : '#000000',
    });

    if (result.isConfirmed) {
      try {
        await eliminarUnidad(unidad.id_medida);
        await Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'Unidad de medida eliminada exitosamente',
          confirmButtonColor: '#0f83b2',
          background: isDark ? '#0a1929' : '#ffffff',
          color: isDark ? '#ffffff' : '#000000',
        });
      } catch (error: any) {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'No se pudo eliminar la unidad de medida',
          confirmButtonColor: '#0f83b2',
          background: isDark ? '#0a1929' : '#ffffff',
          color: isDark ? '#ffffff' : '#000000',
        });
      }
    }
  };

  // Filtrar unidades por búsqueda
  const unidadesFiltradas = unidades.filter(
    (unidad) =>
      unidad.medida.toLowerCase().includes(busqueda.toLowerCase()) ||
      unidad.abreviatura.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-[#0a1929]' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-6 ${
            isDark
              ? 'bg-gradient-to-br from-[#0d1f2d] to-[#0a1929] border border-[#0f83b2]/20'
              : 'bg-white border border-gray-200'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-[#0f83b2] to-[#0db1ec] rounded-xl">
                <Ruler size={32} className="text-white" />
              </div>
              <div>
                <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Unidades de Medida
                </h1>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Gestión de unidades de medida para medicamentos
                </p>
              </div>
            </div>

            <button
              onClick={handleNuevo}
              className="px-6 py-3 bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] text-white rounded-xl font-bold hover:shadow-xl transition-all flex items-center gap-2"
            >
              <Plus size={20} />
              Nueva Unidad
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className={`p-6 rounded-2xl ${
            isDark
              ? 'bg-gradient-to-br from-[#0d1f2d] to-[#0a1929] border border-[#0f83b2]/20'
              : 'bg-white border border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Unidades
                </p>
                <p className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {unidades.length}
                </p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Ruler size={32} className="text-blue-500" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Búsqueda */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-2xl p-6 ${
            isDark
              ? 'bg-gradient-to-br from-[#0d1f2d] to-[#0a1929] border border-[#0f83b2]/20'
              : 'bg-white border border-gray-200'
          }`}
        >
          <div className="relative">
            <Search
              size={20}
              className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}
            />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o abreviatura..."
              className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 outline-none transition-all ${
                isDark
                  ? 'bg-[#0a1929] border-[#0f83b2]/30 text-white placeholder-gray-500 focus:border-[#0db1ec]'
                  : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#0f83b2]'
              }`}
            />
          </div>
        </motion.div>

        {/* Tabla */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-[#0f83b2]/20 rounded-full"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-[#0db1ec] border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
          ) : (
            <TablaUnidadesMedida
              unidades={unidadesFiltradas}
              onEditar={handleEditar}
              onEliminar={handleEliminar}
              isDark={isDark}
            />
          )}
        </motion.div>
      </div>

      {/* Modal */}
      <ModalUnidadMedida
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setUnidadEditar(null);
        }}
        onSubmit={handleSubmit}
        unidadEditar={unidadEditar}
        isDark={isDark}
      />
    </div>
  );
}
