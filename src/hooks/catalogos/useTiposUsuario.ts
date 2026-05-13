import { useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import Swal from 'sweetalert2';
import type { TipoUsuario } from '@/types/catalogos/usuarios-proveedores.types';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export const useTiposUsuario = () => {
  const { theme } = useTheme();
  const [tipos, setTipos] = useState<TipoUsuario[]>([]);
  const [loading, setLoading] = useState(false);

  const getSwalConfig = useCallback((icon: 'success' | 'error' | 'warning', title: string, text: string, hasTimer = false) => {
    const isDark = theme === 'dark';
    return {
      icon,
      title,
      text,
      confirmButtonColor: '#0db1ec',
      ...(hasTimer && { timer: 2000, timerProgressBar: true }),
      background: isDark ? '#1e293b' : '#ffffff',
      color: isDark ? '#ffffff' : '#000000',
      customClass: {
        popup: isDark ? 'swal-dark-popup' : 'swal-light-popup',
        title: isDark ? 'swal-dark-title' : 'swal-light-title',
        htmlContainer: isDark ? 'swal-dark-text' : 'swal-light-text',
        confirmButton: 'swal-confirm-button',
        timerProgressBar: isDark ? 'swal-dark-progress' : 'swal-light-progress',
      },
    };
  }, [theme]);

  const fetchTiposUsuario = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/catalogos/tipos-usuario');
      const data: ApiResponse<TipoUsuario[]> = await response.json();
      if (data.success && data.data) {
        setTipos(data.data);
      } else {
        throw new Error(data.message);
      }
    } catch {
      Swal.fire(getSwalConfig('error', 'Error', 'No se pudieron cargar los tipos de usuario'));
    } finally {
      setLoading(false);
    }
  }, [getSwalConfig]);

  const createTipoUsuario = useCallback(async (tipousuario: string) => {
    try {
      const response = await fetch('/api/catalogos/tipos-usuario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipousuario }),
      });
      const result: ApiResponse<TipoUsuario> = await response.json();

      if (result.success) {
        await Swal.fire(getSwalConfig('success', 'Creado', result.message, true));
        await fetchTiposUsuario();
        return true;
      } else {
        await Swal.fire(getSwalConfig('error', 'Error', result.message));
        return false;
      }
    } catch {
      await Swal.fire(getSwalConfig('error', 'Error de Conexión', 'No se pudo conectar con el servidor'));
      return false;
    }
  }, [fetchTiposUsuario, getSwalConfig]);

  const updateTipoUsuario = useCallback(async (id: number, tipousuario: string) => {
    try {
      const response = await fetch(`/api/catalogos/tipos-usuario/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipousuario }),
      });
      const result: ApiResponse<TipoUsuario> = await response.json();

      if (result.success) {
        await Swal.fire(getSwalConfig('success', 'Actualizado', result.message, true));
        await fetchTiposUsuario();
        return true;
      } else {
        await Swal.fire(getSwalConfig('error', 'Error', result.message));
        return false;
      }
    } catch {
      await Swal.fire(getSwalConfig('error', 'Error de Conexión', 'No se pudo conectar con el servidor'));
      return false;
    }
  }, [fetchTiposUsuario, getSwalConfig]);

  const deleteTipoUsuario = useCallback(async (id: number, nombre: string) => {
    const isDark = theme === 'dark';

    const result = await Swal.fire({
      icon: 'warning',
      title: '¿Estás seguro?',
      html: `¿Deseas eliminar el tipo <strong>${nombre}</strong>?<br>Esta acción no se puede deshacer.`,
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: isDark ? '#1e293b' : '#ffffff',
      color: isDark ? '#ffffff' : '#000000',
      customClass: {
        popup: isDark ? 'swal-dark-popup' : 'swal-light-popup',
        title: isDark ? 'swal-dark-title' : 'swal-light-title',
        htmlContainer: isDark ? 'swal-dark-text' : 'swal-light-text',
        confirmButton: 'swal-confirm-button',
        cancelButton: 'swal-cancel-button',
      },
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/catalogos/tipos-usuario/${id}`, {
          method: 'DELETE',
        });
        const data: ApiResponse<null> = await response.json();

        if (data.success) {
          await Swal.fire(getSwalConfig('success', 'Eliminado', data.message, true));
          await fetchTiposUsuario();
          return true;
        } else {
          await Swal.fire(getSwalConfig('error', 'Error', data.message));
          return false;
        }
      } catch {
        await Swal.fire(getSwalConfig('error', 'Error de Conexión', 'No se pudo conectar con el servidor'));
        return false;
      }
    }
    return false;
  }, [fetchTiposUsuario, getSwalConfig, theme]);

  return {
    tipos,
    loading,
    fetchTiposUsuario,
    createTipoUsuario,
    updateTipoUsuario,
    deleteTipoUsuario,
  };
};
