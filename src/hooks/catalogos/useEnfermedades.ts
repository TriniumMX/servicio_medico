import { useState, useEffect, useCallback } from 'react';
import type { EnfermedadCronica } from '@/types/catalogos/enfermedades';
import Swal from 'sweetalert2';

export const useEnfermedades = () => {
  const [enfermedades, setEnfermedades] = useState<EnfermedadCronica[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEnfermedades = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/catalogos/enfermedades');
      const data = await res.json();
      if (data.success) setEnfermedades(data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const guardarEnfermedad = async (item: Partial<EnfermedadCronica>) => {
    setLoading(true);
    try {
      const method = item.id_enfermedad ? 'PUT' : 'POST';
      const res = await fetch('/api/catalogos/enfermedades', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const data = await res.json();
      
      if (data.success) {
        Swal.fire('Éxito', data.message, 'success');
        await fetchEnfermedades();
        return true;
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

const toggleStatus = async (id: number, estatusActual: boolean) => {
    setLoading(true);
    try {
      // NOTA: Aquí NO enviamos 'kpis', solo el id y el activo invertido.
      // La API detectará que no hay KPIs y no borrará nada.
      const res = await fetch('/api/catalogos/enfermedades', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id_enfermedad: id, 
          activo: !estatusActual 
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        // Recargamos la lista para ver el cambio de pestaña
        await fetchEnfermedades(); 
        // Opcional: Mostrar alerta pequeña
        const Toast = Swal.mixin({
            toast: true, position: 'top-end', showConfirmButton: false, timer: 3000
        });
        Toast.fire({ icon: 'success', title: 'Estatus actualizado' });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return { enfermedades, loading, fetchEnfermedades, guardarEnfermedad, toggleStatus };
};