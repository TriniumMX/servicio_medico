// src/components/catalogos/hospitales/CRUDHospitales.tsx

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Building2, X, Check, Loader2, Search, CheckCircle2 } from 'lucide-react';
import Swal from 'sweetalert2';
import type { Hospital } from '@/types/catalogos/hospitales';

interface CRUDHospitalesProps {
  isDark: boolean;
}

export default function CRUDHospitales({ isDark }: CRUDHospitalesProps) {
  const [hospitales, setHospitales] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [hospitalEditando, setHospitalEditando] = useState<Hospital | null>(null);
  const [busqueda, setBusqueda] = useState('');

  // Form state
  const [nombreHospital, setNombreHospital] = useState('');
  const [activo, setActivo] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarHospitales();
  }, []);

  const cargarHospitales = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/hospitales');
      const data = await response.json();

      if (data.success) {
        setHospitales(data.hospitales);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error al cargar hospitales:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al cargar',
        text: 'No se pudieron cargar los hospitales',
        confirmButtonColor: '#0f83b2',
        background: isDark ? '#0a1929' : '#ffffff',
        color: isDark ? '#ffffff' : '#000000',
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirModalCrear = () => {
    setModoEdicion(false);
    setHospitalEditando(null);
    setNombreHospital('');
    setActivo(true);
    setModalAbierto(true);
  };

  const abrirModalEditar = (hospital: Hospital) => {
    setModoEdicion(true);
    setHospitalEditando(hospital);
    setNombreHospital(hospital.nombre_hospital);
    setActivo(hospital.activo);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setModoEdicion(false);
    setHospitalEditando(null);
    setNombreHospital('');
    setActivo(true);
  };

  const guardarHospital = async () => {
    if (!nombreHospital.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'Por favor ingrese el nombre del hospital',
        confirmButtonColor: '#0f83b2',
        background: isDark ? '#0a1929' : '#ffffff',
        color: isDark ? '#ffffff' : '#000000',
      });
      return;
    }

    setGuardando(true);
    try {
      const url = modoEdicion ? '/api/hospitales/actualizar' : '/api/hospitales/crear';
      const method = modoEdicion ? 'PUT' : 'POST';

      const body = modoEdicion
        ? {
            id_hospital: hospitalEditando?.id_hospital,
            nombre_hospital: nombreHospital.trim(),
            activo,
          }
        : {
            nombre_hospital: nombreHospital.trim(),
            activo,
          };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: modoEdicion ? '¡Actualizado!' : '¡Creado!',
          text: data.message,
          confirmButtonColor: '#0f83b2',
          background: isDark ? '#0a1929' : '#ffffff',
          color: isDark ? '#ffffff' : '#000000',
          timer: 2000,
          showConfirmButton: false,
        });
        cerrarModal();
        cargarHospitales();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error al guardar hospital:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: error.message || 'No se pudo guardar el hospital',
        confirmButtonColor: '#0f83b2',
        background: isDark ? '#0a1929' : '#ffffff',
        color: isDark ? '#ffffff' : '#000000',
      });
    } finally {
      setGuardando(false);
    }
  };

  const eliminarHospital = async (hospital: Hospital) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: '¿Eliminar hospital?',
      html: `¿Está seguro de eliminar <strong>${hospital.nombre_hospital}</strong>?<br/><span style="color: #ef4444; font-size: 0.875rem;">Esta acción no se puede deshacer</span>`,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      background: isDark ? '#0a1929' : '#ffffff',
      color: isDark ? '#ffffff' : '#000000',
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/api/hospitales/eliminar?id=${hospital.id_hospital}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: '¡Eliminado!',
          text: 'Hospital eliminado exitosamente',
          confirmButtonColor: '#0f83b2',
          background: isDark ? '#0a1929' : '#ffffff',
          color: isDark ? '#ffffff' : '#000000',
          timer: 2000,
          showConfirmButton: false,
        });
        cargarHospitales();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error al eliminar hospital:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al eliminar',
        text: 'No se pudo eliminar el hospital',
        confirmButtonColor: '#0f83b2',
        background: isDark ? '#0a1929' : '#ffffff',
        color: isDark ? '#ffffff' : '#000000',
      });
    }
  };

  // Filtrar hospitales por búsqueda
  const hospitalesFiltrados = hospitales.filter((hospital) =>
    hospital.nombre_hospital.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Contar hospitales activos
  const hospitalesActivos = hospitales.filter(h => h.activo).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`rounded-2xl border-2 p-6 ${
        isDark
          ? 'bg-gradient-to-br from-[#0d1f2d] to-[#0a1929] border-[#0f83b2]/20'
          : 'bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-md'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${isDark ? 'bg-[#0f83b2]/20' : 'bg-blue-100'}`}>
              <Building2 size={32} className={isDark ? 'text-[#0db1ec]' : 'text-[#0f83b2]'} />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Gestión de Hospitales
              </h1>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Catálogo de instituciones médicas
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  isDark ? 'bg-[#0f83b2]/20 text-[#0db1ec]' : 'bg-blue-100 text-blue-700'
                }`}>
                  {hospitales.length} Total
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-500">
                  {hospitalesActivos} Activos
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={abrirModalCrear}
            className="px-6 py-3 bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] text-white rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus size={20} />
            Nuevo Hospital
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className={`rounded-xl border-2 p-4 ${
        isDark ? 'bg-[#0d1f2d] border-[#0f83b2]/20' : 'bg-white border-gray-200 shadow-sm'
      }`}>
        <div className="relative">
          <Search
            size={20}
            className={`absolute left-3 top-1/2 -translate-y-1/2 ${
              isDark ? 'text-[#0db1ec]' : 'text-[#0f83b2]'
            }`}
          />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar hospital por nombre..."
            className={`w-full pl-11 pr-4 py-3 rounded-lg border-2 outline-none transition-colors font-medium ${
              isDark
                ? 'bg-[#0a1929] border-[#0f83b2]/30 text-white placeholder-gray-500 focus:border-[#0db1ec]'
                : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#0f83b2]'
            }`}
          />
        </div>
      </div>

      {/* Cards de hospitales */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 size={48} className="animate-spin text-[#0db1ec] mx-auto mb-3" />
            <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Cargando hospitales...
            </p>
          </div>
        </div>
      ) : hospitalesFiltrados.length === 0 ? (
        <div className={`text-center py-16 rounded-xl border-2 border-dashed ${
          isDark ? 'border-gray-700 bg-[#0d1f2d]' : 'border-gray-300 bg-gray-50'
        }`}>
          <Building2
            size={56}
            className={`mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}
          />
          <h3 className={`text-xl font-bold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {busqueda ? 'No se encontraron hospitales' : 'No hay hospitales registrados'}
          </h3>
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            {busqueda ? 'Intenta con otro término de búsqueda' : 'Comienza agregando un nuevo hospital'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hospitalesFiltrados.map((hospital) => (
            <div
              key={hospital.id_hospital}
              className={`rounded-xl border-2 overflow-hidden transition-all hover:shadow-lg ${
                isDark
                  ? 'bg-[#0d1f2d] border-[#0f83b2]/20 hover:border-[#0db1ec]/50'
                  : 'bg-white border-gray-200 hover:border-[#0f83b2]/50 shadow-sm'
              }`}
            >
              {/* Header del card */}
              <div className={`p-4 ${
                isDark
                  ? 'bg-gradient-to-br from-[#0f83b2]/10 to-transparent'
                  : 'bg-gradient-to-br from-[#0f83b2]/5 to-transparent'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${
                    isDark ? 'bg-[#0f83b2]/20' : 'bg-white shadow-sm'
                  }`}>
                    <Building2 size={24} className={isDark ? 'text-[#0db1ec]' : 'text-[#0f83b2]'} />
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                      hospital.activo
                        ? 'bg-emerald-500/20 text-emerald-500'
                        : 'bg-red-500/20 text-red-500'
                    }`}
                  >
                    {hospital.activo ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                </div>

                <h3 className={`text-lg font-bold mb-2 line-clamp-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {hospital.nombre_hospital}
                </h3>

                <div className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  ID: {hospital.id_hospital}
                </div>
              </div>

              {/* Footer del card con acciones */}
              <div className={`p-3 flex items-center gap-2 ${
                isDark ? 'bg-[#0a1929]' : 'bg-gray-50'
              }`}>
                <button
                  onClick={() => abrirModalEditar(hospital)}
                  className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 text-sm"
                  title="Editar hospital"
                >
                  <Edit2 size={16} />
                  Editar
                </button>
                <button
                  onClick={() => eliminarHospital(hospital)}
                  className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 text-sm"
                  title="Eliminar hospital"
                >
                  <Trash2 size={16} />
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modalAbierto && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={cerrarModal}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Modal Content */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={`w-full max-w-lg rounded-2xl border-2 overflow-hidden shadow-2xl ${
                  isDark ? 'bg-[#0d1f2d] border-[#0f83b2]/20' : 'bg-white border-gray-200'
                }`}
              >
                {/* Header del modal */}
                <div className={`p-5 border-b ${
                  isDark ? 'bg-[#0a1929] border-[#0f83b2]/20' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-[#0f83b2]/20' : 'bg-blue-100'}`}>
                        <Building2 size={24} className={isDark ? 'text-[#0db1ec]' : 'text-[#0f83b2]'} />
                      </div>
                      <div>
                        <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {modoEdicion ? 'Editar Hospital' : 'Nuevo Hospital'}
                        </h3>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {modoEdicion ? 'Actualiza la información' : 'Completa los datos'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={cerrarModal}
                      className={`p-2 rounded-lg transition-colors ${
                        isDark ? 'hover:bg-[#0f83b2]/10' : 'hover:bg-gray-200'
                      }`}
                    >
                      <X size={20} className={isDark ? 'text-gray-400' : 'text-gray-600'} />
                    </button>
                  </div>
                </div>

                {/* Form */}
                <div className="p-5 space-y-4">
                  <div>
                    <label
                      className={`block text-sm font-bold mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      Nombre del Hospital
                    </label>
                    <input
                      type="text"
                      value={nombreHospital}
                      onChange={(e) => setNombreHospital(e.target.value)}
                      placeholder="Ej: Hospital General Regional"
                      className={`w-full px-4 py-3 rounded-lg border-2 outline-none transition-colors font-medium ${
                        isDark
                          ? 'bg-[#0a1929] border-[#0f83b2]/30 text-white placeholder-gray-500 focus:border-[#0db1ec]'
                          : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#0f83b2]'
                      }`}
                      autoFocus
                    />
                  </div>

                  <div className={`p-3 rounded-lg border-2 ${
                    isDark ? 'bg-[#0a1929] border-[#0f83b2]/20' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={activo}
                          onChange={(e) => setActivo(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className={`w-12 h-6 rounded-full transition-colors ${
                          activo ? 'bg-emerald-500' : 'bg-gray-400'
                        }`}></div>
                        <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          activo ? 'translate-x-6' : 'translate-x-0'
                        }`}></div>
                      </div>
                      <div>
                        <span className={`text-sm font-bold block ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Hospital activo
                        </span>
                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          {activo ? 'Visible en el sistema' : 'Oculto del sistema'}
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Buttons */}
                <div className={`p-5 flex gap-3 border-t ${
                  isDark ? 'bg-[#0a1929] border-[#0f83b2]/20' : 'bg-gray-50 border-gray-200'
                }`}>
                  <button
                    onClick={cerrarModal}
                    disabled={guardando}
                    className={`flex-1 px-4 py-2.5 rounded-lg font-bold transition-opacity ${
                      isDark
                        ? 'bg-gray-700 hover:opacity-90 text-white'
                        : 'bg-gray-200 hover:opacity-90 text-gray-900'
                    } disabled:opacity-50`}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={guardarHospital}
                    disabled={guardando}
                    className="flex-1 px-4 py-2.5 rounded-lg font-bold text-white bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {guardando ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        {modoEdicion ? 'Actualizar' : 'Crear Hospital'}
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
