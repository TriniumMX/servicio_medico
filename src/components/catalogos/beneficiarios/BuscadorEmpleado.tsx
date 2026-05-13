// src/components/catalogos/beneficiarios/BuscadorEmpleado.tsx

'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface BuscadorEmpleadoProps {
  onBuscar: (numNom: string) => void;
  loading: boolean;
  isDark: boolean;
}

export default function BuscadorEmpleado({ onBuscar, loading, isDark }: BuscadorEmpleadoProps) {
  const [numNom, setNumNom] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numNom.trim()) {
      onBuscar(numNom.trim());
    }
  };

  const handleLimpiar = () => {
    setNumNom('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl p-6 shadow-lg border ${
        isDark
          ? 'bg-[#0a1929] border-[#0f83b2]/30'
          : 'bg-white border-gray-200'
      }`}
    >
      <h2
        className={`text-xl font-bold mb-4 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}
      >
        Buscar Empleado
      </h2>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={numNom}
            onChange={(e) => setNumNom(e.target.value)}
            placeholder="Ingrese número de nómina..."
            disabled={loading}
            className={`w-full px-4 py-3 rounded-lg border outline-none transition-all ${
              isDark
                ? 'bg-[#0d1f2d] border-[#0f83b2]/30 text-white placeholder-gray-500 focus:border-[#0db1ec]'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#0f83b2]'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          />
          
          {numNom && !loading && (
            <button
              type="button"
              onClick={handleLimpiar}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${
                isDark
                  ? 'hover:bg-[#0f83b2]/20 text-gray-400'
                  : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={!numNom.trim() || loading}
          className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
            isDark
              ? 'bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] text-white hover:shadow-lg hover:shadow-[#0db1ec]/30'
              : 'bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] text-white hover:shadow-lg'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Buscando...</span>
            </>
          ) : (
            <>
              <Search size={20} />
              <span>Buscar</span>
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}