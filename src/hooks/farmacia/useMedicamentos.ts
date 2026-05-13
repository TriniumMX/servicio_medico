// src/hooks/farmacia/useMedicamentos.ts

import { useState, useCallback } from 'react';
import type { Medicamento, MedicamentoForm } from '@/types/farmacia/medicamentos';

interface FiltrosMedicamentos {
  busqueda?: string;
  activos?: boolean;
  clasificacion?: string;
  sinEan?: boolean;
}

export const useMedicamentos = () => {
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener todos los medicamentos con filtros opcionales
  const obtenerMedicamentos = useCallback(async (filtros?: FiltrosMedicamentos) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (filtros?.busqueda) {
        params.append('busqueda', filtros.busqueda);
      }

      if (filtros?.activos !== undefined) {
        params.append('activos', filtros.activos.toString());
      }

      if (filtros?.clasificacion) {
        params.append('clasificacion', filtros.clasificacion);
      }

      if (filtros?.sinEan) {
        params.append('sinEan', 'true');
      }

      const url = `/api/farmacia/medicamentos${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener medicamentos');
      }

      if (data.success && data.data) {
        setMedicamentos(data.data);
        return data.data;
      } else {
        setMedicamentos([]);
        return [];
      }
    } catch (err: any) {
      setError(err.message);
      setMedicamentos([]);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener un medicamento por ID
  const obtenerMedicamento = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/farmacia/medicamentos/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener medicamento');
      }

      if (data.success && data.data) {
        return data.data;
      }

      throw new Error('No se pudo obtener el medicamento');
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear nuevo medicamento
  const crearMedicamento = useCallback(async (medicamento: MedicamentoForm) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/farmacia/medicamentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(medicamento),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear medicamento');
      }

      if (data.success) {
        // Actualizar lista local
        await obtenerMedicamentos();
        return data.data;
      }

      throw new Error('No se pudo crear el medicamento');
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [obtenerMedicamentos]);

  // Actualizar medicamento
  const actualizarMedicamento = useCallback(async (id: number, medicamento: MedicamentoForm & { activo?: boolean }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/farmacia/medicamentos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(medicamento),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar medicamento');
      }

      if (data.success) {
        // Actualizar lista local
        await obtenerMedicamentos();
        return data.data;
      }

      throw new Error('No se pudo actualizar el medicamento');
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [obtenerMedicamentos]);

  // Desactivar medicamento
  const desactivarMedicamento = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/farmacia/medicamentos/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al desactivar medicamento');
      }

      if (data.success) {
        // Actualizar lista local
        await obtenerMedicamentos();
        return true;
      }

      throw new Error('No se pudo desactivar el medicamento');
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [obtenerMedicamentos]);

  return {
    medicamentos,
    loading,
    error,
    obtenerMedicamentos,
    obtenerMedicamento,
    crearMedicamento,
    actualizarMedicamento,
    desactivarMedicamento,
  };
};
