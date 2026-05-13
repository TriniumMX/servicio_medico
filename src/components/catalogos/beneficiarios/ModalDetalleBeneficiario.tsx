// src/components/catalogos/beneficiarios/ModalDetalleBeneficiario.tsx

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Calendar, Droplet, Phone, Heart, FileText, Download, ExternalLink } from 'lucide-react';
import type { Beneficiario } from '@/types/catalogos/beneficiarios';

interface ModalDetalleBeneficiarioProps {
  beneficiario: Beneficiario | null;
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

export default function ModalDetalleBeneficiario({ beneficiario, isOpen, onClose, isDark }: ModalDetalleBeneficiarioProps) {
  if (!beneficiario) return null;

  const nombreCompleto = [beneficiario.NOMBRE, beneficiario.A_PATERNO, beneficiario.A_MATERNO]
    .filter(Boolean).join(' ');

  const formatFecha = (fecha: string) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-MX', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const calcularEdad = (fechaNacimiento: string): number => {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`w-full max-w-6xl my-8 rounded-2xl shadow-2xl overflow-hidden ${
                isDark ? 'bg-[#0a1929]' : 'bg-white'
              }`}
            >
              {/* Header con Foto - Optimizado */}
              <div className="relative bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] p-6">
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X size={20} className="text-white" />
                </button>
                
                <div className="flex items-center gap-4">
                  {/* Foto */}
                  <div className="flex-shrink-0">
                    {beneficiario.FOTO_URL ? (
                      <img
                        src={beneficiario.FOTO_URL}
                        alt={nombreCompleto}
                        className="w-24 h-24 rounded-lg object-cover border-2 border-white shadow-lg"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="96" height="96"%3E%3Crect fill="%23e5e7eb" width="96" height="96"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="48" fill="%239ca3af"%3E?%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-lg bg-white/10 flex items-center justify-center">
                        <User size={40} className="text-white/50" />
                      </div>
                    )}
                  </div>

                  {/* Info Principal */}
                  <div className="flex-1 text-white">
                    <h2 className="text-2xl font-bold mb-3">{nombreCompleto}</h2>
                    <div className="grid grid-cols-4 gap-2">
                      <InfoChip icon={<User size={14} />} label="Parentesco" value={beneficiario.PARENTESCO_NOMBRE || 'N/A'} />
                      <InfoChip icon={<Calendar size={14} />} label="Edad" value={`${calcularEdad(beneficiario.F_NACIMIENTO)} años`} />
                      <InfoChip icon={<Droplet size={14} />} label="Sangre" value={beneficiario.SANGRE || 'N/A'} />
                      <InfoChip icon={<User size={14} />} label="Sexo" value={beneficiario.SEXO === 'M' ? 'Masculino' : 'Femenino'} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contenido en 2 columnas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                
                {/* Columna Izquierda */}
                <div className="space-y-4">
                  
                  {/* Información Personal */}
                  <Section title="Información Personal" icon={<User size={18} />} isDark={isDark}>
                    <div className="space-y-2">
                      <Field label="CURP" value={beneficiario.CURP} isDark={isDark} />
                      <Field label="Fecha de Nacimiento" value={formatFecha(beneficiario.F_NACIMIENTO)} isDark={isDark} />
                      <Field label="Número de Nómina" value={beneficiario.NO_NOMINA} isDark={isDark} />
                    </div>
                  </Section>

                  {/* Contacto de Emergencia */}
                  <Section title="Contacto de Emergencia" icon={<Phone size={18} />} isDark={isDark}>
                    <div className="space-y-2">
                      <Field label="Nombre" value={beneficiario.NOMBRE_EMERGENCIA} isDark={isDark} />
                      <Field label="Teléfono" value={beneficiario.TEL_EMERGENCIA} isDark={isDark} />
                    </div>
                  </Section>

                  {/* Información Médica */}
                  <Section title="Información Médica" icon={<Heart size={18} />} isDark={isDark}>
                    <div className="space-y-2">
                      <Field label="Alergias" value={beneficiario.ALERGIAS || 'Ninguna'} isDark={isDark} />
                      <div className="grid grid-cols-2 gap-2">
                        <Badge label="Discapacitado" value={beneficiario.ESDISCAPACITADO} isDark={isDark} />
                        <Badge label="Estudiante" value={beneficiario.ESESTUDIANTE} isDark={isDark} />
                      </div>
                      {beneficiario.ESESTUDIANTE && beneficiario.VIGENCIA_ESTUDIOS && (
                        <Field label="Vigencia de Estudios" value={formatFecha(beneficiario.VIGENCIA_ESTUDIOS)} isDark={isDark} />
                      )}
                    </div>
                  </Section>

                </div>

                {/* Columna Derecha - Documentos */}
                <div>
                  <Section title="Documentos" icon={<FileText size={18} />} isDark={isDark}>
                    <div className="space-y-2">
                      <DocLink label="CURP" url={beneficiario.URL_CURP} isDark={isDark} />
                      <DocLink label="Acta de Nacimiento" url={beneficiario.URL_ACTA_NAC} isDark={isDark} />
                      <DocLink label="INE/Identificación" url={beneficiario.URL_INE} isDark={isDark} />
                      <DocLink label="Constancia de Estudios" url={beneficiario.URL_CONSTANCIA} isDark={isDark} />
                      <DocLink label="Acta de Matrimonio" url={beneficiario.URL_ACTAMATRIMONIO} isDark={isDark} />
                      <DocLink label="Constancia de Concubinato" url={beneficiario.URL_CONCUBINATO} isDark={isDark} />
                      <DocLink label="Número ISSTE" url={beneficiario.URL_NOISSTE} isDark={isDark} />
                      <DocLink label="Acta Dep. Económica" url={beneficiario.URL_ACTADEPENDENCIAECONOMICA} isDark={isDark} />
                      <DocLink label="Cert. Incapacidad" url={beneficiario.URL_INCAP} isDark={isDark} />
                    </div>
                  </Section>
                </div>

              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function InfoChip({ icon, label, value }: any) {
  return (
    <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2 py-1.5">
      <div className="text-white/80">{icon}</div>
      <div>
        <p className="text-white/60 text-[10px]">{label}</p>
        <p className="text-white font-semibold text-xs">{value}</p>
      </div>
    </div>
  );
}

function Section({ title, icon, children, isDark }: any) {
  return (
    <div className={`rounded-lg border p-4 ${
      isDark ? 'bg-[#0d1f2d] border-[#0f83b2]/20' : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="text-[#0db1ec]">{icon}</div>
        <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, isDark }: any) {
  return (
    <div>
      <p className={`text-xs font-semibold uppercase mb-1 ${
        isDark ? 'text-gray-400' : 'text-gray-600'
      }`}>
        {label}
      </p>
      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {value || 'N/A'}
      </p>
    </div>
  );
}

function Badge({ label, value, isDark }: any) {
  return (
    <div className={`rounded-lg p-3 border ${
      value
        ? isDark ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200'
        : isDark ? 'bg-gray-700/30 border-gray-600/30' : 'bg-gray-100 border-gray-300'
    }`}>
      <p className={`text-xs font-semibold ${
        value
          ? 'text-green-400'
          : isDark ? 'text-gray-400' : 'text-gray-500'
      }`}>
        {label}
      </p>
      <p className={`text-sm font-bold mt-1 ${
        value
          ? 'text-green-400'
          : isDark ? 'text-gray-400' : 'text-gray-500'
      }`}>
        {value ? 'Sí' : 'No'}
      </p>
    </div>
  );
}

function DocLink({ label, url, isDark }: any) {
  const tieneDoc = url && url.trim() !== '';
  
  if (!tieneDoc) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-between p-2.5 rounded-lg border transition-all group ${
        isDark
          ? 'bg-[#0a1929] border-[#0f83b2]/30 hover:border-[#0db1ec]'
          : 'bg-white border-gray-200 hover:border-[#0f83b2]'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded ${
          isDark ? 'bg-[#0f83b2]/10' : 'bg-[#0f83b2]/5'
        }`}>
          <FileText size={16} className="text-[#0db1ec]" />
        </div>
        <span className={`font-medium text-xs ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          {label}
        </span>
      </div>
      <ExternalLink 
        size={14} 
        className={`transition-transform group-hover:translate-x-1 ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`}
      />
    </a>
  );
}