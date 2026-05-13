// src/components/farmacia/alertas/BotonEnviarAlerta.tsx

'use client';

import { useState } from 'react';
import { Send, Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { EnviarAlertaResponse, ResumenAlertas } from '@/types/alertas-fondos';

interface BotonEnviarAlertaProps {
  onEnviar: () => Promise<EnviarAlertaResponse>;
  resumen: ResumenAlertas | null;
  correosActivos: number;
  loading?: boolean;
  isDark: boolean;
}

export function BotonEnviarAlerta({
  onEnviar,
  resumen,
  correosActivos,
  loading = false,
  isDark,
}: BotonEnviarAlertaProps) {
  const [resultado, setResultado] = useState<{
    tipo: 'success' | 'error' | 'warning';
    mensaje: string;
  } | null>(null);

  const handleEnviar = async () => {
    setResultado(null);

    try {
      const response = await onEnviar();

      if (response.success) {
        setResultado({
          tipo: 'success',
          mensaje: response.message || `Alerta enviada a ${response.destinatarios} destinatario(s)`,
        });
      } else {
        setResultado({
          tipo: 'error',
          mensaje: response.error || 'Error al enviar alerta',
        });
      }
    } catch (error: any) {
      setResultado({
        tipo: 'error',
        mensaje: error.message || 'Error al enviar alerta',
      });
    }

    // Limpiar mensaje despues de 5 segundos
    setTimeout(() => setResultado(null), 5000);
  };

  const hayAlertas = resumen && resumen.total_alertas > 0;
  const hayCorreos = correosActivos > 0;

  // Determinar si el boton debe estar deshabilitado
  const deshabilitado = loading || !hayAlertas || !hayCorreos;

  // Mensaje de ayuda
  let mensajeAyuda = '';
  if (!hayCorreos) {
    mensajeAyuda = 'Agrega al menos un correo activo para enviar alertas';
  } else if (!hayAlertas) {
    mensajeAyuda = 'No hay medicamentos con alerta para notificar';
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleEnviar}
        disabled={deshabilitado}
        className={`relative w-full group flex items-center justify-center px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 shadow-md border ${
          deshabilitado
            ? isDark
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none border-slate-700'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border-slate-200'
            : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 border-transparent'
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            <span className="tracking-wide">ENVIANDO...</span>
          </>
        ) : (
          <>
            <Send className="h-5 w-5 mr-2 group-hover:translate-x-1 transition-transform" />
            <span className="tracking-wide">ENVIAR ALERTA AHORA</span>
          </>
        )}
      </button>

      {/* Mensaje de ayuda */}
      {mensajeAyuda && (
        <div className={`flex items-start p-3 rounded-xl border ${
          isDark ? 'bg-amber-900/20 border-amber-900/30' : 'bg-amber-50 border-amber-100'
        }`}>
          <AlertTriangle className={`h-5 w-5 mr-2 flex-shrink-0 mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
          <p className={`text-sm ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>{mensajeAyuda}</p>
        </div>
      )}

      {/* Info de envio */}
      {hayCorreos && hayAlertas && !resultado && (
        <div className="text-center">
          <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Se notificará a <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{correosActivos} usuarios</span> sobre <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{resumen?.total_alertas} alertas</span>
          </p>
        </div>
      )}

      {/* Resultado */}
      {resultado && (
        <div
          className={`flex items-start p-4 rounded-xl border backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-300 ${
            resultado.tipo === 'success'
              ? isDark
                ? 'bg-green-900/20 border-green-800 text-green-300'
                : 'bg-green-50/80 border-green-200 text-green-800'
              : resultado.tipo === 'warning'
                ? isDark
                  ? 'bg-amber-900/20 border-amber-800 text-amber-300'
                  : 'bg-amber-50/80 border-amber-200 text-amber-800'
                : isDark
                  ? 'bg-red-900/20 border-red-800 text-red-300'
                  : 'bg-red-50/80 border-red-200 text-red-800'
          }`}
        >
          {resultado.tipo === 'success' ? (
            <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
          ) : resultado.tipo === 'warning' ? (
            <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0" />
          ) : (
            <XCircle className="h-5 w-5 mr-3 flex-shrink-0" />
          )}
          <span className="text-sm font-medium leading-tight">{resultado.mensaje}</span>
        </div>
      )}
    </div>
  );
}
