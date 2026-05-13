// src/hooks/farmacia/useInventario.ts

import { useState } from 'react';
import type {
  InventarioMedicamento,
  InventarioForm,
  InventarioResponse,
  InventarioItemResponse,
  FiltrosInventario,
} from '@/types/farmacia/medicamentos';

export function useInventario() {
  const [inventario, setInventario] = useState<InventarioMedicamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const obtenerInventario = async (filtros?: FiltrosInventario) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();

      if (filtros?.busqueda) params.append('busqueda', filtros.busqueda);
      if (filtros?.cuadro_basico !== undefined) params.append('cuadro_basico', filtros.cuadro_basico.toString());
      if (filtros?.estado_fondo) params.append('estado_fondo', filtros.estado_fondo);

      const response = await fetch(`/api/farmacia/inventario?${params.toString()}`);
      const data: InventarioResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al obtener inventario');
      }

      setInventario(data.data || []);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const actualizarInventario = async (idInventario: number, datos: InventarioForm) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/farmacia/inventario/${idInventario}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datos),
      });

      const data: InventarioItemResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al actualizar inventario');
      }

      // Actualizar el inventario local
      setInventario((prev) =>
        prev.map((item) =>
          item.id_inventario === idInventario
            ? { ...item, ...datos, updated_at: new Date().toISOString() }
            : item
        )
      );

      return data.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    inventario,
    loading,
    error,
    obtenerInventario,
    actualizarInventario,
  };
}
