// src/components/referencias/especialista/ModalSignosVitalesReferencia.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  X,
  Activity,
  Heart,
  Thermometer,
  Wind,
  Ruler,
  Weight,
  Droplet,
  Lock,
  Users,
  UserCircle,
  Stethoscope,
} from 'lucide-react';
import type { ReferenciaEspecialidad } from '@/types/referencias';
import Swal from 'sweetalert2';

interface Props {
  referencia: ReferenciaEspecialidad | null;
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
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

const SIGNOS_VACIOS: SignosVitales = {
  ta_sistolica: '',
  ta_diastolica: '',
  temperatura: '',
  frecuencia: '',
  oxigenacion: '',
  altura: '',
  peso: '',
  glucosa: '',
};

export default function ModalSignosVitalesReferencia({ referencia, isOpen, onClose, isDark }: Props) {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [signosVitales, setSignosVitales] = useState<SignosVitales>(SIGNOS_VACIOS);

  // Resetear formulario cada vez que se abre el modal
  useEffect(() => {
    if (isOpen) {
      setSignosVitales(SIGNOS_VACIOS);
      setGuardando(false);
    }
  }, [isOpen]);

  if (!isOpen || !referencia) return null;

  // es_empleado viene del campo c.es_empleado de la consulta (ahora incluido en mis-referencias).
  // Fallback: si no existe el campo, se considera empleado cuando id_beneficiario es falsy (null/0).
  const esEmpleado = referencia.es_empleado !== undefined
    ? referencia.es_empleado
    : !referencia.id_beneficiario;

  const handleChangeSignos = (campo: keyof SignosVitales, valor: string) => {
    setSignosVitales(prev => ({ ...prev, [campo]: valor }));
  };

  const handleGuardar = async () => {
    if (!signosVitales.ta_sistolica || !signosVitales.ta_diastolica || !signosVitales.temperatura || !signosVitales.frecuencia) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor complete Presión Sistólica, Diastólica, Temperatura y Frecuencia Cardíaca',
        confirmButtonColor: '#0f83b2',
        background: isDark ? '#0a1929' : '#ffffff',
        color: isDark ? '#ffffff' : '#000000',
      });
      return;
    }

    setGuardando(true);
    try {
      const response = await fetch('/api/consultas/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clavenomina: referencia.no_nomina,
          // || null convierte 0, null y undefined a null (empleados tienen id_beneficiario=0 o null)
          clavepaciente: referencia.id_beneficiario || null,
          nombrepaciente: referencia.nombre_paciente,
          departamento: referencia.departamento,
          edad: referencia.edad,
          sexo: referencia.sexo,
          elpacienteesempleado: esEmpleado,
          ta_sistolica: signosVitales.ta_sistolica,
          ta_diastolica: signosVitales.ta_diastolica,
          temperaturapaciente: signosVitales.temperatura,
          pulsosxminutopaciente: signosVitales.frecuencia,
          respiracionpaciente: signosVitales.oxigenacion || null,
          estaturapaciente: signosVitales.altura || null,
          pesopaciente: signosVitales.peso || null,
          glucosapaciente: signosVitales.glucosa || null,
          id_referencia_origen: referencia.id_referencia,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await Swal.fire({
          icon: 'success',
          title: '¡Signos vitales registrados!',
          text: 'Iniciando consulta...',
          confirmButtonColor: '#0f83b2',
          timer: 1500,
          showConfirmButton: false,
          background: isDark ? '#0a1929' : '#ffffff',
          color: isDark ? '#ffffff' : '#000000',
        });
        router.push(`/dashboard/consultas/diagnostico/atender/${data.data.id_consulta}`);
      } else {
        throw new Error(data.error || 'Error al crear la consulta');
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

  const inputClass = `w-full px-4 py-3 rounded-xl border-2 outline-none transition-all font-medium ${
    isDark
      ? 'bg-[#0a1929] border-[#0f83b2]/30 text-white placeholder-gray-500 focus:border-[#0db1ec]'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
  }`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        transition={{ type: 'spring', duration: 0.5 }}
        onClick={e => e.stopPropagation()}
        className={`w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isDark ? 'bg-[#0a1929]' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0f83b2] via-[#0db1ec] to-[#0f83b2] px-6 py-5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Activity size={28} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">Signos Vitales — Consulta Especialista</h3>
                <p className="text-white/80 text-sm mt-1">
                  Referencia {referencia.folio ? `#${referencia.folio}` : `#${referencia.id_referencia}`} · {referencia.nombre_especialidad}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto">

          {/* Paciente BLOQUEADO */}
          <div
            className={`rounded-2xl border-2 p-5 ${
              isDark
                ? 'bg-gradient-to-br from-[#0d1f2d] to-[#0a1929] border-[#0f83b2]/20'
                : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-xl ${isDark ? 'bg-[#0f83b2]/20' : 'bg-blue-100'}`}>
                <Lock size={18} className={isDark ? 'text-[#0db1ec]' : 'text-blue-600'} />
              </div>
              <div>
                <h4 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Paciente — datos bloqueados por la referencia
                </h4>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  No es posible cambiar el paciente. Si hay un error, contacte al coordinador.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Nombre del Paciente
                </p>
                <p className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {referencia.nombre_paciente}
                </p>
              </div>

              <div>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Nómina
                </p>
                <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {referencia.no_nomina}
                </p>
              </div>

              <div>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Tipo de Paciente
                </p>
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-sm ${
                    esEmpleado
                      ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                      : isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'
                  }`}
                >
                  {esEmpleado ? <UserCircle size={16} /> : <Users size={16} />}
                  {esEmpleado ? 'Empleado' : 'Beneficiario'}
                </div>
              </div>

              {referencia.departamento && (
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Departamento
                  </p>
                  <p className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {referencia.departamento}
                  </p>
                </div>
              )}

              {referencia.edad && (
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Edad
                  </p>
                  <p className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {referencia.edad} años
                  </p>
                </div>
              )}

              <div>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Especialidad
                </p>
                <p className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {referencia.nombre_especialidad}
                </p>
              </div>
            </div>
          </div>

          {/* Formulario de Signos Vitales */}
          <div
            className={`rounded-2xl border-2 p-6 ${
              isDark ? 'bg-[#0d1f2d] border-[#0f83b2]/20' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-[#0f83b2]/20' : 'bg-blue-50'}`}>
                <Activity size={24} className={isDark ? 'text-[#0db1ec]' : 'text-blue-600'} />
              </div>
              <div>
                <h5 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Registro de Signos Vitales
                </h5>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Complete los valores medidos. Los campos con <span className="text-red-500">*</span> son obligatorios.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Presión Sistólica */}
              <div>
                <label className={`flex items-center gap-2 text-sm font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <Activity size={18} className="text-red-500" />
                  Presión Sistólica (mmHg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="120"
                  value={signosVitales.ta_sistolica}
                  onChange={e => handleChangeSignos('ta_sistolica', e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Presión Diastólica */}
              <div>
                <label className={`flex items-center gap-2 text-sm font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <Heart size={18} className="text-red-500" />
                  Presión Diastólica (mmHg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="80"
                  value={signosVitales.ta_diastolica}
                  onChange={e => handleChangeSignos('ta_diastolica', e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Temperatura */}
              <div>
                <label className={`flex items-center gap-2 text-sm font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <Thermometer size={18} className="text-orange-500" />
                  Temperatura (°C) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="36.5"
                  value={signosVitales.temperatura}
                  onChange={e => handleChangeSignos('temperatura', e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Frecuencia Cardíaca */}
              <div>
                <label className={`flex items-center gap-2 text-sm font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <Heart size={18} className="text-pink-500" />
                  Frecuencia Cardíaca (bpm) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="75"
                  value={signosVitales.frecuencia}
                  onChange={e => handleChangeSignos('frecuencia', e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Oxigenación */}
              <div>
                <label className={`flex items-center gap-2 text-sm font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <Wind size={18} className="text-cyan-500" />
                  Oxigenación (%)
                </label>
                <input
                  type="number"
                  placeholder="98"
                  value={signosVitales.oxigenacion}
                  onChange={e => handleChangeSignos('oxigenacion', e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Altura */}
              <div>
                <label className={`flex items-center gap-2 text-sm font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <Ruler size={18} className="text-indigo-500" />
                  Altura (cm)
                </label>
                <input
                  type="number"
                  placeholder="175"
                  value={signosVitales.altura}
                  onChange={e => handleChangeSignos('altura', e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Peso */}
              <div>
                <label className={`flex items-center gap-2 text-sm font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <Weight size={18} className="text-amber-500" />
                  Peso (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="70"
                  value={signosVitales.peso}
                  onChange={e => handleChangeSignos('peso', e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Glucosa */}
              <div>
                <label className={`flex items-center gap-2 text-sm font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <Droplet size={18} className="text-blue-500" />
                  Glucosa (mg/dL)
                </label>
                <input
                  type="number"
                  placeholder="90"
                  value={signosVitales.glucosa}
                  onChange={e => handleChangeSignos('glucosa', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Botones */}
            <div className="mt-8 flex flex-col sm:flex-row sm:justify-end gap-3">
              <button
                onClick={onClose}
                disabled={guardando}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 ${
                  isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
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
                    <Stethoscope size={20} />
                    Guardar e Iniciar Consulta
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
