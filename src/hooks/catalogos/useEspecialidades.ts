// src/hooks/pandora/catalogos/useEspecialidades.ts

import { useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import Swal from 'sweetalert2';
import type { 
  Especialidad, 
  CreateEspecialidadDTO, 
  UpdateEspecialidadDTO,
  ApiResponse 
} from '@/types/catalogos/especialidades';

export const useEspecialidades = () => {
  const { theme } = useTheme();
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [loading, setLoading] = useState(false);

  // Configuración dinámica de SweetAlert según el tema
  const getSwalConfig = useCallback((icon: 'success' | 'error' | 'warning', title: string, text: string, hasTimer = false) => {
    const isDark = theme === 'dark';
    
    return {
      icon,
      title,
      text,
      confirmButtonColor: '#0db1ec',
      ...(hasTimer && {
        timer: 2000,
        timerProgressBar: true,
      }),
      background: isDark ? '#0a1929' : '#ffffff',
      color: isDark ? '#ffffff' : '#000000',
      customClass: {
        popup: isDark ? 'swal-dark-popup' : 'swal-light-popup',
        title: isDark ? 'swal-dark-title' : 'swal-light-title',
        htmlContainer: isDark ? 'swal-dark-text' : 'swal-light-text',
        confirmButton: 'swal-confirm-button',
        timerProgressBar: isDark ? 'swal-dark-progress' : 'swal-light-progress'
      }
    };
  }, [theme]);

  /**
   * Obtener todas las especialidades
   */
  const fetchEspecialidades = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/catalogos/especialidades');
      const data: ApiResponse<Especialidad[]> = await response.json();

      if (data.success && data.data) {
        setEspecialidades(data.data);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      Swal.fire(getSwalConfig(
        'error',
        'Error',
        'No se pudieron cargar las especialidades'
      ));
    } finally {
      setLoading(false);
    }
  }, [getSwalConfig]);

  /**
   * Crear nueva especialidad
   */
  const createEspecialidad = useCallback(async (data: CreateEspecialidadDTO) => {
    try {
      const response = await fetch('/api/catalogos/especialidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result: ApiResponse<Especialidad> = await response.json();

      if (result.success) {
        await Swal.fire(getSwalConfig(
          'success',
          '¡Éxito!',
          result.message,
          true
        ));
        await fetchEspecialidades();
        return true;
      } else {
        await Swal.fire(getSwalConfig(
          'error',
          'Error',
          result.message
        ));
        return false;
      }
    } catch (error) {
      await Swal.fire(getSwalConfig(
        'error',
        'Error de Conexión',
        'No se pudo conectar con el servidor'
      ));
      return false;
    }
  }, [fetchEspecialidades, getSwalConfig]);

  /**
   * Actualizar especialidad
   */
  const updateEspecialidad = useCallback(
    async (id: number, data: UpdateEspecialidadDTO) => {
      try {
        const response = await fetch(`/api/catalogos/especialidades/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result: ApiResponse<Especialidad> = await response.json();

        if (result.success) {
          await Swal.fire(getSwalConfig(
            'success',
            '¡Actualizado!',
            result.message,
            true
          ));
          await fetchEspecialidades();
          return true;
        } else {
          await Swal.fire(getSwalConfig(
            'error',
            'Error',
            result.message
          ));
          return false;
        }
      } catch (error) {
        await Swal.fire(getSwalConfig(
          'error',
          'Error de Conexión',
          'No se pudo conectar con el servidor'
        ));
        return false;
      }
    },
    [fetchEspecialidades, getSwalConfig]
  );

  /**
   * Eliminar especialidad
   */
  const deleteEspecialidad = useCallback(
    async (id: number, nombre: string) => {
      const isDark = theme === 'dark';
      
      const result = await Swal.fire({
        icon: 'warning',
        title: '¿Estás seguro?',
        html: `¿Deseas eliminar la especialidad <strong>${nombre}</strong>?<br>Esta acción no se puede deshacer.`,
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        background: isDark ? '#0a1929' : '#ffffff',
        color: isDark ? '#ffffff' : '#000000',
        customClass: {
          popup: isDark ? 'swal-dark-popup' : 'swal-light-popup',
          title: isDark ? 'swal-dark-title' : 'swal-light-title',
          htmlContainer: isDark ? 'swal-dark-text' : 'swal-light-text',
          confirmButton: 'swal-confirm-button',
          cancelButton: 'swal-cancel-button'
        }
      });

      if (result.isConfirmed) {
        try {
          const response = await fetch(`/api/catalogos/especialidades/${id}`, {
            method: 'DELETE',
          });

          const data: ApiResponse<null> = await response.json();

          if (data.success) {
            await Swal.fire(getSwalConfig(
              'success',
              '¡Eliminada!',
              data.message,
              true
            ));
            await fetchEspecialidades();
            return true;
          } else {
            await Swal.fire(getSwalConfig(
              'error',
              'Error',
              data.message
            ));
            return false;
          }
        } catch (error) {
          await Swal.fire(getSwalConfig(
            'error',
            'Error de Conexión',
            'No se pudo conectar con el servidor'
          ));
          return false;
        }
      }
      return false;
    },
    [fetchEspecialidades, getSwalConfig, theme]
  );

  return {
    especialidades,
    loading,
    fetchEspecialidades,
    createEspecialidad,
    updateEspecialidad,
    deleteEspecialidad,
  };
};