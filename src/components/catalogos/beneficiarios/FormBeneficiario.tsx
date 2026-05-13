// src/components/catalogos/beneficiarios/FormBeneficiario.tsx

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Save, X, Edit, Eye } from 'lucide-react';
import Swal from 'sweetalert2';
import CapturaFoto from './CapturaFoto';
import type { Beneficiario } from '@/types/catalogos/beneficiarios';

interface FormBeneficiarioProps {
  numNom: string;
  onSuccess: () => void;
  onCancel: () => void;
  isDark: boolean;
  beneficiarioEditar?: Beneficiario | null;
}

export default function FormBeneficiario({ numNom, onSuccess, onCancel, isDark, beneficiarioEditar }: FormBeneficiarioProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [parentescos, setParentescos] = useState<any[]>([]);
  const isEditMode = !!beneficiarioEditar;

  // Función para convertir valores de sexo antiguos (M/F) a nuevos (1/2)
  const normalizarSexo = (sexo?: string) => {
    if (!sexo) return '';
    if (sexo === 'M') return '2'; // Masculino
    if (sexo === 'F') return '1'; // Femenino
    return sexo; // Ya es '1' o '2'
  };

  const [formData, setFormData] = useState({
    PARENTESCO: beneficiarioEditar?.PARENTESCO?.toString() || '',
    PARENTESCO_NOMBRE: beneficiarioEditar?.PARENTESCO_NOMBRE?.trim() || '',
    NOMBRE: beneficiarioEditar?.NOMBRE?.trim() || '',
    A_PATERNO: beneficiarioEditar?.A_PATERNO?.trim() || '',
    A_MATERNO: beneficiarioEditar?.A_MATERNO?.trim() || '',
    SEXO: normalizarSexo(beneficiarioEditar?.SEXO),
    F_NACIMIENTO: beneficiarioEditar?.F_NACIMIENTO?.split('T')[0] || '',
    CURP: beneficiarioEditar?.CURP?.trim() || '',
    SANGRE: beneficiarioEditar?.SANGRE?.trim() || '',
    ALERGIAS: beneficiarioEditar?.ALERGIAS?.trim() || '',
    TEL_EMERGENCIA: beneficiarioEditar?.TEL_EMERGENCIA?.trim() || '',
    NOMBRE_EMERGENCIA: beneficiarioEditar?.NOMBRE_EMERGENCIA?.trim() || '',
    ESDISCAPACITADO: beneficiarioEditar?.ESDISCAPACITADO || false,
    ESESTUDIANTE: beneficiarioEditar?.ESESTUDIANTE || false,
    VIGENCIA_ESTUDIOS: beneficiarioEditar?.VIGENCIA_ESTUDIOS?.split('T')[0] || '',
  });

  const [documentosExistentes, setDocumentosExistentes] = useState({
    foto: beneficiarioEditar?.FOTO_URL || null,
    curp: beneficiarioEditar?.URL_CURP || null,
    acta_nac: beneficiarioEditar?.URL_ACTA_NAC || null,
    ine: beneficiarioEditar?.URL_INE || null,
    constancia: beneficiarioEditar?.URL_CONSTANCIA || null,
    concubinato: beneficiarioEditar?.URL_CONCUBINATO || null,
    acta_matrimonio: beneficiarioEditar?.URL_ACTAMATRIMONIO || null,
    no_isste: beneficiarioEditar?.URL_NOISSTE || null,
    incapacidad: beneficiarioEditar?.URL_INCAP || null,
    dep_economica: beneficiarioEditar?.URL_ACTADEPENDENCIAECONOMICA || null,
  });

  const [archivos, setArchivos] = useState({
    foto: null as File | null, curp: null as File | null, acta_nac: null as File | null,
    ine: null as File | null, constancia: null as File | null, concubinato: null as File | null,
    acta_matrimonio: null as File | null, no_isste: null as File | null,
    incapacidad: null as File | null, dep_economica: null as File | null,
  });

  useEffect(() => {
    fetch('/api/catalogos/beneficiarios/parentescos')
      .then(res => res.json())
      .then(data => data.success && setParentescos(data.data));
  }, []);

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
    file && setArchivos(prev => ({ ...prev, [key]: file }));
  };

  const handleFotoCapturada = (file: File) => {
    setArchivos(prev => ({ ...prev, foto: file }));
  };

  const validateStep1 = () => {
    if (!formData.PARENTESCO || !formData.NOMBRE || !formData.A_PATERNO || !formData.A_MATERNO ||
        !formData.SEXO || !formData.F_NACIMIENTO || !formData.CURP || formData.CURP.length !== 18 ||
        !formData.SANGRE || (formData.TEL_EMERGENCIA && formData.TEL_EMERGENCIA.length > 10)) {
      Swal.fire({
        icon: 'warning', title: 'Campos incompletos o inválidos',
        text: 'Verifica: Parentesco, Nombre, Apellidos, Sexo, Fecha Nac, CURP (18 chars), Sangre, Tel (10 dígitos)',
        confirmButtonColor: '#0f83b2', background: isDark ? '#0a1929' : '#ffffff',
        color: isDark ? '#ffffff' : '#000000',
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
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
        ? `/api/catalogos/beneficiarios/${beneficiarioEditar.ID_BENEFICIARIO}`
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
      } else throw new Error(data.error);
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

  if (isEditMode) {
    return (
      <FormularioEdicion
        formData={formData}
        parentescos={parentescos}
        archivos={archivos}
        documentosExistentes={documentosExistentes}
        onChange={handleChange}
        onFileChange={handleFileChange}
        onFotoCapturada={handleFotoCapturada}
        onSubmit={handleSubmit}
        onCancel={onCancel}
        loading={loading}
        isDark={isDark}
      />
    );
  }

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
      className={`rounded-xl border overflow-hidden ${isDark ? 'bg-[#0a1929] border-[#0f83b2]/30' : 'bg-white border-gray-200'}`}>
      <div className="bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] px-6 py-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-white">Registrar Beneficiario</h3>
          <button onClick={onCancel} className="text-white/80 hover:text-white"><X size={24} /></button>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-white' : 'bg-white/30'}`} />
          <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-white' : 'bg-white/30'}`} />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-white/80 text-sm">1. Información</span>
          <span className="text-white/80 text-sm">2. Documentos</span>
        </div>
      </div>

      <div className="p-6">
        {step === 1 ? (
          <Step1 formData={formData} parentescos={parentescos} onChange={handleChange}
            onNext={() => validateStep1() && setStep(2)} isDark={isDark} />
        ) : (
          <Step2 archivos={archivos} onFileChange={handleFileChange} onFotoCapturada={handleFotoCapturada}
            onBack={() => setStep(1)} onSubmit={handleSubmit} loading={loading} isDark={isDark} isEditMode={false} />
        )}
      </div>
    </motion.div>
  );
}

function Step1({ formData, parentescos, onChange, onNext, isDark }: any) {
  return (
    <div className="space-y-6">
      <div>
        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Parentesco <span className="text-red-500">*</span>
        </label>
        <select name="PARENTESCO" value={formData.PARENTESCO} onChange={onChange}
          className={`w-full px-4 py-3 rounded-lg border outline-none ${isDark ? 'bg-[#0d1f2d] border-[#0f83b2]/30 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
          <option value="">Seleccione parentesco</option>
          {parentescos.map((p: any) => <option key={p.id_parentesco} value={p.id_parentesco}>{p.parentesco}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['NOMBRE', 'A_PATERNO', 'A_MATERNO'].map(field => (
          <div key={field}>
            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {field === 'NOMBRE' ? 'Nombre' : field === 'A_PATERNO' ? 'Apellido Paterno' : 'Apellido Materno'} <span className="text-red-500">*</span>
            </label>
            <input type="text" name={field} value={formData[field]} onChange={onChange}
              className={`w-full px-4 py-3 rounded-lg border outline-none ${isDark ? 'bg-[#0d1f2d] border-[#0f83b2]/30 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Sexo <span className="text-red-500">*</span></label>
          <div className="flex gap-4">
                            {[['1', 'Femenino'], ['2', 'Masculino']].map(([val, label]) => (
              <label key={val} className={`flex items-center gap-2 cursor-pointer ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <input type="radio" name="SEXO" value={val} checked={formData.SEXO === val} onChange={onChange} className="w-4 h-4" />
                {label}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Fecha de Nacimiento <span className="text-red-500">*</span></label>
          <input type="date" name="F_NACIMIENTO" value={formData.F_NACIMIENTO} onChange={onChange}
            className={`w-full px-4 py-3 rounded-lg border outline-none ${isDark ? 'bg-[#0d1f2d] border-[#0f83b2]/30 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>CURP <span className="text-red-500">*</span></label>
          <input type="text" name="CURP" value={formData.CURP} onChange={onChange} maxLength={18}
            className={`w-full px-4 py-3 rounded-lg border outline-none ${isDark ? 'bg-[#0d1f2d] border-[#0f83b2]/30 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
          <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{formData.CURP.length}/18 caracteres</p>
        </div>
        <div>
          <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Tipo de Sangre <span className="text-red-500">*</span></label>
          <input type="text" name="SANGRE" value={formData.SANGRE} onChange={onChange} placeholder="Ej: O+, A-"
            className={`w-full px-4 py-3 rounded-lg border outline-none ${isDark ? 'bg-[#0d1f2d] border-[#0f83b2]/30 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
        </div>
      </div>

      <div>
        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Alergias</label>
        <textarea name="ALERGIAS" value={formData.ALERGIAS} onChange={onChange} rows={3} placeholder="Ingrese alergias..."
          className={`w-full px-4 py-3 rounded-lg border outline-none resize-none ${isDark ? 'bg-[#0d1f2d] border-[#0f83b2]/30 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Contacto de Emergencia</label>
          <input type="text" name="NOMBRE_EMERGENCIA" value={formData.NOMBRE_EMERGENCIA} onChange={onChange}
            className={`w-full px-4 py-3 rounded-lg border outline-none ${isDark ? 'bg-[#0d1f2d] border-[#0f83b2]/30 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
        </div>
        <div>
          <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Teléfono Emergencia</label>
          <input type="tel" name="TEL_EMERGENCIA" value={formData.TEL_EMERGENCIA} onChange={onChange} maxLength={10}
            className={`w-full px-4 py-3 rounded-lg border outline-none ${isDark ? 'bg-[#0d1f2d] border-[#0f83b2]/30 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[['ESDISCAPACITADO', '¿Es discapacitado?'], ['ESESTUDIANTE', '¿Es estudiante?']].map(([name, label]) => (
          <label key={name} className={`flex items-center gap-2 cursor-pointer ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <input type="checkbox" name={name} checked={formData[name]} onChange={onChange} className="w-4 h-4 rounded" />
            {label}
          </label>
        ))}
      </div>

      {formData.ESESTUDIANTE && (
        <div>
          <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Vigencia de Estudios</label>
          <input type="date" name="VIGENCIA_ESTUDIOS" value={formData.VIGENCIA_ESTUDIOS} onChange={onChange}
            className={`w-full px-4 py-3 rounded-lg border outline-none ${isDark ? 'bg-[#0d1f2d] border-[#0f83b2]/30 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={onNext} type="button"
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] text-white rounded-lg font-semibold hover:shadow-lg">
          Siguiente <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}

function Step2({ archivos, onFileChange, onFotoCapturada, onBack, onSubmit, loading, isDark, isEditMode }: any) {
  return (
    <div className="space-y-6">
      <CapturaFoto onFotoCapturada={onFotoCapturada} fotoActual={archivos.foto} isDark={isDark} />
      <hr className={isDark ? 'border-gray-700' : 'border-gray-200'} />
      <div>
        <h4 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Documentos (Opcionales)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[['curp', 'CURP'], ['acta_nac', 'Acta Nacimiento'], ['ine', 'INE'], ['constancia', 'Constancia'],
            ['acta_matrimonio', 'Acta Matrimonio'], ['concubinato', 'Concubinato'], ['no_isste', 'No. ISSTE'],
            ['incapacidad', 'Incapacidad'], ['dep_economica', 'Dep. Económica']].map(([name, label]) => (
            <div key={name}>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{label}</label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => onFileChange(e, name)}
                className={`w-full px-4 py-2 rounded-lg border text-sm ${isDark ? 'bg-[#0d1f2d] border-[#0f83b2]/30 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
              {archivos[name] && <p className="text-xs text-green-500 mt-1">✓ {archivos[name].name}</p>}
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-between">
        <button onClick={onBack} type="button"
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}>
          <ArrowLeft size={20} /> Anterior
        </button>
        <button onClick={onSubmit} type="button" disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50">
          {loading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</> : <><Save size={20} /> Guardar</>}
        </button>
      </div>
    </div>
  );
}

function FormularioEdicion({ formData, parentescos, archivos, documentosExistentes, onChange, onFileChange, onFotoCapturada, onSubmit, onCancel, loading, isDark }: any) {
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);
  const [nombreDocPrevia, setNombreDocPrevia] = useState<string>('');

  const handleVerDocumento = (url: string, nombre: string) => {
    setVistaPrevia(url);
    setNombreDocPrevia(nombre);
  };

  const cerrarVistaPrevia = () => {
    setVistaPrevia(null);
    setNombreDocPrevia('');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className={`rounded-xl border overflow-hidden ${isDark ? 'bg-[#0a1929] border-[#0f83b2]/30' : 'bg-white border-gray-200'}`}>

      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Edit size={24} />
            Editar Beneficiario
          </h3>
          <button onClick={onCancel} className="text-white/80 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        <p className="text-white/90 text-sm mt-1">Modifica los datos del beneficiario</p>
      </div>

      <div className="p-6 max-h-[80vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Sección Información Personal */}
          <div className={`rounded-lg border p-5 ${isDark ? 'bg-[#0d1f2d] border-[#0f83b2]/20' : 'bg-gray-50 border-gray-200'}`}>
            <h4 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Información Personal
            </h4>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Parentesco <span className="text-red-500">*</span>
                </label>
                <select name="PARENTESCO" value={formData.PARENTESCO} onChange={onChange}
                  className={`w-full px-4 py-3 rounded-lg border outline-none ${isDark ? 'bg-[#0a1929] border-[#0f83b2]/30 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                  <option value="">Seleccione parentesco</option>
                  {parentescos.map((p: any) => <option key={p.id_parentesco} value={p.id_parentesco}>{p.parentesco}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['NOMBRE', 'A_PATERNO', 'A_MATERNO'].map(field => (
                  <div key={field}>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {field === 'NOMBRE' ? 'Nombre' : field === 'A_PATERNO' ? 'Apellido Paterno' : 'Apellido Materno'} <span className="text-red-500">*</span>
                    </label>
                    <input type="text" name={field} value={formData[field]} onChange={onChange}
                      className={`w-full px-4 py-3 rounded-lg border outline-none ${isDark ? 'bg-[#0a1929] border-[#0f83b2]/30 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Sexo <span className="text-red-500">*</span></label>
                  <div className="flex gap-4">
                                    {[['1', 'Femenino'], ['2', 'Masculino']].map(([val, label]) => (
                      <label key={val} className={`flex items-center gap-2 cursor-pointer ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        <input type="radio" name="SEXO" value={val} checked={formData.SEXO === val} onChange={onChange} className="w-4 h-4" />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Fecha de Nacimiento <span className="text-red-500">*</span></label>
                  <input type="date" name="F_NACIMIENTO" value={formData.F_NACIMIENTO} onChange={onChange}
                    className={`w-full px-4 py-3 rounded-lg border outline-none ${isDark ? 'bg-[#0a1929] border-[#0f83b2]/30 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>CURP <span className="text-red-500">*</span></label>
                  <input type="text" name="CURP" value={formData.CURP} onChange={onChange} maxLength={18}
                    className={`w-full px-4 py-3 rounded-lg border outline-none ${isDark ? 'bg-[#0a1929] border-[#0f83b2]/30 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{formData.CURP.length}/18 caracteres</p>
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Tipo de Sangre <span className="text-red-500">*</span></label>
                  <input type="text" name="SANGRE" value={formData.SANGRE} onChange={onChange} placeholder="Ej: O+, A-"
                    className={`w-full px-4 py-3 rounded-lg border outline-none ${isDark ? 'bg-[#0a1929] border-[#0f83b2]/30 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Alergias</label>
                <textarea name="ALERGIAS" value={formData.ALERGIAS} onChange={onChange} rows={3} placeholder="Ingrese alergias..."
                  className={`w-full px-4 py-3 rounded-lg border outline-none resize-none ${isDark ? 'bg-[#0a1929] border-[#0f83b2]/30 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Contacto de Emergencia</label>
                  <input type="text" name="NOMBRE_EMERGENCIA" value={formData.NOMBRE_EMERGENCIA} onChange={onChange}
                    className={`w-full px-4 py-3 rounded-lg border outline-none ${isDark ? 'bg-[#0a1929] border-[#0f83b2]/30 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Teléfono Emergencia</label>
                  <input type="tel" name="TEL_EMERGENCIA" value={formData.TEL_EMERGENCIA} onChange={onChange} maxLength={10}
                    className={`w-full px-4 py-3 rounded-lg border outline-none ${isDark ? 'bg-[#0a1929] border-[#0f83b2]/30 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[['ESDISCAPACITADO', '¿Es discapacitado?'], ['ESESTUDIANTE', '¿Es estudiante?']].map(([name, label]) => (
                  <label key={name} className={`flex items-center gap-2 cursor-pointer ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <input type="checkbox" name={name} checked={formData[name]} onChange={onChange} className="w-4 h-4 rounded" />
                    {label}
                  </label>
                ))}
              </div>

              {formData.ESESTUDIANTE && (
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Vigencia de Estudios</label>
                  <input type="date" name="VIGENCIA_ESTUDIOS" value={formData.VIGENCIA_ESTUDIOS} onChange={onChange}
                    className={`w-full px-4 py-3 rounded-lg border outline-none ${isDark ? 'bg-[#0a1929] border-[#0f83b2]/30 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                </div>
              )}
            </div>
          </div>

          {/* Sección Fotografía */}
          <div className={`rounded-lg border p-5 ${isDark ? 'bg-[#0d1f2d] border-[#0f83b2]/20' : 'bg-gray-50 border-gray-200'}`}>
            <h4 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Fotografía
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className={`rounded-lg border p-5 ${isDark ? 'bg-[#0d1f2d] border-[#0f83b2]/20' : 'bg-gray-50 border-gray-200'}`}>
            <h4 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Fotografía
            </h4>
            <CapturaFoto onFotoCapturada={onFotoCapturada} fotoActual={archivos.foto} isDark={isDark} />
          </div>
              </div>
              {documentosExistentes.foto && !archivos.foto && (
                <div>
                  <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Foto Actual</p>
                  <img src={documentosExistentes.foto} alt="Foto actual" className="w-full h-48 object-cover rounded-lg border-2 border-green-500" />
                  <p className="text-xs text-green-500 mt-2">✓ Foto registrada</p>
                </div>
              )}
            </div>
          </div>

          {/* Sección Documentos */}
          <div className={`rounded-lg border p-5 ${isDark ? 'bg-[#0d1f2d] border-[#0f83b2]/20' : 'bg-gray-50 border-gray-200'}`}>
            <h4 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Documentos
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                ['curp', 'CURP'],
                ['acta_nac', 'Acta Nacimiento'],
                ['ine', 'INE'],
                ['constancia', 'Constancia'],
                ['acta_matrimonio', 'Acta Matrimonio'],
                ['concubinato', 'Concubinato'],
                ['no_isste', 'No. ISSTE'],
                ['incapacidad', 'Incapacidad'],
                ['dep_economica', 'Dep. Económica']
              ].map(([name, label]) => (
                <div key={name} className={`p-3 rounded-lg border ${isDark ? 'border-[#0f83b2]/20' : 'border-gray-200'}`}>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{label}</label>

                  {/* Documento Existente */}
                  {documentosExistentes[name] && (
                    <div className="mb-2">
                      <button
                        type="button"
                        onClick={() => handleVerDocumento(documentosExistentes[name], label)}
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
                    onChange={(e) => onFileChange(e, name)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-[#0a1929] border-[#0f83b2]/30 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />

                  {archivos[name] && (
                    <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                      <ArrowRight size={12} />
                      Nuevo: {archivos[name].name}
                    </p>
                  )}

                  {!documentosExistentes[name] && !archivos[name] && (
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Sin documento</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={onCancel}
              type="button"
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                isDark
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}
            >
              Cancelar
            </button>
            <button
              onClick={onSubmit}
              type="button"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Actualizando...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Actualizar Beneficiario
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal Vista Previa */}
      {vistaPrevia && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={cerrarVistaPrevia}>
          <div className={`max-w-4xl w-full max-h-[90vh] rounded-xl overflow-hidden ${isDark ? 'bg-[#0a1929]' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
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
        </div>
      )}
    </motion.div>
  );
}