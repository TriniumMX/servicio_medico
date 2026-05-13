// src/components/catalogos/beneficiarios/CardEmpleado.tsx

'use client';

import { motion } from 'framer-motion';
import { User, Briefcase, Building2, Droplet, Hash, CheckCircle2, XCircle } from 'lucide-react';
import type { Empleado } from '@/types/catalogos/empleado';

interface CardEmpleadoProps {
  empleado: Empleado;
  isDark: boolean;
}

export default function CardEmpleado({ empleado, isDark }: CardEmpleadoProps) {
  const nombreCompleto = [empleado.nombre, empleado.a_paterno, empleado.a_materno]
    .filter(Boolean).join(' ') || 'N/A';
  
  const esActivo = empleado.activo === 'A' || empleado.activo === true;
  
  const sindicato = empleado.grupoNomina === 'NS' 
    ? empleado.cuotaSindical === 'S' ? 'SUTSMSJR' : empleado.cuotaSindical === '' ? 'SITAM' : null
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl shadow-lg border overflow-hidden ${
        isDark ? 'bg-[#0a1929] border-[#0f83b2]/30' : 'bg-white border-gray-200'
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User size={24} className="text-white" />
            <div>
              <h3 className="text-xl font-bold text-white">{nombreCompleto}</h3>
              <p className="text-white/80 text-sm">#{empleado.num_nom}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full flex items-center gap-1.5 ${
            esActivo ? 'bg-green-500' : 'bg-red-500'
          }`}>
            {esActivo ? <CheckCircle2 size={16} className="text-white" /> : <XCircle size={16} className="text-white" />}
            <span className="text-white text-sm font-semibold">
              {esActivo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="p-6 grid grid-cols-4 gap-4">
        <InfoItem icon={<Briefcase size={18} />} label="Puesto" value={empleado.puesto} isDark={isDark} />
        <InfoItem icon={<Building2 size={18} />} label="Departamento" value={empleado.departamento} isDark={isDark} />
        <InfoItem icon={<Droplet size={18} />} label="Tipo de Sangre" value={empleado.tipo_sangre} isDark={isDark} />
        
        {sindicato ? (
          <div className={`p-3 rounded-lg ${isDark ? 'bg-[#0d1f2d]' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-2 text-[#0db1ec]">
              <Hash size={18} />
              <span className="text-xs font-semibold uppercase">Sindicato</span>
            </div>
            <div className={`inline-block px-3 py-1 rounded-md text-xs font-semibold border ${
              sindicato === 'SUTSMSJR' 
                ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' 
                : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
            }`}>
              {sindicato}
            </div>
          </div>
        ) : (
          <div className={`p-3 rounded-lg ${isDark ? 'bg-[#0d1f2d]' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-2 text-[#0db1ec]">
              <Hash size={18} />
              <span className="text-xs font-semibold uppercase">Sindicato</span>
            </div>
            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              N/A
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function InfoItem({ icon, label, value, isDark }: any) {
  return (
    <div className={`p-3 rounded-lg ${isDark ? 'bg-[#0d1f2d]' : 'bg-gray-50'}`}>
      <div className="flex items-center gap-2 mb-2 text-[#0db1ec]">
        {icon}
        <span className="text-xs font-semibold uppercase">{label}</span>
      </div>
      <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {value || 'N/A'}
      </p>
    </div>
  );
}