import { useState, useEffect, useCallback } from 'react';
import type { EstudioLaboratorio } from '@/types/catalogos/laboratorio';
import Swal from 'sweetalert2';

export const useLaboratorio = () => {
  const [estudios, setEstudios] = useState<EstudioLaboratorio[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEstudios = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/catalogos/laboratorio');
      const data = await res.json();
      if (data.success) setEstudios(data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const guardarEstudio = async (item: Partial<EstudioLaboratorio>) => {
    setLoading(true);
    try {
      const method = item.id_estudio ? 'PUT' : 'POST';
      const res = await fetch('/api/catalogos/laboratorio', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const data = await res.json();
      
      if (data.success) {
        Swal.fire('Éxito', data.message, 'success');
        await fetchEstudios();
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
    // Cambio rápido sin loading global para mejor UX en el switch
    try {
      await fetch('/api/catalogos/laboratorio', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_estudio: id, activo: !estatusActual }),
      });
      await fetchEstudios();
    } catch (error) {
      console.error(error);
    }
  };

  return { estudios, loading, fetchEstudios, guardarEstudio, toggleStatus };
};