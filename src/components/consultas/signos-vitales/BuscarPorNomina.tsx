// src/components/consultas/signos-vitales/BuscarPorNomina.tsx

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  X,
  User,
  UserCircle,
  Users,
  Save,
  Activity,
  Heart,
  Thermometer,
  Wind,
  Ruler,
  Weight,
  Droplet,
  Building2,
  Briefcase,
  Calendar,
  Hash,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { useEmpleado } from '@/hooks/catalogos/useEmpleado';
import type { Beneficiario } from '@/types/catalogos/beneficiarios';
import Swal from 'sweetalert2';

interface BuscarPorNominaProps {
  onCerrar: () => void;
  isDark: boolean;
  onSuccess?: () => void;
  referenciaId?: number | null;
  nominaInicial?: string;
  beneficiarioId?: number | null;
  tipoPacienteInicial?: 'empleado' | 'beneficiario' | null;
}

interface SignosVitales {
  ta_sistolica: string;
  ta_diastolica: string;
  temperatura: string;
  frecuencia: string;
  oxigenacion: string;
  altura: string;
  peso: string;
  glucosa: string;
}

export default function BuscarPorNomina({ onCerrar, isDark, onSuccess, referenciaId, nominaInicial, beneficiarioId, tipoPacienteInicial }: BuscarPorNominaProps) {
  const [numNomina, setNumNomina] = useState(nominaInicial || '');
  const { empleado, loading, buscarEmpleado } = useEmpleado();

  const [tipoPaciente, setTipoPaciente] = useState<'empleado' | 'beneficiario' | null>(tipoPacienteInicial || null);
  const [guardando, setGuardando] = useState(false);

  // Estados para beneficiarios
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([]);
  const [beneficiarioSeleccionado, setBeneficiarioSeleccionado] = useState<Beneficiario | null>(null);
  const [loadingBeneficiarios, setLoadingBeneficiarios] = useState(false);

  const [signosVitales, setSignosVitales] = useState<SignosVitales>({
    ta_sistolica: '',
    ta_diastolica: '',
    temperatura: '',
    frecuencia: '',
    oxigenacion: '',
    altura: '',
    peso: '',
    glucosa: '',
  });

  // Auto-buscar si viene nominaInicial
  useEffect(() => {
    if (nominaInicial && !empleado) {
      buscarEmpleado(nominaInicial).catch(console.error);
    }
  }, [nominaInicial]);

  // Auto-seleccionar beneficiario si viene beneficiarioId
  useEffect(() => {
    if (empleado && beneficiarioId && empleado.beneficiarios) {
      const targetBeneficiario = empleado.beneficiarios.find((b: Beneficiario) => b.ID_BENEFICIARIO === beneficiarioId);
      if (targetBeneficiario) {
        setTipoPaciente('beneficiario');
        setBeneficiarioSeleccionado(targetBeneficiario);
      }
    }
  }, [empleado, beneficiarioId]);

  const calcularEdad = (fechaNacimiento: string) => {
    if (!fechaNacimiento) return 'Edad no disponible';

    let nacimiento: Date;

    // Verificar si la fecha viene en formato DD/MM/YYYY o YYYY-MM-DD
    if (fechaNacimiento.includes('/')) {
      // Formato DD/MM/YYYY
      const partes = fechaNacimiento.split(' ')[0].split('/');
      const dia = parseInt(partes[0]);
      const mes = parseInt(partes[1]) - 1;
      const año = parseInt(partes[2]);
      nacimiento = new Date(año, mes, dia);
    } else {
      // Formato ISO YYYY-MM-DD o Date string
      nacimiento = new Date(fechaNacimiento);
    }

    // Validar que la fecha sea válida
    if (isNaN(nacimiento.getTime())) {
      return 'Fecha inválida';
    }

    const hoy = new Date();
    let años = hoy.getFullYear() - nacimiento.getFullYear();
    let meses = hoy.getMonth() - nacimiento.getMonth();
    let días = hoy.getDate() - nacimiento.getDate();

    if (días < 0) {
      meses--;
      const ultimoDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
      días += ultimoDiaMesAnterior;
    }

    if (meses < 0) {
      años--;
      meses += 12;
    }

    return `${años} años, ${meses} meses, ${días} días`;
  };

  const getNombreCompleto = () => {
    if (!empleado) return '';
    return `${empleado.nombre || ''} ${empleado.a_paterno || ''} ${empleado.a_materno || ''}`.trim();
  };

  const getNombreCompletoBeneficiario = (benef: Beneficiario) => {
    return `${benef.NOMBRE || ''} ${benef.A_PATERNO || ''} ${benef.A_MATERNO || ''}`.trim();
  };

  // Cargar beneficiarios cuando selecciona "beneficiario"
  useEffect(() => {
    const cargarBeneficiarios = async () => {
      if (tipoPaciente === 'beneficiario' && empleado?.num_nom) {
        setLoadingBeneficiarios(true);
        try {
          const response = await fetch(`/api/beneficiarios/por-nomina/${empleado.num_nom}`);
          const data = await response.json();

          if (data.success) {
            setBeneficiarios(data.beneficiarios || []);
            if (data.beneficiarios.length === 0) {
              Swal.fire({
                icon: 'info',
                title: 'Sin beneficiarios',
                text: 'Este empleado no tiene beneficiarios activos registrados',
                confirmButtonColor: '#0f83b2',
                background: isDark ? '#0a1929' : '#ffffff',
                color: isDark ? '#ffffff' : '#000000',
              });
            }
          }
        } catch (error) {
          console.error('Error al cargar beneficiarios:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los beneficiarios',
            confirmButtonColor: '#0f83b2',
            background: isDark ? '#0a1929' : '#ffffff',
            color: isDark ? '#ffffff' : '#000000',
          });
        } finally {
          setLoadingBeneficiarios(false);
        }
      }
    };

    cargarBeneficiarios();
  }, [tipoPaciente, empleado, isDark]);

  const handleBuscar = async () => {
    if (!numNomina.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'Por favor ingrese un número de nómina',
        confirmButtonColor: '#0f83b2',
        background: isDark ? '#0a1929' : '#ffffff',
        color: isDark ? '#ffffff' : '#000000',
      });
      return;
    }

    try {
      await buscarEmpleado(numNomina);
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Empleado no encontrado',
        text: err.message || 'El empleado no fue encontrado o está dado de baja.',
        confirmButtonColor: '#0f83b2',
        background: isDark ? '#0a1929' : '#ffffff',
        color: isDark ? '#ffffff' : '#000000',
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBuscar();
    }
  };

  const handleChangeSignos = (campo: keyof SignosVitales, valor: string) => {
    setSignosVitales((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleGuardarConsulta = async () => {
    if (!tipoPaciente) {
      Swal.fire({
        icon: 'warning',
        title: 'Selección requerida',
        text: 'Por favor seleccione si el paciente es Empleado o Beneficiario',
        confirmButtonColor: '#0f83b2',
        background: isDark ? '#0a1929' : '#ffffff',
        color: isDark ? '#ffffff' : '#000000',
      });
      return;
    }

    // Validar que si es beneficiario, tenga uno seleccionado
    if (tipoPaciente === 'beneficiario' && !beneficiarioSeleccionado) {
      Swal.fire({
        icon: 'warning',
        title: 'Beneficiario requerido',
        text: 'Por favor seleccione un beneficiario de la lista',
        confirmButtonColor: '#0f83b2',
        background: isDark ? '#0a1929' : '#ffffff',
        color: isDark ? '#ffffff' : '#000000',
      });
      return;
    }

    if (!signosVitales.ta_sistolica || !signosVitales.ta_diastolica || !signosVitales.temperatura || !signosVitales.frecuencia) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor complete al menos Presión Sistólica, Diastólica, Temperatura y Frecuencia Cardíaca',
        confirmButtonColor: '#0f83b2',
        background: isDark ? '#0a1929' : '#ffffff',
        color: isDark ? '#ffffff' : '#000000',
      });
      return;
    }

    setGuardando(true);

    try {
      // Preparar datos según sea empleado o beneficiario
      const pacienteNombre = tipoPaciente === 'empleado'
        ? getNombreCompleto()
        : getNombreCompletoBeneficiario(beneficiarioSeleccionado!);

      const pacienteEdad = tipoPaciente === 'empleado'
        ? (empleado?.fecha_nacimiento ? calcularEdad(empleado.fecha_nacimiento) : '')
        : (beneficiarioSeleccionado?.F_NACIMIENTO ? calcularEdad(beneficiarioSeleccionado.F_NACIMIENTO) : '');

      const response = await fetch('/api/consultas/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clavenomina: empleado?.num_nom,
          clavepaciente: tipoPaciente === 'beneficiario' ? beneficiarioSeleccionado?.ID_BENEFICIARIO : null,
          nombrepaciente: pacienteNombre,
          departamento: empleado?.departamento,
          edad: pacienteEdad,
          sexo: tipoPaciente === 'empleado' ? empleado?.sexo : beneficiarioSeleccionado?.SEXO,
          elpacienteesempleado: tipoPaciente === 'empleado',
          // Para empleados usar parentesco ID 1 (EMPLEADO por defecto)
          // Para beneficiarios usar su parentesco real
          parentesco: tipoPaciente === 'beneficiario' ? beneficiarioSeleccionado?.PARENTESCO : 1,
          ta_sistolica: signosVitales.ta_sistolica,
          ta_diastolica: signosVitales.ta_diastolica,
          temperaturapaciente: signosVitales.temperatura,
          pulsosxminutopaciente: signosVitales.frecuencia,
          respiracionpaciente: signosVitales.oxigenacion,
          estaturapaciente: signosVitales.altura,
          pesopaciente: signosVitales.peso,
          glucosapaciente: signosVitales.glucosa,
          id_referencia_origen: referenciaId, // Vincular referencia
        }),
      });

      const data = await response.json();

      if (data.success) {
        await Swal.fire({
          icon: 'success',
          title: '¡Signos vitales registrados!',
          text: 'Los datos han sido guardados correctamente',
          confirmButtonColor: '#0f83b2',
          background: isDark ? '#0a1929' : '#ffffff',
          color: isDark ? '#ffffff' : '#000000',
        });

        onSuccess?.();
        onCerrar();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudieron guardar los signos vitales',
        confirmButtonColor: '#0f83b2',
        background: isDark ? '#0a1929' : '#ffffff',
        color: isDark ? '#ffffff' : '#000000',
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onCerrar}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        transition={{ type: 'spring', duration: 0.5 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-7xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${isDark ? 'bg-[#0a1929]' : 'bg-white'
          }`}
      >
        {/* Header Profesional */}
        <div className="bg-gradient-to-r from-[#0f83b2] via-[#0db1ec] to-[#0f83b2] px-6 py-5 relative overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10"></div>
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Activity size={28} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">Registro de Signos Vitales</h3>
                <p className="text-white/80 text-sm mt-1">Buscar paciente por número de nómina</p>
              </div>
            </div>
            <button
              onClick={onCerrar}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Contenido con scroll */}
        <div className="p-4 sm:p-8 space-y-6 max-h-[calc(100vh-180px)] overflow-y-auto">
          {/* Buscador Mejorado */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Hash
                size={20}
                className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'
                  }`}
              />
              <input
                type="text"
                value={numNomina}
                onChange={(e) => setNumNomina(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ingrese número de nómina..."
                className={`w-full pl-12 pr-4 py-3 sm:py-4 rounded-xl border-2 outline-none transition-all font-medium ${isDark
                  ? 'bg-[#0d1f2d] border-[#0f83b2]/30 text-white placeholder-gray-500 focus:border-[#0db1ec] focus:bg-[#0a1929]'
                  : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#0f83b2] focus:bg-white'
                  }`}
                autoFocus
              />
            </div>
            <button
              onClick={handleBuscar}
              disabled={loading}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] text-white rounded-xl font-bold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <Search size={20} />
              Buscar
            </button>
          </div>

          {/* Loading Mejorado */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <div className="relative">
                <div className="w-16 h-16 border-4 border-[#0f83b2]/20 rounded-full"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-[#0db1ec] border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className={`mt-4 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Buscando empleado...
              </p>
            </motion.div>
          )}

          {/* Información del Empleado */}
          {empleado && !loading && (
            <div className="space-y-6">
              {/* Tarjeta de Información Principal */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl border-2 p-6 ${isDark
                  ? 'bg-gradient-to-br from-[#0d1f2d] to-[#0a1929] border-[#0f83b2]/20'
                  : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
                  }`}
              >
                <div className="flex flex-col lg:flex-row items-start gap-6">
                  {/* Foto del Empleado */}
                  <div className="flex-shrink-0">
                    {empleado.FOTO_URL ? (
                      <div className="relative">
                        <img
                          src={empleado.FOTO_URL}
                          alt={getNombreCompleto()}
                          className="w-24 h-24 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-2xl object-cover shadow-lg ring-4 ring-[#0f83b2]/30"
                        />
                        <div className="absolute -bottom-2 -right-2 p-2 bg-green-500 rounded-full shadow-lg">
                          <User size={16} className="text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-24 h-24 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-2xl bg-gradient-to-br from-[#0f83b2] to-[#0db1ec] flex items-center justify-center shadow-lg">
                        <User size={56} className="text-white" />
                      </div>
                    )}
                  </div>

                  {/* Información en Grid */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Nombre */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-2 mb-2">
                        <User size={18} className={isDark ? 'text-[#0db1ec]' : 'text-blue-600'} />
                        <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                          Paciente
                        </p>
                      </div>
                      <h4 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {getNombreCompleto()}
                      </h4>
                    </div>

                    {/* Edad */}
                    {empleado.fecha_nacimiento && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar size={16} className={isDark ? 'text-[#0db1ec]' : 'text-blue-600'} />
                          <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                            Edad
                          </p>
                        </div>
                        <p className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {calcularEdad(empleado.fecha_nacimiento)}
                        </p>
                      </div>
                    )}

                    {/* Puesto */}
                    {empleado.puesto && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Briefcase size={16} className={isDark ? 'text-[#0db1ec]' : 'text-blue-600'} />
                          <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                            Puesto
                          </p>
                        </div>
                        <p className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {empleado.puesto}
                        </p>
                      </div>
                    )}

                    {/* Departamento */}
                    {empleado.departamento && (
                      <div className="col-span-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 size={16} className={isDark ? 'text-[#0db1ec]' : 'text-blue-600'} />
                          <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                            Departamento
                          </p>
                        </div>
                        <p className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {empleado.departamento}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Solo mostrar si está activo */}
              {empleado.activo === 'A' && (
                <>
                  {/* Selección de Tipo de Paciente */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={`rounded-2xl border-2 p-6 ${isDark ? 'bg-[#0d1f2d] border-[#0f83b2]/20' : 'bg-gray-50 border-gray-200'
                      }`}
                  >
                    <div className="text-center mb-6">
                      <Users
                        size={32}
                        className={`mx-auto mb-3 ${isDark ? 'text-[#0db1ec]' : 'text-blue-600'}`}
                      />
                      <h5 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        ¿Quién va a consulta?
                      </h5>
                      <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Seleccione el tipo de paciente
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        onClick={() => setTipoPaciente('empleado')}
                        className={`group py-6 px-6 rounded-xl font-bold text-lg transition-all duration-300 flex flex-col items-center justify-center gap-3 ${tipoPaciente === 'empleado'
                          ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-xl scale-105 ring-4 ring-emerald-500/30'
                          : isDark
                            ? 'bg-[#0a1929] border-2 border-[#0f83b2]/30 text-gray-300 hover:border-emerald-500/50 hover:scale-102'
                            : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-emerald-500/50 hover:shadow-md hover:scale-102'
                          }`}
                      >
                        <UserCircle size={40} />
                        Empleado
                        {tipoPaciente === 'empleado' && (
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        )}
                      </button>

                      <button
                        onClick={() => setTipoPaciente('beneficiario')}
                        className={`group py-6 px-6 rounded-xl font-bold text-lg transition-all duration-300 flex flex-col items-center justify-center gap-3 ${tipoPaciente === 'beneficiario'
                          ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl scale-105 ring-4 ring-purple-500/30'
                          : isDark
                            ? 'bg-[#0a1929] border-2 border-[#0f83b2]/30 text-gray-300 hover:border-purple-500/50 hover:scale-102'
                            : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-purple-500/50 hover:shadow-md hover:scale-102'
                          }`}
                      >
                        <Users size={40} />
                        Beneficiario
                        {tipoPaciente === 'beneficiario' && (
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        )}
                      </button>
                    </div>
                  </motion.div>

                  {/* Lista de Beneficiarios */}
                  {tipoPaciente === 'beneficiario' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className={`rounded-2xl border-2 p-6 ${isDark ? 'bg-[#0d1f2d] border-[#0f83b2]/20' : 'bg-gray-50 border-gray-200'
                        }`}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-3 rounded-xl ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'
                          }`}>
                          <Users size={24} className={isDark ? 'text-purple-400' : 'text-purple-600'} />
                        </div>
                        <div>
                          <h5 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Seleccione el Beneficiario
                          </h5>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {loadingBeneficiarios
                              ? 'Cargando beneficiarios...'
                              : `${beneficiarios.length} beneficiario(s) activo(s)`}
                          </p>
                        </div>
                      </div>

                      {loadingBeneficiarios ? (
                        <div className="flex justify-center py-8">
                          <div className="relative">
                            <div className="w-12 h-12 border-4 border-purple-500/20 rounded-full"></div>
                            <div className="absolute inset-0 w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        </div>
                      ) : beneficiarios.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto">
                          {beneficiarios.map((benef) => (
                            <button
                              key={benef.ID_BENEFICIARIO}
                              onClick={() => setBeneficiarioSeleccionado(benef)}
                              className={`text-left p-4 rounded-xl transition-all duration-200 cursor-pointer ${beneficiarioSeleccionado?.ID_BENEFICIARIO === benef.ID_BENEFICIARIO
                                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg ring-4 ring-purple-500/30'
                                : isDark
                                  ? 'bg-[#0a1929] border-2 border-[#0f83b2]/30 text-white'
                                  : 'bg-white border-2 border-gray-200 text-gray-900'
                                }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                {/* Radio button indicator */}
                                <div className="flex-shrink-0">
                                  {beneficiarioSeleccionado?.ID_BENEFICIARIO === benef.ID_BENEFICIARIO ? (
                                    <CheckCircle2 size={28} className="text-white" />
                                  ) : (
                                    <Circle size={28} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                                  )}
                                </div>

                                {/* Foto del beneficiario */}
                                <div className="flex-shrink-0">
                                  {benef.FOTO_URL ? (
                                    <img
                                      src={benef.FOTO_URL}
                                      alt={getNombreCompletoBeneficiario(benef)}
                                      className={`w-16 h-16 rounded-xl object-cover ${beneficiarioSeleccionado?.ID_BENEFICIARIO === benef.ID_BENEFICIARIO
                                        ? 'ring-4 ring-white/50'
                                        : 'ring-2 ring-purple-500/30'
                                        }`}
                                    />
                                  ) : (
                                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${beneficiarioSeleccionado?.ID_BENEFICIARIO === benef.ID_BENEFICIARIO
                                      ? 'bg-white/20'
                                      : isDark
                                        ? 'bg-purple-500/20'
                                        : 'bg-purple-100'
                                      }`}>
                                      <User size={32} className={
                                        beneficiarioSeleccionado?.ID_BENEFICIARIO === benef.ID_BENEFICIARIO
                                          ? 'text-white'
                                          : isDark
                                            ? 'text-purple-400'
                                            : 'text-purple-600'
                                      } />
                                    </div>
                                  )}
                                </div>

                                {/* Información */}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h6 className="font-bold text-lg">
                                      {getNombreCompletoBeneficiario(benef)}
                                    </h6>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-lg font-semibold ${beneficiarioSeleccionado?.ID_BENEFICIARIO === benef.ID_BENEFICIARIO
                                      ? 'bg-white/20 text-white'
                                      : isDark
                                        ? 'bg-purple-500/20 text-purple-400'
                                        : 'bg-purple-100 text-purple-700'
                                      }`}>
                                      {benef.PARENTESCO_DESC || 'Beneficiario'}
                                    </span>
                                    {benef.F_NACIMIENTO && (
                                      <span className={beneficiarioSeleccionado?.ID_BENEFICIARIO === benef.ID_BENEFICIARIO ? 'text-white/90' : 'opacity-70'}>
                                        {calcularEdad(benef.F_NACIMIENTO)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          <Users size={48} className="mx-auto mb-3 opacity-30" />
                          <p className="font-semibold">No hay beneficiarios activos</p>
                          <p className="text-sm mt-1">Este empleado no tiene beneficiarios registrados</p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Formulario de Signos Vitales */}
                  {tipoPaciente && (tipoPaciente === 'empleado' || beneficiarioSeleccionado) && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className={`rounded-2xl border-2 p-6 ${isDark ? 'bg-[#0d1f2d] border-[#0f83b2]/20' : 'bg-gray-50 border-gray-200'
                        }`}
                    >
                      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                        <div className={`p-3 rounded-xl ${isDark ? 'bg-[#0f83b2]/20' : 'bg-blue-50'
                          }`}>
                          <Activity size={24} className={isDark ? 'text-[#0db1ec]' : 'text-blue-600'} />
                        </div>
                        <div>
                          <h5 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Registro de Signos Vitales
                          </h5>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Complete los valores medidos. Los campos marcados con <span className="text-red-500">*</span> son obligatorios.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Presión Sistólica */}
                        <div>
                          <label className={`flex items-center gap-2 text-sm font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                            <Activity size={18} className="text-red-500" />
                            Presión Sistólica (mmHg) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            placeholder="120"
                            value={signosVitales.ta_sistolica}
                            onChange={(e) => handleChangeSignos('ta_sistolica', e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all font-medium ${isDark
                              ? 'bg-[#0a1929] border-[#0f83b2]/30 text-white placeholder-gray-500 focus:border-[#0db1ec]'
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                              }`}
                          />
                        </div>

                        {/* Presión Diastólica */}
                        <div>
                          <label className={`flex items-center gap-2 text-sm font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                            <Heart size={18} className="text-red-500" />
                            Presión Diastólica (mmHg) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            placeholder="80"
                            value={signosVitales.ta_diastolica}
                            onChange={(e) => handleChangeSignos('ta_diastolica', e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all font-medium ${isDark
                              ? 'bg-[#0a1929] border-[#0f83b2]/30 text-white placeholder-gray-500 focus:border-[#0db1ec]'
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                              }`}
                          />
                        </div>

                        {/* Temperatura */}
                        <div>
                          <label className={`flex items-center gap-2 text-sm font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                            <Thermometer size={18} className="text-orange-500" />
                            Temperatura (°C) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            placeholder="36.5"
                            value={signosVitales.temperatura}
                            onChange={(e) => handleChangeSignos('temperatura', e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all font-medium ${isDark
                              ? 'bg-[#0a1929] border-[#0f83b2]/30 text-white placeholder-gray-500 focus:border-[#0db1ec]'
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                              }`}
                          />
                        </div>

                        {/* Frecuencia Cardíaca */}
                        <div>
                          <label className={`flex items-center gap-2 text-sm font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                            <Heart size={18} className="text-pink-500" />
                            Frecuencia Cardíaca (bpm) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            placeholder="75"
                            value={signosVitales.frecuencia}
                            onChange={(e) => handleChangeSignos('frecuencia', e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all font-medium ${isDark
                              ? 'bg-[#0a1929] border-[#0f83b2]/30 text-white placeholder-gray-500 focus:border-[#0db1ec]'
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                              }`}
                          />
                        </div>

                        {/* Oxigenación */}
                        <div>
                          <label className={`flex items-center gap-2 text-sm font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                            <Wind size={18} className="text-cyan-500" />
                            Oxigenación (%)
                          </label>
                          <input
                            type="number"
                            placeholder="98"
                            value={signosVitales.oxigenacion}
                            onChange={(e) => handleChangeSignos('oxigenacion', e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all font-medium ${isDark
                              ? 'bg-[#0a1929] border-[#0f83b2]/30 text-white placeholder-gray-500 focus:border-[#0db1ec]'
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                              }`}
                          />
                        </div>

                        {/* Altura */}
                        <div>
                          <label className={`flex items-center gap-2 text-sm font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                            <Ruler size={18} className="text-indigo-500" />
                            Altura (cm)
                          </label>
                          <input
                            type="number"
                            placeholder="175"
                            value={signosVitales.altura}
                            onChange={(e) => handleChangeSignos('altura', e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all font-medium ${isDark
                              ? 'bg-[#0a1929] border-[#0f83b2]/30 text-white placeholder-gray-500 focus:border-[#0db1ec]'
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                              }`}
                          />
                        </div>

                        {/* Peso */}
                        <div>
                          <label className={`flex items-center gap-2 text-sm font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                            <Weight size={18} className="text-amber-500" />
                            Peso (kg)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            placeholder="70"
                            value={signosVitales.peso}
                            onChange={(e) => handleChangeSignos('peso', e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all font-medium ${isDark
                              ? 'bg-[#0a1929] border-[#0f83b2]/30 text-white placeholder-gray-500 focus:border-[#0db1ec]'
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                              }`}
                          />
                        </div>

                        {/* Glucosa */}
                        <div className="md:col-span-2">
                          <label className={`flex items-center gap-2 text-sm font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                            <Droplet size={18} className="text-blue-500" />
                            Glucosa (mg/dL)
                          </label>
                          <input
                            type="number"
                            placeholder="90"
                            value={signosVitales.glucosa}
                            onChange={(e) => handleChangeSignos('glucosa', e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all font-medium ${isDark
                              ? 'bg-[#0a1929] border-[#0f83b2]/30 text-white placeholder-gray-500 focus:border-[#0db1ec]'
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                              }`}
                          />
                        </div>
                      </div>

                      {/* Botón Guardar */}
                      <div className="mt-8 flex flex-col sm:flex-row sm:justify-end gap-3">
                        <button
                          onClick={onCerrar}
                          className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold transition-all ${isDark
                            ? 'bg-gray-700 text-white hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleGuardarConsulta}
                          disabled={guardando}
                          className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl font-bold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                          {guardando ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Guardando...
                            </>
                          ) : (
                            <>
                              <Save size={20} />
                              Guardar Signos Vitales
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </>
              )}

              {/* Mensaje Empleado Inactivo */}
              {empleado.activo !== 'A' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border-2 border-red-500/30 bg-red-500/10 p-8 text-center"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-4">
                    <X size={32} className="text-red-500" />
                  </div>
                  <h5 className="text-xl font-bold text-red-500 mb-2">Empleado Inactivo</h5>
                  <p className={`font-semibold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                    Este empleado está dado de baja. No se pueden registrar signos vitales.
                  </p>
                </motion.div>
              )}
            </div>
          )}

          {/* Mensaje Inicial */}
          {!empleado && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`text-center py-16 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
            >
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 ${isDark ? 'bg-[#0f83b2]/10' : 'bg-blue-50'
                }`}>
                <Search size={40} className={isDark ? 'text-[#0db1ec]' : 'text-blue-500'} />
              </div>
              <h4 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Buscar Paciente
              </h4>
              <p className="text-sm">Ingrese un número de nómina en el campo superior</p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
