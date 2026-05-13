// src/hooks/catalogos/useHospitales.ts

import { useState, useEffect, useCallback } from 'react';
import { HospitalesService } from '@/services/catalogos/hospitalesService';
import type { Hospital } from '@/types/catalogos/hospitales';
import Swal from 'sweetalert2';

export const useHospitales = () => {
  const [hospitales, setHospitales] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);

  const cargarHospitales = useCallback(async () => {
    setLoading(true);
    try {
      const data = await HospitalesService.getAll();
      setHospitales(data);
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Función unificada para Guardar (Crear o Editar)
  const guardarHospital = async (hospital: Partial<Hospital>) => {
    setLoading(true);
    try {
      if (hospital.id_hospital) {
        // Si tiene ID, es EDITAR
        await HospitalesService.update(hospital);
        Swal.fire('Actualizado', 'El hospital ha sido actualizado correctamente', 'success');
      } else {
        // Si no tiene ID, es CREAR
        await HospitalesService.create(hospital);
        Swal.fire('Creado', 'El hospital ha sido registrado correctamente', 'success');
      }
      await cargarHospitales(); // Recargar lista
      return true;
    } catch (error: any) {
      Swal.fire('Error', error.message || 'Ocurrió un error', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Función para Eliminar
  const eliminarHospital = async (id: number, tipo: 'logico' | 'fisico' = 'logico') => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: tipo === 'logico' 
        ? "El hospital se dará de baja (podrá reactivarse después)." 
        : "El hospital se eliminará permanentemente de la base de datos.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        await HospitalesService.delete(id, tipo);
        await cargarHospitales();
        Swal.fire('Eliminado', 'El hospital ha sido eliminado.', 'success');
      } catch (error: any) {
        Swal.fire('Error', error.message, 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    cargarHospitales();
  }, [cargarHospitales]);

  return {
    hospitales,
    loading,
    cargarHospitales,
    guardarHospital,
    eliminarHospital // Exportamos la nueva función
  };
};