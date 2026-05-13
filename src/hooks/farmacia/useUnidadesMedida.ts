// src/hooks/farmacia/useUnidadesMedida.ts

import { useState, useCallback } from 'react';
import type { UnidadMedida, UnidadMedidaForm } from '@/types/farmacia/unidades-medida';

export const useUnidadesMedida = () => {
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener todas las unidades de medida
  const obtenerUnidades = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/farmacia/unidades-medida');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener unidades de medida');
      }

      if (data.success && data.data) {
        setUnidades(data.data);
        return data.data;
      } else {
        setUnidades([]);
        return [];
      }
    } catch (err: any) {
      setError(err.message);
      setUnidades([]);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear nueva unidad de medida
  const crearUnidad = useCallback(async (unidad: UnidadMedidaForm) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/farmacia/unidades-medida', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(unidad),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear unidad de medida');
      }

      if (data.success) {
        // Actualizar lista local
        await obtenerUnidades();
        return data.data;
      }

      throw new Error('No se pudo crear la unidad de medida');
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [obtenerUnidades]);

  // Actualizar unidad de medida
  const actualizarUnidad = useCallback(async (id: number, unidad: UnidadMedidaForm) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/farmacia/unidades-medida/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(unidad),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar unidad de medida');
      }

      if (data.success) {
        // Actualizar lista local
        await obtenerUnidades();
        return data.data;
      }

      throw new Error('No se pudo actualizar la unidad de medida');
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [obtenerUnidades]);

  // Eliminar unidad de medida
  const eliminarUnidad = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/farmacia/unidades-medida/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar unidad de medida');
      }

      if (data.success) {
        // Actualizar lista local
        await obtenerUnidades();
        return true;
      }

      throw new Error('No se pudo eliminar la unidad de medida');
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [obtenerUnidades]);

  return {
    unidades,
    loading,
    error,
    obtenerUnidades,
    crearUnidad,
    actualizarUnidad,
    eliminarUnidad,
  };
};
