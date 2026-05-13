// src/hooks/consultas/useConsultas.ts

import { useState, useEffect, useCallback } from 'react';
import type { SignosVitales } from '@/types/consultas';

export function useConsultas(clavestatus: number, autoLoad: boolean = true) {
  const [consultas, setConsultas] = useState<SignosVitales[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarConsultas = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/consultas/hoy?clavestatus=${clavestatus}`);
      const data = await response.json();

      if (response.ok && data.success) {
        // Ordenar por fecha de registro (más recientes primero)
        const consultasOrdenadas = data.consultas?.sort(
          (a: SignosVitales, b: SignosVitales) =>
            new Date(b.fecha_registro || 0).getTime() - new Date(a.fecha_registro || 0).getTime()
        ) || [];

        setConsultas(consultasOrdenadas);
      } else {
        setError(data.error || 'Error al cargar consultas');
      }
    } catch (err: any) {
      console.error('Error al cargar consultas:', err);
      setError('Error al cargar signos vitales del día');
    } finally {
      setLoading(false);
    }
  }, [clavestatus]);

  useEffect(() => {
    if (autoLoad) {
      cargarConsultas();
    }
  }, [cargarConsultas, autoLoad]);

  return {
    consultas,
    loading,
    error,
    recargar: cargarConsultas,
  };
}
