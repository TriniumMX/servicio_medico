// src/hooks/catalogos/useEmpleado.ts

import { useState } from 'react';
import type { Empleado, EmpleadoResponse } from '@/types/catalogos/empleado';

export const useEmpleado = () => {
  const [empleado, setEmpleado] = useState<Empleado | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarEmpleado = async (num_nom: string) => {
    setLoading(true);
    setError(null);
    setEmpleado(null);

    try {
      const response = await fetch('/api/webService/empleado', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ num_nom }),
      });

      const data: EmpleadoResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al buscar empleado');
      }

      if (data.success && data.data) {
        setEmpleado(data.data);
        return data.data;
      } else {
        throw new Error('No se encontró el empleado');
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const limpiarEmpleado = () => {
    setEmpleado(null);
    setError(null);
  };

  return {
    empleado,
    loading,
    error,
    buscarEmpleado,
    limpiarEmpleado,
  };
};