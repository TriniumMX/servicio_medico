// src/app/dashboard/farmacia/medicamentos/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Pill, DollarSign, Package, AlertCircle, ScanBarcode } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useMedicamentos } from '@/hooks/farmacia/useMedicamentos';
import ModalMedicamento from '@/components/farmacia/medicamentos/ModalMedicamento';
import TablaMedicamentos from '@/components/farmacia/medicamentos/TablaMedicamentos';
import type { Medicamento } from '@/types/farmacia/medicamentos';
import Swal from 'sweetalert2';

export default function MedicamentosPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const {
    medicamentos,
    loading,
    error,
    obtenerMedicamentos,
    crearMedicamento,
    actualizarMedicamento,
    desactivarMedicamento,
  } = useMedicamentos();

  const [modalOpen, setModalOpen] = useState(false);
  const [medicamentoEditar, setMedicamentoEditar] = useState<Medicamento | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroActivos, setFiltroActivos] = useState<boolean | undefined>(undefined);
  const [filtroClasificacion, setFiltroClasificacion] = useState<string>('');
  const [filtroSinEan, setFiltroSinEan] = useState(false);

  useEffect(() => {
    cargarMedicamentos();
  }, []);

  const cargarMedicamentos = async () => {
    try {
      await obtenerMedicamentos({
        busqueda: busqueda || undefined,
        activos: filtroActivos,
        clasificacion: filtroClasificacion || undefined,
        sinEan: filtroSinEan || undefined,
      });
    } catch (err) {
      console.error('Error al cargar medicamentos:', err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarMedicamentos();
    }, 300);
    return () => clearTimeout(timer);
  }, [busqueda, filtroActivos, filtroClasificacion, filtroSinEan]);

  const handleCrear = () => {
    setMedicamentoEditar(null);
    setModalOpen(true);
  };

  const handleEditar = (medicamento: Medicamento) => {
    setMedicamentoEditar(medicamento);
    setModalOpen(true);
  };

  const handleGuardar = async (data: any) => {
    try {
      if (medicamentoEditar) {
        await actualizarMedicamento(medicamentoEditar.id_medicamento, data);
        Swal.fire({
          icon: 'success',
          title: 'Medicamento actualizado',
          text: 'El medicamento se actualizó correctamente',
          background: isDark ? '#1f2937' : '#ffffff',
          color: isDark ? '#f9fafb' : '#111827',
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        await crearMedicamento(data);
        Swal.fire({
          icon: 'success',
          title: 'Medicamento creado',
          text: 'El medicamento se creó correctamente',
          background: isDark ? '#1f2937' : '#ffffff',
          color: isDark ? '#f9fafb' : '#111827',
          timer: 2000,
          showConfirmButton: false,
        });
      }
      setModalOpen(false);
      setMedicamentoEditar(null);
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Ocurrió un error al guardar el medicamento',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f9fafb' : '#111827',
      });
    }
  };

  const handleDesactivar = async (id: number) => {
    try {
      await desactivarMedicamento(id);
      Swal.fire({
        icon: 'success',
        title: 'Medicamento desactivado',
        text: 'El medicamento se desactivó correctamente',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f9fafb' : '#111827',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Ocurrió un error al desactivar el medicamento',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f9fafb' : '#111827',
      });
    }
  };

  // Estadísticas
  const totalMedicamentos = medicamentos.length;
  const medicamentosActivos = medicamentos.filter(m => m.activo).length;
  const medicamentosInactivos = totalMedicamentos - medicamentosActivos;
  const medicamentosSinEan = medicamentos.filter(m => !m.codigo_ean).length;
  const promedioPrecios = medicamentos.length > 0
    ? (medicamentos.reduce((sum, m) => sum + parseFloat(m.precio_unitario), 0) / medicamentos.length).toFixed(2)
    : '0.00';

  const stats = [
    {
      label: 'Total Medicamentos',
      value: totalMedicamentos,
      icon: Pill,
      color: 'bg-blue-500',
      bgColor: isDark ? 'bg-blue-900/20' : 'bg-blue-50',
      textColor: isDark ? 'text-blue-400' : 'text-blue-600',
    },
    {
      label: 'Medicamentos Activos',
      value: medicamentosActivos,
      icon: Package,
      color: 'bg-green-500',
      bgColor: isDark ? 'bg-green-900/20' : 'bg-green-50',
      textColor: isDark ? 'text-green-400' : 'text-green-600',
    },
    {
      label: 'Medicamentos Inactivos',
      value: medicamentosInactivos,
      icon: AlertCircle,
      color: 'bg-red-500',
      bgColor: isDark ? 'bg-red-900/20' : 'bg-red-50',
      textColor: isDark ? 'text-red-400' : 'text-red-600',
    },
    {
      label: 'Precio Promedio',
      value: `$${promedioPrecios}`,
      icon: DollarSign,
      color: 'bg-purple-500',
      bgColor: isDark ? 'bg-purple-900/20' : 'bg-purple-50',
      textColor: isDark ? 'text-purple-400' : 'text-purple-600',
    },
    {
      label: 'Sin Código EAN',
      value: medicamentosSinEan,
      icon: ScanBarcode,
      color: 'bg-orange-500',
      bgColor: isDark ? 'bg-orange-900/20' : 'bg-orange-50',
      textColor: isDark ? 'text-orange-400' : 'text-orange-600',
      onClick: () => setFiltroSinEan(!filtroSinEan),
      active: filtroSinEan,
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
            Medicamentos
          </h1>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Gestión del catálogo de medicamentos
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCrear}
          className="flex items-center gap-2 px-6 py-3 bg-[#0db1ec] text-white rounded-xl hover:bg-[#0c9dd4] transition-colors shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Nuevo Medicamento
        </motion.button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={stat.onClick}
            className={`${stat.bgColor} rounded-xl p-6 shadow-lg transition-all ${
              stat.onClick ? 'cursor-pointer hover:scale-[1.02]' : ''
            } ${stat.active ? 'ring-2 ring-orange-400' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {stat.label}
                </p>
                <p className={`text-2xl font-bold mt-2 ${stat.textColor}`}>
                  {stat.value}
                </p>
                {stat.active && (
                  <p className="text-xs mt-1 text-orange-500 font-medium">Filtro activo</p>
                )}
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          {/* Filtro de Estado */}
          <select
            value={filtroActivos === undefined ? '' : filtroActivos.toString()}
            onChange={(e) => setFiltroActivos(e.target.value === '' ? undefined : e.target.value === 'true')}
            className={`px-4 py-3 rounded-xl border transition-colors ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white focus:border-[#0db1ec]'
                : 'bg-white border-gray-300 text-gray-900 focus:border-[#0db1ec]'
            } focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20`}
          >
            <option value="">Todos los estados</option>
            <option value="true">Solo activos</option>
            <option value="false">Solo inactivos</option>
          </select>

          {/* Filtro de Clasificación */}
          <select
            value={filtroClasificacion}
            onChange={(e) => setFiltroClasificacion(e.target.value)}
            className={`px-4 py-3 rounded-xl border transition-colors ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white focus:border-[#0db1ec]'
                : 'bg-white border-gray-300 text-gray-900 focus:border-[#0db1ec]'
            } focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20`}
          >
            <option value="">Todas las clasificaciones</option>
            <option value="PATENTE">Patente</option>
            <option value="GENERICO">Genérico</option>
            <option value="CONTROLADO">Controlado</option>
          </select>

          {/* Filtro Sin EAN */}
          <button
            onClick={() => setFiltroSinEan(!filtroSinEan)}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all font-medium ${
              filtroSinEan
                ? 'bg-orange-500 border-orange-500 text-white'
                : isDark
                  ? 'bg-gray-700 border-gray-600 text-gray-300 hover:border-orange-400 hover:text-orange-400'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-orange-400 hover:text-orange-500'
            }`}
          >
            <ScanBarcode className="w-4 h-4" />
            Sin código EAN
          </button>
        </div>
      </motion.div>

      {/* Tabla */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <TablaMedicamentos
          medicamentos={medicamentos}
          onEdit={handleEditar}
          onDelete={handleDesactivar}
          loading={loading}
        />
      </motion.div>

      {/* Modal */}
      <ModalMedicamento
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setMedicamentoEditar(null);
        }}
        onSave={handleGuardar}
        medicamento={medicamentoEditar}
      />
    </div>
  );
}
