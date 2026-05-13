import { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';

export interface UsuarioSimple {
  id_usuario: number;
  nombre: string;
  username: string;
  id_tipousuario: number;
  nombre_rol: string;
}

export interface Rol {
  clavetipousuario: number;
  tipousuario: string;
}

export interface Accion {
  id_accion: number;
  clave: string;
  descripcion: string;
}

export const usePermisos = () => {
  const [usuarios, setUsuarios] = useState<UsuarioSimple[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [acciones, setAcciones] = useState<Accion[]>([]);
  const [mapaPermisos, setMapaPermisos] = useState<Record<number, number[]>>({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/permisos');
      const data = await res.json();
      
      if (data.success) {
        setUsuarios(data.usuarios);
        setRoles(data.roles);
        setAcciones(data.acciones);
        
        // Convertir la lista plana de permisos a un Mapa { id_usuario: [1, 2, 3] }
        const mapa: Record<number, number[]> = {};
        data.permisosAsignados.forEach((p: any) => {
          if (!mapa[p.id_usuario]) mapa[p.id_usuario] = [];
          mapa[p.id_usuario].push(p.id_accion);
        });
        setMapaPermisos(mapa);
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
    } catch (error: any) {
      console.error(error);
      Swal.fire('Error', 'No se pudieron cargar los datos: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const guardarPermisosUsuario = async (id_usuario: number, acciones_ids: number[]) => {
    try {
      const res = await fetch('/api/admin/permisos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_usuario, acciones_ids }),
      });
      const data = await res.json();

      if (data.success) {
        // Actualizamos el estado local para que se vea reflejado inmediatamente
        setMapaPermisos(prev => ({ ...prev, [id_usuario]: acciones_ids }));
        
        Swal.fire({
            icon: 'success',
            title: 'Permisos actualizados',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000
        });
        return true;
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error');
      return false;
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { usuarios, roles, acciones, mapaPermisos, loading, guardarPermisosUsuario };
};