// src/app/dashboard/farmacia/inventario/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Package, CheckCircle, AlertCircle } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useInventario } from '@/hooks/farmacia/useInventario';
import TablaInventario from '@/components/farmacia/inventario/TablaInventario';
import ModalEditarInventario from '@/components/farmacia/inventario/ModalEditarInventario';
import type { InventarioMedicamento, FiltrosInventario } from '@/types/farmacia/medicamentos';
import Swal from 'sweetalert2';

export default function InventarioPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const {
    inventario,
    loading,
    error,
    obtenerInventario,
    actualizarInventario,
  } = useInventario();

  const [modalOpen, setModalOpen] = useState(false);
  const [inventarioEditar, setInventarioEditar] = useState<InventarioMedicamento | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCuadroBasico, setFiltroCuadroBasico] = useState<boolean | undefined>(undefined);
  const [filtroEstadoFondo, setFiltroEstadoFondo] = useState<'completo' | 'requiere_reposicion' | ''>('');

  useEffect(() => {
    cargarInventario();
  }, []);

  const cargarInventario = async () => {
    try {
      const filtros: FiltrosInventario = {
        busqueda: busqueda || undefined,
        cuadro_basico: filtroCuadroBasico,
        estado_fondo: filtroEstadoFondo || undefined,
      };
      await obtenerInventario(filtros);
    } catch (err) {
      console.error('Error al cargar inventario:', err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarInventario();
    }, 300);
    return () => clearTimeout(timer);
  }, [busqueda, filtroCuadroBasico, filtroEstadoFondo]);

  const handleEditar = (item: InventarioMedicamento) => {
    setInventarioEditar(item);
    setModalOpen(true);
  };

  const handleGuardar = async (data: any) => {
    if (!inventarioEditar) return;

    try {
      await actualizarInventario(inventarioEditar.id_inventario, data);
      setModalOpen(false);
      setInventarioEditar(null);
      await cargarInventario();
      Swal.fire({
        icon: 'success',
        title: 'Inventario actualizado',
        text: 'Los cambios se guardaron correctamente',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f9fafb' : '#111827',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Ocurrió un error al actualizar el inventario',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f9fafb' : '#111827',
      });
    }
  };

  // Cálculos de estadísticas con el nuevo modelo de fondo fijo
  const totalMedicamentos = inventario.length;
  const fondosCompletos = inventario.filter(i => i.existencia_actual >= i.fondo_fijo).length;
  const requierenReposicion = inventario.filter(i => i.existencia_actual < i.fondo_fijo).length;
  const cuadroBasico = inventario.filter(i => i.es_cuadro_basico).length;

  const stats = [
    {
      label: 'Total Medicamentos',
      value: totalMedicamentos,
      icon: Package,
      color: 'bg-blue-500',
      bgColor: isDark ? 'bg-blue-900/20' : 'bg-blue-50',
      textColor: isDark ? 'text-blue-400' : 'text-blue-600',
    },
    {
      label: 'Fondos Completos',
      value: fondosCompletos,
      icon: CheckCircle,
      color: 'bg-green-500',
      bgColor: isDark ? 'bg-green-900/20' : 'bg-green-50',
      textColor: isDark ? 'text-green-400' : 'text-green-600',
    },
    {
      label: 'Requieren Reposición',
      value: requierenReposicion,
      icon: AlertCircle,
      color: 'bg-red-500',
      bgColor: isDark ? 'bg-red-900/20' : 'bg-red-50',
      textColor: isDark ? 'text-red-400' : 'text-red-600',
    },
    {
      label: 'Cuadro Básico',
      value: cuadroBasico,
      icon: Package,
      color: 'bg-purple-500',
      bgColor: isDark ? 'bg-purple-900/20' : 'bg-purple-50',
      textColor: isDark ? 'text-purple-400' : 'text-purple-600',
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Inventario de Medicamentos
          </h1>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Control y gestión de fondo fijo de medicamentos
          </p>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${stat.bgColor} rounded-xl p-6 shadow-lg`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {stat.label}
                </p>
                <p className={`text-2xl font-bold mt-2 ${stat.textColor}`}>
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-xl`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`rounded-xl shadow-lg p-6 ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              placeholder="Buscar medicamento..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-colors ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-[#0db1ec]'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-[#0db1ec]'
              } focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20`}
            />
          </div>

          {/* Filtro de Cuadro Básico */}
          <select
            value={filtroCuadroBasico === undefined ? '' : filtroCuadroBasico.toString()}
            onChange={(e) => setFiltroCuadroBasico(e.target.value === '' ? undefined : e.target.value === 'true')}
            className={`px-4 py-3 rounded-xl border transition-colors ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white focus:border-[#0db1ec]'
                : 'bg-white border-gray-300 text-gray-900 focus:border-[#0db1ec]'
            } focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20`}
          >
            <option value="">Todos </option>
            <option value="true">Solo Cuadro Básico</option>
            <option value="false">No Cuadro Básico</option>
          </select>

          {/* Filtro de Estado del Fondo */}
          <select
            value={filtroEstadoFondo}
            onChange={(e) => setFiltroEstadoFondo(e.target.value as '' | 'completo' | 'requiere_reposicion')}
            className={`px-4 py-3 rounded-xl border transition-colors ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white focus:border-[#0db1ec]'
                : 'bg-white border-gray-300 text-gray-900 focus:border-[#0db1ec]'
            } focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20`}
          >
            <option value="">Todos los estados</option>
            <option value="completo">Fondo Completo</option>
            <option value="requiere_reposicion">Requiere Reposición</option>
          </select>
        </div>
      </motion.div>

      {/* Tabla */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <TablaInventario
          inventario={inventario}
          onEdit={handleEditar}
          loading={loading}
        />
      </motion.div>

      {/* Modal */}
      {inventarioEditar && (
        <ModalEditarInventario
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setInventarioEditar(null);
          }}
          onSave={handleGuardar}
          inventario={inventarioEditar}
        />
      )}
    </div>
  );
}
