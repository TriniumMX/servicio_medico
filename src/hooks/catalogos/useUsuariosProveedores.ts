// src/hooks/catalogos/useUsuariosProveedores.ts

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import Swal from 'sweetalert2';
import {
  UsuarioConTipo,
  TipoUsuario,
  CreateUsuarioDTO,
  UpdateUsuarioDTO,
  ApiResponse
} from '@/types/catalogos/usuarios-proveedores.types';

export const useUsuariosProveedores = () => {
  const { theme } = useTheme();
  const [usuarios, setUsuarios] = useState<UsuarioConTipo[]>([]);
  const [tiposUsuarios, setTiposUsuarios] = useState<TipoUsuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Configuración dinámica de SweetAlert según el tema
  const getSwalConfig = useCallback((icon: 'success' | 'error', title: string, text: string, hasTimer = false) => {
    const isDark = theme === 'dark';
    
    return {
      icon,
      title,
      text,
      confirmButtonColor: '#0db1ec',
      ...(hasTimer && {
        timer: 3500,
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

  // Cargar usuarios
  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/catalogos/usuarios_y_proveedores');
      const data: ApiResponse<UsuarioConTipo[]> = await response.json();

      if (data.success && data.data) {
        setUsuarios(data.data);
      } else {
        setError(data.error || 'Error al cargar usuarios');
      }
    } catch (err) {
      setError('Error de conexión al cargar usuarios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar tipos de usuarios
  const fetchTiposUsuarios = useCallback(async () => {
    try {
      const response = await fetch('/api/catalogos/usuarios_y_proveedores/tipos');
      const data: ApiResponse<TipoUsuario[]> = await response.json();
      
      if (data.success && data.data) {
        setTiposUsuarios(data.data);
      }
    } catch (err) {
      console.error('Error al cargar tipos de usuarios:', err);
    }
  }, []);

  // Crear usuario
  const createUsuario = async (usuario: CreateUsuarioDTO): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/catalogos/usuarios_y_proveedores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(usuario)
      });

      const data: ApiResponse<UsuarioConTipo> = await response.json();

      if (data.success) {
        await fetchUsuarios();
        Swal.fire(getSwalConfig(
          'success',
          '¡Éxito!',
          'Usuario creado correctamente',
          true
        ));
        return true;
      } else {
        setError(data.error || 'Error al crear usuario');
        Swal.fire(getSwalConfig(
          'error',
          'Error',
          data.error || 'Error al crear usuario'
        ));
        return false;
      }
    } catch (err) {
      setError('Error de conexión al crear usuario');
      Swal.fire(getSwalConfig(
        'error',
        'Error de Conexión',
        'No se pudo conectar con el servidor'
      ));
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar usuario
  const updateUsuario = async (id: number, usuario: UpdateUsuarioDTO): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/catalogos/usuarios_y_proveedores/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(usuario)
      });

      const data: ApiResponse<UsuarioConTipo> = await response.json();

      if (data.success) {
        await fetchUsuarios();
        Swal.fire(getSwalConfig(
          'success',
          '¡Actualizado!',
          'Usuario actualizado correctamente',
          true
        ));
        return true;
      } else {
        setError(data.error || 'Error al actualizar usuario');
        Swal.fire(getSwalConfig(
          'error',
          'Error',
          data.error || 'Error al actualizar usuario'
        ));
        return false;
      }
    } catch (err) {
      setError('Error de conexión al actualizar usuario');
      Swal.fire(getSwalConfig(
        'error',
        'Error de Conexión',
        'No se pudo conectar con el servidor'
      ));
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Eliminar usuario (soft delete)
  const deleteUsuario = async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/catalogos/usuarios_y_proveedores/${id}`, {
        method: 'DELETE'
      });

      const data: ApiResponse<null> = await response.json();

      if (data.success) {
        await fetchUsuarios();
        Swal.fire(getSwalConfig(
          'success',
          '¡Eliminado!',
          'Usuario desactivado correctamente',
          true
        ));
        return true;
      } else {
        setError(data.error || 'Error al eliminar usuario');
        Swal.fire(getSwalConfig(
          'error',
          'Error',
          data.error || 'Error al eliminar usuario'
        ));
        return false;
      }
    } catch (err) {
      setError('Error de conexión al eliminar usuario');
      Swal.fire(getSwalConfig(
        'error',
        'Error de Conexión',
        'No se pudo conectar con el servidor'
      ));
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchUsuarios();
    fetchTiposUsuarios();
  }, [fetchUsuarios, fetchTiposUsuarios]);

  return {
    usuarios,
    tiposUsuarios,
    loading,
    error,
    createUsuario,
    updateUsuario,
    deleteUsuario,
    refreshUsuarios: fetchUsuarios
  };
};