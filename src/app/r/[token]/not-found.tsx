// src/app/r/[token]/not-found.tsx
import Link from 'next/link';
import { AlertTriangle, Shield, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#020817] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[#0a1929] border border-gray-800 rounded-2xl shadow-lg shadow-black/20 p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full mb-4">
            <AlertTriangle className="text-red-400" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Receta no encontrada
          </h1>
          <p className="text-gray-400">
            El enlace que intentas acceder no es válido o ha expirado.
          </p>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
          <p className="text-sm text-amber-300 font-medium mb-2">
            Posibles causas:
          </p>
          <ul className="text-xs text-amber-400/80 space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">•</span>
              <span>El enlace ha expirado (vigencia de 12 meses)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">•</span>
              <span>El enlace fue copiado incorrectamente</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">•</span>
              <span>El acceso fue revocado</span>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-400 text-center">
            Si necesitas acceder a esta receta, contacta con el servicio médico.
          </p>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            <Home size={18} />
            Ir al inicio
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-800 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <Shield size={14} />
            <span>Sistema Médico SJR 2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
