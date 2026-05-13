// src/components/farmacia/surtimiento/CardInfoReceta.tsx
'use client';

import { RecetaCompleta } from '@/types/farmacia/surtimiento';
import { User, Calendar, FileText, Stethoscope, Hash } from 'lucide-react';

interface CardInfoRecetaProps {
  receta: RecetaCompleta;
  isDark: boolean;
  onNuevaReceta: () => void;
}

export default function CardInfoReceta({ receta, isDark }: CardInfoRecetaProps) {
  const fechaEmision = new Date(receta.receta.fecha_emision).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="space-y-6">
      {/* Patient Card */}
      <div className={`p-6 rounded-2xl relative overflow-hidden transition-all
         ${isDark
          ? 'bg-[#0a1929] border border-gray-800 shadow-lg shadow-black/20'
          : 'bg-white border border-gray-100 shadow-md shadow-gray-100'
        }
      `}>
        {/* Decorative Background Element */}
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-10
            ${isDark ? 'bg-blue-500' : 'bg-blue-600'}
         `} />

        <div className="relative mb-6">
          <h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
            <User size={20} /> Datos del Paciente
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
          <div>
            <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Nombre Completo</p>
            <p className={`text-xl font-bold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {receta.paciente.nombre_completo}
            </p>
          </div>
          <div>
            <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No. Nómina</p>
            <p className={`text-lg font-mono font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {receta.paciente.nomina}
            </p>
          </div>
        </div>
      </div>

      {/* Prescription Card */}
      <div className={`p-6 rounded-2xl relative overflow-hidden transition-all
         ${isDark
          ? 'bg-[#0a1929] border border-gray-800 shadow-lg shadow-black/20'
          : 'bg-white border border-gray-100 shadow-md shadow-gray-100'
        }
      `}>
        <div className="relative mb-6">
          <h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
            <FileText size={20} /> Detalles de la Receta
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
              <Hash size={18} />
            </div>
            <div>
              <p className={`text-xs font-bold uppercase mb-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Vigencia (Días)</p>
              <p className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                {receta.receta.vigencia_dias} días
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
              <Calendar size={18} />
            </div>
            <div>
              <p className={`text-xs font-bold uppercase mb-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Fecha Emisión</p>
              <p className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                {fechaEmision}
              </p>
            </div>
          </div>

          <div className="md:col-span-2 flex items-start gap-3">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
              <Stethoscope size={18} />
            </div>
            <div>
              <p className={`text-xs font-bold uppercase mb-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Diagnóstico</p>
              <p className={`font-medium italic leading-relaxed ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                {receta.consulta.diagnostico}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

