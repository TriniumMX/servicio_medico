// src/components/catalogos/beneficiarios/ModalBeneficiario.tsx

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, User, Calendar, Heart, Phone, FileText, Camera, Upload, Eye } from 'lucide-react';
import Swal from 'sweetalert2';
import CapturaFoto from './CapturaFoto';
import type { Beneficiario } from '@/types/catalogos/beneficiarios';

interface ModalBeneficiarioProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  numNom: string;
  beneficiario?: Beneficiario | null;
  isDark: boolean;
}

export default function ModalBeneficiario({
  isOpen,
  onClose,
  onSuccess,
  numNom,
  beneficiario,
  isDark
}: ModalBeneficiarioProps) {
  const isEditMode = !!beneficiario;
  const [loading, setLoading] = useState(false);
  const [parentescos, setParentescos] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'docs'>('info');

  // Función para convertir valores de sexo antiguos (M/F) a nuevos (1/2)
  const normalizarSexo = (sexo?: string) => {
    if (!sexo) return '';
    if (sexo === 'M') return '2'; // Masculino
    if (sexo === 'F') return '1'; // Femenino
    return sexo; // Ya es '1' o '2'
  };

  const [formData, setFormData] = useState({
    PARENTESCO: beneficiario?.PARENTESCO?.toString() || '',
    PARENTESCO_NOMBRE: beneficiario?.PARENTESCO_NOMBRE?.trim() || '',
    NOMBRE: beneficiario?.NOMBRE?.trim() || '',
    A_PATERNO: beneficiario?.A_PATERNO?.trim() || '',
    A_MATERNO: beneficiario?.A_MATERNO?.trim() || '',
    SEXO: normalizarSexo(beneficiario?.SEXO),
    F_NACIMIENTO: beneficiario?.F_NACIMIENTO?.split('T')[0] || '',
    CURP: beneficiario?.CURP?.trim() || '',
    SANGRE: beneficiario?.SANGRE?.trim() || '',
    ALERGIAS: beneficiario?.ALERGIAS?.trim() || '',
    TEL_EMERGENCIA: beneficiario?.TEL_EMERGENCIA?.trim() || '',
    NOMBRE_EMERGENCIA: beneficiario?.NOMBRE_EMERGENCIA?.trim() || '',
    TELEFONO: beneficiario?.TELEFONO?.trim() || '',
    CORREO: beneficiario?.CORREO?.trim() || '',
    ESDISCAPACITADO: beneficiario?.ESDISCAPACITADO || false,
    ESESTUDIANTE: beneficiario?.ESESTUDIANTE || false,
    VIGENCIA_ESTUDIOS: beneficiario?.VIGENCIA_ESTUDIOS?.split('T')[0] || '',
  });

  const [documentosExistentes, setDocumentosExistentes] = useState({
    foto: beneficiario?.FOTO_URL || null,
    curp: beneficiario?.URL_CURP || null,
    acta_nac: beneficiario?.URL_ACTA_NAC || null,
    ine: beneficiario?.URL_INE || null,
    constancia: beneficiario?.URL_CONSTANCIA || null,
    concubinato: beneficiario?.URL_CONCUBINATO || null,
    acta_matrimonio: beneficiario?.URL_ACTAMATRIMONIO || null,
    no_isste: beneficiario?.URL_NOISSTE || null,
    incapacidad: beneficiario?.URL_INCAP || null,
    dep_economica: beneficiario?.URL_ACTADEPENDENCIAECONOMICA || null,
  });

  const [archivos, setArchivos] = useState({
    foto: null as File | null,
    curp: null as File | null,
    acta_nac: null as File | null,
    ine: null as File | null,
    constancia: null as File | null,
    concubinato: null as File | null,
    acta_matrimonio: null as File | null,
    no_isste: null as File | null,
    incapacidad: null as File | null,
    dep_economica: null as File | null,
  });

  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);
  const [nombreDocPrevia, setNombreDocPrevia] = useState<string>('');

  // Cargar parentescos
  useEffect(() => {
    if (isOpen) {
      fetch('/api/catalogos/beneficiarios/parentescos')
        .then(res => res.json())
        .then(data => data.success && setParentescos(data.data));
    }
  }, [isOpen]);

  // Resetear formulario cuando cambia el beneficiario o se abre/cierra
  useEffect(() => {
    if (isOpen && beneficiario) {
      setFormData({
        PARENTESCO: beneficiario.PARENTESCO?.toString() || '',
        PARENTESCO_NOMBRE: beneficiario.PARENTESCO_NOMBRE?.trim() || '',
        NOMBRE: beneficiario.NOMBRE?.trim() || '',
        A_PATERNO: beneficiario.A_PATERNO?.trim() || '',
        A_MATERNO: beneficiario.A_MATERNO?.trim() || '',
        SEXO: normalizarSexo(beneficiario.SEXO),
        F_NACIMIENTO: beneficiario.F_NACIMIENTO?.split('T')[0] || '',
        CURP: beneficiario.CURP?.trim() || '',
        SANGRE: beneficiario.SANGRE?.trim() || '',
        ALERGIAS: beneficiario.ALERGIAS?.trim() || '',
        TEL_EMERGENCIA: beneficiario.TEL_EMERGENCIA?.trim() || '',
        NOMBRE_EMERGENCIA: beneficiario.NOMBRE_EMERGENCIA?.trim() || '',
        TELEFONO: beneficiario.TELEFONO?.trim() || '',
        CORREO: beneficiario.CORREO?.trim() || '',
        ESDISCAPACITADO: beneficiario.ESDISCAPACITADO || false,
        ESESTUDIANTE: beneficiario.ESESTUDIANTE || false,
        VIGENCIA_ESTUDIOS: beneficiario.VIGENCIA_ESTUDIOS?.split('T')[0] || '',
      });

      setDocumentosExistentes({
        foto: beneficiario.FOTO_URL || null,
        curp: beneficiario.URL_CURP || null,
        acta_nac: beneficiario.URL_ACTA_NAC || null,
        ine: beneficiario.URL_INE || null,
        constancia: beneficiario.URL_CONSTANCIA || null,
        concubinato: beneficiario.URL_CONCUBINATO || null,
        acta_matrimonio: beneficiario.URL_ACTAMATRIMONIO || null,
        no_isste: beneficiario.URL_NOISSTE || null,
        incapacidad: beneficiario.URL_INCAP || null,
        dep_economica: beneficiario.URL_ACTADEPENDENCIAECONOMICA || null,
      });
    } else if (isOpen && !beneficiario) {
      // Reset para nuevo registro
      setFormData({
        PARENTESCO: '',
        PARENTESCO_NOMBRE: '',
        NOMBRE: '',
        A_PATERNO: '',
        A_MATERNO: '',
        SEXO: '',
        F_NACIMIENTO: '',
        CURP: '',
        SANGRE: '',
        ALERGIAS: '',
        TEL_EMERGENCIA: '',
        NOMBRE_EMERGENCIA: '',
        TELEFONO: '',
        CORREO: '',
        ESDISCAPACITADO: false,
        ESESTUDIANTE: false,
        VIGENCIA_ESTUDIOS: '',
      });
      setDocumentosExistentes({
        foto: null, curp: null, acta_nac: null, ine: null,
        constancia: null, concubinato: null, acta_matrimonio: null,
        no_isste: null, incapacidad: null, dep_economica: null,
      });
    }

    // Limpiar archivos nuevos
    setArchivos({
      foto: null, curp: null, acta_nac: null, ine: null,
      constancia: null, concubinato: null, acta_matrimonio: null,
      no_isste: null, incapacidad: null, dep_economica: null,
    });
    setActiveTab('info');
  }, [isOpen, beneficiario]);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    if (name === 'PARENTESCO') {
      const p = parentescos.find(p => p.id_parentesco === parseInt(value));
      setFormData(prev => ({ ...prev, PARENTESCO: value, PARENTESCO_NOMBRE: p?.parentesco || '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleFileChange = (e: any, key: keyof typeof archivos) => {
    const file = e.target.files?.[0];
    if (file) {
      setArchivos(prev => ({ ...prev, [key]: file }));
    }
  };

  const handleFotoCapturada = (file: File) => {
    setArchivos(prev => ({ ...prev, foto: file }));
  };

  const handleVerDocumento = (url: string, nombre: string) => {
    setVistaPrevia(url);
    setNombreDocPrevia(nombre);
  };

  const cerrarVistaPrevia = () => {
    setVistaPrevia(null);
    setNombreDocPrevia('');
  };

  const validateForm = () => {
    if (!formData.PARENTESCO || !formData.NOMBRE || !formData.A_PATERNO || !formData.A_MATERNO ||
        !formData.SEXO || !formData.F_NACIMIENTO || !formData.CURP || formData.CURP.length !== 18 ||
        !formData.SANGRE || (formData.TEL_EMERGENCIA && formData.TEL_EMERGENCIA.length > 10)) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos o inválidos',
        text: 'Verifica: Parentesco, Nombre, Apellidos, Sexo, Fecha Nac, CURP (18 caracteres), Tipo de Sangre y Teléfono (10 dígitos)',
        confirmButtonColor: '#0f83b2',
        background: isDark ? '#0a1929' : '#ffffff',
        color: isDark ? '#ffffff' : '#000000',
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('NO_NOMINA', numNom);

      // Limpiar espacios en blanco antes de enviar
      Object.entries(formData).forEach(([key, value]) => {
        const cleanValue = typeof value === 'string' ? value.trim() : value;
        formDataToSend.append(key, String(cleanValue));
      });

      Object.entries(archivos).forEach(([key, file]) => file && formDataToSend.append(key, file));

      const url = isEditMode
        ? `/api/catalogos/beneficiarios/${beneficiario.ID_BENEFICIARIO}`
        : '/api/catalogos/beneficiarios';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, { method, body: formDataToSend });
      const data = await res.json();

      if (data.success) {
        await Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: isEditMode ? 'Beneficiario actualizado correctamente' : 'Beneficiario registrado correctamente',
          confirmButtonColor: '#0f83b2',
          background: isDark ? '#0a1929' : '#ffffff',
          color: isDark ? '#ffffff' : '#000000',
        });
        onSuccess();
        onClose();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || (isEditMode ? 'No se pudo actualizar' : 'No se pudo registrar'),
        confirmButtonColor: '#0f83b2',
        background: isDark ? '#0a1929' : '#ffffff',
        color: isDark ? '#ffffff' : '#000000',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-6xl max-h-[95vh] overflow-hidden rounded-2xl shadow-2xl ${
                isDark ? 'bg-[#0a1929]' : 'bg-white'
              }`}
            >
              {/* Header */}
              <div className={`sticky top-0 flex items-center justify-between p-6 border-b z-10 ${
                isDark ? 'bg-[#0a1929] border-[#0f83b2]/20' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    isEditMode
                      ? 'bg-gradient-to-br from-yellow-500 to-yellow-600'
                      : 'bg-gradient-to-br from-[#0f83b2] to-[#0db1ec]'
                  }`}>
                    <User size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {isEditMode ? 'Editar Beneficiario' : 'Nuevo Beneficiario'}
                    </h2>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {isEditMode ? 'Modifica los datos del beneficiario' : 'Completa los datos del nuevo beneficiario'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  type="button"
                  disabled={loading}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark
                      ? 'hover:bg-[#0f83b2]/10 text-gray-400 hover:text-white'
                      : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Tabs */}
              <div className={`flex border-b ${isDark ? 'border-[#0f83b2]/20' : 'border-gray-200'}`}>
                <button
                  type="button"
                  onClick={() => setActiveTab('info')}
                  className={`flex-1 py-4 px-6 font-semibold transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'info'
                      ? isDark
                        ? 'bg-[#0f83b2]/10 text-[#0db1ec] border-b-2 border-[#0db1ec]'
                        : 'bg-[#0f83b2]/5 text-[#0f83b2] border-b-2 border-[#0f83b2]'
                      : isDark
                        ? 'text-gray-400 hover:text-gray-300 hover:bg-[#0f83b2]/5'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <User size={18} />
                  Información Personal
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('docs')}
                  className={`flex-1 py-4 px-6 font-semibold transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'docs'
                      ? isDark
                        ? 'bg-[#0f83b2]/10 text-[#0db1ec] border-b-2 border-[#0db1ec]'
                        : 'bg-[#0f83b2]/5 text-[#0f83b2] border-b-2 border-[#0f83b2]'
                      : isDark
                        ? 'text-gray-400 hover:text-gray-300 hover:bg-[#0f83b2]/5'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <FileText size={18} />
                  Documentos y Fotografía
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="overflow-y-auto" style={{ maxHeight: 'calc(95vh - 200px)' }}>
                <div className="p-6">
                  {activeTab === 'info' ? (
                    <div className="space-y-6">
                      {/* Sección Datos Básicos */}
                      <div className={`rounded-lg border p-5 ${isDark ? 'bg-[#0d1f2d] border-[#0f83b2]/20' : 'bg-gray-50 border-gray-200'}`}>
                        <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          <User className="h-5 w-5 text-[#0db1ec]" />
                          Datos Básicos
                        </h3>

                        <div className="space-y-4">
                          <div>
                            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              Parentesco <span className="text-red-500">*</span>
                            </label>
                            <select
                              name="PARENTESCO"
                              value={formData.PARENTESCO}
                              onChange={handleChange}
                              required
                              className={`w-full px-4 py-3 rounded-lg border outline-none transition-colors ${
                                isDark
                                  ? 'bg-[#0a1929] border-[#0f83b2]/30 text-white focus:border-[#0db1ec]'
                                  : 'bg-white border-gray-300 text-gray-900 focus:border-[#0db1ec]'
                              } focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20`}
                            >
                              <option value="">Seleccione parentesco</option>
                              {parentescos.map((p: any) => (
                                <option key={p.id_parentesco} value={p.id_parentesco}>
                                  {p.parentesco}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                              { name: 'NOMBRE', label: 'Nombre' },
                              { name: 'A_PATERNO', label: 'Apellido Paterno' },
                              { name: 'A_MATERNO', label: 'Apellido Materno' }
                            ].map(field => (
                              <div key={field.name}>
                                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {field.label} <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  name={field.name}
                                  value={formData[field.name as keyof typeof formData] as string}
                                  onChange={handleChange}
                                  required
                                  className={`w-full px-4 py-3 rounded-lg border outline-none transition-colors ${
                                    isDark
                                      ? 'bg-[#0a1929] border-[#0f83b2]/30 text-white focus:border-[#0db1ec]'
                                      : 'bg-white border-gray-300 text-gray-900 focus:border-[#0db1ec]'
                                  } focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20`}
                                />
                              </div>
                            ))}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Sexo <span className="text-red-500">*</span>
                              </label>
                              <div className="flex gap-4">
                                {[['1', 'Femenino'], ['2', 'Masculino']].map(([val, label]) => (
                                  <label
                                    key={val}
                                    className={`flex items-center gap-2 cursor-pointer ${isDark ? 'text-white' : 'text-gray-900'}`}
                                  >
                                    <input
                                      type="radio"
                                      name="SEXO"
                                      value={val}
                                      checked={formData.SEXO === val}
                                      onChange={handleChange}
                                      className="w-4 h-4"
                                    />
                                    {label}
                                  </label>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Fecha de Nacimiento <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="date"
                                name="F_NACIMIENTO"
                                value={formData.F_NACIMIENTO}
                                onChange={handleChange}
                                required
                                className={`w-full px-4 py-3 rounded-lg border outline-none transition-colors ${
                                  isDark
                                    ? 'bg-[#0a1929] border-[#0f83b2]/30 text-white focus:border-[#0db1ec]'
                                    : 'bg-white border-gray-300 text-gray-900 focus:border-[#0db1ec]'
                                } focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20`}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                CURP <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                name="CURP"
                                value={formData.CURP}
                                onChange={handleChange}
                                maxLength={18}
                                required
                                className={`w-full px-4 py-3 rounded-lg border outline-none transition-colors ${
                                  isDark
                                    ? 'bg-[#0a1929] border-[#0f83b2]/30 text-white focus:border-[#0db1ec]'
                                    : 'bg-white border-gray-300 text-gray-900 focus:border-[#0db1ec]'
                                } focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20`}
                              />
                              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {formData.CURP.length}/18 caracteres
                              </p>
                            </div>

                            <div>
                              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Tipo de Sangre <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                name="SANGRE"
                                value={formData.SANGRE}
                                onChange={handleChange}
                                required
                                placeholder="Ej: O+, A-"
                                className={`w-full px-4 py-3 rounded-lg border outline-none transition-colors ${
                                  isDark
                                    ? 'bg-[#0a1929] border-[#0f83b2]/30 text-white focus:border-[#0db1ec]'
                                    : 'bg-white border-gray-300 text-gray-900 focus:border-[#0db1ec]'
                                } focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Sección Información Médica */}
                      <div className={`rounded-lg border p-5 ${isDark ? 'bg-[#0d1f2d] border-[#0f83b2]/20' : 'bg-gray-50 border-gray-200'}`}>
                        <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          <Heart className="h-5 w-5 text-[#0db1ec]" />
                          Información Médica
                        </h3>

                        <div className="space-y-4">
                          <div>
                            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              Alergias
                            </label>
                            <textarea
                              name="ALERGIAS"
                              value={formData.ALERGIAS}
                              onChange={handleChange}
                              rows={3}
                              placeholder="Ingrese alergias conocidas..."
                              className={`w-full px-4 py-3 rounded-lg border outline-none resize-none transition-colors ${
                                isDark
                                  ? 'bg-[#0a1929] border-[#0f83b2]/30 text-white focus:border-[#0db1ec]'
                                  : 'bg-white border-gray-300 text-gray-900 focus:border-[#0db1ec]'
                              } focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20`}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                              ['ESDISCAPACITADO', '¿Tiene alguna discapacidad?'],
                              ['ESESTUDIANTE', '¿Es estudiante actualmente?']
                            ].map(([name, label]) => (
                              <label
                                key={name}
                                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                                  formData[name as keyof typeof formData]
                                    ? isDark
                                      ? 'bg-[#0db1ec]/10 border-[#0db1ec]/30'
                                      : 'bg-[#0db1ec]/5 border-[#0db1ec]/30'
                                    : isDark
                                      ? 'bg-[#0a1929] border-[#0f83b2]/20'
                                      : 'bg-white border-gray-200'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  name={name}
                                  checked={formData[name as keyof typeof formData] as boolean}
                                  onChange={handleChange}
                                  className="w-5 h-5 rounded text-[#0db1ec] focus:ring-2 focus:ring-[#0db1ec]/20"
                                />
                                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {label}
                                </span>
                              </label>
                            ))}
                          </div>

                          {formData.ESESTUDIANTE && (
                            <div>
                              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Vigencia de Estudios
                              </label>
                              <input
                                type="date"
                                name="VIGENCIA_ESTUDIOS"
                                value={formData.VIGENCIA_ESTUDIOS}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 rounded-lg border outline-none transition-colors ${
                                  isDark
                                    ? 'bg-[#0a1929] border-[#0f83b2]/30 text-white focus:border-[#0db1ec]'
                                    : 'bg-white border-gray-300 text-gray-900 focus:border-[#0db1ec]'
                                } focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20`}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Sección Datos de Contacto Personal */}
                      <div className={`rounded-lg border p-5 ${isDark ? 'bg-[#0d1f2d] border-[#0f83b2]/20' : 'bg-gray-50 border-gray-200'}`}>
                        <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          <Phone className="h-5 w-5 text-[#0db1ec]" />
                          Datos de Contacto Personal
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              Teléfono Personal
                            </label>
                            <input
                              type="tel"
                              name="TELEFONO"
                              value={formData.TELEFONO}
                              onChange={handleChange}
                              maxLength={10}
                              placeholder="10 dígitos (opcional)"
                              className={`w-full px-4 py-3 rounded-lg border outline-none transition-colors ${
                                isDark
                                  ? 'bg-[#0a1929] border-[#0f83b2]/30 text-white focus:border-[#0db1ec]'
                                  : 'bg-white border-gray-300 text-gray-900 focus:border-[#0db1ec]'
                              } focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20`}
                            />
                          </div>

                          <div>
                            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              Correo Electrónico
                            </label>
                            <input
                              type="email"
                              name="CORREO"
                              value={formData.CORREO}
                              onChange={handleChange}
                              placeholder="correo@ejemplo.com (opcional)"
                              className={`w-full px-4 py-3 rounded-lg border outline-none transition-colors ${
                                isDark
                                  ? 'bg-[#0a1929] border-[#0f83b2]/30 text-white focus:border-[#0db1ec]'
                                  : 'bg-white border-gray-300 text-gray-900 focus:border-[#0db1ec]'
                              } focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Sección Contacto de Emergencia */}
                      <div className={`rounded-lg border p-5 ${isDark ? 'bg-[#0d1f2d] border-[#0f83b2]/20' : 'bg-gray-50 border-gray-200'}`}>
                        <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          <Phone className="h-5 w-5 text-[#0db1ec]" />
                          Contacto de Emergencia
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              Nombre del Contacto
                            </label>
                            <input
                              type="text"
                              name="NOMBRE_EMERGENCIA"
                              value={formData.NOMBRE_EMERGENCIA}
                              onChange={handleChange}
                              placeholder="Nombre completo"
                              className={`w-full px-4 py-3 rounded-lg border outline-none transition-colors ${
                                isDark
                                  ? 'bg-[#0a1929] border-[#0f83b2]/30 text-white focus:border-[#0db1ec]'
                                  : 'bg-white border-gray-300 text-gray-900 focus:border-[#0db1ec]'
                              } focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20`}
                            />
                          </div>

                          <div>
                            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              Teléfono de Emergencia
                            </label>
                            <input
                              type="tel"
                              name="TEL_EMERGENCIA"
                              value={formData.TEL_EMERGENCIA}
                              onChange={handleChange}
                              maxLength={10}
                              placeholder="10 dígitos"
                              className={`w-full px-4 py-3 rounded-lg border outline-none transition-colors ${
                                isDark
                                  ? 'bg-[#0a1929] border-[#0f83b2]/30 text-white focus:border-[#0db1ec]'
                                  : 'bg-white border-gray-300 text-gray-900 focus:border-[#0db1ec]'
                              } focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Sección Fotografía */}
                      <div className={`rounded-lg border p-5 ${isDark ? 'bg-[#0d1f2d] border-[#0f83b2]/20' : 'bg-gray-50 border-gray-200'}`}>
                        <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          <Camera className="h-5 w-5 text-[#0db1ec]" />
                          Fotografía del Beneficiario
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <CapturaFoto
                              onFotoCapturada={handleFotoCapturada}
                              fotoActual={archivos.foto}
                              isDark={isDark}
                            />
                          </div>

                          {isEditMode && documentosExistentes.foto && !archivos.foto && (
                            <div>
                              <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Foto Actual
                              </p>
                              <img
                                src={documentosExistentes.foto}
                                alt="Foto actual"
                                className="w-full h-48 object-cover rounded-lg border-2 border-green-500"
                              />
                              <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
                                <Eye size={14} />
                                Foto registrada
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Sección Documentos */}
                      <div className={`rounded-lg border p-5 ${isDark ? 'bg-[#0d1f2d] border-[#0f83b2]/20' : 'bg-gray-50 border-gray-200'}`}>
                        <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          <Upload className="h-5 w-5 text-[#0db1ec]" />
                          Documentos (Opcionales)
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            ['curp', 'CURP'],
                            ['acta_nac', 'Acta de Nacimiento'],
                            ['ine', 'INE/Identificación'],
                            ['constancia', 'Constancia de Estudios'],
                            ['acta_matrimonio', 'Acta de Matrimonio'],
                            ['concubinato', 'Constancia de Concubinato'],
                            ['no_isste', 'Número ISSTE'],
                            ['incapacidad', 'Certificado de Incapacidad'],
                            ['dep_economica', 'Acta Dependencia Económica']
                          ].map(([name, label]) => (
                            <div key={name} className={`p-3 rounded-lg border ${isDark ? 'border-[#0f83b2]/20' : 'border-gray-200'}`}>
                              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {label}
                              </label>

                              {/* Documento Existente */}
                              {isEditMode && documentosExistentes[name as keyof typeof documentosExistentes] && (
                                <div className="mb-2">
                                  <button
                                    type="button"
                                    onClick={() => handleVerDocumento(
                                      documentosExistentes[name as keyof typeof documentosExistentes]!,
                                      label
                                    )}
                                    className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                      isDark
                                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
                                        : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                                    }`}
                                  >
                                    <div className="flex items-center justify-center gap-2">
                                      <Eye size={16} />
                                      Ver documento actual
                                    </div>
                                  </button>
                                </div>
                              )}

                              {/* Input para Nuevo Documento */}
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => handleFileChange(e, name as keyof typeof archivos)}
                                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                                  isDark
                                    ? 'bg-[#0a1929] border-[#0f83b2]/30 text-white'
                                    : 'bg-white border-gray-300 text-gray-900'
                                }`}
                              />

                              {archivos[name as keyof typeof archivos] && (
                                <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                                  <Upload size={12} />
                                  Nuevo: {archivos[name as keyof typeof archivos]?.name}
                                </p>
                              )}

                              {!documentosExistentes[name as keyof typeof documentosExistentes] &&
                               !archivos[name as keyof typeof archivos] && (
                                <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                  Sin documento
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Botones de Acción */}
                <div className={`sticky bottom-0 flex justify-end gap-3 p-6 border-t ${
                  isDark ? 'bg-[#0a1929] border-[#0f83b2]/20' : 'bg-white border-gray-200'
                }`}>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                      isDark
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                    } disabled:opacity-50`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 transition-all ${
                      isEditMode
                        ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 text-white'
                        : 'bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] text-white'
                    }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {isEditMode ? 'Actualizando...' : 'Guardando...'}
                      </>
                    ) : (
                      <>
                        <Save size={20} />
                        {isEditMode ? 'Actualizar Beneficiario' : 'Registrar Beneficiario'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>

          {/* Modal Vista Previa de Documentos */}
          {vistaPrevia && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
              onClick={cerrarVistaPrevia}
            >
              <div
                className={`max-w-4xl w-full max-h-[90vh] rounded-xl overflow-hidden ${
                  isDark ? 'bg-[#0a1929]' : 'bg-white'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] px-6 py-4 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">{nombreDocPrevia}</h3>
                  <button onClick={cerrarVistaPrevia} className="text-white/80 hover:text-white">
                    <X size={24} />
                  </button>
                </div>
                <div className="p-4 max-h-[calc(90vh-80px)] overflow-auto">
                  {vistaPrevia.endsWith('.pdf') ? (
                    <iframe src={vistaPrevia} className="w-full h-[70vh]" title={nombreDocPrevia} />
                  ) : (
                    <img src={vistaPrevia} alt={nombreDocPrevia} className="w-full h-auto" />
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
