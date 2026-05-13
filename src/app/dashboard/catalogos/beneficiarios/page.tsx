// src/app/dashboard/catalogos/beneficiarios/page.tsx

'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus } from 'lucide-react';
import Swal from 'sweetalert2';
import BuscadorEmpleado from '@/components/catalogos/beneficiarios/BuscadorEmpleado';
import CardEmpleado from '@/components/catalogos/beneficiarios/CardEmpleado';
import TablaBeneficiarios from '@/components/catalogos/beneficiarios/TablaBeneficiarios';
import ModalDetalleBeneficiario from '@/components/catalogos/beneficiarios/ModalDetalleBeneficiario';
import ModalBeneficiario from '@/components/catalogos/beneficiarios/ModalBeneficiario';
import { useEmpleado } from '@/hooks/catalogos/useEmpleado';
import { useBeneficiarios } from '@/hooks/catalogos/useBeneficiarios';
import type { Beneficiario } from '@/types/catalogos/beneficiarios';

export default function BeneficiariosPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const { empleado, loading, buscarEmpleado, limpiarEmpleado } = useEmpleado();
  const { beneficiarios, loading: loadingBeneficiarios, obtenerBeneficiarios } = useBeneficiarios();
  
  const [beneficiarioSeleccionado, setBeneficiarioSeleccionado] = useState<Beneficiario | null>(null);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [modalBeneficiarioOpen, setModalBeneficiarioOpen] = useState(false);
  const [beneficiarioEditar, setBeneficiarioEditar] = useState<Beneficiario | null>(null);

  const empleadoActivo = empleado?.activo === 'A';

  const handleBuscar = async (numNom: string) => {
    try {
      setModalBeneficiarioOpen(false);
      limpiarEmpleado();
      const emp = await buscarEmpleado(numNom);
      if (emp) {
        await obtenerBeneficiarios(numNom);
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Empleado no encontrado',
        text: err.message || 'El empleado no fue encontrado o está dado de baja. Favor de contactar a Recursos Humanos.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#0f83b2',
        background: isDark ? '#0a1929' : '#ffffff',
        color: isDark ? '#ffffff' : '#000000',
      });
    }
  };

  const handleVerDetalles = (beneficiario: Beneficiario) => {
    setBeneficiarioSeleccionado(beneficiario);
    setModalDetalleOpen(true);
  };

  const handleCerrarModalDetalle = () => {
    setModalDetalleOpen(false);
    setBeneficiarioSeleccionado(null);
  };

  const handleAbrirModalNuevo = () => {
    setBeneficiarioEditar(null);
    setModalBeneficiarioOpen(true);
  };

  const handleSuccessRegistro = async () => {
    setModalBeneficiarioOpen(false);
    setBeneficiarioEditar(null);
    if (empleado) {
      await obtenerBeneficiarios(empleado.num_nom);
    }
  };

  const handleCerrarModal = () => {
    setModalBeneficiarioOpen(false);
    setBeneficiarioEditar(null);
  };

  const handleEditar = async (beneficiario: Beneficiario) => {
    try {
      // Validar que el ID existe
      if (!beneficiario.ID_BENEFICIARIO) {
        throw new Error('ID de beneficiario no válido');
      }

      console.log('🔍 Editando beneficiario con ID:', beneficiario.ID_BENEFICIARIO);

      const response = await fetch(`/api/catalogos/beneficiarios/${beneficiario.ID_BENEFICIARIO}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'No se pudieron obtener los detalles del beneficiario.');
      }

      console.log('✅ Datos del beneficiario obtenidos:', data.data);
      setBeneficiarioEditar(data.data);
      setModalBeneficiarioOpen(true);

    } catch (error: any) {
      console.error('❌ Error al editar:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
        confirmButtonColor: '#0f83b2',
        background: isDark ? '#0a1929' : '#ffffff',
        color: isDark ? '#ffffff' : '#000000',
      });
    }
  };

  const handleEliminar = async (beneficiario: Beneficiario) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: '¿Está seguro?',
      text: `¿Desea marcar como inactivo a ${beneficiario.NOMBRE} ${beneficiario.A_PATERNO}?`,
      input: 'textarea',
      inputLabel: 'Motivo de la baja',
      inputPlaceholder: 'Ingrese el motivo...',
      inputValidator: (value) => {
        if (!value) {
          return 'Debe ingresar un motivo';
        }
        return null;
      },
      showCancelButton: true,
      confirmButtonText: 'Sí, dar de baja',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      background: isDark ? '#0a1929' : '#ffffff',
      color: isDark ? '#ffffff' : '#000000',
    });

    if (result.isConfirmed && result.value) {
      try {
        const response = await fetch(`/api/catalogos/beneficiarios/${beneficiario.ID_BENEFICIARIO}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ motivo: result.value }),
        });

        const data = await response.json();

        if (data.success) {
          await Swal.fire({
            icon: 'success',
            title: 'Beneficiario dado de baja',
            text: 'El beneficiario ha sido marcado como inactivo',
            confirmButtonColor: '#0f83b2',
            background: isDark ? '#0a1929' : '#ffffff',
            color: isDark ? '#ffffff' : '#000000',
          });
          
          if (empleado) {
            await obtenerBeneficiarios(empleado.num_nom);
          }
        } else {
          throw new Error(data.error);
        }
      } catch (error: any) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'No se pudo dar de baja al beneficiario',
          confirmButtonColor: '#0f83b2',
          background: isDark ? '#0a1929' : '#ffffff',
          color: isDark ? '#ffffff' : '#000000',
        });
      }
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="p-3 rounded-lg bg-gradient-to-br from-[#0f83b2] to-[#0db1ec]">
            <Users size={28} className="text-white" />
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Beneficiarios
            </h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Consulta de información de empleados y beneficiarios
            </p>
          </div>
        </motion.div>

        {/* Buscador */}
        <BuscadorEmpleado
          onBuscar={handleBuscar}
          loading={loading}
          isDark={isDark}
        />

        {/* Card del empleado */}
        {empleado && !loading && (
          <>
            <CardEmpleado empleado={empleado} isDark={isDark} />

            {/* Botón Registrar Beneficiario */}
            {empleadoActivo && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <button
                  onClick={handleAbrirModalNuevo}
                  className="w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 bg-gradient-to-r from-green-600 to-green-500 text-white hover:shadow-lg hover:shadow-green-500/30"
                >
                  <Plus size={24} />
                  Registrar Beneficiario
                </button>
              </motion.div>
            )}
          </>
        )}

        {/* Tabla de beneficiarios */}
        {empleado && !loadingBeneficiarios && (
          <TablaBeneficiarios
            beneficiarios={beneficiarios}
            isDark={isDark}
            onVerDetalles={handleVerDetalles}
            onEditar={handleEditar}
            onEliminar={handleEliminar}
          />
        )}

        {/* Loading de beneficiarios */}
        {loadingBeneficiarios && (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-[#0f83b2]/30 border-t-[#0db1ec] rounded-full animate-spin" />
          </div>
        )}

        {/* Mensaje inicial */}
        {!empleado && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-center py-12 rounded-xl border ${
              isDark
                ? 'bg-[#0a1929]/50 border-[#0f83b2]/20 text-gray-400'
                : 'bg-gray-50 border-gray-200 text-gray-600'
            }`}
          >
            <Users size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg">Ingrese un número de nómina para buscar</p>
          </motion.div>
        )}
      </div>

      {/* Modal de Detalles */}
      <ModalDetalleBeneficiario
        beneficiario={beneficiarioSeleccionado}
        isOpen={modalDetalleOpen}
        onClose={handleCerrarModalDetalle}
        isDark={isDark}
      />

      {/* Modal de Registro/Edición */}
      <ModalBeneficiario
        isOpen={modalBeneficiarioOpen}
        onClose={handleCerrarModal}
        onSuccess={handleSuccessRegistro}
        numNom={empleado?.num_nom || ''}
        beneficiario={beneficiarioEditar}
        isDark={isDark}
      />
    </div>
  );
}